import { ReactElement, ReactNode } from 'react';
import { SocketProvider } from '../components/provider/SocketProvider';
import { NextPage } from 'next';
import { AppProps } from 'next/app';
import { createGlobalStyle } from 'styled-components';
import reset from 'styled-reset';

const GlobalStyle = createGlobalStyle`
 ${reset}
`;

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <>
      <GlobalStyle />
      <SocketProvider>
        <Component {...pageProps} />
      </SocketProvider>
    </>
  );
}
