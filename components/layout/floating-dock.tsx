"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useActiveRoute } from "@/hooks/use-active-route";
import { Wallet, History, CreditCard, Shield, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  requireAuth?: boolean;
};

type FloatingDockProps = {
  navItems: NavItem[];
  isFixed?: boolean;
};

export function FloatingDock({ navItems, isFixed = true }: FloatingDockProps) {
  const { isActive } = useActiveRoute();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    if (!isFixed) return;
    const unsubscribe = scrollY.on("change", (latest) => {
      if (latest > lastY && latest > 80) {
        // scrolling down
        setVisible(false);
      } else {
        // scrolling up or stopped
        setVisible(true);
      }
      setLastY(latest);
    });
    return () => unsubscribe();
  }, [scrollY, lastY, isFixed]);

  const dockVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const filteredItems = navItems.filter((item) => {
    // Add your authentication logic here
    // For example, check if user is authenticated
    const isAuthenticated = true; // Replace with actual auth check
    if (item.requireAuth && !isAuthenticated) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {(!isFixed || visible) && (
        <motion.nav
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={dockVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "bottom-0 left-0 right-0 z-50 mb-4 flex justify-center pointer-events-none",
            isFixed ? "fixed" : "relative"
          )}
        >
          <div className="flex items-center gap-2 p-2 rounded-full bg-background/80 backdrop-blur-lg border shadow-lg pointer-events-auto">
            {filteredItems.map((item, idx) => {
              const isActiveRoute = isActive(item.href, false);
              const Icon = item.icon;

              return (
                <Link key={idx} href={item.href}>
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-full transition-colors cursor-pointer",
                      isActiveRoute
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-primary/10"
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm">
                      {item.label}
                    </span>
                  </motion.a>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

// Example usage:
// const navItems: NavItem[] = [
//   { href: "/wallet", label: "Vue d'ensemble", icon: Wallet },
//   { href: "/wallet/transactions", label: "Transactions", icon: CreditCard },
//   { href: "/wallet/transactions/history", label: "Historique", icon: History, requireAuth: true },
//   { href: "/wallet/settings", label: "Paramètres", icon: Settings, requireAuth: true },
// ];
// <FloatingDock navItems={navItems} isFixed={true} />
