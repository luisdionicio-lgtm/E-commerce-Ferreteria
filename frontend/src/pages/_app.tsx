import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Toaster } from 'sonner';
import { AppProvider } from '../app/context';
import '../styles/global.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Head>
        <title>FerreMax · E-commerce de ferretería</title>
        <meta
          name="description"
          content="Catálogo de herramientas, pinturas y materiales. Proyecto académico con Next.js, Express y MySQL."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/mark.svg" />
      </Head>
      <Component {...pageProps} />
      <Toaster position="bottom-right" richColors closeButton />
    </AppProvider>
  );
}
