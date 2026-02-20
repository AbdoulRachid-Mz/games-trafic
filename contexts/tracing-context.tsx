// contexts/tracing-context.tsx
"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState, Suspense } from "react";
import { useTracing } from "@/hooks/use-tracing";
import { TracingContextValue } from "@/types/tracing";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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


function TracingProviderInner({ children, options }: TracingProviderProps) {
  const tracing = useTracing();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [canRender, setCanRender] = useState(false);

  // Initial configuration based on options
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
    const ignore = searchParams?.get("ignore_visite") === "true";
    const shouldRedirect = (options?.redirectFirstTimeUsers ?? tracing.config.redirectFirstTimeUsers) === true;
    const redirectPath = tracing.config.redirectPath || "/welcome";
    const isWelcome = pathname === redirectPath;
    if (ignore || !shouldRedirect) {
      setCanRender(true);
      return;
    }
    const hasVisited = typeof window !== "undefined" ? localStorage.getItem("gt_welcome_visited") : null;
    if (!hasVisited && !isWelcome && (tracing.config.checkRedirectConditions ?? true)) {
      router.replace(redirectPath);
      return;
    }
    setCanRender(true);
  }, [searchParams, pathname, router, options?.redirectFirstTimeUsers, tracing.config.redirectFirstTimeUsers, tracing.config.redirectPath, tracing.config.checkRedirectConditions]);

  useEffect(() => {
    const disabled = typeof window !== "undefined" && localStorage.getItem("gt_explanations_disabled") === "true";
    if (disabled) {
      tracing.updateConfig({ showExplanations: false });
    }
  }, [tracing.updateConfig]);

  return (
    <TracingContext.Provider value={tracing}>
      {canRender ? children : null}
    </TracingContext.Provider>
  );
}

export function TracingProvider({ children, options }: TracingProviderProps) {
  return (
    <Suspense fallback={null}>
      <TracingProviderInner options={options}>
        {children}
      </TracingProviderInner>
    </Suspense>
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
