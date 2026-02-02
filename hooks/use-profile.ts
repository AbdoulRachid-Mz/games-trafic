"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserWithAllRelations } from "@/actions/users";

// Reuse the type or import it if I move it
export interface CompleteUserData extends UserWithAllRelations {
  stats: {
    shopsCount: number;
    tournamentsCount: number;
    productsCount: number;
    followersCount: number;
    followingCount: number;
  };
}

interface UseProfileReturn {
  data: CompleteUserData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Simple in-memory cache per mode
const PROFILE_CACHE: Record<
  string,
  { data: CompleteUserData | null; timestamp: number }
> = {
  minimal: { data: null, timestamp: 0 },
  partial: { data: null, timestamp: 0 },
  full: { data: null, timestamp: 0 },
};
const CACHE_TTL = 30000; // 30s

export interface UseProfileOptions {
  enabled?: boolean;
  mode?: "minimal" | "partial" | "full";
  relations?: string[];
}

export function useUserProfile(options: UseProfileOptions | boolean = true) {
  const enabled =
    typeof options === "boolean" ? options : (options.enabled ?? true);
  const mode =
    typeof options === "object" ? (options.mode ?? "minimal") : "minimal";
  const relations = typeof options === "object" ? options.relations : undefined;

  const [data, setData] = useState<CompleteUserData | null>(
    PROFILE_CACHE[mode]?.data || null,
  );
  const [loading, setLoading] = useState(!PROFILE_CACHE[mode]?.data && enabled);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(
    async (force = false) => {
      if (!enabled) return;

      // Check cache for this specific mode
      const now = Date.now();
      const cached = PROFILE_CACHE[mode];
      if (!force && cached?.data && now - cached.timestamp < CACHE_TTL) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          me: "true",
          mode: mode,
        });
        if (relations) params.append("relations", relations.join(","));

        const res = await fetch(`/api/auth/profile?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Cache-Control": force ? "no-cache" : "default",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setData(null);
            return;
          }
          throw new Error(`Failed to fetch profile: ${res.status}`);
        }

        const json = await res.json();
        if (json.success && json.user) {
          PROFILE_CACHE[mode] = {
            data: json.user,
            timestamp: Date.now(),
          };
          setData(json.user);
        } else {
          setError(json.error || "Unknown error");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [enabled, mode, relations],
  );

  useEffect(() => {
    fetchProfile();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchProfile]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchProfile(true),
  };
}
