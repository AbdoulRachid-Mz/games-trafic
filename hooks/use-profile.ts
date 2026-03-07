"use client";

import { useQuery } from "@tanstack/react-query";
import { UserWithAllRelations } from "@/actions/users";
import { useAuthContext } from "@/contexts/auth-context";

// Reuse the type or import it if I move it
export interface CompleteUserData extends UserWithAllRelations {
  hasPasskey?: boolean;
  stats: {
    shopsCount: number;
    tournamentsCount: number;
    productsCount: number;
    followersCount: number;
    followingCount: number;
  };
}

export interface UseProfileOptions {
  enabled?: boolean;
  mode?: "minimal" | "partial" | "full";
  relations?: string[];
}

// Assume useAuth() is available in your project
// Adjust import path as needed
// import { useAuth } from "@/hooks/useAuth";

async function fetchUserProfile(
  mode: string,
  relations?: string[],
): Promise<CompleteUserData | null> {
  const params = new URLSearchParams({
    me: "true",
    mode,
  });
  if (relations?.length) params.append("relations", relations.join(","));

  const res = await fetch(`/api/auth/profile?${params.toString()}`);
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  const json = await res.json();
  if (json.success && json.user) return json.user;
  throw new Error(json.error || "Unknown error");
}

export function useUserProfile(
  options: UseProfileOptions | boolean = true,
) {
  const { isAuthenticated } = useAuthContext();

  const enabled =
    typeof options === "boolean" ? options : (options.enabled ?? true);
  const mode =
    typeof options === "object" ? (options.mode ?? "minimal") : "minimal";
  const relations = typeof options === "object" ? options.relations : undefined;

  const staleTime =
    mode === "minimal" ? 5 * 60 * 1000 : mode === "partial" ? 2 * 60 * 1000 : 60 * 1000;

  const queryKey = ["userProfile", mode, ...(relations || [])];

  const query = useQuery<CompleteUserData | null, Error>({
    queryKey,
    queryFn: () => fetchUserProfile(mode, relations),
    enabled: enabled && isAuthenticated,
    staleTime,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh: () => query.refetch(),
  };
}
