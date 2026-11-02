"use client";

import { useCallback, useMemo } from "react";
import type { User } from "@/database/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

interface SessionResponse {
  authenticated: boolean;
  user: User | null;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isVip: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyResetToken: (token: string) => Promise<string>;
}

async function fetchSession(): Promise<SessionResponse> {
  try {
    const { data, error } = await authClient.getSession();
    if (error || !data?.user) {
      return { authenticated: false, user: null };
    }
    return { authenticated: true, user: data.user as unknown as User };
  } catch (err) {
    console.error("fetchSession error:", err);
    return { authenticated: false, user: null };
  }
}

function getPermissions(user: User | null): string[] {
  if (!user) return [];
  const permissions = new Set<string>(["user:read"]);
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

function getRoles(user: User | null): string[] {
  if (!user) return [];
  const roles = new Set<string>(["user"]);
  if (user.isAdmin) roles.add("admin");
  if (user.isVip) roles.add("vip");
  user.accountTypes?.forEach((type) => roles.add(type.toLowerCase()));
  return Array.from(roles);
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const user = data?.user ?? null;
  const isAuthenticated = !!user;

  const permissions = useMemo(() => getPermissions(user), [user]);
  const roles = useMemo(() => getRoles(user), [user]);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    await queryClient.resetQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message);
      await refreshUser();
    },
    [refreshUser]
  );

  const signUp = useCallback(
    async (email: string, password: string, userData?: any) => {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: userData?.name || email.split("@")[0],
        ...userData,
      });
      if (error) throw new Error(error.message);
      await refreshUser();
    },
    [refreshUser]
  );

  return {
    user,
    loading: isLoading,
    isAuthenticated,
    permissions,
    roles,
    hasPermission,
    hasRole,
    isAdmin: user?.isAdmin || false,
    isVip: user?.isVip || false,
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
      const { error } = await authClient.resetPassword({ token, newPassword });
      if (error) throw new Error(error.message);
    },
    verifyResetToken: async (token: string) => {
      if (!token) throw new Error("Token manquant");
      return "Utilisateur";
    },
  };
}