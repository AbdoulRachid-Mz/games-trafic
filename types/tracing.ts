// types/tracing.ts

import { TraceType } from "./trace";

// ============================================================================
// TYPES DE BASE
// ============================================================================

export interface PageVisit {
  page: string;
  count: number;
  firstVisit: Date;
  lastVisit: Date;
  duration?: number;
  hasReadExplanation: boolean;
}

export interface SessionData {
  id: string;
  startTime: Date;
  lastActivity: Date;
  pageVisits: Record<string, PageVisit>;
  isAuthenticated: boolean;
  userId?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
}

export interface AggregatedTrace {
  type: TraceType;
  entityId?: string;
  payload?: any;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  synced: boolean;
}

export interface UserJourney {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  pagesVisited: string[];
  totalDuration: number;
  completedGoals: string[];
  exitPage?: string;
  exitReason?: string;
}

export interface ExplanationState {
  page: string;
  shown: boolean;
  completed: boolean;
  skipped: boolean;
  shownAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
}

export interface TracingConfig {
  // Configuration du tracing
  enabled: boolean;
  isActive: boolean; // Flag global pour activer/désactiver complètement
  autoFlushInterval: number; // en millisecondes
  maxQueueSize: number;
  minSyncInterval: number; // en millisecondes

  // Configuration des explications
  showExplanations: boolean;
  explanationFrequency: "ALWAYS" | "FIRST_TIME" | "NEVER" | "ONCE";
  autoShowExplanationDelay: number; // en millisecondes

  // Configuration de redirection
  redirectFirstTimeUsers: boolean;
  redirectPath: string;
  checkRedirectConditions: boolean;
}

// ============================================================================
// TYPES POUR LE CONTEXTE
// ============================================================================

export interface TracingContextValue {
  // État
  isInitialized: boolean;
  isLoading: boolean;
  sessionId: string;
  isAuthenticated: boolean;
  userId?: string;

  // Données
  currentPage: string;
  currentSession: SessionData;
  pageVisits: Record<string, PageVisit>;
  aggregatedTraces: AggregatedTrace[];
  explanationStates: Record<string, ExplanationState>;

  // Statistiques
  stats: {
    totalSessions: number;
    totalPageVisits: number;
    totalTraces: number;
    sessionDuration: number;
    pagesPerSession: number;
  };

  // Fonctions de tracing
  trackPageView: (page: string, metadata?: any) => void;
  trackAction: (type: TraceType, entityId?: string, payload?: any) => void;
  trackError: (error: Error | string, metadata?: any) => void;
  trackGoal: (goalId: string, metadata?: any) => void;

  // Fonctions d'explication
  showExplanation: (page: string) => void;
  completeExplanation: (page: string) => void;
  skipExplanation: (page: string) => void;
  shouldShowExplanation: (page: string) => boolean;

  // Fonctions de session
  startNewSession: () => void;
  endCurrentSession: (reason?: string) => Promise<void>;

  // Synchronisation
  syncTraces: () => Promise<void>;
  flushQueue: () => Promise<void>;

  // Utilitaires
  getSessionDuration: () => number;
  getMostVisitedPages: (
    limit?: number
  ) => Array<{ page: string; count: number }>;
  getUserJourney: () => UserJourney;

  // Configuration
  config: TracingConfig;
  updateConfig: (updates: Partial<TracingConfig>) => void;
}

// ============================================================================
// TYPES POUR L'API
// ============================================================================

export interface TraceBatchRequest {
  sessionId: string;
  userId?: string;
  traces: Array<{
    type: TraceType;
    entityId?: string;
    payload?: any;
    timestamp: number;
  }>;
  metadata?: {
    userAgent?: string;
    deviceInfo?: Record<string, any>;
    pageViews?: Array<{
      page: string;
      timestamp: number;
      duration?: number;
    }>;
  };
}

export interface TraceBatchResponse {
  success: boolean;
  syncedCount: number;
  sessionId: string;
  nextSyncTime?: number;
}

export interface JourneyAnalysis {
  sessionId: string;
  userId?: string;
  patterns: {
    frequentPaths: Array<{
      path: string[];
      count: number;
    }>;
    commonEntryPoints: string[];
    commonExitPoints: string[];
    averageSessionDuration: number;
  };
  recommendations?: Array<{
    type: "EXPLANATION" | "REDIRECT" | "FEATURE_HIGHLIGHT";
    page: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    message?: string;
    action?: string;
  }>;
}

// ============================================================================
// TYPES POUR LE STOCKAGE LOCAL
// ============================================================================

export interface LocalStorageData {
  // Données de session
  sessions: Record<string, SessionData>;
  currentSessionId: string;

  // Données de tracing (queue)
  traceQueue: Array<{
    type: TraceType;
    entityId?: string;
    payload?: any;
    timestamp: number;
  }>;

  // Données d'explication
  explanations: Record<string, ExplanationState>;

  // Données de visite
  pageVisits: Record<string, PageVisit>;

  // Métadonnées
  metadata: {
    totalSessions: number;
    firstVisitDate: Date;
    lastVisitDate: Date;
    userPreferences?: Record<string, any>;
  };
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const DEFAULT_TRACING_CONFIG: TracingConfig = {
  enabled: true,
  isActive: true,
  autoFlushInterval: 30000, // 30 secondes
  maxQueueSize: 100,
  minSyncInterval: 10000, // 10 secondes

  showExplanations: true,
  explanationFrequency: "FIRST_TIME",
  autoShowExplanationDelay: 3000, // 3 secondes

  redirectFirstTimeUsers: true,
  redirectPath: "/welcome",
  checkRedirectConditions: true,
};

export const STORAGE_KEYS = {
  TRACING_DATA: "gt_tracing_data",
  SESSION_ID: "gt_session_id",
  USER_ID: "gt_user_id",
  EXPLANATIONS: "gt_explanations",
  PAGE_VISITS: "gt_page_visits",
} as const;

export const TRACE_PRIORITIES = {
  HIGH: ["ERROR", "PURCHASE", "SIGNIN", "SIGNOUT", "REGISTER"],
  MEDIUM: ["NAVIGATION", "VIEW", "LIKE", "FOLLOW", "BOOKMARK"],
  LOW: ["OTHER", "EXPLANATION_SHOWN", "EXPLANATION_COMPLETED"],
} as const;

// ============================================================================
// TYPES POUR LES ÉVÉNEMENTS
// ============================================================================

export interface TracingEvent {
  type:
    | "PAGE_VIEW"
    | "USER_ACTION"
    | "ERROR"
    | "GOAL_COMPLETED"
    | "EXPLANATION";
  data: any;
  timestamp: number;
  sessionId: string;
  userId?: string;
}
