import { Head } from '$fresh/runtime.ts';

import { createStyle } from 'flcss';

import Avatar from './Avatar.tsx';

import type { User } from '$fable/src/discord.ts';

import type { Schema } from '$fable/src/types.ts';

import colors from '../theme.ts';

export default ({ user, packs }: { user: User; packs: Schema.Pack[] }) => {
  const styles = createStyle({
    wrapper: {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      padding: '0 10vw',
      gap: '3em',
      flexWrap: 'wrap',
      margin: '5vh 0',
    },
    card: {
      cursor: 'pointer',
      width: '128px',
      minHeight: '32px',
      color: 'inherit',
      backgroundColor: colors.embed,
      textDecoration: 'none',
      padding: '24px 16px',
      borderRadius: '8px',
      transition: 'background-color .125s, box-shadow .125s, transform .125s',
      ':hover': {
        backgroundColor: 'rgb(35, 36, 40)',
        transform: 'translateY(-8px)',
        boxShadow: '0 8px 16px rgba(0,0,0,.2)',
      },
    },
    cardImage: {
      width: '128px',
      height: '128px',
      objectFit: 'cover',
      borderRadius: '8px',
    },
    cardTitle: {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
    cardPlaceholder: {
      extend: 'card',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      color: colors.grey,
      border: `4px dashed ${colors.grey}`,
      fontSize: '42px',
      ':hover': {
        transform: 'translateY(-8px)',
      },
    },
  });

  return (
    <>
      <Head>
        <style>{styles.bundle}</style>
      </Head>

      <Avatar id={user?.id} avatar={user?.avatar} />

      <div className={styles.names.wrapper}>
        {packs.map((pack) => (
          <a className={styles.names.card} href={pack.manifest.id}>
            {pack.manifest.image
              ? (
                <img
                  src={pack.manifest.image}
                  className={styles.names.cardImage}
                />
              )
              : undefined}
            <div className={styles.names.cardTitle}>
              {pack.manifest.title ?? pack.manifest.id}
            </div>
          </a>
        ))}

        <a className={styles.names.cardPlaceholder} href={'/import'}>
          <i class='bx bx-link'></i>
        </a>
        <a className={styles.names.cardPlaceholder} href={'/new'}>
          <i class='bx bxs-folder-plus'></i>
        </a>
      </div>
    </>
  );
};
