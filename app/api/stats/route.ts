// app/api/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getStats,
  getGlobalStats,
  getRecentActivities,
  getDashboardStats,
  getPerformanceMetrics,
  getUserStats,
} from "@/actions/stats";
import type { StatsFilters } from "@/actions/stats";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extraire tous les paramètres possibles
    const filters: StatsFilters = {
      entity: searchParams.get("entity") || undefined,
      statId: searchParams.get("statId") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      userId: searchParams.get("userId") || undefined,
      shopId: searchParams.get("shopId") || undefined,
      tournamentId: searchParams.get("tournamentId") || undefined,
      game: searchParams.get("game") || undefined,
      platform: searchParams.get("platform") || undefined,
      status: searchParams.get("status") || undefined,
      year: searchParams.has("year")
        ? parseInt(searchParams.get("year")!)
        : undefined,
      month: searchParams.has("month")
        ? parseInt(searchParams.get("month")!)
        : undefined,
      group_by:
        (searchParams.get("group_by") as
          | "day"
          | "week"
          | "month"
          | "year"
          | "quarter") || undefined,
      limit: searchParams.has("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      page: searchParams.has("page")
        ? parseInt(searchParams.get("page")!)
        : undefined,
      sort_by: searchParams.get("sort_by") || undefined,
      sort_order:
        (searchParams.get("sort_order") as "asc" | "desc") || undefined,
      includeDeleted: searchParams.has("includeDeleted")
        ? searchParams.get("includeDeleted") === "true"
        : undefined,
    };

    // Vérifier l'action spécifique demandée
    const action = searchParams.get("action");

    switch (action) {
      case "global":
        const globalStats = await getGlobalStats(filters);
        return NextResponse.json({
          success: true,
          action: "global",
          filters,
          data: globalStats,
          timestamp: new Date().toISOString(),
        });

      case "recent":
        const limit = filters.limit || 10;
        const recentActivities = await getRecentActivities(limit);
        return NextResponse.json({
          success: true,
          action: "recent",
          filters,
          data: recentActivities,
          metadata: {
            total: recentActivities.length,
            limit,
          },
          timestamp: new Date().toISOString(),
        });

      case "dashboard":
        const dashboardStats = await getDashboardStats();
        return NextResponse.json({
          success: true,
          action: "dashboard",
          filters,
          data: dashboardStats,
          timestamp: new Date().toISOString(),
        });

      case "performance":
        const timeframe =
          (searchParams.get("timeframe") as "day" | "week" | "month") || "day";
        const performanceMetrics = await getPerformanceMetrics(timeframe);
        return NextResponse.json({
          success: true,
          action: "performance",
          filters: { ...filters, timeframe },
          data: performanceMetrics,
          timestamp: new Date().toISOString(),
        });

      case "user-clips":
        const userId = filters.userId;
        if (!userId) {
          return NextResponse.json(
            { success: false, error: "User ID required" },
            { status: 400 },
          );
        }
        
        const userStats = await getUserStats(filters);
        return NextResponse.json({
          success: true,
          action: "user-clips",
          data: userStats.data.game_clips,
          timestamp: new Date().toISOString(),
        });

      case "custom":
        // Utiliser des paramètres personnalisés pour des requêtes spécifiques
        return handleCustomStats(filters);

      default:
        // Action par défaut : getStats avec les filtres
        const stats = await getStats(filters);
        return NextResponse.json({
          success: true,
          action: "getStats",
          filters,
          data: stats.data,
          metadata: {
            entity: stats.entity,
            statId: stats.statId,
            ...stats.metadata,
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("API Stats Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Fonction pour gérer les statistiques personnalisées
async function handleCustomStats(filters: StatsFilters) {
  // Ici vous pouvez ajouter des requêtes personnalisées basées sur des combinaisons de paramètres

  const customResponse = {
    success: true,
    action: "custom",
    filters,
    data: {
      message: "Custom stats query",
      available_params: Object.keys(filters).filter(
        (key) => filters[key as keyof StatsFilters] !== undefined,
      ),
      filters_applied: filters,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(customResponse);
}

// Méthode POST pour des requêtes plus complexes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valider le corps de la requête
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 },
      );
    }

    const { action, filters = {}, query = {}, options = {} } = body;

    // Traiter différentes actions POST
    switch (action) {
      case "batch":
        // Récupérer plusieurs types de statistiques en une seule requête
        const batchResults = await handleBatchStats(query);
        return NextResponse.json({
          success: true,
          action: "batch",
          results: batchResults,
          timestamp: new Date().toISOString(),
        });

      case "compare":
        // Comparer des statistiques sur différentes périodes
        const comparison = await handleComparison(query);
        return NextResponse.json({
          success: true,
          action: "compare",
          data: comparison,
          timestamp: new Date().toISOString(),
        });

      case "export":
        // Générer des statistiques pour export
        const exportData = await handleExport(query);
        return NextResponse.json({
          success: true,
          action: "export",
          data: exportData,
          format: options.format || "json",
          timestamp: new Date().toISOString(),
        });

      case "advanced":
        // Requêtes statistiques avancées
        const advancedStats = await handleAdvancedQuery(query);
        return NextResponse.json({
          success: true,
          action: "advanced",
          data: advancedStats,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            available_actions: ["batch", "compare", "export", "advanced"],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("API Stats POST Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Fonctions auxiliaires pour les requêtes POST
async function handleBatchStats(queries: any[]) {
  const results = [];

  for (const query of queries) {
    try {
      const stats = await getStats(query.filters || {});
      results.push({
        query,
        success: true,
        data: stats.data,
        metadata: stats.metadata,
      });
    } catch (error) {
      results.push({
        query,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

async function handleComparison(query: any) {
  const { periods, entity, statId, ...baseFilters } = query;

  const comparisons = [];

  for (const period of periods) {
    const periodFilters = {
      ...baseFilters,
      date_from: period.start,
      date_to: period.end,
      entity,
      statId,
    };

    try {
      const stats = await getStats(periodFilters);
      comparisons.push({
        period: period.name || `${period.start} to ${period.end}`,
        filters: periodFilters,
        data: stats.data,
        metadata: stats.metadata,
      });
    } catch (error) {
      comparisons.push({
        period: period.name || `${period.start} to ${period.end}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    entity,
    statId,
    comparisons,
    generated_at: new Date().toISOString(),
  };
}

async function handleExport(query: any) {
  const { format = "json", ...filters } = query;

  const stats = await getStats(filters);

  // Formater selon le format demandé
  switch (format) {
    case "csv":
      return formatAsCSV(stats);
    case "excel":
      return formatAsExcel(stats);
    case "json":
    default:
      return stats;
  }
}

async function handleAdvancedQuery(query: any) {
  // Implémentation pour des requêtes statistiques avancées
  // Ex: corrélations, tendances, prédictions, etc.

  return {
    message: "Advanced query processing",
    query,
    status: "not_implemented",
    timestamp: new Date().toISOString(),
  };
}

// Fonctions de formatage
function formatAsCSV(stats: any) {
  // Conversion simple en CSV (à améliorer selon les besoins)
  const { data, metadata } = stats;

  if (typeof data === "object" && !Array.isArray(data)) {
    const headers = Object.keys(data).join(",");
    const values = Object.values(data).join(",");
    return {
      format: "csv",
      content: `${headers}\n${values}`,
      filename: `stats_${new Date().toISOString().split("T")[0]}.csv`,
    };
  }

  return {
    format: "csv",
    content: "Not convertible to CSV format",
    data,
  };
}

function formatAsExcel(stats: any) {
  // Stub pour Excel (implémentation réelle nécessiterait une bibliothèque)
  return {
    format: "excel",
    message: "Excel export not implemented",
    data: stats.data,
    metadata: stats.metadata,
  };
}
