// @/actions/user-stats.ts
"use server";

import {
  users,
  shops,
  products,
  tournaments,
  posts,
  messages,
  groups,
  interactions,
  notifications,
  themes,
  announcements,
  claims,
  userTraces,
  searchHistory,
  walletTransactions,
  vipSubscriptions,
  gameItems,
  orders,
  teams,
  tournamentEditions,
  matches,
  categories,
  games,
  themePurchases,
  userWallets,
  teamMembers,
  tournamentMembers,
  editionRegistrations,
  viewers,
  editionResults,
  requests,
  gameClips,
  ledgerEntries,
} from "@/database/schema";
import { db } from "@/lib/db";
import {
  count,
  sum,
  avg,
  min,
  max,
  eq,
  and,
  or,
  gte,
  lte,
  between,
  sql,
  desc,
  asc,
  inArray,
  isNotNull,
  isNull,
  ne,
  not,
} from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountBalance } from "@/lib/ledger/ledger-utils";

// ============================================================================
// TYPES
// ============================================================================

export interface UserStatsFilters {
  userId?: string;
  date_from?: string;
  date_to?: string;
  period?: "day" | "week" | "month" | "year" | "all";
  includeDeleted?: boolean;
}

export interface UserStatsResponse {
  success: boolean;
  data: UserStatsData;
  metadata?: {
    generated_at: string;
    user_id: string;
    period: string;
  };
  error?: string;
}

export interface UserStatsData {
  // Informations utilisateur de base
  user_info: {
    id: string;
    username?: string;
    email: string;
    full_name?: string;
    profile_image?: string;
    is_vip: boolean;
    is_admin: boolean;
    is_active: boolean;
    account_types: string[];
    level: string;
    created_at: string;
    last_login?: string;
  };

  // Statistiques globales
  overview: {
    total_shops: number;
    total_products: number;
    total_tournaments: number;
    total_posts: number;
    total_orders: number;
    total_interactions: number;
    total_notifications: number;
    total_transactions: number;
    total_views: number;
  };

  // Boutiques
  shops: {
    total: number;
    active: number;
    verified: number;
    featured: number;
    total_products: number;
    total_views: number;
    total_balance: number;
    recent: Array<{
      id: string;
      name: string;
      product_count: number;
      created_at: string;
    }>;
  };

  // Produits
  products: {
    total: number;
    active: number;
    visible: number;
    featured: number;
    sold: number;
    reserved: number;
    total_views: number;
    total_value: number;
    avg_price: number;
    total_orders?: number; // Ajouter ? pour rendre optionnel
    by_status: Array<{
      status: string | null; // Accepter null
      count: number;
    }>;
    by_game: Array<{
      game: string | null; // Accepter null
      count: number;
    }>;
    recent: Array<{
      id: string;
      name: string;
      price: number;
      status: string | null; // Accepter null
      created_at: string;
    }>;
  };

  // Tournois
  tournaments: {
    total: number;
    active: number;
    upcoming: number;
    completed: number;
    featured: number;
    verified: number;
    total_editions: number;
    total_participants: number;
    total_prize_pool: number;
    total_views: number;
    by_status: Array<{
      status: string | null; // Accepter null
      count: number;
    }>;
    by_game: Array<{
      game: string | null; // Accepter null
      count: number;
    }>;
    recent: Array<{
      id: string;
      name: string;
      status: string | null; // Accepter null
      created_at: string;
    }>;
  };

  // Équipes
  teams: {
    total: number;
    as_captain: number;
    as_vice_captain: number;
    as_member: number;
    active: number;
    recent: Array<{
      id: string;
      name: string;
      role: string | null; // Accepter null
      joined_at: string;
    }>;
  };

  // Tournois (participation)
  tournament_participation: {
    total_editions: number;
    total_matches: number;
    matches_won: number;
    matches_lost: number;
    best_position?: number;
    total_prizes: number;
    recent_participations: Array<{
      edition_id: string;
      tournament_name: string;
      position?: number;
      prize?: number;
      participated_at: string;
    }>;
  };

  // Posts et contenu
  content: {
    total_posts: number;
    active_posts: number;
    stories: number;
    total_interactions: number;
    likes_received: number;
    follows_received: number;
    views_received: number;
    recent_posts: Array<{
      id: string;
      content_preview: string;
      is_story: boolean | null; // Accepter null
      created_at: string;
    }>;
  };

  // Messages
  messages: {
    total_sent: number;
    total_received: number;
    unread: number;
    recent_conversations: Array<{
      user_id: string;
      username?: string;
      last_message: string;
      unread_count: number;
      last_message_at: string;
    }>;
  };

  // Interactions
  interactions: {
    total: number;
    likes_given: number;
    follows_given: number;
    bookmarks_given: number;
    views_given: number;
    by_type: Array<{
      type: string;
      count: number;
    }>;
    recent: Array<{
      type: string;
      entity_type: string;
      created_at: string;
    }>;
  };

  // Notifications
  notifications: {
    total: number;
    unread: number;
    read: number;
    by_type: Array<{
      type: string;
      count: number;
    }>;
    recent: Array<{
      id: string;
      title: string;
      type: string;
      read: boolean | null;
      created_at: string;
    }>;
  };

  // Portefeuille et transactions
  wallet: {
    balance: number;
    total_deposits: number;
    total_withdrawals: number;
    total_transactions: number;
    transaction_volume: number;
    recent_transactions: Array<{
      id: string;
      type: string;
      amount: number;
      status: string | null;
      created_at: string;
    }>;
    by_type: Array<{
      type: string;
      count: number;
      total_amount: number;
    }>;
  };

  // VIP
  vip: {
    is_active: boolean;
    current_plan?: "MONTHLY" | "YEARLY" | "LIFETIME" | null;
    start_date?: string;
    end_date?: string;
    auto_renew: boolean;
    total_spent: number;
    benefits: string[];
  };

