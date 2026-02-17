import { useMemo, useCallback, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchEntities } from "@/actions/entities";
import { useAuthContext } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-debounce";

export type LocalSearchType =
  | "shop"
  | "product"
  | "tournament"
  | "theme"
  | "service"
  | "guide"
  | "blog"
  | "item";

export interface LocalSearchResult {
  id: string;
  type: LocalSearchType;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  raw?: any;
}

export interface UseLocalSearchOptions {
  limitPerType?: number;
  debounceMs?: number;
  enabled?: boolean;
}

function toTableName(t: LocalSearchType): string {
  if (t === "item") return "gameItems";
  if (t === "shop") return "shops";
  if (t === "product") return "products";
  if (t === "tournament") return "tournaments";
  if (t === "theme") return "themes";
  if (t === "service") return "services";
  if (t === "guide") return "guides";
  if (t === "blog") return "blogs";
  return t;
}

function normalizeResult(type: LocalSearchType, row: any): LocalSearchResult {
  if (type === "shop") {
    return {
      id: row.id,
      type,
      title: row.name || row.title || "",
      description: row.description || "",
      image: row.profileImage || row.images?.[0] || row.thumbnail || undefined,
      raw: row,
    };
  }
  if (type === "product") {
    return {
      id: row.id,
      type,
      title: row.name || row.title || "",
      description: row.description || "",
      image: row.image || row.images?.[0] || undefined,
      price: row.price || row.amount || undefined,
      currency: row.currency || "GTC",
      raw: row,
    };
  }
  if (type === "tournament") {
    return {
      id: row.id,
      type,
      title: row.name || row.title || "",
      description: row.description || "",
      image: row.image || row.images?.[0] || undefined,
      raw: row,
    };
  }
  if (type === "theme") {
    return {
      id: row.id,
      type,
      title: row.name || row.title || "",
      description: row.description || "",
      image: row.thumbnail || row.images?.[0] || undefined,
      price: row.price || undefined,
      currency: row.currency || "GTC",
      raw: row,
    };
  }
  if (type === "service") {
    return {
      id: row.id,
      type,
      title: row.title || row.name || "",
      description: row.description || "",
      image: row.images?.[0] || undefined,
      raw: row,
    };
  }
  if (type === "guide") {
    return {
      id: row.id,
      type,
      title: row.title || "",
      description: row.category || row.description || "",
      image: row.images?.[0] || undefined,
      raw: row,
    };
  }
  if (type === "blog") {
    return {
      id: row.id,
      type,
      title: row.title || "",
      description: row.content ? String(row.content).slice(0, 140) : "",
      image: row.images?.[0] || undefined,
      raw: row,
    };
  }
  if (type === "item") {
    return {
      id: row.id,
      type,
      title: row.name || row.title || "",
      description: row.description || "",
      image: row.image || row.images?.[0] || undefined,
      price: row.price || undefined,
      currency: row.currency || "GTC",
      raw: row,
    };
  }
  return {
    id: row.id,
    type,
    title: row.name || row.title || "",
    description: row.description || "",
    image: row.image || row.images?.[0] || undefined,
    raw: row,
  };
}

export function useLocalSearch(
  types: LocalSearchType[] | "all",
  term: string,
  options: UseLocalSearchOptions = {},
) {
  const { user } = useAuthContext();
  const storageKey = user?.id ? `search_session_${user.id}` : "search_session_anonymous";
  const limitPerType = options.limitPerType ?? 8;
  const debouncedTerm = useDebounce(term, options.debounceMs ?? 400);
  const enabled = options.enabled !== false && debouncedTerm.length >= 2;

  const selectedTypes: LocalSearchType[] = useMemo(() => {
    if (types === "all") {
      return ["shop", "product", "tournament", "theme", "service", "guide", "blog", "item"];
    }
    return Array.from(new Set(types));
  }, [types]);

  const queries = useQueries({
    queries: selectedTypes.map((t) => ({
      queryKey: ["local-search", t, debouncedTerm, limitPerType],
      queryFn: async () => {
        const table = toTableName(t);
        const res = await fetchEntities<any>(table, {
          page: 1,
          limit: limitPerType,
          search: debouncedTerm,
          isActive: true,
          isDeleted: false,
        });
        return res.data.map((row: any) => normalizeResult(t, row));
      },
      enabled,
      staleTime: 60_000,
      gcTime: 300_000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const results: LocalSearchResult[] = useMemo(() => {
    if (!enabled) return [];
    return queries.flatMap((q) => (q.data as LocalSearchResult[] | undefined) || []);
  }, [queries, enabled]);

  const getHistory = useCallback((): { id: string; query: string; timestamp: number }[] => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as { id: string; query: string; timestamp: number }[];
      parsed.sort((a, b) => b.timestamp - a.timestamp);
      return parsed.slice(0, 50);
    } catch {
      return [];
    }
  }, [storageKey]);

  const setHistory = useCallback(
    (items: { id: string; query: string; timestamp: number }[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 50)));
      } catch {}
    },
    [storageKey],
  );

  const addToHistory = useCallback(
    (q: string) => {
      const termClean = q.trim().toLowerCase();
      if (!termClean || termClean.length < 2) return;
      const items = getHistory();
      const filtered = items.filter(
        (it) => it.query !== termClean && Date.now() - it.timestamp < 5 * 60 * 1000,
      );
      const newItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        query: termClean,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 50);
      setHistory(updated);
    },
    [getHistory, setHistory],
  );

  const clearHistory = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const deleteHistoryItem = useCallback(
    (termOrId: string) => {
      const items = getHistory();
      const updated = items.filter((it) => it.id !== termOrId && it.query !== termOrId);
      setHistory(updated);
    },
    [getHistory, setHistory],
  );

  const suggestions = useMemo(() => {
    if (!term) return [];
    const items = getHistory();
    return items
      .filter((h) => h.query.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 5)
      .map((h) => h.query);
  }, [getHistory, term]);

  useEffect(() => {}, [debouncedTerm]);

  return {
    results,
    isLoading,
    addToHistory,
    clearHistory,
    deleteHistoryItem,
    history: useMemo(() => getHistory(), [getHistory]),
    suggestions,
    debouncedTerm,
  };
}

