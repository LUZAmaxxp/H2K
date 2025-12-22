'use client';

import { useRouter as useNextRouter, usePathname as useNextPathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Custom router hook
 */
export function useRouter() {
  const nextRouter = useNextRouter();

  return {
    push: nextRouter.push,
    replace: nextRouter.replace,
    back: nextRouter.back,
    forward: nextRouter.forward,
    refresh: nextRouter.refresh,
    prefetch: nextRouter.prefetch,
  };
}

/**
 * Custom pathname hook
 */
export function usePathname() {
  return useNextPathname();
}

// Export Link
export { Link };
