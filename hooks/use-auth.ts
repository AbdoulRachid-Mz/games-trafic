// hooks/use-auth.ts - VERSION OPTIMISÉE
"use client";

import { useCallback, useMemo } from "react";
import type { User } from "@/database/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

// Types
export interface SessionData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  roles: string[];
}

interface UseAuthReturn {
  // État de base
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // Rôles et permissions
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isVip: boolean;
  
  // Actions
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  
  // Gestion mot de passe
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyResetToken: (token: string) => Promise<string>;
}

// Cache en mémoire pour éviter les requêtes répétées
let sessionCache: SessionData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 secondes

async function fetchSessionWithCache(force = false): Promise<SessionData> {
  const now = Date.now();
  
  // Utiliser le cache si disponible et pas expiré
  if (!force && sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return sessionCache;
  }
  
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
      headers: {
        "Cache-Control": force ? "no-cache" : "max-age=0",
      },
    });
    
    if (!res.ok) {
      throw new Error(`Session fetch failed: ${res.status}`);
    }
    
    const data = await res.json();
    
    const user = data.authenticated ? data.user : null;
    const isAuthenticated = !!user;
    
    // Calculer les permissions et rôles
    const permissions = getUserPermissions(user);
    const roles = getUserRoles(user);
    
    // Mettre en cache
    sessionCache = {
      user,
      isAuthenticated,
      isLoading: false,
      permissions,
      roles,
    };
    cacheTimestamp = now;
    
    return sessionCache;
    
  } catch (error) {
    console.error("Error fetching session:", error);
    
    // Retourner un état vide en cas d'erreur
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      roles: [],
    };
  }
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  
  const {
    data: sessionData = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      permissions: [],
      roles: [],
    },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => fetchSessionWithCache(false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  const refreshUser = useCallback(async () => {
    // Invalider le cache
    sessionCache = null;
    cacheTimestamp = 0;
    
    await queryClient.invalidateQueries({ queryKey: ["auth-session"] });
    await refetch();
  }, [queryClient, refetch]);

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
      // Invalider le cache immédiatement
      sessionCache = null;
      cacheTimestamp = 0;
      await refreshUser();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      
      if (error) throw new Error(error.message);
      
      await refreshUser();
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }, [refreshUser]);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: userData?.name || email.split('@')[0],
        ...userData,
      });
      
      if (error) throw new Error(error.message);
      
      await refreshUser();
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }, [refreshUser]);

  const hasPermission = useCallback(
    (permission: string) => {
      return sessionData.permissions.includes(permission);
    },
    [sessionData.permissions]
  );

  const hasRole = useCallback(
    (role: string) => {
      return sessionData.roles.includes(role);
    },
    [sessionData.roles]
  );

  return {
    user: sessionData.user,
    loading: isLoading || sessionData.isLoading,
    isAuthenticated: sessionData.isAuthenticated,
    permissions: sessionData.permissions,
    roles: sessionData.roles,
    hasPermission,
    hasRole,
    isAdmin: sessionData.user?.isAdmin || false,
    isVip: sessionData.user?.isVip || false,
    refreshUser,
    signOut,
    signIn,
    signUp,
    forgotPassword: async (email: string) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
    },
    resetPassword: async (token: string, newPassword: string) => {
      const { error } = await authClient.resetPassword({
        token,
        newPassword,
      });
      if (error) throw new Error(error.message);
    },
    verifyResetToken: async (token: string) => {
      if (!token) throw new Error("Token manquant");
      return "Utilisateur";
    },
  };
}

// Fonctions utilitaires optimisées
function getUserPermissions(user: User | null): string[] {
  if (!user) return [];
  
  const permissions: Set<string> = new Set(["user:read"]);
  
  if (user.isAdmin) {
    permissions.add("admin:access");
    permissions.add("user:manage");
    permissions.add("content:manage");
    permissions.add("system:config");
  }
  
  if (user.isVip) {
    permissions.add("vip:access");
    permissions.add("theme:create");
    permissions.add("shop:create_multiple");
    permissions.add("tournament:create_multiple");
  }
  
  user.accountTypes?.forEach((type) => {
    switch (type) {
      case "SELLER":
        permissions.add("product:sell");
        permissions.add("shop:create");
        break;
      case "TOURNAMENT_ORGANIZER":
        permissions.add("tournament:create");
        permissions.add("tournament:manage");
        break;
      case "TRADER":
        permissions.add("product:trade");
        permissions.add("exchange:create");
        break;
    }
  });
  
  return Array.from(permissions);
}

function getUserRoles(user: User | null): string[] {
  if (!user) return [];
  
  const roles: Set<string> = new Set(["user"]);
  
  if (user.isAdmin) roles.add("admin");
  if (user.isVip) roles.add("vip");
  
  user.accountTypes?.forEach((type) => {
    roles.add(type.toLowerCase());
  });
  
  return Array.from(roles);
}