"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "message" | "purchase" | "tournament" | "promotion" | "system";
  icon: React.ReactNode;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

interface RightBarProps {
  isRightOpen: boolean;
  onClose: () => void;
}

export function RightBar({ isRightOpen, onClose }: RightBarProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState("all");

  // Mock notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "Nouveau message",
        message: "JohnDoe vous a envoyé un message concernant votre commande",
        type: "message",
        icon: <MessageSquare className="h-4 w-4" />,
        read: false,
        createdAt: new Date().toISOString(),
        linkUrl: "/messages",
      },
      {
        id: "2",
        title: "Commande expédiée",
        message: "Votre commande #12345 vient d'être expédiée",
        type: "purchase",
        icon: <ShoppingBag className="h-4 w-4" />,
        read: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        linkUrl: "/orders/12345",
      },
      {
        id: "3",
        title: "Tournoi à venir",
        message: "Le tournoi 'Battle Royale' commence dans 2 heures",
        type: "tournament",
        icon: <Trophy className="h-4 w-4" />,
        read: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        linkUrl: "/tournaments/battle-royale",
      },
      {
        id: "4",
        title: "Promotion spéciale",
        message: "Réduction de 20% sur tous les produits gaming ce week-end",
        type: "promotion",
        icon: <TrendingUp className="h-4 w-4" />,
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        linkUrl: "/promotions",
      },
      {
        id: "5",
        title: "Mise à jour système",
        message: "Nouvelle fonctionnalité : système de trading amélioré",
        type: "system",
        icon: <Settings className="h-4 w-4" />,
        read: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        linkUrl: "/whats-new",
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString();
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "message":
        return "bg-blue-500";
      case "purchase":
        return "bg-green-500";
      case "tournament":
        return "bg-amber-500";
      case "promotion":
        return "bg-purple-500";
      case "system":
        return "bg-gray-500";
      default:
        return "bg-primary";
    }
  };

  // Mark as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Delete selected
  const deleteSelected = () => {
    setNotifications((prev) =>
      prev.filter((n) => !selectedNotifications.includes(n.id)),
    );
    setSelectedNotifications([]);
  };

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

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className={cn(
              "fixed inset-y-0 right-0 w-full sm:w-96 bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl z-50",
              "flex flex-col",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg"
                >
                  <Bell className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <Typography variant="h4" weight="bold">
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Typography variant="body-sm" theme="muted">
                      {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                    </Typography>
                  )}
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4">
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-5 w-full bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger value="all" className="rounded-md text-xs">
                    Toutes
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="rounded-md text-xs">
                    Non lues
                  </TabsTrigger>
                  <TabsTrigger value="message" className="rounded-md text-xs">
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="purchase" className="rounded-md text-xs">
                    Achats
                  </TabsTrigger>
                  <TabsTrigger
                    value="tournament"
                    className="rounded-md text-xs"
                  >
                    Tournois
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full gap-1.5"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Tout lire
                  </Button>
                </motion.div>
                {selectedNotifications.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 rounded-full gap-1.5"
                      onClick={deleteSelected}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </motion.div>
                )}
              </div>
              <Typography variant="caption2" theme="muted">
                {filteredNotifications.length} notifications
              </Typography>
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <div
                          className={cn(
                            "group relative p-4 rounded-2xl border transition-all duration-200",
                            "hover:shadow-lg cursor-pointer bg-background/50",
                            notification.read
                              ? "border-border/30"
                              : "border-primary/20 bg-primary/5",
                          )}
                          onClick={() => markAsRead(notification.id)}
                        >
                          {/* Unread indicator */}
                          {!notification.read && (
                            <motion.div
                              layoutId="unreadIndicator"
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
                            />
                          )}

                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div
                              className={cn(
                                "flex-shrink-0 p-2.5 rounded-xl",
                                getTypeColor(notification.type),
                              )}
                            >
                              {notification.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <Typography
                                  variant="body-sm"
                                  weight="semibold"
                                  className={cn(
                                    !notification.read && "text-primary",
                                  )}
                                >
                                  {notification.title}
                                </Typography>
                                <Typography
                                  variant="caption2"
                                  theme="muted"
                                  className="flex items-center gap-1"
                                >
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(notification.createdAt)}
                                </Typography>
                              </div>
                              <Typography
                                variant="body-sm"
                                theme="muted"
                                className="mt-1 line-clamp-2"
                              >
                                {notification.message}
                              </Typography>
                              {notification.linkUrl && (
                                <motion.div
                                  whileHover={{ x: 5 }}
                                  className="mt-2"
                                >
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto text-primary gap-1.5"
                                    asChild
                                  >
                                    <Link href={notification.linkUrl}>
                                      Voir les détails
                                      <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                      </svg>
                                    </Link>
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-60 text-center p-4"
                    >
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <Bell className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <Typography variant="h4" weight="medium" className="mb-2">
                        Aucune notification
                      </Typography>
                      <Typography
                        variant="body-sm"
                        theme="muted"
                        className="max-w-sm"
                      >
                        Vous n'avez aucune notification pour le moment. Revenez
                        plus tard !
                      </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-6 border-t border-border/50">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="rounded-full"
                  >
                    <Link href="/notifications">
                      Voir toutes les notifications
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Paramètres
                  </Button>
                </div>
                <Separator />
                <div className="text-center">
                  <Typography variant="caption2" theme="muted">
                    © {new Date().getFullYear()} GT-V2 Gaming Hub
                  </Typography>
                  <Typography variant="caption2" theme="muted" className="mt-1">
                    Tous droits réservés
                  </Typography>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
