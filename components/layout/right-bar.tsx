"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Bell,
  Check,
  Trash2,
  MessageSquare,
  ShoppingBag,
  Trophy,
  Clock,
  TrendingUp,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { Skeleton } from "@/components/ui/skeleton";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  linkUrl?: string | null;
};

interface RightBarProps {
  isRightOpen: boolean;
  onClose: () => void;
  /** If true, renders as a fixed overlay (mobile). If false, renders inline. */
  overlayMode?: boolean;
}

export function RightBar({ isRightOpen, onClose, overlayMode = true }: RightBarProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
      case "message":
        return <MessageSquare className="h-4 w-4 text-white" />;
      case "ORDER":
      case "purchase":
        return <ShoppingBag className="h-4 w-4 text-white" />;
      case "TOURNAMENT":
      case "tournament":
        return <Trophy className="h-4 w-4 text-white" />;
      case "PROMOTION":
      case "promotion":
        return <TrendingUp className="h-4 w-4 text-white" />;
      default:
        return <Bell className="h-4 w-4 text-white" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "MESSAGE":
        return "bg-blue-500";
      case "ORDER":
        return "bg-green-500";
      case "TOURNAMENT":
        return "bg-amber-500";
      case "PROMOTION":
        return "bg-purple-500";
      default:
        return "bg-primary";
    }
  };

  const loadNotifications = useCallback(async () => {
    if (!user?.id || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await getUserNotifications(user.id, {
        page: 1,
        limit: 30,
        unreadOnly: false,
      });
      setNotifications(
        result.notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || "system",
          read: n.read || false,
          createdAt: new Date(n.createdAt as any),
          linkUrl: n.linkUrl,
        }))
      );
    } catch {
      // Silently fail — keep existing state
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    if (isRightOpen) {
      loadNotifications();
    }
  }, [isRightOpen, loadNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.type?.toUpperCase() === activeTab.toUpperCase();
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "maintenant";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await markNotificationAsRead(id, user.id).catch(() => null);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsAsRead(user.id).catch(() => null);
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id, user.id).catch(() => null);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <div>
            <Typography variant="h5" weight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="body-sm" theme="muted">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </Typography>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={loadNotifications}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Actualiser"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          {overlayMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 overflow-x-auto">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="all" className="rounded-md text-xs">Toutes</TabsTrigger>
            <TabsTrigger value="unread" className="rounded-md text-xs">Non lues</TabsTrigger>
            <TabsTrigger value="MESSAGE" className="rounded-md text-xs">Messages</TabsTrigger>
            <TabsTrigger value="ORDER" className="rounded-md text-xs">Achats</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-full gap-1.5 text-xs"
          onClick={handleMarkAllRead}
        >
          <Check className="h-3 w-3" />
          Tout lire
        </Button>
        <Typography variant="caption2" theme="muted">
          {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
        </Typography>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl border border-border/30 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div
                  className={cn(
                    "group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                    "hover:shadow-md",
                    notification.read
                      ? "border-border/30 bg-background/50"
                      : "border-primary/20 bg-primary/5"
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}

                  <div className="flex items-start gap-3 pl-1">
                    <div className={cn("flex-shrink-0 p-2 rounded-lg", getTypeColor(notification.type))}>
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Typography
                          variant="body-sm"
                          weight="semibold"
                          className={cn(!notification.read && "text-primary", "line-clamp-1")}
                        >
                          {notification.title}
                        </Typography>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Typography variant="caption2" theme="muted">
                            {formatTimeAgo(notification.createdAt)}
                          </Typography>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <Typography variant="body-sm" theme="muted" className="mt-0.5 line-clamp-2 text-xs">
                        {notification.message}
                      </Typography>
                      {notification.linkUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-primary gap-1 mt-1 text-xs"
                          asChild
                        >
                          <Link href={notification.linkUrl} onClick={(e) => e.stopPropagation()}>
                            Voir les détails →
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <div className="p-4 rounded-full bg-muted/50 mb-3">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <Typography variant="h6" weight="medium" className="mb-1">
                Aucune notification
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Vous êtes à jour !
              </Typography>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <Button variant="ghost" size="sm" asChild className="w-full rounded-full justify-start gap-2">
          <Link href="/dashboard/notifications">
            <Bell className="h-4 w-4" />
            Voir toutes les notifications
          </Link>
        </Button>
        <Separator className="my-2" />
        <Button variant="ghost" size="sm" asChild className="w-full rounded-full justify-start gap-2">
          <Link href="/settings/notifications">
            <Settings className="h-4 w-4" />
            Paramètres notifications
          </Link>
        </Button>
      </div>
    </div>
  );

  // ── Non-overlay mode (permanent panel on desktop) ──
  if (!overlayMode) {
    return (
      <div
        className={cn(
          "w-80 bg-background/95 backdrop-blur-lg border-l border-border/50 flex flex-col h-full",
          !isRightOpen && "hidden"
        )}
      >
        {sidebarContent}
      </div>
    );
  }

  // ── Overlay mode (mobile slide-over) ──
  return (
    <AnimatePresence>
      {isRightOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl z-50 flex flex-col"
          >
            {sidebarContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
