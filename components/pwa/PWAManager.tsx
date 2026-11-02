"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePWA, usePushNotifications } from "@/lib/optimized-pwa";
import { useAuthContext } from "@/contexts/auth-context";
import {
  Download,
  RefreshCw,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  Globe,
  X,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

type ManagerVisibility =
  | "always"
  | "installable"
  | "update"
  | "offline"
  | "notification"
  | "never";

interface PWAManagerProps {
  visibility?: ManagerVisibility;
  autoHideDelay?: number;
  showNotifications?: boolean;
}

export default function PWAManager({
  visibility = "installable",
  autoHideDelay = 10000,
  showNotifications = true,
}: PWAManagerProps) {
  const { user, isAuthenticated } = useAuthContext();
  const pwa = usePWA();
  const push = usePushNotifications();

  const [isVisible, setIsVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Déterminer si le manager doit être visible
  const shouldBeVisible = useCallback(() => {
    switch (visibility) {
      case "always":
        return true;
      case "installable":
        return pwa.isInstallable;
      case "update":
        return pwa.isUpdateAvailable;
      case "offline":
        return !pwa.isOnline;
      case "notification":
        return push.isSupported && !push.isSubscribed;
      case "never":
        return false;
      default:
        return pwa.isInstallable || pwa.isUpdateAvailable || !pwa.isOnline;
    }
  }, [visibility, pwa, push]);

  // Gérer la visibilité
  useEffect(() => {
    const visible = shouldBeVisible();

    if (visible && !isVisible) {
      setIsVisible(true);

      // Auto-hide après délai
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          if (visibility !== "always") {
            setIsVisible(false);
          }
        }, autoHideDelay);
        setAutoHideTimer(timer);
      }
    } else if (!visible && isVisible) {
      setIsVisible(false);
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [shouldBeVisible, isVisible, autoHideDelay, visibility]);

  // Gérer les notifications
  useEffect(() => {
    if (!showNotifications) return;

    if (pwa.isUpdateAvailable) {
      toast.info("Une mise à jour est disponible", {
        description: "Cliquez pour mettre à jour l'application",
        action: {
          label: "Mettre à jour",
          onClick: pwa.update,
        },
        duration: 10000,
      });
    }

    if (!pwa.isOnline) {
      toast.warning("Vous êtes hors ligne", {
        description: "Certaines fonctionnalités peuvent être limitées",
        duration: 5000,
      });
    }
  }, [pwa.isUpdateAvailable, pwa.isOnline, showNotifications]);

  const handleInstall = async () => {
    const installed = await pwa.install();
    if (installed) {
      toast.success("Application installée", {
        description: "L'application a été installée avec succès",
      });
      setIsVisible(false);
    }
  };

  const handleUpdate = async () => {
    await pwa.update();
    toast.info("Mise à jour en cours...", {
      description: "La page va se recharger automatiquement",
    });
  };

  const handleToggleNotifications = async () => {
    if (push.isSubscribed) {
      await push.unsubscribe();
      toast.success("Notifications désactivées", {
        description: "Vous ne recevrez plus de notifications push",
      });
    } else {
      const subscribed = await push.subscribe();
      if (subscribed) {
        toast.success("Notifications activées", {
          description: "Vous recevrez maintenant des notifications push",
        });
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Ne plus afficher pendant 24h
    localStorage.setItem("pwa_manager_hidden", Date.now().toString());
  };

  const isUpdateAvailable = pwa.isUpdateAvailable;
  const isInstallable = pwa.isInstallable;

  if (!isVisible && !isUpdateAvailable) return null;

  // Vérifier si caché récemment (sauf si mise à jour)
  if (!isUpdateAvailable) {
    const lastHidden = localStorage.getItem("pwa_manager_hidden");
    if (lastHidden) {
      const hiddenTime = parseInt(lastHidden);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - hiddenTime < twentyFourHours) {
        return null;
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-10 duration-300">
      <Card className="backdrop-blur-lg bg-white/95 dark:bg-gray-900/95 shadow-2xl border-0 ring-1 ring-black/5 dark:ring-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  {isUpdateAvailable
                    ? "Mise à jour disponible"
                    : "Games-Trafics"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isUpdateAvailable
                    ? "Une nouvelle version est prête"
                    : "Application mobile"}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Installation */}
          {pwa.isInstallable && (
            <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Installation disponible
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Installez l'application pour une meilleure expérience
                  </p>
                </div>
              </div>

              <Button
                onClick={handleInstall}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Installer l'application
              </Button>
            </div>
          )}

          {/* Mise à jour */}
          {pwa.isUpdateAvailable && (
            <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Mise à jour disponible
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Une nouvelle version améliore l'expérience
                  </p>
                </div>
              </div>

              <Button
                onClick={handleUpdate}
                variant="secondary"
                className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                Mettre à jour maintenant
              </Button>
            </div>
          )}

          {/* Mode hors ligne */}
          {!pwa.isOnline && (
            <div className="space-y-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <WifiOff className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Mode hors ligne
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Votre connexion internet est interrompue
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Certaines fonctionnalités sont limitées</p>
                <p>• Le contenu récent peut ne pas être disponible</p>
                <p>• Vérifiez votre connexion internet</p>
              </div>
            </div>
          )}

          {/* Notifications Push */}
          {push.isSupported && isAuthenticated && pwa.isInstalled && (
            <div className="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium">Notifications</p>
                </div>

                <Badge
                  variant={push.isSubscribed ? "default" : "outline"}
                  className="text-xs"
                >
                  {push.isSubscribed ? "Activées" : "Désactivées"}
                </Badge>
              </div>

              <Button
                onClick={handleToggleNotifications}
                disabled={push.isLoading}
                variant={push.isSubscribed ? "outline" : "secondary"}
                size="sm"
                className="w-full gap-2"
              >
                {push.isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : push.isSubscribed ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {push.isLoading
                  ? "Chargement..."
                  : push.isSubscribed
                  ? "Désactiver les notifications"
                  : "Activer les notifications"}
              </Button>

              {!push.isSubscribed && (
                <p className="text-xs text-muted-foreground text-center">
                  Recevez des notifications importantes directement
                </p>
              )}
            </div>
          )}

          {/* Statistiques */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="font-medium">Connexion</p>
                <p className={pwa.isOnline ? "text-green-600" : "text-red-600"}>
                  {pwa.isOnline ? "Stable" : "Instable"}
                </p>
              </div>

              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="font-medium">Application</p>
                <p
                  className={
                    pwa.isInstalled ? "text-green-600" : "text-blue-600"
                  }
                >
                  {pwa.isInstalled ? "Installée" : "Navigateur"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
