"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  Store,
  Trophy,
  ShoppingBag,
  Settings,
  Bell,
  User,
  Palette,
  Package,
  MessageSquare,
  Wallet,
  Users,
  LogOut,
  LogIn,
  UserPlus,
  ChevronRight,
  Gamepad2,
  Shield,
  Sparkles,
  PlusCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/contexts/auth-context";
import { Separator } from "@/components/ui/separator";

interface MenuItem {
  id: string;
  label: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: boolean;
  badgeCount?: number;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  group?:
    | "main"
    | "social"
    | "tools"
    | "admin"
    | "vip"
    | "games"
    | "application";
  new?: boolean;
}

interface LeftBarProps {
  isOpen?: boolean;
  onClose?: () => void;
  requireAuth?: boolean;
  isUserOwnerPage?: boolean;
}

const defaultMenuItems: MenuItem[] = [
  // Main Navigation
  {
    id: "home",
    label: "Accueil",
    link: "/",
    icon: Home,
    group: "main",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    link: "/marketplace",
    icon: Store,
    group: "main",
    new: true,
  },
  {
    id: "shops",
    label: "Boutiques",
    link: "/shops",
    icon: ShoppingBag,
    group: "main",
  },
  {
    id: "tournaments",
    label: "Tournois",
    link: "/tournaments",
    icon: Trophy,
    group: "main",
  },
  {
    id: "themes",
    label: "Thèmes",
    link: "/themes",
    icon: Palette,
    group: "main",
  },

  // Games & Clips
  {
    id: "games",
    label: "Jeux",
    link: "/games",
    icon: Gamepad2,
    group: "games",
  },
  {
    id: "game-clips",
    label: "Clips",
    link: "/game-clips",
    icon: MessageSquare,
    group: "games",
  },

  // Application Features
  {
    id: "blog",
    label: "Blog",
    link: "/blogs",
    icon: MessageSquare,
    group: "application",
    requiresAuth: false,
  },
  {
    id: "services",
    label: "Services",
    link: "/services",
    icon: Package,
    group: "application",
    requiresAuth: false,
  },
  {
    id: "partners",
    label: "Partenaires",
    link: "/partners",
    icon: Users,
    group: "application",
    requiresAuth: true,
  },

  {
    id: "documentation",
    label: "Documentation",
    link: "/docs",
    icon: TrendingUp,
    group: "application",
    requiresAuth: false,
  },
  {
    id: "support",
    label: "Support",
    link: "/support",
    icon: MessageSquare,
    group: "application",
    requiresAuth: false,
  },
  {
    id: "contact",
    label: "Contact",
    link: "/contact",
    icon: Users,
    group: "application",
    requiresAuth: false,
  },

  // Social & Communication

  {
    id: "notifications",
    label: "Notifications",
    link: "/dashboard/notifications",
    icon: Bell,
    group: "social",
    badge: true,
    badgeCount: 12,
    requiresAuth: true,
  },

  // User Tools
  {
    id: "wallet",
    label: "Portefeuille",
    link: "/wallet",
    icon: Wallet,
    group: "tools",
    requiresAuth: true,
  },
  {
    id: "profile",
    label: "Mon Profil",
    link: "/profile",
    icon: User,
    group: "tools",
    requiresAuth: true,
  },
  {
    id: "settings",
    label: "Paramètres",
    link: "/profile/settings",
    icon: Settings,
    group: "tools",
    requiresAuth: true,
  },

  // vip/pricing
  {
    id: "vip",
    label: "VIP",
    link: "/vip",
    icon: Sparkles,
    group: "tools",
    requiresAuth: true,
  },

  // Admin
  {
    id: "admin",
    label: "Administration",
    link: "/admin",
    icon: Shield,
    group: "admin",
    adminOnly: true,
  },
];

