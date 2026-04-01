"use client";

import {
  deletePushSubscription,
  subscribeToPush,
} from "@/actions/notifications";
import { useEffect, useState, useCallback } from "react";

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isUpdateAvailable: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    registration: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

  // 📲 Détection PWA installée
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInstalled = () => {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      const isInApp = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isInApp;

      setState((prev) => ({ ...prev, isInstalled }));

      if (isInstalled) {
        console.log("📱 Application installée");
      }
    };

    checkInstalled();
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkInstalled);

    return () => {
      mediaQuery.removeEventListener("change", checkInstalled);
    };
  }, []);

  // 🌐 Détection connexion
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      console.log("🌐 Connexion rétablie");
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log("📴 Hors ligne");
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 🔧 Enregistrement Service Worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log("✅ Service Worker enregistré:", registration.scope);
        setState((prev) => ({ ...prev, registration }));

        // Vérification des mises à jour
        registration.addEventListener("updatefound", () => {
          const newSW = registration.installing;
          if (newSW) {
            newSW.addEventListener("statechange", () => {
              if (
                newSW.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("🔄 Mise à jour disponible");
                setWaitingSW(newSW);
                setState((prev) => ({ ...prev, isUpdateAvailable: true }));

                // Notifier l'utilisateur de la mise à jour
                if (Notification.permission === "granted") {
                  new Notification("Games Trafics - Mise à jour disponible", {
                    body: "Une nouvelle version est disponible. Cliquez pour mettre à jour.",
                    icon: "/icons/icon-192.png",
                    tag: "update-available",
                  });
                }
              }
            });
          }
        });

        // Vérifier immédiatement s'il y a une mise à jour
        registration.update();
      } catch (error) {
        console.error("❌ Erreur Service Worker:", error);
      }
    };

    registerSW();
  }, []);

  // 📥 Prompt d'installation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
  }, []);

  // 🚀 Installation
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setState((prev) => ({
          ...prev,
          isInstallable: false,
          isInstalled: true,
        }));
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Erreur installation:", error);
      return false;
    }
  }, [deferredPrompt]);

  // 🔄 Mise à jour
  const update = useCallback(async () => {
    if (!waitingSW) return;

    try {
      waitingSW.postMessage({ type: "SKIP_WAITING" });

      // Attendre le changement de contrôleur
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("❌ Erreur mise à jour:", error);
      window.location.reload(); // Fallback reload
    }
  }, [waitingSW]);

  return {
    ...state,
    install,
    update,
  };
}

// 🔔 Hook pour notifications push (version compatible auth-context)
export interface PushNotificationState {
  subscription: PushSubscription | null;
  isSupported: boolean;
  isLoading: boolean;
  isSubscribed: boolean;
}

export function usePushNotifications(userId?: string) {
  const [state, setState] = useState<PushNotificationState>({
    subscription: null,
    isSupported: false,
    isLoading: false,
    isSubscribed: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSupport = async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window;
      setState((prev) => ({ ...prev, isSupported: supported }));

      if (supported) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const currentSub = await registration.pushManager.getSubscription();

          setState((prev) => ({
            ...prev,
            subscription: currentSub,
            isSubscribed: !!currentSub,
          }));

          console.log(
            "🔔 Notifications push:",
            currentSub ? "abonné" : "non abonné"
          );
        } catch (error) {
          console.error("❌ Erreur vérification push:", error);
        }
      }
    };

    checkSupport();
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      console.warn("❌ Notifications push non supportées");
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("❌ Permission refusée");
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!applicationServerKey) {
        throw new Error("VAPID_PUBLIC_KEY non configurée");
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
      });

      setState((prev) => ({
        ...prev,
        subscription: newSubscription,
        isSubscribed: true,
        isLoading: false,
      }));

      console.log("✅ Abonnement push créé");

      // Envoyer au serveur via action serveur
      try {
        // @ts-ignore
        const { success, error } = await subscribeToPush(userId!, {
          endpoint: newSubscription.endpoint,
          keys: newSubscription.toJSON().keys as {
            p256dh: string;
            auth: string;
          },
        });

        if (!success) {
          console.warn("⚠️ Échec enregistrement côté serveur:", error);
        }
      } catch (serverError) {
        console.error("❌ Erreur serveur:", serverError);
      }

      return true;
    } catch (error) {
      console.error("❌ Erreur abonnement push:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, userId]);

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) {
      console.warn("❌ Aucun abonnement à désactiver");
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await state.subscription.unsubscribe();

      setState((prev) => ({
        ...prev,
        subscription: null,
        isSubscribed: false,
        isLoading: false,
      }));

      console.log("✅ Désabonnement push réussi");

      // Informer le serveur via action serveur
      try {
        // @ts-ignore
        const { success, error } = await deletePushSubscription(
          state.subscription.endpoint
        );

        if (!success) {
          console.warn("⚠️ Échec suppression côté serveur:", error);
        }
      } catch (serverError) {
        console.error("❌ Erreur serveur désabonnement:", serverError);
      }

      return true;
    } catch (error) {
      console.error("❌ Erreur désabonnement push:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.subscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

// Utilitaire pour convertir VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 📲 Hook d'installation simple (alternative)
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      console.log("📥 Prompt d'installation capturé");
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      console.warn("❌ Aucun prompt disponible");
      return;
    }

    try {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;

      console.log(`📱 Installation: ${outcome}`);

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);

        // Analytics
        if (typeof (window as any).gtag !== "undefined") {
          (window as any).gtag("event", "pwa_install_accepted");
        }
      }
    } catch (error) {
      console.error("❌ Erreur installation:", error);
    }
  };

  return { isInstallable, install };
}
