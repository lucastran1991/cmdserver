import { useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect on client, useEffect on server
export const useClientLayoutEffect = typeof window !== 'undefined' 
  ? useLayoutEffect 
  : useEffect;