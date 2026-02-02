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
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Typography } from "@/components/ui/typography";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useActiveRoute } from "@/hooks/use-active-route";
import { useScreenSize } from "@/hooks/use-screen";
import type { FABAction as FABActionType } from "@/config/routes-config";
import type { NavItem } from "@/types/routes";
import { Badge } from "../ui/badge";

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
  const [showNavLinks, setShowNavLinks] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthContext();
  const { isActive } = useActiveRoute();
  const { scrollY } = useScroll();
  const { isSmallScreen, isMediumScreen } = useScreenSize();
// 1️⃣ Motion values de base
const x = useMotionValue(0);
const y = useMotionValue(0);

// 2️⃣ Transforms dérivés
const transformedX = useTransform(x, (v) => dragPosition.x + v);
const transformedY = useTransform(y, (v) => dragPosition.y + v);

// 3️⃣ Rotations
const rotateX = useTransform(y, [-100, 100], [10, -10]);
const rotateY = useTransform(x, [-100, 100], [-10, 10]);

// 4️⃣ Contraintes de drag
const dragConstraints = useMemo(() => {
  if (typeof window === "undefined") return undefined;

  return {
    left: 50,
    right: window.innerWidth - 50,
    top: 50,
    bottom: window.innerHeight - 50,
  };
}, []);


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
    { href: "/themes", label: "Thèmes", icon: Palette, requireAuth: false },
  ];

  const navItems = propNavItems.length > 0 ? propNavItems : defaultNavItems;

  useEffect(() => {
    setIsMounted(true);

    // Set initial drag position to bottom right
    if (typeof window !== "undefined") {
      setDragPosition({
        x: window.innerWidth - 100,
        y: window.innerHeight - 100,
      });
    }
  }, []);

  // Scroll behavior for hide/show
  useEffect(() => {
    if (!isFixed) return;

    const unsubscribe = scrollY.on("change", (latest) => {
      if (isDragging) return;

      if (latest > lastScrollY && latest > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(latest);
    });

    return () => unsubscribe();
  }, [scrollY, lastScrollY, isFixed, isDragging]);

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
        setShowNavLinks(false);
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
      setShowNavLinks(false);
    },
    [isAuthenticated, router],
  );

  // Handle press for long press
  const handlePressStart = () => {
    pressTimerRef.current = setTimeout(() => {
      // Long press shows actions
      if (filteredActions.length > 0) {
        setShowActions(true);
        setShowNavLinks(false);
      }
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // Handle click
  const handleClick = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // Toggle nav links on click
    if (filteredNavItems.length > 0) {
      setShowNavLinks(!showNavLinks);
      setShowActions(false);
    }
  };

  // Handle drag
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);

    // Update position
    setDragPosition((prev) => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y,
    }));

    // Reset motion values
    x.set(0);
    y.set(0);
  };

  // Don't render if hidden or not mounted
  if (!isMounted || hidden || (isFixed && !visible && !isDragging)) {
    return null;
  }

  return (
    <TooltipProvider>
      {/* Navigation Dock (Bottom Center) */}
      <AnimatePresence>
        {showNavLinks && filteredNavItems.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-background/95 backdrop-blur-lg border border-border/50 shadow-2xl">
              {filteredNavItems.map((item, idx) => {
                const isActiveRoute = isActive(item.href, false);
                const Icon = item.icon as React.ElementType;

                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <motion.div
                          whileHover={{ scale: 1.15, y: -5 }}
                          whileTap={{ scale: 0.9 }}
                          className={cn(
                            "flex items-center justify-center p-3 rounded-xl transition-all duration-200",
                            "hover:shadow-lg cursor-pointer",
                            isActiveRoute
                              ? "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg"
                              : "hover:bg-primary/10",
                          )}
                          aria-label={item.label}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <Typography variant="caption1">{item.label}</Typography>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
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

            {/* Actions List */}
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
              style={{
                left: dragPosition.x - 100,
                top: dragPosition.y - filteredActions.length * 60 - 20,
              }}
              className="fixed z-50 rounded-2xl shadow-2xl p-2 min-w-[200px] bg-background/95 backdrop-blur-lg border border-border/50"
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
                          ? "bg-gradient-to-r from-primary to-purple-600 text-white"
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

      {/* Main FAB Button */}
      <motion.div
        style={{
          x: transformedX,
          y: transformedY,
          rotateX,
          rotateY,
        }}
        className="fixed z-50 cursor-grab active:cursor-grabbing"
        drag
        dragMomentum={false}
        dragElastic={0.1}
       dragConstraints={dragConstraints}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                ref={fabRef}
                size="icon"
                className={cn(
                  "rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all duration-300",
                  "bg-gradient-to-br from-primary via-purple-600 to-pink-600 hover:from-primary hover:via-purple-700 hover:to-pink-700",
                  "relative overflow-hidden group",
                  (showActions || showNavLinks) &&
                    "ring-3 ring-primary/50 ring-offset-2 ring-offset-background",
                )}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onClick={handleClick}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-600/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showActions || showNavLinks ? "close" : "open"}
                      initial={{ rotate: 0, scale: 1 }}
                      animate={{
                        rotate: showActions || showNavLinks ? 180 : 0,
                        scale: showActions || showNavLinks ? 0.8 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center"
                    >
                      {showActions || showNavLinks ? (
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
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="flex items-center gap-2">
              <Typography variant="caption1" weight="medium">
                {showActions
                  ? "Actions rapides"
                  : showNavLinks
                    ? "Navigation rapide"
                    : filteredActions.length > 0
                      ? "Cliquez pour naviguer, maintenez pour les actions"
                      : "Menu de navigation"}
              </Typography>
              {!showActions && !showNavLinks && filteredActions.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {filteredActions.length}
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
};
