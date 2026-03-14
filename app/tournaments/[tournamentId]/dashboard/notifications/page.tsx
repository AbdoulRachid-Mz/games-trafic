"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { useAuthContext } from "@/contexts/auth-context";
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  ShoppingBag,
  Trophy,
  Info,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { markAllNotificationsAsRead } from "@/actions/notifications";

export default function TournamentNotificationsPage() {
  const params = useParams();
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();


  const handleMarkAllAsRead = () => {
    if (notifications.filter(n => !n.read).length === 0) return;
    
    startTransition(async () => {
      try {
        await markAllNotificationsAsRead(user!.id);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("Toutes les notifications ont été marquées comme lues");
      } catch (error) {
        toast.error("Erreur lors de l'opération");
      }
    });
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id, params.tournamentId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getUserNotifications(user!.id, {
        tournamentId: params.tournamentId as string,
        limit: 50,
      });
      setNotifications(res.notifications || []);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationAsRead(id, user!.id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        toast.success("Marquée comme lue");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteNotification(id, user!.id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success("Notification supprimée");
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "TOURNAMENT_JOIN":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "ORDER_NEW":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground text-sm">
            Activités récentes du tournoi
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.some(n => !n.read) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <CheckSquare className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
          <Badge variant="secondary" className="gap-2 py-1.5 px-3">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {notifications.filter((n) => !n.read).length} non lues
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aucune notification pour ce tournoi.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    notif.read ? "bg-card" : "bg-muted/30 border-primary/20"
                  }`}
                >
                  <div className="mt-1 p-2 rounded-full bg-background border shadow-sm shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-medium ${
                          !notif.read && "text-primary"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(notif.createdAt), "dd MMM HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-balance text-muted-foreground">
                      {notif.message}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!notif.read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Marquer comme lue"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Supprimer"
                      onClick={() => handleDelete(notif.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
