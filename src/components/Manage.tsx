import { useSignal } from '@preact/signals';

import { serialize } from 'bson';

import ImageInput, { type IImageInput } from './ImageInput.tsx';

import Dialog from './Dialog.tsx';

import Notice, { Dismissible } from './Notice.tsx';

import Media from './Media.tsx';
import Characters from './Characters.tsx';
import Maintainers from './Maintainers.tsx';

import IconClose from 'icons/x.tsx';
import IconInfo from 'icons/info-circle.tsx';
import IconClipboard from 'icons/clipboard-text.tsx';

import { Schema } from './Dashboard.tsx';

import strings from '../../i18n/en-US.ts';

import type { Data } from '../api/publish.ts';

export default (props: {
  user: string;
  pack?: Schema.Pack;
  new?: boolean;
}) => {
  const pack: Readonly<Schema.Pack['manifest']> = props.pack?.manifest ??
    { id: '' };

  const loading = useSignal<boolean>(false);
  const error = useSignal<string | undefined>(undefined);

  const title = useSignal<string | undefined>(pack.title);
  const image = useSignal<IImageInput | undefined>(undefined);

  const media = useSignal(pack.media?.new ?? []);
  const characters = useSignal(pack.characters?.new ?? []);

  const maintainers = useSignal(pack.maintainers ?? []);

  const onPublish = async () => {
    const body: Data = {
      old: pack,
      title: title.value,
      image: image.value,
      media: media.value,
      characters: characters.value,
      maintainers: maintainers.value,
    };

    loading.value = true;

    try {
      const response = await fetch(`api/publish`, {
        method: 'POST',
        body: serialize(body),
      });

      if (response.status === 200) {
        open(props.new ? `/?success=${await response.text()}` : '/', '_self');
      } else {
        const err = await response.json() as {
          errors: {
            instancePath: string;
            keyword: string;
            message: string;
            params: { limit?: number };
            schemaPath: string;
          }[];
        };

        document.querySelectorAll(`[invalid]`).forEach((ele) =>
          ele.removeAttribute(`invalid`)
        );

        document.querySelectorAll(`[shake]`).forEach((ele) =>
          ele.removeAttribute(`shake`)
        );

        err.errors.forEach((err) => {
          const path = err.instancePath
            .substring(1)
            .split('/');

          console.error(path);
          console.error(err);

          if (path[0] === 'media' || path[0] === 'characters') {
            if (path[1] === 'new') {
              const i = parseInt(path[2]);

              const child = document.querySelector(`.${path[0]}`)?.children[i];

              requestAnimationFrame(() => {
                child?.setAttribute('shake', 'true');
                child?.setAttribute('invalid', 'true');
                document.querySelector('.manage-wrapper')
                  ?.setAttribute('shake', 'true');
              });
            }
          }
        });
      }
    } catch (err) {
      console.error(error.value = err?.message);
    } finally {
      loading.value = false;
    }
  };

  return (
    <>
      {error.value
        ? (
          <Dismissible type={'error'}>
            {error.value}
          </Dismissible>
        )
        : undefined}

      <Dialog
        visible={true}
        name={'manage'}
        class={'manage-wrapper'}
        action={'back'}
      >
        {/* this component require client-side javascript */}
        <noscript>{strings.noScript}</noscript>

        <Dialog name={'info'} class={'dialog-normal'}>
          <div>
            <IconClose data-dialog-cancel={'info'} class={'close'} />

            <div
              class={'install-info'}
              data-clipboard={`/packs install id: ${pack.id}`}
            >
              <i>{`/packs install id: ${pack.id}`}</i>
              <IconClipboard />
            </div>

            <Notice type={'info'}>
              {strings.success.youNeed}
              <strong>{strings.success.manageServer}</strong>
              {strings.success.permissionToInstall}
            </Notice>
          </div>
        </Dialog>

        <div class={'manage-container'}>
          <div class={'manage-header'}>
            <ImageInput
              default={pack.image}
              accept={['image/png', 'image/jpeg', 'image/webp', 'image/gif']}
              onChange={(value) => image.value = value}
            />

            <input
              required
              type={'text'}
              value={title}
              pattern='.{3,128}'
              placeholder={strings.packTitle}
              onInput={(
                ev,
              ) => (title.value = (ev.target as HTMLInputElement).value)}
            />

            <button disabled={loading} onClick={onPublish}>
              {props.new ? strings.publish : strings.save}
            </button>

            {!props.new
              ? <IconInfo data-dialog={'info'} class={'info'} />
              : undefined}

            <IconClose data-dialog-cancel={'manage'} class={'close'} />
          </div>

          <div class={'manage-boxes'}>
            <Characters characters={characters} media={media} />
            <Media characters={characters} media={media} />

            <i />

            <Maintainers
              maintainers={maintainers}
              owner={props.pack?.owner ?? props.user}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};
