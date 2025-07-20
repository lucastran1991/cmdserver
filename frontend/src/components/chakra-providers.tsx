"use client";

import { ChakraProvider } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface ChakraProvidersProps {
  children: ReactNode;
}

export function ChakraProviders({ children }: ChakraProvidersProps) {
  return (
    <ChakraProvider>
      {children}
    </ChakraProvider>
  );
}