  // Jeux et items
  games: {
    total_items_requested: number;
    total_spent: number;
    pending_requests: number;
    completed_requests: number;
    recent_requests: Array<{
      id: string;
      game_item_name: string;
      quantity: number;
      status: string | null;
      created_at: string;
    }>;
  };

  // Thèmes
  themes: {
    total_purchases: number;
    total_spent: number;
    created_themes: number;
    recent_purchases: Array<{
      theme_name: string;
      price: number;
      purchased_at: string;
    }>;
  };

  // Recherches
  searches: {
    total: number;
    recent_searches: string[];
    most_frequent: Array<{
      query: string;
      count: number;
    }>;
  };

  // Activité récente
  recent_activity: Array<{
    id: string;
    type: string;
    action: string;
    description: string;
    timestamp: string;
    icon: string;
  }>;

  // Game Clips
  game_clips: {
    total: number;
    total_views: number;
    total_likes: number;
    recent: Array<{
      id: string;
      caption: string | null;
      views: number;
      likes: number;
      created_at: string;
    }>;
  };

  // Performances temporelles
  performance: {
    daily_avg_interactions: number;
    weekly_avg_posts: number;
    monthly_avg_transactions: number;
    activity_trend: Array<{
      date: string;
      interactions: number;
      posts: number;
      transactions: number;
    }>;
  };
}

// ============================================================================
// FONCTIONS D'AIDE
// ============================================================================

function buildUserWhereConditions(filters: UserStatsFilters, userId: string) {
  const conditions = [eq(users.id, userId)];

  // Date filters
  if (filters.date_from) {
    conditions.push(gte(users.createdAt, new Date(filters.date_from)));
  }
  if (filters.date_to) {
    conditions.push(lte(users.createdAt, new Date(filters.date_to)));
  }

  // Exclude deleted items unless specified
  if (!filters.includeDeleted) {
    conditions.push(eq(users.isDeleted, false));
  }

  return and(...conditions);
}

function buildPeriodFilter(period?: string) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "day":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );
      break;
    case "year":
      startDate = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate(),
      );
      break;
    default:
      return undefined;
  }

  return gte(users.createdAt, startDate);
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

