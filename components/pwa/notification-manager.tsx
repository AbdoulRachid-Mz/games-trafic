"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { usePushNotifications } from "@/lib/optimized-pwa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Settings, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/use-profile";
import { useMarkAllAsRead, useNotification } from "@/hooks/use-notifications";


export default function NotificationManager() {
  const { user, isAuthenticated } = useAuthContext();
  const { data: profile, loading: profileLoading, error: profileError } = useUserProfile(
    { mode: "partial", relations: ["notifications"] }
  );

  const push = usePushNotifications();
  
  const [showManager, setShowManager] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mettre à jour le compteur de notifications non lues
  useEffect(() => {
    if (profile?.notifications?.unread) {
      setUnreadCount(profile.notifications.unread.length);
    }
  }, [profile]);

  const { mutate: markAllNotificationsAsRead } = useMarkAllAsRead();

  // Vérifier si les notifications sont supportées au démarrage
  useEffect(() => {
    if (push.isSupported && isAuthenticated && !push.isSubscribed) {
      // Demander gentiment après 5 secondes
      const timer = setTimeout(() => {
        toast.info("Activer les notifications", {
          description: "Restez informé des nouveautés et messages",
          action: {
            label: "Activer",
            onClick: () => setShowManager(true),
          },
          duration: 8000,
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [push.isSupported, push.isSubscribed, isAuthenticated]);

  const handleToggleNotifications = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour activer les notifications");
      return;
    }

    if (push.isSubscribed) {
      await push.unsubscribe();
      toast.success("Notifications désactivées");
    } else {
      const success = await push.subscribe();
      if (success) {
        toast.success("Notifications activées");
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Implémentez cette action selon votre backend
      await markAllNotificationsAsRead(user?.id ?? '');
      await push.unsubscribe();
      toast.success("Toutes les notifications marquées comme lues");
    } catch (error) {
      toast.error("Erreur lors du marquage des notifications");
    }
  };

  if (!push.isSupported && !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Badge flottant */}
      <div className="fixed bottom-24 right-6 z-40">
        <Button
          onClick={() => setShowManager(!showManager)}
          className="rounded-full w-12 h-12 p-0 shadow-lg relative"
          variant="default"
        >
          <Bell className="h-5 w-5" />
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Manager de notifications */}
      {showManager && (
        <div className="fixed bottom-36 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-10 duration-300">
          <Card className="backdrop-blur-lg bg-white/95 dark:bg-gray-900/95 shadow-2xl border-0 ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
                    <CardDescription className="text-xs">
                      {isAuthenticated ? "Gérez vos préférences" : "Connectez-vous pour activer"}
                    </CardDescription>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowManager(false)}
                  className="h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* État des notifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications push</span>
                  <Badge variant={push.isSubscribed ? "default" : "secondary"}>
                    {push.isSubscribed ? "Activé" : "Désactivé"}
                  </Badge>
                </div>
                
                {!isAuthenticated ? (
                  <div className="text-sm text-muted-foreground p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    Connectez-vous pour activer les notifications
                  </div>
                ) : !push.isSupported ? (
                  <div className="text-sm text-muted-foreground p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    Votre navigateur ne supporte pas les notifications push
                  </div>
                ) : (
                  <Button
                    onClick={handleToggleNotifications}
                    disabled={push.isLoading}
                    className="w-full gap-2"
                    size="sm"
                    variant={push.isSubscribed ? "outline" : "default"}
                  >
                    {push.isLoading ? (
                      <span className="animate-spin">⟳</span>
                    ) : push.isSubscribed ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    {push.isLoading 
                      ? "Chargement..." 
                      : push.isSubscribed 
                        ? "Désactiver les notifications" 
                        : "Activer les notifications"
                    }
                  </Button>
                )}
              </div>

              {/* Notifications non lues */}
              {isAuthenticated && profile?.notifications?.unread && profile.notifications.unread.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Notifications non lues</span>
                    <Badge variant="destructive">
                      {profile.notifications.unread.length}
                    </Badge>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {profile.notifications.unread.slice(0, 3).map((notification: any) => (
                      <div 
                        key={notification.id}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm"
                      >
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {profile.notifications.unread.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      + {profile.notifications.unread.length - 3} autres notifications
                    </p>
                  )}
                  
                  <Button
                    onClick={handleMarkAllAsRead}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                </div>
              )}

              {/* Paramètres */}
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    setShowManager(false);
                    // Rediriger vers les paramètres de notifications
                    window.location.href = "/profile/notifications";
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Paramètres avancés
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}