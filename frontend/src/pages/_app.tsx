import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Toaster } from 'sonner';
import { AppProvider } from '../state/context';
import '../styles/global.css';
import '../styles/ui-refinement.css';
import '../styles/orders.css';
import '../styles/home-redesign.css';

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
        <link
          rel="preload"
          href="/fonts/source-sans-3-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/barlow-condensed-700.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        style={
          {
            '--success-text': '#27613e',
            '--error-text': '#982d24',
            '--warning-text': '#754600',
            '--info-text': '#235b7a',
          } as React.CSSProperties
        }
      />
    </AppProvider>
  );
}
