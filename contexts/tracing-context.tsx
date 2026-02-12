// contexts/tracing-context.tsx
"use client";

import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useTracing } from "@/hooks/use-tracing";
import { TracingContextValue } from "@/types/tracing";

const TracingContext = createContext<TracingContextValue | undefined>(
  undefined
);

interface TracingProviderProps {
  children: ReactNode;
  options?: {
    enabled?: boolean;
    isActive?: boolean;
    showExplanations?: boolean;
    redirectFirstTimeUsers?: boolean;
  };
}

export function TracingProvider({ children, options }: TracingProviderProps) {
  const tracing = useTracing();

  // Configuration initiale basée sur les options
  useEffect(() => {
    if (options) {
      const updates: Partial<typeof tracing.config> = {};

      if (options.enabled !== undefined) {
        updates.enabled = options.enabled;
      }

      if (options.isActive !== undefined) {
        updates.isActive = options.isActive;
      }

      if (options.showExplanations !== undefined) {
        updates.showExplanations = options.showExplanations;
      }

      if (options.redirectFirstTimeUsers !== undefined) {
        updates.redirectFirstTimeUsers = options.redirectFirstTimeUsers;
      }

      if (Object.keys(updates).length > 0) {
        tracing.updateConfig(updates);
      }
    }
  }, [options, tracing.updateConfig]);

  useEffect(() => {
    const disabled = typeof window !== "undefined" && localStorage.getItem("gt_explanations_disabled") === "true";
    if (disabled) {
      tracing.updateConfig({ showExplanations: false });
    }
  }, [tracing.updateConfig]);

  return (
    <TracingContext.Provider value={tracing}>
      {children}
    </TracingContext.Provider>
  );
}

export function useTracingContext() {
  const context = useContext(TracingContext);

  if (context === undefined) {
    throw new Error("useTracingContext must be used within a TracingProvider");
  }

  return context;
}

// Hook spécialisé pour le tracking des pages
export function usePageTracking() {
  const { trackPageView, currentPage, pageVisits } = useTracingContext();

  return {
    trackPageView,
    currentPage,
    pageVisits,
  };
}

// Hook spécialisé pour les explications
export function useExplanationTracking() {
  const {
    showExplanation,
    completeExplanation,
    skipExplanation,
    shouldShowExplanation,
    explanationStates,
  } = useTracingContext();

  return {
    showExplanation,
    completeExplanation,
    skipExplanation,
    shouldShowExplanation,
    explanationStates,
  };
}

// Hook spécialisé pour les actions utilisateur
export function useActionTracking() {
  const { trackAction, trackError, trackGoal } = useTracingContext();

  return {
    trackAction,
    trackError,
    trackGoal,
  };
}

// Hook spécialisé pour les sessions
export function useSessionTracking() {
  const {
    sessionId,
    startNewSession,
    endCurrentSession,
    getSessionDuration,
    getUserJourney,
  } = useTracingContext();

  return {
    sessionId,
    startNewSession,
    endCurrentSession,
    getSessionDuration,
    getUserJourney,
  };
}

// Hook spécialisé pour les statistiques
export function useTracingStats() {
  const {
    stats,
    getMostVisitedPages,
    aggregatedTraces,
    syncTraces,
    flushQueue,
  } = useTracingContext();

  return {
    stats,
    getMostVisitedPages,
    aggregatedTraces,
    syncTraces,
    flushQueue,
  };
}

// Hook pour l'analyse du parcours utilisateur
export function useJourneyAnalysis() {
  const { currentSession, pageVisits, getUserJourney, aggregatedTraces } =
    useTracingContext();

  const analyzeJourney = () => {
    const journey = getUserJourney();
    const traces = aggregatedTraces;

    // Analyse des patterns
    const frequentPaths: Array<{ path: string[]; count: number }> = [];
    const pages = Object.keys(pageVisits);

    // Simple pattern analysis (peut être étendu)
    const patterns = {
      frequentPaths,
      commonEntryPoints: pages.filter(
        (page) => page === "/" || page.startsWith("/welcome")
      ),
      commonExitPoints: pages.filter(
        (page) => page === currentSession?.lastActivity?.toString()
      ),
      averageSessionDuration: journey.totalDuration,
    };

    // Recommandations basées sur l'analyse
    const recommendations = [];

    if (journey.pagesVisited.length === 0) {
      recommendations.push({
        type: "REDIRECT" as const,
        page: "/",
        priority: "HIGH" as const,
        message: "Première visite détectée",
        action: "REDIRECT_TO_WELCOME",
      });
    }

    return {
      sessionId: journey.sessionId,
      userId: journey.userId,
      patterns,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  };

  return {
    analyzeJourney,
    currentSession,
    pageVisits,
  };
}
