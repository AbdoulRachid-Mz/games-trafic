"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { findRouteConfig } from "@/config/routes-config";
import { FABAction } from "@/config/routes-config";

export const useFabActions = () => {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuthContext();
  
  const routeConfig = useMemo(() => {
    return findRouteConfig(pathname);
  }, [pathname]);
  
  const actions = useMemo(() => {
    if (!routeConfig?.fabActions) return [];
    
    return (routeConfig.fabActions as FABAction[]).filter((action: FABAction) => {
      if (action.requiresAdmin && !isAdmin) return false;
      if (action.requiresAuth && !isAuthenticated) return false;
      return true;
    });
  }, [routeConfig?.fabActions, isAdmin, isAuthenticated]);
  
  const defaultActions: FABAction[] = useMemo(() => [
    {
      id: "create-shop",
      label: "Créer une boutique",
      type: "link",
      url: "/shops/create",
      requiresAuth: true,
    },
    {
      id: "create-tournament",
      label: "Créer un tournoi",
      type: "link",
      url: "/tournaments/create",
      requiresAuth: true,
    },
    {
      id: "marketplace",
      label: "Marketplace",
      type: "link",
      url: "/marketplace",
    },
  ], []);
  
  return {
    actions,
    defaultActions,
  };
};