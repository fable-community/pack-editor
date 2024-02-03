import { Head } from '$fresh/runtime.ts';

import type { PageProps } from '$fresh/server.ts';

export default ({ Component }: PageProps) => {
  return (
    <>
      <Head>
        <title>Community Packs</title>
        <link rel='manifest' href='/manifest.json' />
        <meta
          name='description'
          content='A portal app to create, manage and publish Fable Community Packs'
        />
        <link rel='icon' type='image/x-icon' href='/favicon.ico' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          crossOrigin='anonymous'
          href='https://fonts.gstatic.com'
        />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap'
        />

        <link rel='stylesheet' href={'/root.css'} />

        <script async src='/dialogs.js' type={'module'} />
        <script async src='/clipboards.js' type={'module'} />

        {/* error tracking */}
        <script
          crossOrigin='anonymous'
          src='https://js.sentry-cdn.com/dacb35e205814c16aa731b503abdc9f8.min.js'
        />
      </Head>
      <Component />
    </>
  );
};
