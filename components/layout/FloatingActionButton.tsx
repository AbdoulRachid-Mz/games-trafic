// components/layout/FloatingActionButton.tsx
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
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Typography } from "@/components/ui/typography";
import { useAuthContext } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { useActiveRoute } from "@/hooks/use-active-route";
import type { FABAction as FABActionType } from "@/config/routes-config";
import type { NavItem } from "@/types/routes";
import { Badge } from "../ui/badge";
import { resolveRoute } from "@/lib/routes/resolver";

export type FABAction = FABActionType;

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
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthContext();
  const { data: profile } = useUserProfile({ mode: "partial", relations: ["wallet"] });
  const { pathname } = useActiveRoute();
  const { scrollY } = useScroll();

  const resolved = useMemo(() => {
    try {
      return resolveRoute(pathname || "/", {
        isAuthenticated: !!isAuthenticated,
        isAdmin: !!isAdmin,
        isVip: false,
        hasWallet: !!profile?.wallet?.id || !!(profile as { hasWallet?: boolean })?.hasWallet,
      });
    } catch {
      return { pathname: pathname || "/" } as ReturnType<typeof resolveRoute>;
    }
  }, [pathname, isAuthenticated, isAdmin, profile?.wallet?.id, (profile as { hasWallet?: boolean })?.hasWallet]);

  // Default nav items if none provided
  const defaultNavItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Accueil", icon: Home, requireAuth: false },
      { href: "/marketplace", label: "Marketplace", icon: Store, requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: ShoppingBag, requireAuth: false },
      { href: "/tournaments", label: "Tournois", icon: Trophy, requireAuth: false },
      { href: "/games", label: "Jeux", icon: Gamepad2, requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: Palette, requireAuth: false },
    ],
    []
  );

  const navItems = propNavItems.length > 0 ? propNavItems : defaultNavItems;

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Harmonized scroll detection via framer-motion (same pattern as top-middle.tsx)
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!isFixed || showActions) return;
    if (latest > lastScrollY && latest > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    setLastScrollY(latest);
  });

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
    [isAuthenticated, router]
  );

  if (!isMounted || hidden) return null;

  const hasFab = filteredActions.length > 0;

  return (
    <TooltipProvider>
      <AnimatePresence>
        {(isVisible || showActions) && (
          <motion.div
            initial={{
              y: isInitialLoad ? 100 : 0,
              opacity: isInitialLoad ? 0 : 1,
              scale: isInitialLoad ? 0.9 : 1,
            }}
            animate={{
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              y: 100,
              opacity: 0,
              scale: 0.9,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
            className={cn(
              "z-40",
              isFixed
                ? "fixed bottom-5 max-md:bottom-3 left-1/2 -translate-x-1/2"
                : "relative flex justify-center"
            )}
          >
            {/* Conteneur principal du Dock unifié */}
            <div
              ref={containerRef}
              className={cn(
                "relative flex items-center p-1.5 rounded-2xl bg-background/85 dark:bg-neutral-950/85 backdrop-blur-xl border border-border/60 shadow-2xl transition-all duration-300",
                "ring-1 ring-white/10 dark:ring-white/5",
                hasFab ? "pr-16" : "pr-1.5"
              )}
            >
              {/* Zone scrollable horizontalement (4 max mobile/md, 6 max lg+) */}
              <div
                ref={scrollTrackRef}
                className={cn(
                  "flex items-center gap-1 overflow-x-auto scroll-smooth",
                  // Hide scrollbar cleanly across browsers
                  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                  // Responsive container width: 4 items max on mobile/md (4*58px + gaps = ~248px), 6 on lg+ (6*58px + gaps = ~374px)
                  "max-w-[248px] lg:max-w-[374px]"
                )}
              >
                {(() => {
                  const normalizeHref = (href: string) =>
                    href.endsWith("/") && href !== "/" ? href.slice(0, -1) : href;
                  const activeItem = filteredNavItems.find(
                    (i) => resolved.pathname === normalizeHref(i.href)
                  );
                  const activeHref = activeItem ? normalizeHref(activeItem.href) : "";

                  return filteredNavItems.map((item, idx) => {
                    const isActiveRoute =
                      activeHref !== "" && normalizeHref(item.href) === activeHref;
                    const Icon = item.icon as React.ElementType;

                    return (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => router.push(item.href)}
                            className={cn(
                              "flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-200 cursor-pointer",
                              "flex-shrink-0 w-[58px] min-w-[58px] h-[52px] relative group",
                              isActiveRoute ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            aria-label={item.label}
                          >
                            <motion.div
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex flex-col items-center justify-center w-full h-full"
                            >
                              {isActiveRoute && (
                                <motion.div
                                  layoutId="activeDockIndicator"
                                  className="absolute -top-1 h-1 w-6 rounded-full bg-gradient-to-r from-primary to-purple-600 shadow-sm"
                                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                              )}

                              <div
                                className={cn(
                                  "p-1.5 rounded-lg mb-0.5 transition-all duration-300",
                                  isActiveRoute
                                    ? "bg-primary text-white shadow-md shadow-primary/25"
                                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>

                              <Typography
                                variant="caption2"
                                weight={isActiveRoute ? "bold" : "medium"}
                                className={cn(
                                  "text-[10px] leading-tight truncate max-w-full transition-colors",
                                  isActiveRoute ? "text-primary" : "text-muted-foreground"
                                )}
                              >
                                {item.label}
                              </Typography>
                            </motion.div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  });
                })()}
              </div>

              {/* Bouton FAB : Intégré au dock, positionné en absolu à droite */}
              {hasFab && (
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        ref={fabRef}
                        size="icon"
                        onClick={() => setShowActions((prev) => !prev)}
                        className={cn(
                          "rounded-xl w-12 h-12 shadow-lg transition-all duration-300",
                          "bg-gradient-to-br from-primary via-primary to-pink-600 hover:from-primary hover:via-purple-700 hover:to-pink-700",
                          "relative overflow-hidden group",
                          showActions && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background"
                        )}
                        aria-label="Actions rapides"
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={showActions ? "close" : "open"}
                            initial={{ rotate: -90, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            exit={{ rotate: 90, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center"
                          >
                            {showActions ? (
                              <X className="h-5 w-5 text-primary-foreground" />
                            ) : (
                              <Plus className="h-5 w-5 text-primary-foreground" />
                            )}
                          </motion.div>
                        </AnimatePresence>

                        {/* Badge avec nombre d'actions */}
                        {filteredActions.length > 0 && !showActions && (
                          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-white dark:bg-black border border-primary text-[10px] font-bold text-primary flex items-center justify-center shadow-sm">
                            {filteredActions.length}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {showActions ? "Fermer les actions" : "Actions rapides"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Popup des Actions rapides (au-dessus du dock) */}
              <AnimatePresence>
                {showActions && filteredActions.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.85, opacity: 0, y: 15 }}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                    className="absolute bottom-full right-0 mb-3 z-50 rounded-2xl shadow-2xl p-2 min-w-[220px] bg-background/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-border/60"
                  >
                    <div className="px-3 py-1.5 border-b border-border/40 mb-1 flex items-center justify-between">
                      <Typography variant="caption1" weight="semibold" className="text-muted-foreground uppercase text-[10px] tracking-wider">
                        Actions rapides
                      </Typography>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {filteredActions.length}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {filteredActions.map((action, index) => (
                        <motion.button
                          key={action.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          onClick={() => executeAction(action)}
                          className={cn(
                            "w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 group text-left",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            action.id === activeActionId
                              ? "bg-primary/15 text-primary"
                              : "hover:bg-primary/10 text-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "flex-shrink-0 p-1.5 rounded-lg transition-colors",
                              action.id === activeActionId
                                ? "bg-primary text-white shadow-md shadow-primary/25"
                                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                            )}
                          >
                            {action.icon || <Sparkles className="h-4 w-4" />}
                          </div>
                          <Typography variant="body-sm" weight="medium" className="truncate text-xs">
                            {action.label}
                          </Typography>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};

export default FloatingActionButton;
