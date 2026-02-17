"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTracingContext } from "@/contexts/tracing-context";
import type { JourneyAnalysis } from "@/types/tracing";

type Priority = "HIGH" | "MEDIUM" | "LOW";

const PRIORITY_ORDER: Priority[] = ["HIGH", "MEDIUM", "LOW"];

export function useJourneyRecommendations(options?: { minIntervalMs?: number }) {
  const { sessionId, userId, config } = useTracingContext() as any;
  const minIntervalMs = options?.minIntervalMs ?? 15000;

  const [analysis, setAnalysis] = useState<JourneyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const sortRecommendations = useCallback(
    (rec: NonNullable<JourneyAnalysis["recommendations"]>) => {
      return [...rec].sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority as Priority) -
          PRIORITY_ORDER.indexOf(b.priority as Priority)
      );
    },
    []
  );

  const fetchAnalysis = useCallback(
    async (force?: boolean) => {
      if (!config?.enabled || !config?.isActive) return;
      const now = Date.now();
      if (!force && now - lastFetchRef.current < minIntervalMs) return;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/traces/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userId,
            limit: 150,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Failed to analyze journey");
        }
        const json = (await res.json()) as {
          success: boolean;
          analysis: JourneyAnalysis;
        };
        const data = json.analysis;
        const sorted =
          data.recommendations && data.recommendations.length
            ? sortRecommendations(data.recommendations)
            : undefined;
        setAnalysis({
          ...data,
          recommendations: sorted,
        });
        lastFetchRef.current = Date.now();
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError(e?.message || "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    },
    [sessionId, userId, minIntervalMs, sortRecommendations, config?.enabled, config?.isActive]
  );

  useEffect(() => {
    fetchAnalysis(true);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchAnalysis]);

  const topRecommendation = useMemo(() => {
    if (!analysis?.recommendations?.length) return null;
    return analysis.recommendations[0];
  }, [analysis]);

  return {
    analysis,
    loading,
    error,
    refresh: fetchAnalysis,
    topRecommendation,
  };
}

