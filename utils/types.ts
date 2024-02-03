// deno-lint-ignore-file no-external-import

import type {
  DisaggregatedCharacter,
  DisaggregatedMedia,
  Modify,
} from 'https://raw.githubusercontent.com/ker0olos/fable/main/src/types.ts';

import type { IImageInput } from '~/components/ImageInput.tsx';

export type User = {
  id: string;
  username: string;
  avatar?: string;
  discriminator?: string;
  // deno-lint-ignore camelcase
  display_name?: string;
};

export type Entity = {
  id: string;
  alias?: string;
  image?: string;
};

export type Media = Modify<
  DisaggregatedMedia,
  { images?: IImageInput[] }
>;

export type Character = Modify<
  DisaggregatedCharacter,
  { images?: IImageInput[] }
>;

export type SortingOrder = 'asc' | 'desc';

export type CharacterSorting = 'name' | 'media' | 'role' | 'rating' | 'updated';
export type MediaSorting = 'title' | 'popularity' | 'updated';

export { Modify };

export {
  CharacterRole,
  type DisaggregatedCharacter,
  type DisaggregatedMedia,
  type Manifest,
  MediaType,
} from 'https://raw.githubusercontent.com/ker0olos/fable/main/src/types.ts';

export { type Pack } from 'https://raw.githubusercontent.com/ker0olos/fable/main/db/schema.ts';
