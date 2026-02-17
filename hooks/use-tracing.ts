// hooks/use-tracing.ts
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import {
  TracingContextValue,
  TracingConfig,
  DEFAULT_TRACING_CONFIG,
  STORAGE_KEYS,
  LocalStorageData,
  SessionData,
  PageVisit,
  AggregatedTrace,
  ExplanationState,
  TraceBatchRequest,
  JourneyAnalysis,
  TraceBatchResponse,
  UserJourney,
} from "@/types/tracing";
import {
  ROUTE_CONFIG,
  findRouteConfig,
  canAccessRoute,
} from "@/config/routes-config";
import { PAGE_EXPLANATIONS } from "@/config/page-explanations";
import { TraceType } from "@/types/trace";
import { createUserTracesBatch } from "@/actions/user-traces";
import { getDefaultStorageData } from "@/utils/tracing-utils";

// ============================================================================
// UTILITAIRES
// ============================================================================

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDeviceInfo = (): Record<string, any> => {
  if (typeof window === "undefined") return {};

  const ua = navigator.userAgent;
  return {
    userAgent: ua,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isMobile: /iPhone|iPad|iPod|Android/i.test(ua),
    isTablet: /iPad|Android(?!.*Mobile)/i.test(ua),
    isDesktop: !/iPhone|iPad|iPod|Android/i.test(ua),
  };
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to storage:`, error);
  }
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useTracing(): TracingContextValue {
  // Hooks Next.js
  const pathname = usePathname();
  const router = useRouter();

  // Contexte d'authentification
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();

  // État
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<string>("");
  const [config, setConfig] = useState<TracingConfig>(DEFAULT_TRACING_CONFIG);

  // Références pour les données volatiles
  const sessionDataRef = useRef<SessionData | null>(null);
  const pageVisitsRef = useRef<Record<string, PageVisit>>({});
  const aggregatedTracesRef = useRef<Map<string, AggregatedTrace>>(new Map());
  const explanationStatesRef = useRef<Record<string, ExplanationState>>({});

  // Références pour les timers et compteurs
  const pageViewStartTimeRef = useRef<number>(0);
  const autoFlushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncInProgressRef = useRef<boolean>(false);
  const storageUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStorageUpdateRef = useRef<boolean>(false);

  // ==========================================================================
  // INITIALISATION
  // ==========================================================================

  const initialize = useCallback(async () => {
    if (isInitialized || typeof window === "undefined") return;

    setIsLoading(true);

    try {
      // 1. Charger la configuration
      const savedConfig = loadFromStorage<TracingConfig>(
        "gt_tracing_config",
        DEFAULT_TRACING_CONFIG,
      );
      setConfig(savedConfig);

      // 2. Récupérer ou créer l'ID de session
      let storedSessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
      if (!storedSessionId) {
        storedSessionId = generateSessionId();
        sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, storedSessionId);
      }
      setSessionId(storedSessionId);

      // 3. Charger les données existantes
      const storageData = loadFromStorage<LocalStorageData>(
        STORAGE_KEYS.TRACING_DATA,
        {
          sessions: {},
          currentSessionId: storedSessionId,
          traceQueue: [],
          explanations: {},
          pageVisits: {},
          metadata: {
            totalSessions: 0,
            firstVisitDate: new Date(),
            lastVisitDate: new Date(),
          },
        },
      );

      // 4. Initialiser les références
      pageVisitsRef.current = storageData.pageVisits;
      explanationStatesRef.current = storageData.explanations;

      // 5. Démarrer une nouvelle session
      await startNewSession();

      // 6. Vérifier les redirections
      if (config.redirectFirstTimeUsers) {
        checkAndRedirect();
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize tracing:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, config.redirectFirstTimeUsers]);

  useEffect(() => {
    // Cleanup des vieilles données toutes les 5 minutes
    const cleanupInterval = setInterval(
      () => {
        const storageData = loadFromStorage<LocalStorageData>(
          STORAGE_KEYS.TRACING_DATA,
          getDefaultStorageData(),
        );

        // Supprimer les traces de plus de 24h
        const now = Date.now();
        storageData.traceQueue = storageData.traceQueue.filter(
          (trace) => now - trace.timestamp < 24 * 60 * 60 * 1000,
        );

        // Limiter la queue à 500 entrées max
        if (storageData.traceQueue.length > 500) {
          storageData.traceQueue = storageData.traceQueue.slice(-500);
        }

        saveToStorage(STORAGE_KEYS.TRACING_DATA, storageData);
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  // ==========================================================================
  // GESTION DES SESSIONS
  // ==========================================================================

  const startNewSession = useCallback(async () => {
    const newSession: SessionData = {
      id: sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      pageVisits: {},
      isAuthenticated: !!user,
      userId: user?.id,
      userAgent: navigator.userAgent,
      deviceInfo: getDeviceInfo(),
    };

    sessionDataRef.current = newSession;

    // Enregistrer la trace de début de session
    trackAction("NAVIGATION", "SESSION_START", {
      isAuthenticated: !!user,
      userId: user?.id,
      deviceInfo: getDeviceInfo(),
    });

    // Charger les données de session existantes
    const storageData = loadFromStorage<LocalStorageData>(
      STORAGE_KEYS.TRACING_DATA,
      {
        sessions: {},
        currentSessionId: sessionId,
        traceQueue: [],
        explanations: {},
        pageVisits: {},
        metadata: {
          totalSessions: 0,
          firstVisitDate: new Date(),
          lastVisitDate: new Date(),
        },
      },
    );

    // Incrémenter le compteur de sessions
    storageData.metadata.totalSessions += 1;
    storageData.metadata.lastVisitDate = new Date();

    if (!storageData.metadata.firstVisitDate) {
      storageData.metadata.firstVisitDate = new Date();
    }

    // Sauvegarder
    saveToStorage(STORAGE_KEYS.TRACING_DATA, {
      ...storageData,
      currentSessionId: sessionId,
      sessions: {
        ...storageData.sessions,
        [sessionId]: newSession,
      },
      metadata: storageData.metadata,
    });
  }, [sessionId, user]);

  const scheduleStorageUpdate = useCallback(() => {
    if (pendingStorageUpdateRef.current) return;
    pendingStorageUpdateRef.current = true;

    if (storageUpdateTimerRef.current)
      clearTimeout(storageUpdateTimerRef.current);

    storageUpdateTimerRef.current = setTimeout(() => {
      const currentData = loadFromStorage<LocalStorageData>(
        STORAGE_KEYS.TRACING_DATA,
        getDefaultStorageData(),
      );
      const updatedData = {
        ...currentData,
        pageVisits: pageVisitsRef.current,
        explanations: explanationStatesRef.current,
      };

      saveToStorage(STORAGE_KEYS.TRACING_DATA, updatedData);
      pendingStorageUpdateRef.current = false;
    }, 5000); // Batch every 5 seconds to reduce I/O
  }, []);

  useEffect(() => {
    return () => {
      if (storageUpdateTimerRef.current)
        clearTimeout(storageUpdateTimerRef.current);
    };
  }, []);

  const endCurrentSession = useCallback(async (reason?: string) => {
    if (!sessionDataRef.current) return;

    const sessionEndTime = new Date();
    const duration =
      sessionEndTime.getTime() - sessionDataRef.current.startTime.getTime();

    // Enregistrer la trace de fin de session
    trackAction("NAVIGATION", "SESSION_END", {
      duration,
      reason,
      pagesVisited: Object.keys(sessionDataRef.current.pageVisits),
    });

    // Forcer la synchronisation
    await syncTraces();

    // Nettoyer la session actuelle
    sessionDataRef.current = null;

    // Supprimer l'ID de session du sessionStorage
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);

    // Générer un nouvel ID pour la prochaine session
    const newSessionId = generateSessionId();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
    setSessionId(newSessionId);
  }, []);

  // ==========================================================================
  // TRACKING DES PAGES
  // ==========================================================================

  const trackPageView = useCallback(
    (page: string, metadata?: any) => {
      if (!config.isActive || !config.enabled || !sessionDataRef.current)
        return;

      const now = Date.now();

      // Calculer la durée de la page précédente
      if (currentPage && pageViewStartTimeRef.current > 0) {
        const duration = now - pageViewStartTimeRef.current;

        // Mettre à jour les visites de page
        const existingVisit = pageVisitsRef.current[currentPage] || {
          page: currentPage,
          count: 0,
          firstVisit: new Date(),
          lastVisit: new Date(),
          hasReadExplanation: false,
        };

        pageVisitsRef.current[currentPage] = {
          ...existingVisit,
          count: existingVisit.count + 1,
          lastVisit: new Date(),
          duration: (existingVisit.duration || 0) + duration,
        };

        // Mettre à jour la session
        if (sessionDataRef.current) {
          sessionDataRef.current.pageVisits[currentPage] = {
            ...existingVisit,
            count: existingVisit.count + 1,
            lastVisit: new Date(),
            duration: (existingVisit.duration || 0) + duration,
          };
          sessionDataRef.current.lastActivity = new Date();
        }

        // Sauvegarder les visites de page (batched)
        scheduleStorageUpdate();
      }

      // Enregistrer la trace de navigation
      const routeConfig = findRouteConfig(page);
      trackAction("NAVIGATION", page, {
        routeName: routeConfig?.name,
        requireAuth: routeConfig?.requireAuth,
        requireAdmin: routeConfig?.requireAdmin,
        ...metadata,
      });

      // Mettre à jour la page courante
      setCurrentPage(page);
      pageViewStartTimeRef.current = now;

    },
    [config, currentPage],
  );

  const debouncedSync = useMemo(
    () => debounce(() => syncTraces(), config.minSyncInterval),
    [config.minSyncInterval],
  );

  // ==========================================================================
  // TRACKING DES ACTIONS
  // ==========================================================================

  const trackAction = useCallback(
    (type: TraceType, entityId?: string, payload?: any) => {
      if (!config.isActive || !config.enabled) return;

      // Logic pour éviter de tracker trop de choses répétitives
      const traceKey = `${type}:${entityId || "none"}`;
      const now = new Date();

      // Vérifier si une action identique a été trackée récemment (throttle)
      const lastTrace = aggregatedTracesRef.current.get(traceKey);
      if (lastTrace && now.getTime() - lastTrace.lastSeen.getTime() < 2000) {
        // Mettre à jour les stats mais ne pas ajouter à la queue
        aggregatedTracesRef.current.set(traceKey, {
          ...lastTrace,
          count: lastTrace.count + 1,
          lastSeen: now,
        });
        return;
      }

      // LIMITER la taille du payload
      const limitedPayload = limitPayloadSize(payload, 1000);

      // Agrégation
      if (lastTrace) {
        aggregatedTracesRef.current.set(traceKey, {
          ...lastTrace,
          count: lastTrace.count + 1,
          lastSeen: now,
          payload: limitedPayload,
        });
      } else {
        aggregatedTracesRef.current.set(traceKey, {
          type,
          entityId,
          payload: limitedPayload,
          count: 1,
          firstSeen: now,
          lastSeen: now,
          synced: false,
        });
      }

      // Ajouter à la queue avec limite
      const storageData = loadFromStorage<LocalStorageData>(
        STORAGE_KEYS.TRACING_DATA,
        getDefaultStorageData(),
      );

      // Limite stricte
      if (storageData.traceQueue.length >= config.maxQueueSize) {
        // Rotation: on enlève les 20% les plus vieux
        storageData.traceQueue = storageData.traceQueue.slice(
          Math.floor(config.maxQueueSize * 0.2),
        );
      }

      storageData.traceQueue.push({
        type,
        entityId,
        payload: limitedPayload,
        timestamp: now.getTime(),
      });

      // Sauvegarde différée
      scheduleStorageUpdate();

      // Sync si la queue devient importante
      if (storageData.traceQueue.length >= config.maxQueueSize / 2) {
        debouncedSync();
      }
    },
    [config, sessionId, scheduleStorageUpdate, debouncedSync],
  );

  // Ajouter ces fonctions utilitaires
  const checkForDuplicateTrace = (
    type: TraceType,
    entityId?: string,
    payload?: any,
  ): boolean => {
    const traceKey = `${type}:${entityId || "none"}`;
    const existing = aggregatedTracesRef.current.get(traceKey);

    if (!existing) return false;

    // Vérifier si c'est un doublon récent (moins de 5 secondes)
    const now = Date.now();
    const timeSinceLast = now - existing.lastSeen.getTime();
    return timeSinceLast < 5000; // 5 secondes
  };

  const limitPayloadSize = (payload: any, maxSize: number): any => {
    if (!payload) return payload;

    const payloadStr = JSON.stringify(payload);
    if (payloadStr.length <= maxSize) return payload;

    // Si trop grand, ne garder que les champs essentiels
    if (typeof payload === "object") {
      return {
        ...Object.keys(payload).reduce((acc, key) => {
          if (["id", "type", "name", "page", "error"].includes(key)) {
            acc[key] = payload[key];
          }
          return acc;
        }, {} as any),
        _truncated: true,
      };
    }

    return { value: "Truncated payload", _truncated: true };
  };

  const isLowPriorityTrace = (type: TraceType): boolean => {
    return ["VIEW", "NAVIGATION"].includes(type);
  };

  const shouldSkipLowPriorityTrace = (): boolean => {
    // Ignorer 50% des traces VIEW/NAVIGATION pour réduire le volume
    return Math.random() < 0.5;
  };

  const trackError = useCallback(
    (error: Error | string, metadata?: any) => {
      const errorMessage = error instanceof Error ? error.message : error;
      const errorStack = error instanceof Error ? error.stack : undefined;

      trackAction("ERROR", "CLIENT_ERROR", {
        error: errorMessage,
        stack: errorStack,
        ...metadata,
      });
    },
    [trackAction],
  );

  const trackGoal = useCallback(
    (goalId: string, metadata?: any) => {
      trackAction("OTHER", `GOAL_${goalId}`, {
        goalId,
        ...metadata,
      });
    },
    [trackAction],
  );

  // ==========================================================================
  // GESTION DES EXPLICATIONS
  // ==========================================================================

  const parseExplanationKey = (input: string) => {
    const idx = input.indexOf("@v");
    if (idx >= 0) {
      return { page: input.slice(0, idx), key: input, version: input.slice(idx + 2) };
    }
    return { page: input, key: input, version: undefined as string | undefined };
  };

    const syncTraces = useCallback(async (): Promise<void> => {
    if (syncInProgressRef.current || !config.isActive || !config.enabled)
      return;

    syncInProgressRef.current = true;

    try {
      const storageData = loadFromStorage<LocalStorageData>(
        STORAGE_KEYS.TRACING_DATA,
        getDefaultStorageData(),
      );

      if (storageData.traceQueue.length === 0) {
        return;
      }

      // LIMITER le nombre de traces envoyées
      const tracesToSync = storageData.traceQueue.slice(0, 50); // Max 50 traces par sync

      // Vérifier la taille totale
      const totalSize = JSON.stringify(tracesToSync).length;
      if (totalSize > 500000) {
        // 500KB max
        console.warn("Trace batch too large, truncating...");
        tracesToSync.length = Math.floor(tracesToSync.length / 2);
      }

      // Appeler l'action serveur
      const tracesToCreate = tracesToSync.map((trace) => ({
        userId: user?.id || null,
        sessionId,
        type: trace.type,
        entityId: trace.entityId || null,
        payload: trace.payload || {},
      }));

      if (tracesToCreate.length > 0) {
        try {
          await createUserTracesBatch(tracesToCreate);

          // Retirer UNIQUEMENT les traces synchronisées
          storageData.traceQueue = storageData.traceQueue.slice(
            tracesToSync.length,
          );

          // Marquer comme synchronisées dans aggregatedTraces
          tracesToSync.forEach((trace) => {
            const traceKey = `${trace.type}:${trace.entityId || "none"}`;
            const existing = aggregatedTracesRef.current.get(traceKey);
            if (existing) {
              aggregatedTracesRef.current.set(traceKey, {
                ...existing,
                synced: true,
              });
            }
          });

          saveToStorage(STORAGE_KEYS.TRACING_DATA, storageData);
        } catch (error) {
          console.error("Failed to sync traces:", error);
          // En cas d'erreur, ne pas supprimer les traces
        }
      }
    } finally {
      syncInProgressRef.current = false;
    }
  }, [config, sessionId, user]);

  const showExplanation = useCallback(
    (pageOrKey: string) => {
      if (!config.showExplanations) return;
      const { page, key, version } = parseExplanationKey(pageOrKey);
      const exists = PAGE_EXPLANATIONS.some((e) => {
        if (e.page === page) return true;
        if (e.page.includes("[") || e.page.includes("*")) {
          const pattern = e.page
            .replace(/\[[^\]]+\]/g, "[^/]+")
            .replace(/\*\*/g, ".*")
            .replace(/\*/g, "[^/]*");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(page);
        }
        return false;
      });
      if (!exists) return;
      trackAction("EXPLANATION_OPENED", key, { page, version });
    },
    [config, trackAction],
  );

  const completeExplanation = useCallback(
    (pageOrKey: string) => {
      const { page, key, version } = parseExplanationKey(pageOrKey);
      const prev = explanationStatesRef.current[key];
      explanationStatesRef.current[key] = {
        page,
        shown: true,
        completed: true,
        skipped: false,
        shownAt: prev?.shownAt || new Date(),
        completedAt: new Date(),
        skippedAt: undefined,
      };
      trackAction("EXPLANATION_COMPLETED", key, { page, version });
      scheduleStorageUpdate();
      syncTraces();
    },
    [trackAction, syncTraces],
  );

  const skipExplanation = useCallback(
    (pageOrKey: string) => {
      const { page, key, version } = parseExplanationKey(pageOrKey);
      const prev = explanationStatesRef.current[key];
      explanationStatesRef.current[key] = {
        page,
        shown: true,
        completed: false,
        skipped: true,
        shownAt: prev?.shownAt || new Date(),
        completedAt: undefined,
        skippedAt: new Date(),
      };
      trackAction("EXPLANATION_SKIPPED", key, { page, version });
      scheduleStorageUpdate();
      syncTraces();
    },
    [trackAction, syncTraces],
  );

  const shouldShowExplanation = useCallback(
    (pageOrKey: string): boolean => {
      if (!config.showExplanations) return false;
      if (config.explanationFrequency === "NEVER") return false;

      const { page, key } = parseExplanationKey(pageOrKey);
      const existingState = explanationStatesRef.current[key];
      const globalDisabled = typeof window !== "undefined" && localStorage.getItem("gt_explanations_disabled") === "true";
      const pageDisabled = typeof window !== "undefined" && localStorage.getItem(`gt_explanation_${page}_disabled`) === "true";
      if (globalDisabled || pageDisabled) return false;
      const explanationExists = PAGE_EXPLANATIONS.some((e) => {
        if (e.page === page) return true;
        if (e.page.includes("[") || e.page.includes("*")) {
          const pattern = e.page
            .replace(/\[[^\]]+\]/g, "[^/]+")
            .replace(/\*\*/g, ".*")
            .replace(/\*/g, "[^/]*");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(page);
        }
        return false;
      });

      if (!explanationExists) return false;

      const lsKey = `gt_explanation_${page}_shown`;
      const hasBeenShown = localStorage.getItem(lsKey);

      switch (config.explanationFrequency) {
        case "ALWAYS":
          return true;
        case "FIRST_TIME":
          return !existingState?.shown && !hasBeenShown;
        case "ONCE":
          return !hasBeenShown;
        default:
          return false;
      }
    },
    [config],
  );

  // ==========================================================================
  // SYNCHRONISATION
  // ==========================================================================

  // const debouncedSync = useMemo(
  //   () => debounce(() => syncTraces(), config.minSyncInterval),
  //   [config.minSyncInterval],
  // );



  const flushQueue = useCallback(async () => {
    await syncTraces();
  }, [syncTraces]);

  // ==========================================================================
  // UTILITAIRES ET ANALYTIQUES
  // ==========================================================================

  const getSessionDuration = useCallback((): number => {
    if (!sessionDataRef.current) return 0;
    return Date.now() - sessionDataRef.current.startTime.getTime();
  }, []);

  const getMostVisitedPages = useCallback((limit: number = 5) => {
    return Object.entries(pageVisitsRef.current)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([page, data]) => ({ page, count: data.count }));
  }, []);

  const getUserJourney = useCallback((): UserJourney => {
    if (!sessionDataRef.current) {
      return {
        sessionId,
        startTime: new Date(),
        pagesVisited: [],
        totalDuration: 0,
        completedGoals: [],
      };
    }

    return {
      sessionId: sessionDataRef.current.id,
      userId: sessionDataRef.current.userId,
      startTime: sessionDataRef.current.startTime,
      endTime: new Date(),
      pagesVisited: Object.keys(sessionDataRef.current.pageVisits),
      totalDuration: getSessionDuration(),
      completedGoals: [], // À implémenter
      exitPage: currentPage,
    };
  }, [sessionId, currentPage, getSessionDuration]);

  // Remplacer checkAndRedirect dans use-tracing.ts
  const checkAndRedirect = useCallback(() => {
    if (!config.redirectFirstTimeUsers || typeof window === "undefined") return;

    const key = "gt_welcome_visited";
    const hasVisitedWelcome = localStorage.getItem(key);
    const isWelcomePage = pathname === "/welcome";

    if (
      !hasVisitedWelcome &&
      !isWelcomePage &&
      config.checkRedirectConditions
    ) {
      localStorage.setItem(key, "true");
      router.replace(config.redirectPath);
    } else if (hasVisitedWelcome && isWelcomePage) {
      // Empêcher le retour si déjà visité
      router.replace("/");
    }
  }, [config, pathname, router]);

  const updateConfig = useCallback((updates: Partial<TracingConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveToStorage("gt_tracing_config", newConfig);
      return newConfig;
    });
  }, []);

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  // Initialisation
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Tracking automatique des changements de page
  useEffect(() => {
    if (isInitialized && pathname) {
      trackPageView(pathname);
    }
  }, [isInitialized, pathname, trackPageView]);

  // Synchronisation automatique
  useEffect(() => {
    if (!config.isActive || !config.enabled) return;

    autoFlushTimerRef.current = setInterval(() => {
      if (aggregatedTracesRef.current.size > 0) {
        debouncedSync();
      }
    }, config.autoFlushInterval);

    return () => {
      if (autoFlushTimerRef.current) {
        clearInterval(autoFlushTimerRef.current);
      }
    };
  }, [config, debouncedSync]);

  // Synchronisation avant déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (
        config.isActive &&
        config.enabled &&
        aggregatedTracesRef.current.size > 0
      ) {
        // Utiliser sendBeacon pour une meilleure garantie d'envoi
        const storageData = loadFromStorage<LocalStorageData>(
          STORAGE_KEYS.TRACING_DATA,
          {
            sessions: {},
            currentSessionId: sessionId,
            traceQueue: [],
            explanations: {},
            pageVisits: {},
            metadata: {
              totalSessions: 0,
              firstVisitDate: new Date(),
              lastVisitDate: new Date(),
            },
          },
        );

        if (storageData.traceQueue.length > 0) {
          const batchRequest: TraceBatchRequest = {
            sessionId,
            userId: user?.id,
            traces: storageData.traceQueue.slice(0, 10), // Limiter pour sendBeacon
            metadata: {
              userAgent: navigator.userAgent,
              // isPageUnload: true,
            },
          };

          const blob = new Blob([JSON.stringify(batchRequest)], {
            type: "application/json",
          });

          navigator.sendBeacon("/api/traces/batch", blob);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [config, sessionId, user]);

  // ==========================================================================
  // VALEUR RETOURNÉE
  // ==========================================================================

  const stats = useMemo(
    () => ({
      totalSessions: loadFromStorage<LocalStorageData>(
        STORAGE_KEYS.TRACING_DATA,
        {
          sessions: {},
          currentSessionId: "",
          traceQueue: [],
          explanations: {},
          pageVisits: {},
          metadata: {
            totalSessions: 0,
            firstVisitDate: new Date(),
            lastVisitDate: new Date(),
          },
        },
      ).metadata.totalSessions,
      totalPageVisits: Object.values(pageVisitsRef.current).reduce(
        (sum, visit) => sum + visit.count,
        0,
      ),
      totalTraces: Array.from(aggregatedTracesRef.current.values()).reduce(
        (sum, trace) => sum + trace.count,
        0,
      ),
      sessionDuration: getSessionDuration(),
      pagesPerSession: sessionDataRef.current
        ? Object.keys(sessionDataRef.current.pageVisits).length
        : 0,
    }),
    [getSessionDuration],
  );

  return {
    // État
    isInitialized,
    isLoading,
    sessionId,
    isAuthenticated: !!user,
    userId: user?.id,

    // Données
    currentPage,
    currentSession: sessionDataRef.current || {
      id: sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      pageVisits: {},
      isAuthenticated: !!user,
    },
    pageVisits: pageVisitsRef.current,
    aggregatedTraces: Array.from(aggregatedTracesRef.current.values()),
    explanationStates: explanationStatesRef.current,

    // Statistiques
    stats,

    // Fonctions de tracing
    trackPageView,
    trackAction,
    trackError,
    trackGoal,

    // Fonctions d'explication
    showExplanation,
    completeExplanation,
    skipExplanation,
    shouldShowExplanation,

    // Fonctions de session
    startNewSession,
    endCurrentSession,

    // Synchronisation
    syncTraces,
    flushQueue,

    // Utilitaires
    getSessionDuration,
    getMostVisitedPages,
    getUserJourney,

    // Configuration
    config,
    updateConfig,
  };
}
