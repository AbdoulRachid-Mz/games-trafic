import { useAuthContext } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    // @ts-ignore → type non standard
    deferredPrompt.prompt();
    // @ts-ignore
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, install };
}

// hooks dédiés pour PWA
export function usePWAStatus() {
  const { user, isAuthenticated, isAdmin, isVip } = useAuthContext();
  const [pwaStatus, setPWAStatus] = useState({
    canInstall: false,
    isInstalled: false,
    hasUpdate: false,
    isOnline: true,
  });

  useEffect(() => {
    // Détection PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = (window.navigator as any).standalone === true;
    
    setPWAStatus(prev => ({
      ...prev,
      isInstalled: isStandalone || isInApp,
      isOnline: navigator.onLine,
    }));
  }, []);

  return {
    ...pwaStatus,
    user,
    isAuthenticated,
    canReceiveNotifications: isAuthenticated && pwaStatus.isInstalled,
  };
}
