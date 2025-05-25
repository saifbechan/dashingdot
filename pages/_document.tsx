import NextDocument, { Head, Html, Main, NextScript } from 'next/document';
import React, { type JSX } from 'react';

type Props = {
  lang: string;
};

class Document extends NextDocument<Props> {
  render(): JSX.Element {
    return (
      <Html lang={this.props.lang || 'en'}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
