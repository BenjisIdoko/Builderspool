'use client';

import { useEffect } from 'react';

// Registers the service worker (public/sw.js) in production only — in dev it
// would cache stale bundles and fight HMR.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Not installable / blocked — the site works the same without it.
    });
  }, []);
  return null;
}
