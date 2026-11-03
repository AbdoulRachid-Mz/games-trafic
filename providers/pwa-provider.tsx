'use client';

import { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // 🔴 IMPORTANT : jamais de SW en dev
    if (process.env.NODE_ENV !== 'production') {
      // Nettoyage automatique en dev
      navigator.serviceWorker?.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      if ("caches" in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
      return;
    }

    if (!('serviceWorker' in navigator)) return;

    let interval: NodeJS.Timeout;
    let refreshing = false;

    // 🔄 Gérer controllerchange : recharger automatiquement la page quand le nouveau SW prend le contrôle
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(registration => {
        // 🔄 Détecter si un SW est déjà en attente (waiting)
        if (registration.waiting) {
          window.dispatchEvent(new CustomEvent('sw-waiting', { detail: registration.waiting }));
        }

        // 🔄 Écouter l'arrivée d'une mise à jour
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.dispatchEvent(new CustomEvent('sw-waiting', { detail: installingWorker }));
              }
            });
          }
        });

        interval = setInterval(() => {
          registration.update().catch(console.error);
        }, 60 * 60 * 1000);
      })
      .catch(err => {
        console.error('❌ Erreur SW:', err);
      });

    return () => {
      if (interval) clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return (
    <>
      {children}
      {mounted && showManager && <PWAManager visibility="installable" />}
    </>
  );
}