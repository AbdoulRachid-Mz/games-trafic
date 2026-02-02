'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const PWAManager = dynamic(() => import('@/components/pwa/PWAManager'), {
  ssr: false,
});

interface PWAProviderProps {
  children: React.ReactNode;
  showManager?: boolean;
  showNotifications?: boolean;
}

export default function PWAProvider({
  children,
  showManager = true,
}: PWAProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 🔴 IMPORTANT : jamais de SW en dev
    if (process.env.NODE_ENV !== 'production') {
      // Nettoyage automatique en dev
      navigator.serviceWorker?.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      return;
    }

    if (!('serviceWorker' in navigator)) return;

    let interval: NodeJS.Timeout;

    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        interval = setInterval(() => {
          registration.update().catch(console.error);
        }, 60 * 60 * 1000);
      })
      .catch(err => {
        console.error('❌ Erreur SW:', err);
      });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <>
      {children}
      {showManager && <PWAManager visibility="installable" />}
    </>
  );
}
