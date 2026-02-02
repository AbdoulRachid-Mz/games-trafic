'use client';

import { useEffect } from 'react';

export function DisableSWInDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker?.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });

      caches?.keys?.().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }
  }, []);

  return null;
}