export function LeftBar({
  isOpen: externalIsOpen = true,
  onClose,
  requireAuth = false,
  isUserOwnerPage = false,
}: LeftBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user: authUser,
    isAuthenticated,
    isAdmin,
    signOut,
  } = useAuthContext();

  const isOpen = externalIsOpen;

  // Filter menu items based on permissions
  const filteredMenuItems = defaultMenuItems.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const groupedItems = filteredMenuItems.reduce(
    (acc, item) => {
      const group = item.group || "main";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await signOut();
      if (onClose) onClose();
    } else {
      router.push("/sign-in");
      if (onClose) onClose();
    }
  };

  const handleCreateAction = (type: "shop" | "tournament") => {
    router.push(`/${type}s/create`);
    if (onClose) onClose();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full flex flex-col bg-background/95 backdrop-blur-lg">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 5 }}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg"
              >
                <Gamepad2 className="h-5 w-5 text-white" />
              </motion.div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <Typography
                    variant="body-lg"
                    weight="bold"
                    className="truncate bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                  >
                    GT
                  </Typography>
                  <Typography
                    variant="caption2"
                    theme="muted"
                    className="truncate"
                  >
                    Games Trafic
                  </Typography>
                </div>
              )}
            </Link>

            {/* Close button */}
            {isOpen && onClose && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        {isAuthenticated && authUser && (
          <div className="p-4 border-b border-border/50">
            <Link href="/profile" onClick={() => onClose && onClose()}>
              <motion.div
                className="flex items-center gap-3 group cursor-pointer"
                whileHover={{ x: 5 }}
              >
                <Avatar className="h-11 w-11 border-2 border-primary/30 shadow-md flex-shrink-0">
                  <AvatarImage
                    src={authUser.profileImage || undefined}
                    alt={
                      authUser.username || authUser.fullName || "Utilisateur"
                    }
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-semibold">
                    {authUser.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="body-sm"
                        weight="semibold"
                        className="truncate group-hover:text-primary transition-colors"
                      >
                        {authUser.fullName ||
                          authUser.username ||
                          "Utilisateur"}
                      </Typography>
                      {authUser.isVip && (
                        <Sparkles className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    <Typography
                      variant="caption2"
                      theme="muted"
                      className="truncate"
                    >
                      {authUser.email}
                    </Typography>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {authUser.isVip && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] px-1.5 py-0.5">
                          VIP
                        </Badge>
                      )}
                      {isAdmin && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          <Shield className="h-2.5 w-2.5 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        {isAuthenticated && isOpen && (
          <div className="px-4 py-3 border-b border-border/50">
            <Typography
              variant="caption2"
              weight="medium"
              theme="muted"
              className="mb-2 uppercase tracking-wider"
            >
              Actions Rapides
            </Typography>
            <div className="grid grid-cols-2 gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  className="w-full h-auto flex-col gap-1.5 py-2 px-1 rounded-lg bg-primary/5 hover:bg-primary/10"
                  onClick={() => handleCreateAction("shop")}
                >
                  <PlusCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary">Boutique</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  className="w-full h-auto flex-col gap-1.5 py-2 px-1 rounded-lg bg-primary/5 hover:bg-primary/10"
                  onClick={() => handleCreateAction("tournament")}
                >
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary">Tournoi</span>
                </Button>
              </motion.div>
              {/* <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  className="w-full h-auto flex-col gap-1.5 py-2 px-1 rounded-lg bg-primary/5 hover:bg-primary/10"
                  onClick={() => handleCreateAction("product")}
                >
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-xs">Produit</span>
                </Button>
              </motion.div> */}
            </div>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group}>
              {isOpen && items.length > 0 && group !== "main" && (
                <div className="mb-2">
                  <Typography
                    variant="caption2"
                    weight="medium"
                    theme="muted"
                    className="uppercase tracking-wider px-2"
                  >
                    {group === "social" && "Social"}
                    {group === "tools" && "Outils"}
                    {group === "admin" && "Admin"}
                  </Typography>
                  <Separator className="my-2" />
                </div>
              )}

              <div className="space-y-1">
                {items.map((item, index) => {
                  const isActive =
                    pathname === item.link ||
                    (item.link !== "/" && pathname.startsWith(item.link));

                  const IconComponent = item.icon;

                  return (
                    <Tooltip key={item.id} delayDuration={isOpen ? 1000 : 300}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.link}
                          onClick={() => onClose && onClose()}
                        >
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                              "hover:bg-primary/5 active:bg-primary/10 cursor-pointer",
                              isActive
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-foreground/80",
                              !isOpen && "justify-center",
                            )}
                          >
                            <div className="flex-shrink-0 relative">
                              <IconComponent
                                className={cn(
                                  "h-4.5 w-4.5 transition-colors",
                                  isActive
                                    ? "text-primary"
                                    : "text-muted-foreground group-hover:text-primary",
                                )}
                              />
                              {item.badge && (item.badgeCount || 0) > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 text-[10px] flex items-center justify-center border-2 border-background"
                                >
                                  {Math.min(item.badgeCount || 0, 9)}
                                  {(item.badgeCount || 0) > 9 && "+"}
                                </Badge>
                              )}
                              {item.new && (
                                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 border border-background" />
                              )}
                            </div>

                            {isOpen && (
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <Typography
                                  variant="body-sm"
                                  weight="medium"
                                  className={cn(
                                    "truncate transition-colors",
                                    isActive
                                      ? "text-primary"
                                      : "group-hover:text-primary",
                                  )}
                                >
                                  {item.label}
                                </Typography>
                                {item.new && (
                                  <Badge className="bg-green-500/20 text-green-600 text-[10px] px-1.5 py-0">
                                    New
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Active indicator */}
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                              />
                            )}
                          </motion.div>
                        </Link>
                      </TooltipTrigger>
                      {!isOpen && (
                        <TooltipContent side="right" className="ml-2">
                          <div className="text-center">
                            <Typography variant="caption1" weight="medium">
                              {item.label}
                            </Typography>
                            {item.badge && (item.badgeCount || 0) > 0 && (
                              <Typography variant="caption2" theme="muted">
                                {item.badgeCount} non lu
                              </Typography>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer with auth actions */}
        <div className="p-4 border-t border-border/50 mt-auto">
          {isOpen ? (
            <div className="space-y-3">
              {isAuthenticated ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    onClick={handleAuthAction}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Déconnexion
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full justify-start gap-2 rounded-lg bg-gradient-to-r from-primary to-purple-600"
                      onClick={handleAuthAction}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Connexion
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 rounded-lg"
                      onClick={() => {
                        router.push("/sign-up");
                        onClose && onClose();
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Inscription
                    </Button>
                  </motion.div>
                </>
              )}

              <div className="text-center pt-2">
                <Typography variant="caption2" theme="muted">
                  © {new Date().getFullYear()} GT
                </Typography>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAuthAction}
                      className="h-9 w-9 rounded-full hover:bg-primary/10"
                    >
                      {isAuthenticated ? (
                        <LogOut className="h-4 w-4" />
                      ) : (
                        <LogIn className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <Typography variant="caption1">
                    {isAuthenticated ? "Déconnexion" : "Connexion"}
                  </Typography>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