export async function getUserStats(
  filters: UserStatsFilters = {},
): Promise<UserStatsResponse> {
  try {
    let userId = filters.userId;

    // Si pas d'ID utilisateur fourni, utiliser l'utilisateur courant
    if (!userId) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          data: {} as UserStatsData,
          error: "Utilisateur non authentifié",
        };
      }
      userId = currentUser.id;
    }

    // Vérifier que l'utilisateur existe
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return {
        success: false,
        data: {} as UserStatsData,
        error: "Utilisateur non trouvé",
      };
    }

    // Récupérer toutes les statistiques en parallèle pour optimiser les performances
    const [
      userInfo,
      shopsStats,
      productsStats,
      tournamentsStats,
      teamsStats,
      tournamentParticipationStats,
      postsStats,
      messagesStats,
      interactionsStats,
      notificationsStats,
      walletStats,
      vipStats,
      gamesStats,
      themesStats,
      searchesStats,
      recentActivity,
      performanceStats,
      gameClipsStats,
    ] = await Promise.all([
      // Informations utilisateur
      getUserInfo(userId),

      // Boutiques
      getShopsStats(userId, filters),

      // Produits
      getProductsStats(userId, filters),

      // Tournois créés
      getTournamentsStats(userId, filters),

      // Équipes
      getTeamsStats(userId),

      // Participation aux tournois
      getTournamentParticipationStats(userId),

      // Posts et contenu
      getContentStats(userId, filters),

      // Messages
      getMessagesStats(userId),

      // Interactions
      getInteractionsStats(userId, filters),

      // Notifications
      getNotificationsStats(userId),

      // Portefeuille
      getWalletStats(userId, filters),

      // VIP
      getVipStats(userId),

      // Jeux
      getGamesStats(userId, filters),

      // Thèmes
      getThemesStats(userId),

      // Recherches
      getSearchesStats(userId),

      // Activité récente
      getRecentActivity(userId),

      // Performances
      getPerformanceStats(userId, filters.period),

      // Game Clips
      getGameClipsStats(userId, filters),
    ]);

    const statsData: UserStatsData = {
      user_info: {
        ...userInfo,
        is_vip: userInfo.is_vip ?? false,
        is_admin: userInfo.is_admin ?? false,
        is_active: userInfo.is_active ?? false,
        level: userInfo.level ?? "C",
      },
      overview: {
        total_shops: shopsStats.total,
        total_products: productsStats.total,
        total_tournaments: tournamentsStats.total,
        total_posts: postsStats.total_posts,
        total_orders: productsStats.total_orders || 0,
        total_interactions: interactionsStats.total,
        total_notifications: notificationsStats.total,
        total_transactions: walletStats.total_transactions,
        total_views:
          productsStats.total_views +
          shopsStats.total_views +
          tournamentsStats.total_views,
      },
      shops: shopsStats,
      products: productsStats,
      tournaments: tournamentsStats,
      teams: teamsStats,
      tournament_participation: tournamentParticipationStats,
      content: postsStats,
      messages: messagesStats,
      interactions: interactionsStats,
      notifications: notificationsStats,
      wallet: walletStats,
      vip: {
        ...vipStats,
        benefits: Array.isArray(vipStats.benefits) ? vipStats.benefits : [],
      },
      games: gamesStats,
      themes: themesStats,
      searches: searchesStats,
      recent_activity: recentActivity,
      performance: performanceStats,
      game_clips: gameClipsStats,
    };

    return {
      success: true,
      data: statsData,
      metadata: {
        generated_at: new Date().toISOString(),
        user_id: userId,
        period: filters.period || "all",
      },
    };
  } catch (error) {
    console.error("Error in getUserStats:", error);
    return {
      success: false,
      data: {} as UserStatsData,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// export const getUserDashboardStats = getUserStats;
export const getPerUserStats = getUserStats;

// ============================================================================
// FONCTIONS SPÉCIFIQUES PAR SECTION
// ============================================================================

async function getUserInfo(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      full_name: users.fullName,
      profile_image: users.profileImage,
      is_vip: users.isVip,
      is_admin: users.isAdmin,
      is_active: users.isActive,
      account_types: users.accountTypes,
      level: users.level,
      created_at: users.createdAt,
      last_login: users.lastLogin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    id: user.id,
    username: user.username || undefined,
    email: user.email,
    full_name: user.full_name || undefined,
    profile_image: user.profile_image || undefined,
    is_vip: user.is_vip,
    is_admin: user.is_admin,
    is_active: user.is_active,
    account_types: user.account_types || [],
    level: user.level || "C",
    created_at: user.created_at?.toISOString() || new Date().toISOString(),
    last_login: user.last_login?.toISOString(),
  };
}

async function getShopsStats(userId: string, filters: UserStatsFilters) {
  const [stats] = await db
    .select({
      total: count(),
      active: sql<number>`count(CASE WHEN ${shops.isActive} = true THEN 1 END)`,
      verified: sql<number>`count(CASE WHEN ${shops.verified} = true THEN 1 END)`,
      featured: sql<number>`count(CASE WHEN ${shops.featured} = true THEN 1 END)`,
      total_products: sum(shops.productCount),
      total_views: sum(shops.viewCount),
      total_balance: sum(shops.balance),
    })
    .from(shops)
    .where(and(eq(shops.ownerId, userId), eq(shops.isDeleted, false)));

  const recentShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      product_count: shops.productCount,
      created_at: shops.createdAt,
    })
    .from(shops)
    .where(and(eq(shops.ownerId, userId), eq(shops.isDeleted, false)))
    .orderBy(desc(shops.createdAt))
    .limit(5);

  return {
    total: Number(stats.total || 0),
    active: Number(stats.active || 0),
    verified: Number(stats.verified || 0),
    featured: Number(stats.featured || 0),
    total_products: Number(stats.total_products || 0),
    total_views: Number(stats.total_views || 0),
    total_balance: Number(stats.total_balance || 0),
    recent: recentShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      product_count: Number(shop.product_count || 0),
      created_at: shop.created_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getProductsStats(userId: string, filters: UserStatsFilters) {
  const [stats] = await db
    .select({
      total: count(),
      active: sql<number>`count(CASE WHEN ${products.isActive} = true THEN 1 END)`,
      visible: sql<number>`count(CASE WHEN ${products.isVisible} = true THEN 1 END)`,
      featured: sql<number>`count(CASE WHEN ${products.isFeatured} = true THEN 1 END)`,
      sold: sql<number>`count(CASE WHEN ${products.status} = 'VENDU' THEN 1 END)`,
      reserved: sql<number>`count(CASE WHEN ${products.status} = 'RESERVE' THEN 1 END)`,
      total_views: sum(products.viewCount),
      total_value: sum(products.price),
      avg_price: avg(products.price),
      total_orders: sql<number>`(
      SELECT COUNT(*) FROM ${orders} 
      WHERE ${orders.buyerId} = ${userId} 
      AND ${orders.isDeleted} = false
    )`,
    })
    .from(products)
    .where(and(eq(products.userId, userId), eq(products.isDeleted, false)));

  const byStatus = await db
    .select({
      status: products.status,
      count: count(),
    })
    .from(products)
    .where(and(eq(products.userId, userId), eq(products.isDeleted, false)))
    .groupBy(products.status);

  const byGame = await db
    .select({
      game: sql<string>`COALESCE(${products.game}, 'Unknown')`,
      count: count(),
    })
    .from(products)
    .where(and(eq(products.userId, userId), eq(products.isDeleted, false)))
    .groupBy(sql`1`)
    .orderBy(desc(count()))
    .limit(10);

  const recentProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      status: products.status,
      created_at: products.createdAt,
    })
    .from(products)
    .where(and(eq(products.userId, userId), eq(products.isDeleted, false)))
    .orderBy(desc(products.createdAt))
    .limit(10);

  return {
    total: Number(stats.total || 0),
    active: Number(stats.active || 0),
    visible: Number(stats.visible || 0),
    featured: Number(stats.featured || 0),
    sold: Number(stats.sold || 0),
    reserved: Number(stats.reserved || 0),
    total_views: Number(stats.total_views || 0),
    total_value: Number(stats.total_value || 0),
    avg_price: Number(stats.avg_price || 0),
    total_orders: Number(stats.total_orders || 0),
    by_status: byStatus.map((s) => ({
      status: s.status,
      count: Number(s.count),
    })),
    by_game: byGame.map((g) => ({
      game: g.game,
      count: Number(g.count),
    })),
    recent: recentProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      status: p.status,
      created_at: p.created_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getTournamentsStats(userId: string, filters: UserStatsFilters) {
  const [stats] = await db
    .select({
      total: count(),
      active: sql<number>`count(CASE WHEN ${tournaments.isActive} = true THEN 1 END)`,
      upcoming: sql<number>`count(CASE WHEN ${tournaments.status} = 'UPCOMING' THEN 1 END)`,
      completed: sql<number>`count(CASE WHEN ${tournaments.status} = 'COMPLETED' THEN 1 END)`,
      featured: sql<number>`count(CASE WHEN ${tournaments.featured} = true THEN 1 END)`,
      verified: sql<number>`count(CASE WHEN ${tournaments.verified} = true THEN 1 END)`,
      total_editions: sum(tournaments.totalEditions),
      total_participants: sum(tournaments.totalParticipants),
      total_prize_pool: sum(tournaments.totalPrizePool),
      total_views: sum(tournaments.viewCount),
    })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.organizerId, userId),
        eq(tournaments.isDeleted, false),
      ),
    );

  const byStatus = await db
    .select({
      status: tournaments.status,
      count: count(),
    })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.organizerId, userId),
        eq(tournaments.isDeleted, false),
      ),
    )
    .groupBy(tournaments.status);

  const byGame = await db
    .select({
      game: tournaments.game,
      count: count(),
    })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.organizerId, userId),
        eq(tournaments.isDeleted, false),
      ),
    )
    .groupBy(tournaments.game)
    .orderBy(desc(count()))
    .limit(10);

  const recentTournaments = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      status: tournaments.status,
      created_at: tournaments.createdAt,
    })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.organizerId, userId),
        eq(tournaments.isDeleted, false),
      ),
    )
    .orderBy(desc(tournaments.createdAt))
    .limit(10);

  return {
    total: Number(stats.total || 0),
    active: Number(stats.active || 0),
    upcoming: Number(stats.upcoming || 0),
    completed: Number(stats.completed || 0),
    featured: Number(stats.featured || 0),
    verified: Number(stats.verified || 0),
    total_editions: Number(stats.total_editions || 0),
    total_participants: Number(stats.total_participants || 0),
    total_prize_pool: Number(stats.total_prize_pool || 0),
    total_views: Number(stats.total_views || 0),
    by_status: byStatus.map((s) => ({
      status: s.status,
      count: Number(s.count),
    })),
    by_game: byGame.map((g) => ({
      game: g.game,
      count: Number(g.count),
    })),
    recent: recentTournaments.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      created_at: t.created_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getTeamsStats(userId: string) {
  // Équipes où l'utilisateur est capitaine
  const captainTeams = await db
    .select({
      total: count(),
    })
    .from(teams)
    .where(eq(teams.captainId, userId));

  // Équipes où l'utilisateur est vice-capitaine
  const viceCaptainTeams = await db
    .select({
      total: count(),
    })
    .from(teams)
    .where(eq(teams.viceCaptainId, userId));

  // Équipes où l'utilisateur est membre
  const memberTeams = await db
    .select({
      total: count(),
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  // Toutes les équipes de l'utilisateur (en tant que membre)
  const allMemberTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      role: teamMembers.role,
      joined_at: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .orderBy(desc(teamMembers.joinedAt))
    .limit(10);

  return {
    total:
      Number(captainTeams[0]?.total || 0) +
      Number(viceCaptainTeams[0]?.total || 0) +
      Number(memberTeams[0]?.total || 0),
    as_captain: Number(captainTeams[0]?.total || 0),
    as_vice_captain: Number(viceCaptainTeams[0]?.total || 0),
    as_member: Number(memberTeams[0]?.total || 0),
    active: allMemberTeams.length,
    recent: allMemberTeams.map((team) => ({
      id: team.id,
      name: team.name,
      role: team.role,
      joined_at: team.joined_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getTournamentParticipationStats(userId: string) {
  // Participation aux tournois via tournament_members
  const participation = await db
    .select({
      total_editions: sql<number>`COUNT(DISTINCT ${editionRegistrations.editionId})`,
      total_matches: sql<number>`COUNT(DISTINCT ${matches.id})`,
      matches_won: sql<number>`COUNT(CASE WHEN ${matches.winnerRegistrationId} = ${editionRegistrations.id} THEN 1 END)`,
      matches_lost: sql<number>`COUNT(CASE WHEN ${matches.loserRegistrationId} = ${editionRegistrations.id} THEN 1 END)`,
    })
    .from(tournamentMembers)
    .leftJoin(
      editionRegistrations,
      eq(tournamentMembers.id, editionRegistrations.memberId),
    )
    .leftJoin(
      matches,
      or(
        eq(matches.participant1RegistrationId, editionRegistrations.id),
        eq(matches.participant2RegistrationId, editionRegistrations.id),
      ),
    )
    .where(eq(tournamentMembers.userId, userId));

  // Meilleure position
  const bestPosition = await db
    .select({
      position: min(editionResults.position),
    })
    .from(tournamentMembers)
    .leftJoin(
      editionRegistrations,
      eq(tournamentMembers.id, editionRegistrations.memberId),
    )
    .leftJoin(
      editionResults,
      eq(editionRegistrations.id, editionResults.registrationId),
    )
    .where(eq(tournamentMembers.userId, userId));

  // Total des prix gagnés
  const totalPrizes = await db
    .select({
      total: sum(editionResults.prizeAmount),
    })
    .from(tournamentMembers)
    .leftJoin(
      editionRegistrations,
      eq(tournamentMembers.id, editionRegistrations.memberId),
    )
    .leftJoin(
      editionResults,
      eq(editionRegistrations.id, editionResults.registrationId),
    )
    .where(eq(tournamentMembers.userId, userId));

  // Participations récentes
  const recentParticipations = await db
    .select({
      edition_id: editionRegistrations.id,
      tournament_name: tournaments.name,
      position: editionResults.position,
      prize: editionResults.prizeAmount,
      participated_at: editionRegistrations.registeredAt,
    })
    .from(tournamentMembers)
    .innerJoin(
      editionRegistrations,
      eq(tournamentMembers.id, editionRegistrations.memberId),
    )
    .innerJoin(
      tournamentEditions,
      eq(editionRegistrations.editionId, tournamentEditions.id),
    )
    .innerJoin(tournaments, eq(tournamentEditions.tournamentId, tournaments.id))
    .leftJoin(
      editionResults,
      eq(editionRegistrations.id, editionResults.registrationId),
    )
    .where(eq(tournamentMembers.userId, userId))
    .orderBy(desc(editionRegistrations.registeredAt))
    .limit(10);

  return {
    total_editions: Number(participation[0]?.total_editions || 0),
    total_matches: Number(participation[0]?.total_matches || 0),
    matches_won: Number(participation[0]?.matches_won || 0),
    matches_lost: Number(participation[0]?.matches_lost || 0),
    best_position: bestPosition[0]?.position
      ? Number(bestPosition[0].position)
      : undefined,
    total_prizes: Number(totalPrizes[0]?.total || 0),
    recent_participations: recentParticipations.map((p) => ({
      edition_id: p.edition_id,
      tournament_name: p.tournament_name,
      position: p.position ? Number(p.position) : undefined,
      prize: p.prize ? Number(p.prize) : undefined,
      participated_at:
        p.participated_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getContentStats(userId: string, filters: UserStatsFilters) {
  const [stats] = await db
    .select({
      total_posts: count(),
      active_posts: sql<number>`count(CASE WHEN ${posts.isActive} = true THEN 1 END)`,
      stories: sql<number>`count(CASE WHEN ${posts.isStory} = true THEN 1 END)`,
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.isDeleted, false)));

  // Interactions reçues sur les posts
  const interactionsReceived = await db
    .select({
      likes: sql<number>`count(CASE WHEN ${interactions.type} = 'LIKE' THEN 1 END)`,
      follows: sql<number>`count(CASE WHEN ${interactions.type} = 'FOLLOW' THEN 1 END)`,
      views: sql<number>`count(CASE WHEN ${interactions.type} = 'VIEW' THEN 1 END)`,
    })
    .from(interactions)
    .innerJoin(posts, eq(interactions.entityId, posts.id))
    .where(
      and(
        eq(posts.authorId, userId),
        eq(interactions.entityType, "POST"),
        eq(interactions.isDeleted, false),
      ),
    );

  const recentPosts = await db
    .select({
      id: posts.id,
      content_preview: sql<string>`SUBSTRING(${posts.content}, 1, 100)`,
      is_story: posts.isStory,
      created_at: posts.createdAt,
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.isDeleted, false)))
    .orderBy(desc(posts.createdAt))
    .limit(10);

  return {
    total_posts: Number(stats.total_posts || 0),
    active_posts: Number(stats.active_posts || 0),
    stories: Number(stats.stories || 0),
    total_interactions:
      Number(interactionsReceived[0]?.likes || 0) +
      Number(interactionsReceived[0]?.follows || 0) +
      Number(interactionsReceived[0]?.views || 0),
    likes_received: Number(interactionsReceived[0]?.likes || 0),
    follows_received: Number(interactionsReceived[0]?.follows || 0),
    views_received: Number(interactionsReceived[0]?.views || 0),
    recent_posts: recentPosts.map((p) => ({
      id: p.id,
      content_preview: p.content_preview || "",
      is_story: p.is_story,
      created_at: p.created_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getMessagesStats(userId: string) {
  const [stats] = await db
    .select({
      total_sent: sql<number>`COUNT(CASE WHEN ${messages.senderId} = ${userId} THEN 1 END)`,
      total_received: sql<number>`COUNT(CASE WHEN ${messages.recipientId} = ${userId} THEN 1 END)`,
      unread: sql<number>`COUNT(CASE WHEN ${messages.recipientId} = ${userId} AND NOT (${userId} = ANY(${messages.readBy})) THEN 1 END)`,
    })
    .from(messages)
    .where(
      and(
        or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
        eq(messages.isDeleted, false),
      ),
    );

  // Conversations récentes - CORRECTION ICI
  // Build a raw SQL CTE to get the other participant per conversation
  const conversationCTE = sql`
    WITH conversations AS (
      SELECT
        CASE 
          WHEN sender_id = ${userId} THEN recipient_id
          ELSE sender_id
        END AS other_user_id,
        MAX(content) AS last_message,
        COUNT(CASE WHEN recipient_id = ${userId} AND NOT (${userId} = ANY(read_by)) THEN 1 END) AS unread_count,
        MAX(created_at) AS last_message_at
      FROM ${messages}
      WHERE (sender_id = ${userId} OR recipient_id = ${userId})
        AND is_deleted = false
      GROUP BY 1
    )
  `;

  // Final query joining the CTE with users to get usernames
  const queryResult = await db.execute(sql`
    ${conversationCTE}
    SELECT
      c.other_user_id AS user_id,
      u.username,
      c.last_message,
      c.unread_count,
      c.last_message_at
    FROM conversations c
    JOIN ${users} u ON u.id = c.other_user_id
    ORDER BY c.last_message_at DESC
    LIMIT 10
  `);
  const recentConversations = (((queryResult as any)?.rows ?? queryResult) as unknown as {
    user_id: string;
    username: string | null;
    last_message: string;
    unread_count: string;
    last_message_at: string;
  }[]);

  return {
    total_sent: Number(stats.total_sent || 0),
    total_received: Number(stats.total_received || 0),
    unread: Number(stats.unread || 0),
    recent_conversations: recentConversations.map((c) => ({
      user_id: c.user_id,
      username: c.username || undefined,
      last_message: c.last_message || "",
      unread_count: Number(c.unread_count || 0),
      last_message_at: c.last_message_at,
    })),
  };
}

async function getInteractionsStats(userId: string, filters: UserStatsFilters) {
  const [stats] = await db
    .select({
      total: count(),
      likes_given: sql<number>`count(CASE WHEN ${interactions.type} = 'LIKE' THEN 1 END)`,
      follows_given: sql<number>`count(CASE WHEN ${interactions.type} = 'FOLLOW' THEN 1 END)`,
      bookmarks_given: sql<number>`count(CASE WHEN ${interactions.type} = 'BOOKMARK' THEN 1 END)`,
      views_given: sql<number>`count(CASE WHEN ${interactions.type} = 'VIEW' THEN 1 END)`,
    })
    .from(interactions)
    .where(
      and(eq(interactions.userId, userId), eq(interactions.isDeleted, false)),
    );

  const byType = await db
    .select({
      type: interactions.type,
      count: count(),
    })
    .from(interactions)
    .where(
      and(eq(interactions.userId, userId), eq(interactions.isDeleted, false)),
    )
    .groupBy(interactions.type);

  const recentInteractions = await db
    .select({
      type: interactions.type,
      entity_type: interactions.entityType,
      created_at: interactions.createdAt,
    })
    .from(interactions)
    .where(
      and(eq(interactions.userId, userId), eq(interactions.isDeleted, false)),
    )
    .orderBy(desc(interactions.createdAt))
    .limit(10);

  return {
    total: Number(stats.total || 0),
    likes_given: Number(stats.likes_given || 0),
    follows_given: Number(stats.follows_given || 0),
    bookmarks_given: Number(stats.bookmarks_given || 0),
    views_given: Number(stats.views_given || 0),
    by_type: byType.map((t) => ({
      type: t.type,
      count: Number(t.count),
    })),
    recent: recentInteractions.map((i) => ({
      type: i.type,
      entity_type: i.entity_type,
      created_at: i.created_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getNotificationsStats(userId: string) {
  const [stats] = await db
    .select({
      total: count(),
      unread: sql<number>`count(CASE WHEN ${notifications.read} = false THEN 1 END)`,
      read: sql<number>`count(CASE WHEN ${notifications.read} = true THEN 1 END)`,
    })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isDeleted, false)),
    );

  const byType = await db
    .select({
      type: notifications.type,
      count: count(),
    })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isDeleted, false)),
    )
    .groupBy(notifications.type);

  const recentNotifications = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      type: notifications.type,
      read: notifications.read,
      created_at: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isDeleted, false)),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(10);

  return {
    total: Number(stats.total || 0),
    unread: Number(stats.unread || 0),
    read: Number(stats.read || 0),
    by_type: byType.map((t) => ({
      type: t.type,
      count: Number(t.count),
    })),
    recent: recentNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      read: n.read,
      created_at: n.created_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getWalletStats(userId: string, filters: UserStatsFilters) {
  // Solde du portefeuille
  const [walletRow] = await db
    .select({
      accountId: userWallets.financialAccountId,
    })
    .from(userWallets)
    .where(eq(userWallets.userId, userId))
    .limit(1);
  let walletBalance = 0;
  if (walletRow?.accountId) {
    const balance = await getAccountBalance(walletRow.accountId);
    walletBalance = balance;
  }

  const [stats] = await db
    .select({
      total_transactions: count(),
      transaction_volume: sum(walletTransactions.amount),
      total_deposits: sql<number>`COUNT(CASE WHEN ${walletTransactions.type} = 'DEPOSIT' THEN 1 END)`,
      total_withdrawals: sql<number>`COUNT(CASE WHEN ${walletTransactions.type} = 'WITHDRAWAL' THEN 1 END)`,
    })
    .from(walletTransactions)
    .where(
      or(
        eq(walletTransactions.fromUserId, userId),
        eq(walletTransactions.toUserId, userId),
      ),
    );

  const byType = await db
    .select({
      type: walletTransactions.type,
      count: count(),
      total_amount: sum(walletTransactions.amount),
    })
    .from(walletTransactions)
    .where(
      or(
        eq(walletTransactions.fromUserId, userId),
        eq(walletTransactions.toUserId, userId),
      ),
    )
    .groupBy(walletTransactions.type);

  const recentTransactions = await db
    .select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      status: walletTransactions.status,
      created_at: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .where(
      or(
        eq(walletTransactions.fromUserId, userId),
        eq(walletTransactions.toUserId, userId),
      ),
    )
    .orderBy(desc(walletTransactions.createdAt))
    .limit(10);

  return {
    balance: walletBalance,
    total_deposits: Number(stats.total_deposits || 0),
    total_withdrawals: Number(stats.total_withdrawals || 0),
    total_transactions: Number(stats.total_transactions || 0),
    transaction_volume: Number(stats.transaction_volume || 0),
    recent_transactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount || 0),
      status: t.status,
      created_at: t.created_at?.toISOString() || new Date().toISOString(),
    })),
    by_type: byType.map((t) => ({
      type: t.type,
      count: Number(t.count || 0),
      total_amount: Number(t.total_amount || 0),
    })),
  };
}

async function getVipStats(userId: string) {
  const [vip] = await db
    .select({
      plan_type: vipSubscriptions.planType,
      status: vipSubscriptions.status,
      start_date: vipSubscriptions.startDate,
      end_date: vipSubscriptions.endDate,
      auto_renew: vipSubscriptions.autoRenew,
      price_paid: vipSubscriptions.pricePaid,
      active_benefits: vipSubscriptions.activeBenefits,
    })
    .from(vipSubscriptions)
    .where(
      and(
        eq(vipSubscriptions.userId, userId),
        eq(vipSubscriptions.isDeleted, false),
        eq(vipSubscriptions.status, "ACTIVE"),
      ),
    )
    .limit(1);

  const totalSpent = await db
    .select({
      total: sum(vipSubscriptions.pricePaid),
    })
    .from(vipSubscriptions)
    .where(eq(vipSubscriptions.userId, userId));

  return {
    is_active: !!vip,
    current_plan: vip?.plan_type,
    start_date: vip?.start_date?.toISOString(),
    end_date: vip?.end_date?.toISOString(),
    auto_renew: vip?.auto_renew || false,
    total_spent: Number(totalSpent[0]?.total || 0),
    benefits: vip?.active_benefits || [],
  };
}

async function getGamesStats(userId: string, filters: UserStatsFilters) {
  const [stats] = await db
    .select({
      total_items_requested: count(),
      total_spent: sum(requests.totalGtc),
      pending_requests: sql<number>`COUNT(CASE WHEN ${requests.status} = 'PENDING' THEN 1 END)`,
      completed_requests: sql<number>`COUNT(CASE WHEN ${requests.status} = 'COMPLETED' THEN 1 END)`,
    })
    .from(requests)
    .where(and(eq(requests.userId, userId), eq(requests.type, "GAME_ITEMS")));

  const recentRequests = await db
    .select({
      id: requests.id,
      game_item_name: gameItems.name,
      quantity: requests.quantity,
      status: requests.status,
      created_at: requests.createdAt,
    })
    .from(requests)
    .innerJoin(gameItems, eq(requests.gameItemId, gameItems.id))
    .where(and(eq(requests.userId, userId), eq(requests.type, "GAME_ITEMS")))
    .orderBy(desc(requests.createdAt))
    .limit(10);

  return {
    total_items_requested: Number(stats.total_items_requested || 0),
    total_spent: Number(stats.total_spent || 0),
    pending_requests: Number(stats.pending_requests || 0),
    completed_requests: Number(stats.completed_requests || 0),
    recent_requests: recentRequests.map((r) => ({
      id: r.id,
      game_item_name: r.game_item_name,
      quantity: Number(r.quantity || 0),
      status: r.status,
      created_at: r.created_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getThemesStats(userId: string) {
  const [stats] = await db
    .select({
      total_purchases: count(),
      total_spent: sum(themePurchases.price),
    })
    .from(themePurchases)
    .where(eq(themePurchases.userId, userId));

  const createdThemes = await db
    .select({
      total: count(),
    })
    .from(themes)
    .where(eq(themes.creatorId, userId));

  const recentPurchases = await db
    .select({
      theme_name: themes.name,
      price: themePurchases.price,
      purchased_at: themePurchases.createdAt,
    })
    .from(themePurchases)
    .innerJoin(themes, eq(themePurchases.themeId, themes.id))
    .where(eq(themePurchases.userId, userId))
    .orderBy(desc(themePurchases.createdAt))
    .limit(10);

  return {
    total_purchases: Number(stats.total_purchases || 0),
    total_spent: Number(stats.total_spent || 0),
    created_themes: Number(createdThemes[0]?.total || 0),
    recent_purchases: recentPurchases.map((p) => ({
      theme_name: p.theme_name,
      price: Number(p.price || 0),
      purchased_at: p.purchased_at?.toISOString() || new Date().toISOString(),
    })),
  };
}

async function getSearchesStats(userId: string) {
  const [stats] = await db
    .select({
      total: count(),
    })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId));

  const recentSearches = await db
    .select({
      query: searchHistory.query,
    })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(10);

  const mostFrequent = await db
    .select({
      query: searchHistory.query,
      count: count(),
    })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .groupBy(searchHistory.query)
    .orderBy(desc(count()))
    .limit(5);

  return {
    total: Number(stats.total || 0),
    recent_searches: recentSearches.map((s) => s.query),
    most_frequent: mostFrequent.map((m) => ({
      query: m.query,
      count: Number(m.count),
    })),
  };
}

async function getRecentActivity(userId: string) {
  const activities = [];

  // Derniers posts
  const recentPosts = await db
    .select({
      id: posts.id,
      created_at: posts.createdAt,
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.isDeleted, false)))
    .orderBy(desc(posts.createdAt))
    .limit(3);

  activities.push(
    ...recentPosts.map((p) => ({
      id: p.id,
      type: "post",
      action: "post_created",
      description: "Nouveau post publié",
      timestamp: p.created_at?.toISOString() || new Date().toISOString(),
      icon: "📝",
    })),
  );

  // Dernières interactions
  const recentInteractions = await db
    .select({
      id: interactions.id,
      type: interactions.type,
      entity_type: interactions.entityType,
      created_at: interactions.createdAt,
    })
    .from(interactions)
    .where(
      and(eq(interactions.userId, userId), eq(interactions.isDeleted, false)),
    )
    .orderBy(desc(interactions.createdAt))
    .limit(3);

  activities.push(
    ...recentInteractions.map((i) => ({
      id: i.id,
      type: "interaction",
      action: `${i.type.toLowerCase()}_given`,
      description: `${i.type} donné sur ${i.entity_type}`,
      timestamp: i.created_at?.toISOString() || new Date().toISOString(),
      icon: i.type === "LIKE" ? "❤️" : i.type === "FOLLOW" ? "👥" : "🔖",
    })),
  );

  // Dernières transactions
  const recentTransactions = await db
    .select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      created_at: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .where(
      or(
        eq(walletTransactions.fromUserId, userId),
        eq(walletTransactions.toUserId, userId),
      ),
    )
    .orderBy(desc(walletTransactions.createdAt))
    .limit(3);

  activities.push(
    ...recentTransactions.map((t) => ({
      id: t.id,
      type: "transaction",
      action: t.type.toLowerCase(),
      description: `Transaction ${t.type}: ${t.amount} GTC`,
      timestamp: t.created_at?.toISOString() || new Date().toISOString(),
      icon: "💰",
    })),
  );

  // Trier par date et retourner
  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);
}

async function getPerformanceStats(userId: string, period?: string) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "day":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30,
      );
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      break;
    case "month":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        now.getDate(),
      );
      break;
    default:
      startDate = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate(),
      );
  }

  // Activité par jour
  const dailyActivity = await db
    .select({
      date: sql<string>`DATE(${interactions.createdAt})`,
      interactions: count(),
      posts: sql<number>`COUNT(DISTINCT ${posts.id})`,
      transactions: sql<number>`COUNT(DISTINCT ${walletTransactions.id})`,
    })
    .from(interactions)
    .leftJoin(
      posts,
      and(
        eq(posts.authorId, userId),
        sql`DATE(${posts.createdAt}) = DATE(${interactions.createdAt})`,
      ),
    )
    .leftJoin(
      walletTransactions,
      and(
        or(
          eq(walletTransactions.fromUserId, userId),
          eq(walletTransactions.toUserId, userId),
        ),
        sql`DATE(${walletTransactions.createdAt}) = DATE(${interactions.createdAt})`,
      ),
    )
    .where(
      and(
        eq(interactions.userId, userId),
        gte(interactions.createdAt, startDate),
      ),
    )
    .groupBy(sql`DATE(${interactions.createdAt})`)
    .orderBy(asc(sql`DATE(${interactions.createdAt})`));

  // Calcul des moyennes
  const interactionDays = dailyActivity.filter(
    (d) => Number(d.interactions) > 0,
  ).length;
  const postDays = dailyActivity.filter((d) => Number(d.posts) > 0).length;
  const transactionDays = dailyActivity.filter(
    (d) => Number(d.transactions) > 0,
  ).length;

  const totalInteractions = dailyActivity.reduce(
    (sum, d) => sum + Number(d.interactions),
    0,
  );
  const totalPosts = dailyActivity.reduce((sum, d) => sum + Number(d.posts), 0);
  const totalTransactions = dailyActivity.reduce(
    (sum, d) => sum + Number(d.transactions),
    0,
  );

  return {
    daily_avg_interactions:
      interactionDays > 0 ? totalInteractions / interactionDays : 0,
    weekly_avg_posts: postDays > 0 ? (totalPosts / postDays) * 7 : 0,
    monthly_avg_transactions:
      transactionDays > 0 ? (totalTransactions / transactionDays) * 30 : 0,
    activity_trend: dailyActivity.map((d) => ({
      date: d.date,
      interactions: Number(d.interactions),
      posts: Number(d.posts),
      transactions: Number(d.transactions),
    })),
  };
}

async function getGameClipsStats(userId: string, filters: UserStatsFilters) {
  const [stats] = await db
    .select({
      total: count(),
      total_views: sql<number>`COALESCE(SUM(CASE WHEN ${interactions.type} = 'VIEW' THEN 1 ELSE 0 END), 0)`,
      total_likes: sql<number>`COALESCE(SUM(CASE WHEN ${interactions.type} = 'LIKE' THEN 1 ELSE 0 END), 0)`,
    })
    .from(gameClips)
    .leftJoin(
      interactions,
      and(
        eq(interactions.entityId, gameClips.id),
        eq(interactions.entityType, "GAMECLIP"),
      ),
    )
    .where(eq(gameClips.authorId, userId));

  const recentClips = await db
    .select({
      id: gameClips.id,
      caption: gameClips.caption,
      createdAt: gameClips.createdAt,
    })
    .from(gameClips)
    .where(eq(gameClips.authorId, userId))
    .orderBy(desc(gameClips.createdAt))
    .limit(5);

  const clipIds = recentClips.map((c) => c.id);
  let interactionsMap: Record<string, { views: number; likes: number }> = {};

  if (clipIds.length > 0) {
    const counts = await db
      .select({
        id: interactions.entityId,
        type: interactions.type,
        count: count(),
      })
      .from(interactions)
      .where(
        and(
          inArray(interactions.entityId, clipIds),
          eq(interactions.entityType, "GAMECLIP"),
        ),
      )
      .groupBy(interactions.entityId, interactions.type);

    counts.forEach((c) => {
      if (!interactionsMap[c.id])
        interactionsMap[c.id] = { views: 0, likes: 0 };
      if (c.type === "VIEW") interactionsMap[c.id].views = Number(c.count);
      if (c.type === "LIKE") interactionsMap[c.id].likes = Number(c.count);
    });
  }

  return {
    total: Number(stats.total || 0),
    total_views: Number(stats.total_views || 0),
    total_likes: Number(stats.total_likes || 0),
    recent: recentClips.map((c) => ({
      id: c.id,
      caption: c.caption,
      views: interactionsMap[c.id]?.views || 0,
      likes: interactionsMap[c.id]?.likes || 0,
      created_at: c.createdAt?.toISOString() || new Date().toISOString(),
    })),
  };
}

// ============================================================================
// FONCTION SIMPLIFIÉE POUR LE DASHBOARD
// ============================================================================

export async function getUserDashboardStats(userId?: string) {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          data: null,
          error: "Utilisateur non authentifié",
        };
      }
      targetUserId = currentUser.id;
    }

    // Récupérer seulement les stats essentielles pour le dashboard
    const [
      userInfo,
      shopsCount,
      productsCount,
      tournamentsCount,
      walletBalance,
      unreadNotifications,
      recentActivity,
    ] = await Promise.all([
      getUserInfo(targetUserId),

      db
        .select({ count: count() })
        .from(shops)
        .where(
          and(eq(shops.ownerId, targetUserId), eq(shops.isDeleted, false)),
        ),

      db
        .select({ count: count() })
        .from(products)
        .where(
          and(eq(products.userId, targetUserId), eq(products.isDeleted, false)),
        ),

      db
        .select({ count: count() })
        .from(tournaments)
        .where(
          and(
            eq(tournaments.organizerId, targetUserId),
            eq(tournaments.isDeleted, false),
          ),
        ),

      db
        .select({ accountId: userWallets.financialAccountId })
        .from(userWallets)
        .where(eq(userWallets.userId, targetUserId))
        .limit(1),

      db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, targetUserId),
            eq(notifications.read, false),
            eq(notifications.isDeleted, false),
          ),
        ),

      getRecentActivity(targetUserId).then((activities) =>
        activities.slice(0, 5),
      ),
    ]);

    // Calculate real balance from accountId
    let balanceValue = 0;
    if (walletBalance[0]?.accountId) {
      balanceValue = await getAccountBalance(walletBalance[0].accountId);
    }

    return {
      success: true,
      data: {
        user_info: userInfo,
        quick_stats: {
          shops: Number(shopsCount[0]?.count || 0),
          products: Number(productsCount[0]?.count || 0),
          tournaments: Number(tournamentsCount[0]?.count || 0),
          balance: balanceValue,
          unread_notifications: Number(unreadNotifications[0]?.count || 0),
        },
        recent_activity: recentActivity,
      },
      metadata: {
        generated_at: new Date().toISOString(),
        user_id: targetUserId,
      },
    };
  } catch (error) {
    console.error("Error in getUserDashboardStats:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}
