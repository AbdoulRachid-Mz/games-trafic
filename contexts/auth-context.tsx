// contexts/auth-context.tsx - VERSION OPTIMISÉE
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/database/schema";

interface AuthContextType {
  // État
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Rôles
  isAdmin: boolean;
  isVip: boolean;
  roles: string[];

  // Permissions
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;

  // Actions
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const value = useMemo(
    () => ({
      user: auth.user,
      loading: auth.loading,
      isAuthenticated: auth.isAuthenticated,
      isAdmin: auth.isAdmin,
      isVip: auth.isVip,
      roles: auth.roles,
      permissions: auth.permissions,
      hasPermission: auth.hasPermission,
      hasRole: auth.hasRole,
      refreshUser: auth.refreshUser,
      signOut: auth.signOut,
      signIn: auth.signIn,
      signUp: auth.signUp,
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

// Hooks de compatibilité
export function useAuthState() {
  const { user, loading, isAuthenticated } = useAuthContext();
  return { user, loading, isAuthenticated };
}

export function usePermissions() {
  const { hasPermission, isAdmin, isVip, permissions } = useAuthContext();
  return { hasPermission, isAdmin, isVip, permissions };
}

export function useRoles() {
  const { hasRole, isAdmin, isVip, roles } = useAuthContext();
  return { hasRole, isAdmin, isVip, roles };
}
