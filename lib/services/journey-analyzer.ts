// lib/services/journey-analyzer.ts
import { UserTrace } from '@/database/schema';
import { JourneyAnalysis } from '@/types/tracing';

export async function analyzeUserJourney(
  sessionId: string,
  userId?: string | null,
  traces: UserTrace[] = []
): Promise<JourneyAnalysis> {
  // Filtrer et organiser les traces
  const navigationTraces = traces.filter(t => t.type === 'NAVIGATION');
  const actionTraces = traces.filter(t => t.type !== 'NAVIGATION');
  
  // Extraire les pages visitées
  const pagesVisited = navigationTraces
    .filter(t => t.entityId && !t.entityId.includes('SESSION_'))
    .map(t => t.entityId!)
    .filter((page, index, array) => array.indexOf(page) === index); // Uniques
  
  // Analyser les patterns
  const frequentPaths = findFrequentPaths(navigationTraces);
  const commonEntryPoints = findCommonEntryPoints(navigationTraces);
  const commonExitPoints = findCommonExitPoints(navigationTraces);
  
  // Calculer la durée de session
  const sessionStart = traces.find(t => t.entityId === 'SESSION_START');
  const sessionEnd = traces.find(t => t.entityId === 'SESSION_END');
  const averageDuration = calculateAverageDuration(traces);
  
  // Générer des recommandations
  const recommendations = generateRecommendations(
    pagesVisited,
    actionTraces,
    userId ? 'RETURNING' : 'NEW'
  );
  
  return {
    sessionId,
    userId: userId || undefined,
    patterns: {
      frequentPaths,
      commonEntryPoints,
      commonExitPoints,
      averageSessionDuration: averageDuration,
    },
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  };
}

function findFrequentPaths(traces: UserTrace[]): Array<{ path: string[]; count: number }> {
  const paths: Record<string, { path: string[]; count: number }> = {};
  
  // Group traces by sequential pages
  for (let i = 0; i < traces.length - 1; i++) {
    const current = traces[i];
    const next = traces[i + 1];
    
    if (current.entityId && next.entityId && current.type === 'NAVIGATION' && next.type === 'NAVIGATION') {
      const path = [current.entityId, next.entityId];
      const key = path.join('->');
      
      if (!paths[key]) {
        paths[key] = { path, count: 0 };
      }
      paths[key].count++;
    }
  }
  
  return Object.values(paths)
    .filter(p => p.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function findCommonEntryPoints(traces: UserTrace[]): string[] {
  const entryPoints = traces
    .filter(t => t.entityId && t.type === 'NAVIGATION')
    .slice(0, 3)
    .map(t => t.entityId!);
  
  return entryPoints.filter((point, index, array) => array.indexOf(point) === index);
}

function findCommonExitPoints(traces: UserTrace[]): string[] {
  const exitPoints = traces
    .filter(t => t.entityId && t.type === 'NAVIGATION')
    .slice(-3)
    .map(t => t.entityId!);
  
  return exitPoints.filter((point, index, array) => array.indexOf(point) === index);
}

function calculateAverageDuration(traces: UserTrace[]): number {
  const durations: number[] = [];
  let pageStartTime: number | null = null;
  let currentPage: string | null = null;
  
  for (const trace of traces) {
    if (trace.type === 'NAVIGATION' && trace.entityId && trace.createdAt) {
      if (currentPage && pageStartTime && trace.entityId !== currentPage) {
        const duration = trace.createdAt.getTime() - pageStartTime;
        durations.push(duration);
      }
      
      currentPage = trace.entityId;
      pageStartTime = trace.createdAt.getTime();
    }
  }
  
  if (durations.length === 0) return 0;
  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
}

function generateRecommendations(
  pagesVisited: string[],
  actionTraces: UserTrace[],
  userType: 'NEW' | 'RETURNING'
): Array<{
  type: 'EXPLANATION' | 'REDIRECT' | 'FEATURE_HIGHLIGHT';
  page: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  message?: string;
  action?: string;
}> {
  const recommendations: Array<{
    type: 'EXPLANATION' | 'REDIRECT' | 'FEATURE_HIGHLIGHT';
    page: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    message?: string;
    action?: string;
  }> = [];
  
  // Recommandation pour les nouveaux utilisateurs
  if (userType === 'NEW') {
    if (!pagesVisited.includes('/profile') && pagesVisited.length > 3) {
      recommendations.push({
        type: 'REDIRECT',
        page: '/profile',
        priority: 'MEDIUM',
        message: 'Complétez votre profil pour une meilleure expérience',
        action: 'REDIRECT_TO_PROFILE',
      });
    }
    
    if (!pagesVisited.includes('/marketplace') && pagesVisited.includes('/')) {
      recommendations.push({
        type: 'EXPLANATION',
        page: '/marketplace',
        priority: 'HIGH',
        message: 'Découvrez notre marketplace',
        action: 'SHOW_MARKETPLACE_EXPLANATION',
      });
    }
  }
  
  // Recommandation basée sur les actions
  const hasViewedProducts = actionTraces.some(t => 
    t.type === 'VIEW' && t.entityId?.includes('product')
  );
  
  if (hasViewedProducts && !actionTraces.some(t => t.type === 'PURCHASE')) {
    recommendations.push({
      type: 'FEATURE_HIGHLIGHT',
      page: '/products',
      priority: 'MEDIUM',
      message: 'Saviez-vous que vous pouvez acheter directement depuis notre plateforme ?',
      action: 'HIGHLIGHT_PURCHASE_FEATURE',
    });
  }
  
  return recommendations;
}