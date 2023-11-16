import '#filter-boolean';

import { useCallback, useState } from 'preact/hooks';

import { type Signal, useSignal } from '@preact/signals';

import { hideDialog, showDialog } from '../static/js/dialogs.js';

import { defaultImage } from './Dashboard.tsx';

import Notice from './Notice.tsx';

import Dialog from './Dialog.tsx';

import Select from './Select.tsx';
import TextInput from './TextInput.tsx';
import ImageInput from './ImageInput.tsx';

import IconTrash from 'icons/trash.tsx';
import IconPlus from 'icons/plus.tsx';
import IconApply from 'icons/check.tsx';

import comma from '../utils/comma.ts';

import { i18n } from '../utils/i18n.ts';

import { Character, type Media, MediaType } from '../utils/types.ts';

export default (
  { signal, media, visible }: {
    signal: Signal<Media>;
    characters: Signal<Character[]>;
    media: Signal<Media[]>;
    visible: boolean;
  },
) => {
  const [, updateState] = useState({});

  // used to force the entire component to redrew
  const forceUpdate = useCallback(() => updateState({}), []);

  const newAliasValue = useSignal('');

  const MediaFormat = {
    [i18n('anime')]: 'TV',
    [i18n('manga')]: 'MANGA',
    [i18n('movie')]: 'MOVIE',
    [i18n('OVA')]: 'OVA',
    [i18n('ONA')]: 'ONA',
    [i18n('oneShot')]: 'ONE_SHOT',
    [i18n('novel')]: 'NOVEL',
    [i18n('videoGame')]: 'VIDEO_GAME',
  };

  const MediaRelation = {
    [i18n('prequel')]: 'PREQUEL',
    [i18n('sequel')]: 'SEQUEL',
    [i18n('adaptation')]: 'ADAPTATION',
    [i18n('sideStory')]: 'SIDE_STORY',
    [i18n('spinoff')]: 'SPIN_OFF',
  };

  return (
    <div class={visible ? '' : 'hidden'}>
      <div
        class={'flex flex-col gap-8 max-w-[980px] mx-auto pb-[15vh] pt-[2.5vh]'}
      >
        <div
          class={'flex flex-row items-center border-grey border-b-2 p-2 gap-2'}
        >
          <div class={'w-auto h-[90px] aspect-[90/127] mr-4'} />
          <i class={'basis-full'}>{i18n('title')}</i>
          <i class={'basis-full'}>{i18n('popularity')}</i>
        </div>

        {Object.values(media.value)
          .map((_media, i) => {
            return (
              <div
                key={media.value[i].id}
                class={'flex flex-row items-center p-2 gap-2'}
                onClick={() => {
                  signal.value = media.value[i];
                  requestAnimationFrame(() => showDialog('media'));
                }}
              >
                <img
                  class={'bg-grey w-auto h-[90px] aspect-[90/127] mr-4 object-cover object-center'}
                  src={_media.images?.[0]?.url ?? defaultImage}
                />
                <i class={'basis-full'}>
                  {_media.title.english}
                </i>
                <i class={'basis-full'}>
                  {comma(_media.popularity ?? 0)}
                </i>
              </div>
            );
          })}
      </div>

      <Dialog
        name={'media'}
        class={'flex items-center justify-center w-full h-full left-0 top-0 pointer-events-none'}
      >
        <div
          class={'bg-embed2 flex flex-col gap-y-6 overflow-x-hidden overflow-y-auto rounded-[10px] m-4 p-4 h-[80vh] w-[80vw] max-w-[680px] pointer-events-auto'}
        >
          <div class={'flex flex-row-reverse ml-auto gap-2'}>
            <IconApply
              class={'w-[24px] h-[24px] cursor-pointer'}
              onClick={() => {
                forceUpdate();

                requestAnimationFrame(() => hideDialog('media'));
              }}
            />

            <IconTrash
              class={'w-[24px] h-[24px] cursor-pointer text-red'}
              onClick={() => {
                const i = media.value.findIndex(({ id }) =>
                  signal.value.id === id
                );

                if (i > -1 && window.confirm(i18n('deleteMedia'))) {
                  media.value.splice(i, 1);
                  forceUpdate();
                  requestAnimationFrame(() => hideDialog('media'));
                }
              }}
            />
          </div>

          <ImageInput
            key={`${signal.value.id}-image`}
            class={'w-auto h-[192px] object-cover object-center aspect-[90/127] mx-auto flex-shrink-0'}
            default={signal.value.images?.[0]?.url ?? ''}
            accept={['image/png', 'image/jpeg', 'image/webp']}
            onChange={(image) => {
              signal.value.images = [image];
              forceUpdate();
            }}
          />

          <Select
            required
            list={MediaType}
            label={i18n('type')}
            defaultValue={signal.value.type}
            onChange={(t: MediaType) => signal.value.type = t}
          />

          <TextInput
            required
            pattern='.{1,128}'
            label={i18n('title')}
            value={signal.value.title.english ?? ''}
            onInput={(value) => signal.value.title.english = value}
            key={`${signal.value.id}-title`}
          />

          <Select
            list={MediaFormat}
            label={i18n('format')}
            defaultValue={signal.value.format}
            onChange={(f) =>
              // deno-lint-ignore no-explicit-any
              signal.value.format = (f as any) || undefined}
          />

          <TextInput
            min={0}
            max={2147483647}
            type={'number'}
            label={i18n('popularity')}
            value={signal.value.popularity ?? 0}
            hint={i18n('popularityHint')}
            onInput={(value) => signal.value.popularity = Number(value ?? 0)}
            key={`${signal.value.id}-popularity`}
          />

          <TextInput
            multiline
            pattern='.{1,2048}'
            label={i18n('description')}
            placeholder={i18n('placeholderMediaDescription')}
            value={signal.value.description}
            onInput={(value) => signal.value.description = value}
            key={`${signal.value.id}-description`}
          />

          <TextInput
            class={'text-disabled'}
            label={i18n('imageUrl')}
            value={signal.value.images?.[0]?.file?.name ??
              signal.value.images?.[0]?.url}
            onInput={(value) => {
              signal.value.images = [{ url: value }];
              forceUpdate();
            }}
            key={`${signal.value.id}-imageurl`}
          />

          <div class={'flex flex-col gap-2'}>
            <label class={'uppercase text-disabled text-[0.8rem]'}>
              {i18n('aliases')}
            </label>
            <label class={'text-disabled text-[0.75rem]'}>
              {i18n('aliasesHint')}
            </label>
            <div class={'flex flex-wrap gap-2'}>
              {signal.value.title.alternative?.map((alias, i) => (
                <div
                  class={'flex items-center justify-center bg-embed rounded-[100vw] px-6 py-4 gap-2'}
                  key={i}
                >
                  <i>{alias}</i>
                  <IconTrash
                    class={'w-[16px] h-auto cursor-pointer text-red'}
                    onClick={() => {
                      // deno-lint-ignore no-non-null-assertion
                      signal.value.title.alternative!.splice(i, 1);
                      forceUpdate();
                    }}
                  />
                </div>
              ))}

              {(signal.value.title.alternative?.length ?? 0) < 5
                ? (
                  <div
                    class={'flex items-center justify-center bg-embed rounded-[100vw] px-6 py-4 gap-2'}
                  >
                    <input
                      placeholder={'Harry Potter: 11th Book'}
                      value={newAliasValue}
                      class={'border-0 p-0 rounded-[100vw] bg-embed text-[0.8rem] w-[180px]'}
                      onInput={(event) =>
                        newAliasValue.value =
                          (event.target as HTMLInputElement).value}
                    />
                    <IconPlus
                      class={[
                        'w-[16px] h-auto',
                        (newAliasValue.value?.length || 0) <= 0
                          ? 'pointer-events-none opacity-60'
                          : 'cursor-pointer',
                      ].join(' ')}
                      onClick={() => {
                        if (!signal.value.title.alternative) {
                          signal.value.title.alternative = [];
                        }

                        signal.value.title.alternative.push(
                          newAliasValue.value,
                        );

                        newAliasValue.value = '';

                        forceUpdate();
                      }}
                    />
                  </div>
                )
                : undefined}
            </div>
          </div>

          <div class={'flex flex-col'}>
            <label class={'uppercase text-disabled text-[0.8rem]'}>
              {i18n('relations')}
            </label>
            <div class={'flex flex-col gap-2'}>
              {media.value
                .filter(({ id }) => id !== signal.value.id)
                .map((media, i) => {
                  const defaultValue = Number(
                    signal.value.relations?.findIndex((r) =>
                      r.mediaId === media.id
                    ),
                  );

                  return (
                    <div class={'grid grid-flow-col gap-2'} key={i}>
                      <i class={'flex items-center font-[700]'}>
                        {media.title.english}
                      </i>
                      <Select
                        nullLabel={i18n('none')}
                        list={MediaRelation}
                        defaultValue={defaultValue > -1
                          // deno-lint-ignore no-non-null-assertion
                          ? signal.value.relations![defaultValue].relation
                          : undefined}
                        onChange={(r) => {
                          const exists = Number(
                            signal.value.relations?.findIndex((r) =>
                              r.mediaId === media.id
                            ),
                          );

                          if (exists > -1) {
                            if (r) {
                              // deno-lint-ignore  no-non-null-assertion
                              signal.value.relations![exists].relation =
                                // deno-lint-ignore no-explicit-any
                                r as any;
                            } else {
                              // deno-lint-ignore no-non-null-assertion
                              signal.value.relations!.splice(exists, 1);
                            }
                          } else {
                            if (!signal.value.relations) {
                              signal.value.relations = [];
                            }

                            signal.value.relations.push({
                              mediaId: media.id,
                              // deno-lint-ignore no-explicit-any
                              relation: r as any,
                            });
                          }
                        }}
                      />
                    </div>
                  );
                })}
            </div>
          </div>

          <div class={'flex flex-col'}>
            <label class={'uppercase text-disabled text-[0.8rem]'}>
              {i18n('links')}
            </label>
            <Notice type={'info'}>{i18n('linksNotice')}</Notice>
            <div class={'flex flex-col gap-2'}>
              {signal.value.externalLinks?.map((link, i) => (
                <div class={'flex items-center flex-wrap gap-2'}>
                  <TextInput
                    required
                    value={link.site}
                    placeholder={'YouTube'}
                    onInput={(site) =>
                      // deno-lint-ignore no-non-null-assertion
                      signal.value.externalLinks![i].site = site}
                    key={`${signal.value.id}-link-${i}-site`}
                  />
                  <TextInput
                    required
                    value={link.url}
                    pattern={'^(https:\\/\\/)?(www\\.)?(youtube\\.com|twitch\\.tv|netflix\\.com|crunchyroll\\.com|tapas\\.io|webtoons\\.com|amazon\\.com)[\\S]*$'}
                    placeholder={'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                    onInput={(url) =>
                      // deno-lint-ignore no-non-null-assertion
                      signal.value.externalLinks![i].url = url}
                    key={`${signal.value.id}-link-${i}-url`}
                  />
                  <IconTrash
                    class={'w-[24px] h-auto cursor-pointer text-red'}
                    onClick={() => {
                      // deno-lint-ignore no-non-null-assertion
                      signal.value.externalLinks!.splice(i, 1);
                      forceUpdate();
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  if (!signal.value.externalLinks) {
                    signal.value.externalLinks = [];
                  }

                  signal.value.externalLinks.push({
                    site: '',
                    url: '',
                  });

                  forceUpdate();
                }}
              >
                <IconPlus />
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
