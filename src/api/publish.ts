// deno-lint-ignore-file no-non-null-assertion

import { encode } from '$std/encoding/base64.ts';

import { getCookies } from '$std/http/cookie.ts';

import { deserialize } from 'bson';

import nanoid from '../utils/nanoid.ts';

import { getRating } from '../utils/rating.ts';

import type { Handlers } from '$fresh/server.ts';

import { IImageInput, TEN_MB } from '../components/ImageInput.tsx';

import { Character, CharacterRole, Media, Pack } from '../utils/types.ts';

interface Cookies {
  accessToken?: string;
}

interface Credentials {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl: string;
}

interface Upload {
  uploadUrl: string;
  authorizationToken: string;
}

export interface Data {
  userId: string;
  old: Pack['manifest'];
  title?: string;
  private?: boolean;
  description?: string;
  author?: string;
  image?: IImageInput;
  characters?: Character[];
  media?: Media[];
  maintainers?: string[];
}

interface DiscordWebhook {
  username?: string;
  // deno-lint-ignore camelcase
  avatar_url?: string;
  content?: string;
  embeds?: {
    title: string;
    description: string;
  }[];
  // deno-lint-ignore camelcase
  allowed_mentions: {
    parse: string[];
  };
}

const idRegex = /[^-_a-z0-9]+/g;

const b2 = {
  id: Deno.env.get('B2_KEY_ID'),
  bucketId: Deno.env.get('B2_BUCKET_ID'),
  bucketName: Deno.env.get('B2_BUCKET_NAME'),
  key: Deno.env.get('B2_KEY'),
};

const publicWebhookUrl = Deno.env.get('PUBLIC_EVERYTHING_DISCORD_WEBHOOK_URL');

const setUpImages = async () => {
  if (!b2.id || !b2.key || !b2.bucketId || !b2.bucketName) {
    return;
  }

  const _credentials = await fetch(
    'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
    { headers: { Authorization: `Basic ${encode(`${b2.id}:${b2.key}`)}` } },
  );

  if (_credentials.status !== 200) {
    console.error('failed to authorize b2');
    return;
  }

  const credentials = await _credentials.json() as Credentials;

  return credentials;
};

const uploadImage = async ({ file, credentials }: {
  file: NonNullable<IImageInput['file']>;
  credentials?: Credentials;
}) => {
  if (!credentials) {
    return '';
  }

  if (file.size > TEN_MB) {
    console.error('image is over 10 mb');
    return '';
  }

  const _upload = await fetch(
    `${credentials.apiUrl}/b2api/v2/b2_get_upload_url`,
    {
      method: 'POST',
      body: JSON.stringify({ bucketId: b2.bucketId }),
      headers: { Authorization: credentials.authorizationToken },
    },
  );

  if (_upload.status !== 200) {
    console.error('failed to generate b2 upload url');
    return '';
  }

  const upload = await _upload.json() as Upload;

  const hash = await crypto.subtle.digest('SHA-1', file.data.buffer);

  const hashArray = Array.from(new Uint8Array(hash));

  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''); // convert bytes to hex string

  const fileName = nanoid(8);

  const _file = await fetch(
    upload.uploadUrl,
    {
      method: 'POST',
      body: file.data.buffer,
      headers: {
        'Authorization': upload.authorizationToken,
        'Content-Type': file.type,
        'Content-Length': `${file.size}`,
        'X-Bz-File-Name': fileName,
        'X-Bz-Content-Sha1': hashHex,
      },
    },
  );

  if (_file.status !== 200) {
    console.error('failed to generate b2 upload url');
    return '';
  }

  const url = `${credentials.downloadUrl}/file/${b2.bucketName}/${fileName}`;

  console.log(url);

  return url;
};

