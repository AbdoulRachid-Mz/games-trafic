"use client";

import {
  Plus,
  X,
  Sparkles,
  Home,
  Store,
  ShoppingBag,
  Trophy,
  Palette,
  Gamepad2,
  Wallet,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Typography } from "@/components/ui/typography";
import { useAuthContext } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useActiveRoute } from "@/hooks/use-active-route";
import type { FABAction as FABActionType } from "@/config/routes-config";
import type { NavItem } from "@/types/routes";
import { Badge } from "../ui/badge";
import { resolveRoute } from "@/lib/routes/resolver";

interface FloatingActionButtonProps {
  hidden?: boolean;
  actions?: FABActionType[];
  activeActionId?: string;
  navItems?: NavItem[];
  isFixed?: boolean;
}

export const FloatingActionButton = ({
  hidden,
  actions: propActions = [],
  activeActionId,
  navItems: propNavItems = [],
  isFixed = true,
}: FloatingActionButtonProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showNavLinks, setShowNavLinks] = useState(true); // Visible par défaut
  const [isMounted, setIsMounted] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const [dockVisible, setDockVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthContext();
  const { data: profile } = useUserProfile({ mode: "partial", relations: ["wallet"] });
  const { pathname } = useActiveRoute();
  const resolved = useMemo(() => {
    try {
      return resolveRoute(pathname || "/", {
        isAuthenticated: !!isAuthenticated,
        isAdmin: !!isAdmin,
        isVip: false,
        hasWallet: !!profile?.wallet?.id,
      } as any);
    } catch {
      return { pathname: pathname || "/" } as any;
    }
  }, [pathname, isAuthenticated, isAdmin, profile?.wallet?.id]);

  // Default nav items if none provided
  const defaultNavItems: NavItem[] = [
    { href: "/", label: "Accueil", icon: Home, requireAuth: false },
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: Store,
      requireAuth: false,
    },
    {
      href: "/shops",
      label: "Boutiques",
      icon: ShoppingBag,
      requireAuth: false,
    },
    {
      href: "/tournaments",
      label: "Tournois",
      icon: Trophy,
      requireAuth: false,
    },
    { href: "/games", label: "Jeux", icon: Gamepad2, requireAuth: false },
    { href: "/game-clips", label: "Clips", icon: Palette, requireAuth: false },
  ];

  const navItems = propNavItems.length > 0 ? propNavItems : defaultNavItems;

  useEffect(() => {
    setIsMounted(true);
    
    // Animation d'entrée initiale
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Gestion du scroll pour cacher/afficher
  useEffect(() => {
    if (!isFixed) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const isAtTop = currentScrollY < 100;
      
      // Masquer seulement si on descend et qu'on n'est pas en haut
      if (scrollingDown && !isAtTop && !showActions) {
        setFabVisible(false);
        setDockVisible(false);
      } else {
        // Afficher quand on remonte ou qu'on est en haut
        setFabVisible(true);
        setDockVisible(true);
      }
      
      setLastScrollY(currentScrollY);

      // Réafficher après un certain temps d'inactivité de scroll
      scrollTimeoutRef.current = setTimeout(() => {
        setFabVisible(true);
        setDockVisible(true);
      }, 1500); // Réapparaît après 1.5s sans scroll
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isFixed, lastScrollY, showActions]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        fabRef.current &&
        !fabRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter actions based on permissions
  const filteredActions = useMemo(() => {
    return propActions.filter((action) => {
      if (action.requiresAuth && !isAuthenticated) return false;
      if (action.requiresAdmin && !isAdmin) return false;
      return true;
    });
  }, [propActions, isAuthenticated, isAdmin]);

  // Filter nav items based on permissions
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.requireAuth && !isAuthenticated) return false;
      return true;
    });
  }, [navItems, isAuthenticated]);

  // Execute action
  const executeAction = useCallback(
    (action: FABActionType) => {
      if (action.requiresAuth && !isAuthenticated) {
        toast.info("Connectez-vous pour accéder à cette fonctionnalité");
        router.push("/sign-in");
        return;
      }

      if (action.type === "button" && action.action) {
        action.action();
      } else if (action.type === "link" && action.url) {
        router.push(action.url);
      }

      setShowActions(false);
    },
    [isAuthenticated, router],
  );

  // Handle press start (long press)
  const handlePressStart = () => {
    setIsPressed(true);
    pressTimerRef.current = setTimeout(() => {
      // Long press pour basculer les nav links
      setShowNavLinks(!showNavLinks);
      setShowActions(false);
    }, 500); // 500ms pour le long press
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // Handle click (court press)
  const handleClick = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // Click court pour basculer les actions
    if (filteredActions.length > 0) {
      setShowActions(!showActions);
    }
  };

  // Don't render if hidden or not mounted
  if (!isMounted || hidden) return null;

  // Si le dock est caché par le scroll ET par long press, ne rien afficher
  if (isFixed && !dockVisible && !showNavLinks && !fabVisible) {
    return null;
  }

  return (
    <TooltipProvider>
      {/* Navigation Dock (Bottom Center) */}
      <AnimatePresence>
        {showNavLinks && filteredNavItems.length > 0 && dockVisible && (
          <motion.div
            initial={{ 
              y: isInitialLoad ? 100 : 0, 
              opacity: isInitialLoad ? 0 : 1, 
              scale: isInitialLoad ? 0.8 : 1 
            }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1 
            }}
            exit={{ 
              y: 100, 
              opacity: 0, 
              scale: 0.8 
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="fixed bottom-10 max-md:bottom-4 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-background/30 backdrop-blur-lg border border-border/50 shadow-2xl">
              {(() => {
                const normalizeHref = (href: string) =>
                  href.endsWith("/") && href !== "/" ? href.slice(0, -1) : href;
                const activeItem = filteredNavItems.find(
                  (i) => resolved.pathname === normalizeHref(i.href),
                );
                const activeHref = activeItem ? normalizeHref(activeItem.href) : "";
                return filteredNavItems.map((item, idx) => {
                  const isActiveRoute = activeHref !== "" && normalizeHref(item.href) === activeHref;
                  const Icon = item.icon as React.ElementType;

                  return (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <Link href={item.href}>
                          <motion.div
                            whileHover={{ scale: 1.15, y: -5 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              "flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-300",
                              "hover:shadow-lg cursor-pointer min-w-[50px]",
                              "relative group",
                              isActiveRoute
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-primary/5",
                            )}
                            aria-label={item.label}
                          >
                            {/* Indicateur actif */}
                            {isActiveRoute && (
                              <motion.div
                                className="absolute -top-1 h-1 w-6 rounded-full bg-gradient-to-r from-primary to-purple-600"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                            
                            <div className={cn(
                              "p-2 rounded-lg mb-1 transition-all duration-300",
                              isActiveRoute
                                ? "bg-primary text-white shadow-lg"
                                : "bg-primary/10 text-primary group-hover:bg-gradient-to-r group-hover:from-primary/20 group-hover:to-purple-600/20"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            
                            <Typography
                              variant="caption2"
                              weight="medium"
                              className={cn(
                                "text-xs transition-colors duration-300",
                                isActiveRoute
                                  ? "text-primary font-bold"
                                  : "text-muted-foreground group-hover:text-foreground"
                              )}
                            >
                              {item.label}
                            </Typography>
                            
                            {/* Effet de halo sur l'élément actif */}
                            {isActiveRoute && (
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-purple-600/5 -z-10" />
                            )}
                          </motion.div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <Typography variant="caption1">{item.label}</Typography>
                      </TooltipContent>
                    </Tooltip>
                  );
                });
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions Menu */}
      <AnimatePresence>
        {showActions && filteredActions.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowActions(false)}
            />

            {/* Actions List - Positionné près du bouton FAB */}
            <motion.div
              ref={containerRef}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              className="fixed bottom-24 right-6 z-50 rounded-2xl shadow-2xl p-2 min-w-[200px] bg-background/95 backdrop-blur-lg border border-border/50"
            >
              {filteredActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => executeAction(action)}
                    className={cn(
                      "w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 group",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      action.id === activeActionId
                        ? "bg-gradient-to-r from-primary/20 to-purple-600/20 text-primary"
                        : "hover:bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 p-2 rounded-lg transition-colors",
                        action.id === activeActionId
                          ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg"
                          : "bg-primary/10 text-primary group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-600 group-hover:text-white",
                      )}
                    >
                      {action.icon || <Plus className="h-4 w-4" />}
                    </div>
                    <Typography
                      variant="body-sm"
                      weight="medium"
                      className="text-left"
                    >
                      {action.label}
                    </Typography>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB Button - Positionné en bas à droite */}
      <AnimatePresence>
        {fabVisible && (
          <motion.div
            initial={{ 
              x: isInitialLoad ? 100 : 0, 
              opacity: isInitialLoad ? 0 : 1,
              scale: isInitialLoad ? 0.8 : 1
            }}
            animate={{ 
              x: 0, 
              opacity: 1,
              scale: 1
            }}
            exit={{ 
              x: 100, 
              opacity: 0,
              scale: 0.8
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="fixed bottom-16 right-6 z-50"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    ref={fabRef}
                    size="icon"
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    onClick={handleClick}
                    className={cn(
                      "rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all duration-300",
                      "bg-gradient-to-br from-primary via-primary to-pink-600 hover:from-primary hover:via-purple-700 hover:to-pink-700",
                      "relative overflow-hidden group",
                      (showActions || isPressed) &&
                        "ring-3 ring-primary/50 ring-offset-2 ring-offset-background",
                    )}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-600/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Content */}
                    <div className="relative z-10">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={showActions ? "close" : "open"}
                          initial={{ rotate: 0, scale: 1 }}
                          animate={{
                            rotate: showActions ? 180 : 0,
                            scale: showActions ? 0.8 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center"
                        >
                          {showActions ? (
                            <X className="h-7 w-7 text-primary-foreground" />
                          ) : filteredActions.length > 0 ? (
                            <Plus className="h-7 w-7 text-primary-foreground" />
                          ) : (
                            <Sparkles className="h-7 w-7 text-primary-foreground" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Badge for actions count */}
                    {filteredActions.length > 0 && !showActions && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-white border-2 border-primary shadow-lg flex items-center justify-center"
                      >
                        <Typography
                          variant="caption2"
                          weight="bold"
                          className="text-primary"
                        >
                          {filteredActions.length}
                        </Typography>
                      </motion.div>
                    )}

                    {/* Indicateur de long press */}
                    {isPressed && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/50"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1.2 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <div className="flex flex-col gap-1">
                  <Typography variant="caption1" weight="medium">
                    {showActions
                      ? "Actions rapides"
                      : "Menu de navigation"}
                  </Typography>
                  <Typography variant="caption2" className="text-muted-foreground">
                    {filteredActions.length > 0 ? (
                      <>
                        <span className="text-primary">Cliquez</span> pour les actions
                        <br />
                        <span className="text-primary">Maintenez</span> pour {showNavLinks ? "masquer" : "afficher"} la navigation
                      </>
                    ) : (
                      <>
                        <span className="text-primary">Maintenez</span> pour {showNavLinks ? "masquer" : "afficher"} la navigation
                      </>
                    )}
                  </Typography>
                  {!showActions && filteredActions.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {filteredActions.length} action{filteredActions.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};
