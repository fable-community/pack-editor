import { Head } from '$fresh/runtime.ts';

import { createStyle } from 'flcss';

import Dialog from './Dialog.tsx';

import colors from '../utils/theme.ts';

import IconClose from 'icons/x.tsx';
import IconImage from 'icons/photo-plus.tsx';

import type { Schema } from './Dashboard.tsx';

import strings from '../../i18n/en-US.json' assert { type: 'json' };

export default (props: { pack?: Schema.Pack }) => {
  const pack: Partial<Schema.Pack['manifest']> = props.pack?.manifest ?? {};

  const styles = createStyle({
    wrapper: {
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: colors.embedHighlight,
    },
    container: {
      display: 'grid',
      alignItems: 'center',
      gridTemplateColumns: '48px 1fr 32px',
      gridTemplateRows: '48px auto',
      padding: '1.5em',
      gap: '2em',
    },
    image: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',

      borderRadius: '100%',
      height: '100%',
      width: '100%',

      border: `2px solid ${colors.grey}`,

      '> svg': {
        width: '28px',
        height: 'auto',
        cursor: 'pointer',
        color: colors.grey,
      },
    },
    close: {
      width: '100%',
      height: 'auto',
      cursor: 'pointer',
    },
  });

  return (
    <>
      <Head>
        <style>{styles.bundle}</style>
      </Head>

      <Dialog
        name='manage'
        visible={true}
        class={styles.names.wrapper}
        action={'back'}
      >
        <form
          method='post'
          action={'/api/publish'}
          class={styles.names.container}
        >
          <div
            class={styles.names.image}
            style={{
              backgroundImage: `url(${pack.image})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            {!pack.image ? <IconImage /> : undefined}
          </div>

          <input
            type='text'
            placeholder={strings.packTitle}
            value={pack.title ?? pack.id}
          />

          <IconClose data-dialog-cancel={'manage'} class={styles.names.close} />
        </form>
      </Dialog>
    </>
  );
};