export const handler: Handlers = {
  async POST(req): Promise<Response> {
    try {
      const cookies = getCookies(req.headers) as Cookies;

      const endpoint = Deno.env.get('API_ENDPOINT');

      if (!cookies.accessToken) {
        throw new Error('Access token not defined');
      }

      const data = deserialize(
        new Uint8Array(await req.arrayBuffer()),
      ) as Data;

      const { old: pack } = data;

      if (typeof data.title === 'string') {
        pack.title = data.title;
      }

      if (typeof data.private === 'boolean') {
        pack.private = data.private;
      }

      if (typeof data.description === 'string') {
        pack.description = data.description;
      }

      if (typeof data.author === 'string') {
        pack.author = data.author;
      }

      if (!pack.id) {
        const candidate = pack.title?.toLowerCase()?.replace(
          idRegex,
          '',
        );

        if (!candidate || candidate.length < 3) {
          return new Response('cannot create pack id from pack title', {
            status: 400,
          });
        }

        pack.id = candidate;
      }

      const credentials = await setUpImages();

      if (data.image?.file) {
        pack.image = await uploadImage({
          credentials,
          file: data.image.file,
        });
      }

      pack.media ??= {};
      pack.characters ??= {};

      // sort media by popularity
      data.media
        ?.sort((a, b) => {
          return (b.popularity ?? 0) - (a.popularity ?? 0);
        });

      // sort media by role then popularity
      data.characters
        ?.sort((a, b) => {
          if (
            a.media?.length && b?.media?.length &&
            a.media[0].role !== b.media[0].role
          ) {
            const v = {
              [CharacterRole.Main]: 0,
              [CharacterRole.Supporting]: 1,
              [CharacterRole.Background]: 2,
            };

            return v[a.media[0].role] - v[b.media[0].role];
          } else {
            let aRating: number;
            let bRating: number;

            if (a.popularity) {
              aRating = getRating({
                popularity: a.popularity ?? 0,
              });
            } else if (a.media?.[0].mediaId) {
              const media = data.media?.find(({ id }) =>
                a.media?.[0].mediaId === id
              );

              if (media) {
                aRating = getRating({
                  popularity: media.popularity ?? 0,
                  role: a.media?.[0].role,
                });
              } else {
                aRating = 1;
              }
            } else {
              aRating = 1;
            }

            if (b.popularity) {
              bRating = getRating({
                popularity: b.popularity ?? 0,
              });
            } else if (b.media?.length) {
              const media = data.media?.find(({ id }) =>
                b.media?.[0].mediaId === id
              );

              if (media) {
                bRating = getRating({
                  popularity: media.popularity ?? 0,
                  role: b.media?.[0].role,
                });
              } else {
                bRating = 1;
              }
            } else {
              bRating = 1;
            }

            return bRating - aRating;
          }
        });

      pack.media!.new = await Promise.all(
        data.media?.map(async (media) => {
          const url = media.images?.length && media.images[0].file
            ? await uploadImage({
              file: media.images[0].file,
              credentials,
            })
            : undefined;

          const characters: {
            role: CharacterRole;
            characterId: string;
          }[] = [];

          // discover and link media to the characters that reference it
          data.characters?.forEach((character) => {
            const find = character.media
              ?.find(({ mediaId }) => media.id === mediaId);

            if (find) {
              characters!.push({
                characterId: character.id,
                role: find.role,
              });
            }
          });

          return {
            ...media,
            characters,
            images: url ? [{ url }] : media.images,
          };
        }) ?? [],
      );

      pack.characters!.new = await Promise.all(
        data.characters?.map(async (char) => {
          const url = char.images?.length && char.images[0].file
            ? await uploadImage({
              file: char.images[0].file,
              credentials,
            })
            : undefined;

          return {
            ...char,
            images: url ? [{ url }] : char.images,
          };
        }) ?? [],
      );

      pack.maintainers = data.maintainers ?? [];

      // console.log(pack);

      if (endpoint) {
        const response = await fetch(`${endpoint}/publish`, {
          method: 'POST',
          headers: { 'authorization': `Bearer ${cookies.accessToken}` },
          body: JSON.stringify(
            {
              manifest: pack,
              accessToken: cookies.accessToken,
            }, // filter null values
            (_, value) => {
              if (value !== null) {
                return value;
              }
            },
          ),
        });

        if (response.status !== 200) {
          const { errors } = await response.json();

          return new Response(
            JSON.stringify({
              pack,
              errors,
            }),
            { status: response.status },
          );
        }

        if (publicWebhookUrl && !pack.private) {
          const body: DiscordWebhook = {
            username: 'Community Packs',
            content: `<@${data.userId}> updated **${pack.title ?? pack.id}**`,
            // deno-lint-ignore camelcase
            avatar_url:
              'https://raw.githubusercontent.com/fable-community/packs/main/static/bot.png',
            // deno-lint-ignore camelcase
            allowed_mentions: { parse: [] },
          };

          fetch(publicWebhookUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          }).catch(console.error);
        }

        return new Response(pack.id);
      } else {
        throw new Error('Fable endpoint not defined');
      }
    } catch (err) {
      console.error(err);

      return new Response(err?.message, {
        status: 500,
      });
    }
  },
};
