import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/700.css';

import { ChakraProvider } from '@chakra-ui/react';
import Head from 'next/head';
import theme from '../styles/theme';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta content="#141526" name="theme-color" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link href="/favicon.ico" rel="icon" sizes="64x64 32x32 24x24 16x16" type="image/x-icon" />
        <link href="/favicon.png" rel="apple-touch-icon" />
        <link href="/manifest.json" rel="manifest" />
        <meta content="react, typescript, javascript, github, nextjs" name="keywords" />
      </Head>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}

export default MyApp;
