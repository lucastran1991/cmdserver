import type { AppProps } from 'next/app';
import { useEffect } from 'react';

// Suppress useLayoutEffect warnings when running on server
if (typeof window === 'undefined') {
  console.error = (...args: any) => {
    if (/useLayoutEffect/.test(args[0])) return;
    console.error(...args);
  };
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}