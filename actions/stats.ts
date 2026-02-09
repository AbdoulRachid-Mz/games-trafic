// @/actions/stats.ts
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
  requests,
  gameClips,
  partners,
  services,
  blogs,
  guides,
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
import { alias } from "drizzle-orm/pg-core";

// ============================================================================
// TYPES
// ============================================================================

export interface StatsFilters {
  entity?: string;
  statId?: string;
  date_from?: string;
  date_to?: string;
  userId?: string;
  shopId?: string;
  tournamentId?: string;
  game?: string;
  platform?: string;
  status?: string;
  year?: number;
  month?: number;
  group_by?: "day" | "week" | "month" | "year" | "quarter";
  limit?: number;
  page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  includeDeleted?: boolean;
}

export interface StatsResponse {
  entity: string;
  statId?: string;
  data: any;
  metadata?: {
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface GlobalStats {
  // Utilisateurs
  total_users: number;
  active_users: number;
  vip_users: number;
  admin_users: number;
  verified_users: number;
  anonymous_users: number;

  // Boutiques et Produits
  total_shops: number;
  active_shops: number;
  verified_shops: number;
  total_products: number;
  active_products: number;
  sold_products: number;
  total_orders: number;

  // Tournois
  total_tournaments: number;
  active_tournaments: number;
  upcoming_tournaments: number;
  completed_tournaments: number;
  total_editions: number;
  total_matches: number;

  // Équipes
  total_teams: number;
  active_teams: number;

  // Contenu
  total_posts: number;
  active_posts: number;
  total_messages: number;
  total_groups: number;
  private_groups: number;

  // Game Clips
  total_game_clips: number;
  total_clip_views: number;
  total_clip_likes: number;

  // Interactions
  total_interactions: number;
  total_likes: number;
  total_follows: number;
  total_bookmarks: number;
  total_views: number;

  // Finances
  total_wallet_balance: number;
  total_transactions: number;
  total_transaction_volume: number;

  // VIP
  total_vip_subscriptions: number;
  active_vip_subscriptions: number;

  // Jeux
  total_games: number;
  total_game_items: number;
  total_game_item_requests: number;

  // Thèmes
  total_themes: number;
  premium_themes: number;
  total_theme_purchases: number;

  // Annonces
  total_announcements: number;
  pinned_announcements: number;
  active_announcements: number;

  // Partenaires
  total_partners: number;
  active_partners: number;
  verified_partners: number;

  // Services
  total_services: number;
  active_services: number;

  // Blogs
  total_blogs: number;
  active_blogs: number;

  // Guides
  total_guides: number;
  active_guides: number;

  // Autres
  total_claims: number;
  pending_claims: number;
  total_searches: number;
  total_traces: number;
  total_categories: number;

  // Statistiques temporelles
  new_users_today: number;
  new_orders_today: number;
  new_products_today: number;
  new_posts_today: number;
}

export interface RecentActivity {
  id: string;
  type:
  | "user"
  | "shop"
  | "product"
  | "tournament"
  | "order"
  | "post"
  | "message"
  | "transaction"
  | "vip"
  | "match"
  | "team";
  action: string;
  description: string;
  entity_id: string;
  user_id?: string;
  user_name?: string;
  timestamp: Date;
  icon: string;
  color: string;
}

// ============================================================================
// FONCTIONS D'AIDE
// ============================================================================

function buildWhereConditions(filters: StatsFilters, table: any) {
  const conditions = [];

  // Date filters - convertir en string ISO
  if (filters.date_from) {
    conditions.push(gte(table.createdAt, filters.date_from));
  }
  if (filters.date_to) {
    conditions.push(lte(table.createdAt, filters.date_to));
  }

  // Year filter - utiliser sql.raw pour EXTRACT
  if (filters.year) {
    conditions.push(
      sql`EXTRACT(YEAR FROM ${table.createdAt}) = ${filters.year}`,
    );
  }

  // Month filter
  if (filters.month) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${table.createdAt}) = ${filters.month}`,
    );
  }

  // Exclude deleted items unless specified
  if (!filters.includeDeleted && "isDeleted" in table) {
    conditions.push(eq(table.isDeleted, false));
  }

  if (!filters.includeDeleted && "isActive" in table) {
    conditions.push(eq(table.isActive, true));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

// ============================================================================
// I. STATISTIQUES GLOBALES COMPLÈTES
// ============================================================================

export async function getGlobalStats(
  filters: StatsFilters = {},
): Promise<GlobalStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    // Insert likes for game clips into interactions table
    // Aggregate likes for game clips from interactions
    const gameClipLikes = await db
      .select({
        clipId: interactions.entityId,
        likes: count(),
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.type, "LIKE"),
          eq(interactions.entityType, "GAMECLIP"),
        ),
      )
      .groupBy(interactions.entityId);

    // Build a map of clipId -> like count
    const likesMap = new Map<string, number>();
    for (const row of gameClipLikes) {
      likesMap.set(row.clipId, Number(row.likes));
    }

    // Toutes les requêtes en parallèle pour optimiser les performances
    const [
      usersStats,
      shopsStats,
      productsStats,
      tournamentsStats,
      teamsStats,
      postsStats,
      messagesStats,
      groupsStats,
      interactionsStats,
      walletStats,
      vipStats,
      gamesStats,
      themesStats,
      announcementsCount,
      activeAnnouncementsCount,
      pinnedAnnouncementsCount,

      partnersCount,
      activePartnersCount,
      verifiedPartnersCount,

      servicesCount,
      activeServicesCount,

      blogsCount,
      activeBlogsCount,

      guidesCount,
      activeGuidesCount,

      claimsCount,
      claimsStats,
      searchStats,
      traceStats,
      categoriesStats,
      ordersStats,
      editionsStats,
      matchesStats,
      gameClipsStats,
      todayStats,
      newOrdersToday,
      newProductsToday,
      newPostsToday,
    ] = await Promise.all([
      // Users
      db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${users.isActive} = true THEN 1 END)`,
          vip: sql<number>`count(CASE WHEN ${users.isVip} = true THEN 1 END)`,
          admin: sql<number>`count(CASE WHEN ${users.isAdmin} = true THEN 1 END)`,
          verified: sql<number>`count(CASE WHEN ${users.emailVerified} = true THEN 1 END)`,
          anonymous: sql<number>`count(CASE WHEN ${users.isAnonymous} = true THEN 1 END)`,
        })
        .from(users)
        .where(buildWhereConditions(filters, users)),

      // Shops
      db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${shops.isActive} = true THEN 1 END)`,
          verified: sql<number>`count(CASE WHEN ${shops.verified} = true THEN 1 END)`,
        })
        .from(shops)
        .where(buildWhereConditions(filters, shops)),

      // Products
      db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${products.isActive} = true THEN 1 END)`,
          sold: sql<number>`count(CASE WHEN ${products.status} = 'VENDU' THEN 1 END)`,
        })
        .from(products)
        .where(buildWhereConditions(filters, products)),

      // Tournaments
      db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${tournaments.isActive} = true THEN 1 END)`,
          upcoming: sql<number>`count(CASE WHEN ${tournaments.status} = 'UPCOMING' THEN 1 END)`,
          completed: sql<number>`count(CASE WHEN ${tournaments.status} = 'COMPLETED' THEN 1 END)`,
        })
        .from(tournaments)
        .where(buildWhereConditions(filters, tournaments)),

      // Teams
      db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${teams.isActive} = true THEN 1 END)`,
        })
        .from(teams)
        .where(buildWhereConditions(filters, teams)),

      // Posts
      db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${posts.isActive} = true THEN 1 END)`,
        })
        .from(posts)
        .where(buildWhereConditions(filters, posts)),

      // Messages
      db
        .select({
          total: count(),
        })
        .from(messages)
        .where(buildWhereConditions(filters, messages)),

      // Groups
      db
        .select({
          total: count(),
          private: sql<number>`count(CASE WHEN ${groups.isPrivate} = true THEN 1 END)`,
        })
        .from(groups)
        .where(buildWhereConditions(filters, groups)),

      // Interactions
      db
        .select({
          total: count(),
          likes: sql<number>`count(CASE WHEN ${interactions.type} = 'LIKE' THEN 1 END)`,
          follows: sql<number>`count(CASE WHEN ${interactions.type} = 'FOLLOW' THEN 1 END)`,
          bookmarks: sql<number>`count(CASE WHEN ${interactions.type} = 'BOOKMARK' THEN 1 END)`,
          views: sql<number>`count(CASE WHEN ${interactions.type} = 'VIEW' THEN 1 END)`,
        })
        .from(interactions)
        .where(buildWhereConditions(filters, interactions)),

      // Wallet
      db
        .select({
          total_balance: sum(userWallets.balance),
          total_transactions: count(),
          total_volume: sum(walletTransactions.amount),
        })
        .from(walletTransactions)
        .leftJoin(userWallets, eq(walletTransactions.walletId, userWallets.id))
        .where(buildWhereConditions(filters, walletTransactions)),

      // VIP Subscriptions
      db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${vipSubscriptions.status} = 'ACTIVE' THEN 1 END)`,
        })
        .from(vipSubscriptions)
        .where(buildWhereConditions(filters, vipSubscriptions)),

      // Games
      db
        .select({
          total_games: count(),
          total_items: count(),
          total_requests: count(),
        })
        .from(games)
        .leftJoin(gameItems, eq(games.id, gameItems.gameId))
        .leftJoin(requests, eq(gameItems.id, requests.gameItemId))
        .where(buildWhereConditions(filters, games)),

      // Themes
      db
        .select({
          total: count(),
          premium: sql<number>`count(CASE WHEN ${themes.isPremium} = true THEN 1 END)`,
          purchases: count(),
        })
        .from(themes)
        .leftJoin(themePurchases, eq(themes.id, themePurchases.themeId))
        .where(buildWhereConditions(filters, themes)),

      // Announcements
      db.select({ count: count() }).from(announcements),
      db
        .select({ count: count() })
        .from(announcements)
        .where(eq(announcements.isActive, true)),
      db
        .select({ count: count() })
        .from(announcements)
        .where(eq(announcements.isPinned, true)),

      // Partners
      db.select({ count: count() }).from(partners),
      db
        .select({ count: count() })
        .from(partners)
        .where(eq(partners.isActive, true)),
      db
        .select({ count: count() })
        .from(partners)
        .where(eq(partners.verified, true)),

      // Services
      db.select({ count: count() }).from(services),
      db
        .select({ count: count() })
        .from(services)
        .where(eq(services.isActive, true)),

      // Blogs
      db.select({ count: count() }).from(blogs),
      db.select({ count: count() }).from(blogs).where(eq(blogs.isActive, true)),

      // Guides
      db.select({ count: count() }).from(guides),
      db.select({ count: count() }).from(guides).where(eq(guides.isActive, true)),

      // Claims
      db.select({ count: count() }).from(claims),
      db
        .select({
          total: count(),
          pending: sql<number>`count(CASE WHEN ${claims.status} = 'PENDING' THEN 1 END)`,
        })
        .from(claims)
        .where(buildWhereConditions(filters, claims)),

      // Search History
      db
        .select({
          total: count(),
        })
        .from(searchHistory)
        .where(buildWhereConditions(filters, searchHistory)),

      // User Traces
      db
        .select({
          total: count(),
        })
        .from(userTraces)
        .where(buildWhereConditions(filters, userTraces)),

      // Categories
      db
        .select({
          total: count(),
        })
        .from(categories)
        .where(buildWhereConditions(filters, categories)),

      // Orders
      db
        .select({
          total: count(),
        })
        .from(orders)
        .where(buildWhereConditions(filters, orders)),

      // Tournament Editions
      db
        .select({
          total: count(),
        })
        .from(tournamentEditions)
        .where(buildWhereConditions(filters, tournamentEditions)),

      // Matches
      db
        .select({
          total: count(),
        })
        .from(matches)
        .where(buildWhereConditions(filters, matches)),

      // Game Clips
      db
        .select({
          total: count(),
          views: sql<number>`COALESCE(SUM(${gameClips.viewCount}), 0)`,
        })
        .from(gameClips)
        .where(buildWhereConditions(filters, gameClips)),

      // Today's stats
      db
        .select({
          new_users: sql<number>`count(CASE WHEN DATE(${users.createdAt}) = ${todayStr} THEN 1 END)`,
        })
        .from(users),

      // Nouvelles commandes aujourd'hui
      db
        .select({
          new_orders: sql<number>`count(CASE WHEN DATE(${orders.createdAt}) = ${todayStr} THEN 1 END)`,
        })
        .from(orders),

      // Nouveaux produits aujourd'hui
      db
        .select({
          new_products: sql<number>`count(CASE WHEN DATE(${products.createdAt}) = ${todayStr} THEN 1 END)`,
        })
        .from(products),

      // Nouveaux posts aujourd'hui
      db
        .select({
          new_posts: sql<number>`count(CASE WHEN DATE(${posts.createdAt}) = ${todayStr} THEN 1 END)`,
        })
        .from(posts),
    ]);

    return {
      // Users
      total_users: Number(usersStats[0]?.total || 0),
      active_users: Number(usersStats[0]?.active || 0),
      vip_users: Number(usersStats[0]?.vip || 0),
      admin_users: Number(usersStats[0]?.admin || 0),
      verified_users: Number(usersStats[0]?.verified || 0),
      anonymous_users: Number(usersStats[0]?.anonymous || 0),

      // Shops & Products
      total_shops: Number(shopsStats[0]?.total || 0),
      active_shops: Number(shopsStats[0]?.active || 0),
      verified_shops: Number(shopsStats[0]?.verified || 0),
      total_products: Number(productsStats[0]?.total || 0),
      active_products: Number(productsStats[0]?.active || 0),
      sold_products: Number(productsStats[0]?.sold || 0),
      total_orders: Number(ordersStats[0]?.total || 0),

      // Tournaments
      total_tournaments: Number(tournamentsStats[0]?.total || 0),
      active_tournaments: Number(tournamentsStats[0]?.active || 0),
      upcoming_tournaments: Number(tournamentsStats[0]?.upcoming || 0),
      completed_tournaments: Number(tournamentsStats[0]?.completed || 0),
      total_editions: Number(editionsStats[0]?.total || 0),
      total_matches: Number(matchesStats[0]?.total || 0),

      // Teams
      total_teams: Number(teamsStats[0]?.total || 0),
      active_teams: Number(teamsStats[0]?.active || 0),

      // Content
      total_posts: Number(postsStats[0]?.total || 0),
      active_posts: Number(postsStats[0]?.active || 0),
      total_messages: Number(messagesStats[0]?.total || 0),
      total_groups: Number(groupsStats[0]?.total || 0),
      private_groups: Number(groupsStats[0]?.private || 0),

      // Game Clips
      total_game_clips: Number(gameClipsStats[0]?.total || 0),
      total_clip_views: Number(gameClipsStats[0]?.views || 0),
      total_clip_likes: Number(interactionsStats[0]?.likes || 0),

      // Interactions
      total_interactions: Number(interactionsStats[0]?.total || 0),
      total_likes: Number(interactionsStats[0]?.likes || 0),
      total_follows: Number(interactionsStats[0]?.follows || 0),
      total_bookmarks: Number(interactionsStats[0]?.bookmarks || 0),
      total_views: Number(interactionsStats[0]?.views || 0),

      // Finance
      total_wallet_balance: Number(walletStats[0]?.total_balance || 0),
      total_transactions: Number(walletStats[0]?.total_transactions || 0),
      total_transaction_volume: Number(walletStats[0]?.total_volume || 0),

      // VIP
      total_vip_subscriptions: Number(vipStats[0]?.total || 0),
      active_vip_subscriptions: Number(vipStats[0]?.active || 0),

      // Games
      total_games: Number(gamesStats[0]?.total_games || 0),
      total_game_items: Number(gamesStats[0]?.total_items || 0),
      total_game_item_requests: Number(gamesStats[0]?.total_requests || 0),

      // Themes
      total_themes: Number(themesStats[0]?.total || 0),
      premium_themes: Number(themesStats[0]?.premium || 0),
      total_theme_purchases: Number(themesStats[0]?.purchases || 0),

      // Announcements
      total_announcements: Number(announcementsCount[0].count),
      pinned_announcements: Number(pinnedAnnouncementsCount[0].count),
      active_announcements: Number(activeAnnouncementsCount[0].count),

      // Partenaires
      total_partners: Number(partnersCount[0].count),
      active_partners: Number(activePartnersCount[0].count),
      verified_partners: Number(verifiedPartnersCount[0].count),

      // Services
      total_services: Number(servicesCount[0].count),
      active_services: Number(activeServicesCount[0].count),

      // Blogs
      total_blogs: Number(blogsCount[0].count),
      active_blogs: Number(activeBlogsCount[0].count),

      // Guides
      total_guides: Number(guidesCount[0].count),
      active_guides: Number(activeGuidesCount[0].count),

      // Claims
      total_claims: Number(claimsCount[0].count),
      pending_claims: Number(claimsStats[0]?.pending || 0),

      // Search & Traces
      total_searches: Number(searchStats[0]?.total || 0),
      total_traces: Number(traceStats[0]?.total || 0),
      total_categories: Number(categoriesStats[0]?.total || 0),

      // Today's stats
      new_users_today: Number(todayStats[0]?.new_users || 0),
      new_orders_today: Number(newOrdersToday[0]?.new_orders || 0),
      new_products_today: Number(newProductsToday[0]?.new_products || 0),
      new_posts_today: Number(newPostsToday[0]?.new_posts || 0),
    };
  } catch (error) {
    console.error("Error in getGlobalStats:", error);
    throw error;
  }
}

// ============================================================================
// II. STATISTIQUES PAR ENTITÉ
// ============================================================================

export async function getUserStats(
  filters: StatsFilters = {},
): Promise<StatsResponse> {
  const statId = filters.statId;

  switch (statId) {
    case "roles":
      const roles = await db
        .select({
          role: users.role,
          count: count(),
        })
        .from(users)
        .where(buildWhereConditions(filters, users))
        .groupBy(users.role)
        .orderBy(desc(count()));

      return {
        entity: "users",
        statId: "roles",
        data: roles.map((r) => ({
          role: r.role || "user",
          count: Number(r.count),
        })),
      };

    case "status":
      const status = await db
        .select({
          status: sql<string>`CASE 
          WHEN ${users.isActive} = true AND ${users.emailVerified} = true THEN 'Active & Verified'
          WHEN ${users.isActive} = true AND ${users.emailVerified} = false THEN 'Active & Unverified'
          WHEN ${users.isActive} = false THEN 'Inactive'
          ELSE 'Unknown'
        END`,
          count: count(),
        })
        .from(users)
        .where(buildWhereConditions(filters, users))
        .groupBy(sql`1`)
        .orderBy(desc(count()));

      return {
        entity: "users",
        statId: "status",
        data: status.map((s) => ({
          status: s.status,
          count: Number(s.count),
        })),
      };

    case "growth":
      const groupBy = filters.group_by || "month";
      const growth = await db
        .select({
          period: sql<string>`DATE_TRUNC('${sql.raw(groupBy)}', ${users.createdAt
            })`,
          count: count(),
        })
        .from(users)
        .where(buildWhereConditions(filters, users))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`));

      return {
        entity: "users",
        statId: "growth",
        data: growth.map((g) => ({
          period: g.period,
          count: Number(g.count),
        })),
      };

    case "countries":
      const countries = await db
        .select({
          country: sql<string>`COALESCE(${users.country}, 'Unknown')`,
          count: count(),
        })
        .from(users)
        .where(buildWhereConditions(filters, users))
        .groupBy(sql`1`)
        .orderBy(desc(count()))
        .limit(filters.limit || 10);

      return {
        entity: "users",
        statId: "countries",
        data: countries.map((c) => ({
          country: c.country,
          count: Number(c.count),
        })),
      };

    case "account_types":
      const accountTypes = await db
        .select({
          type: sql<string>`unnest(${users.accountTypes})`,
          count: count(),
        })
        .from(users)
        .where(buildWhereConditions(filters, users))
        .groupBy(sql`1`)
        .orderBy(desc(count()));

      return {
        entity: "users",
        statId: "account_types",
        data: accountTypes.map((at) => ({
          type: at.type,
          count: Number(at.count),
        })),
      };

    default:
      const summary = await db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${users.isActive} = true THEN 1 END)`,
          verified: sql<number>`count(CASE WHEN ${users.emailVerified} = true THEN 1 END)`,
          vip: sql<number>`count(CASE WHEN ${users.isVip} = true THEN 1 END)`,
          admin: sql<number>`count(CASE WHEN ${users.isAdmin} = true THEN 1 END)`,
          anonymous: sql<number>`count(CASE WHEN ${users.isAnonymous} = true THEN 1 END)`,
          last_month: sql<number>`count(CASE WHEN ${users.createdAt} >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END)`,
          avg_shops: avg(users.shopsCreatedCount),
          avg_tournaments: avg(users.tournamentsCreatedCount),
          avg_posts: avg(users.postsCreatedCount),
        })
        .from(users)
        .where(buildWhereConditions(filters, users));

      return {
        entity: "users",
        statId: "summary",
        data: summary[0]
          ? {
            total: Number(summary[0].total),
            active: Number(summary[0].active),
            verified: Number(summary[0].verified),
            vip: Number(summary[0].vip),
            admin: Number(summary[0].admin),
            anonymous: Number(summary[0].anonymous),
            last_month: Number(summary[0].last_month),
            avg_shops: Number(summary[0].avg_shops || 0),
            avg_tournaments: Number(summary[0].avg_tournaments || 0),
            avg_posts: Number(summary[0].avg_posts || 0),
          }
          : null,
        metadata: { total: Number(summary[0]?.total || 0) },
      };
  }
}

export async function getShopStats(
  filters: StatsFilters = {},
): Promise<StatsResponse> {
  const statId = filters.statId;

  switch (statId) {
    case "countries":
      const countries = await db
        .select({
          country: sql<string>`COALESCE(${shops.country}, 'Unknown')`,
          count: count(),
          total_products: sum(shops.productCount),
          avg_balance: avg(shops.balance),
        })
        .from(shops)
        .where(buildWhereConditions(filters, shops))
        .groupBy(shops.country)
        .orderBy(desc(count()))
        .limit(filters.limit || 10);

      return {
        entity: "shops",
        statId: "countries",
        data: countries.map((c) => ({
          country: c.country,
          count: Number(c.count),
          total_products: Number(c.total_products || 0),
          avg_balance: Number(c.avg_balance || 0),
        })),
      };

    case "verification":
      const verification = await db
        .select({
          verified: shops.verified,
          count: count(),
          avg_products: avg(shops.productCount),
          avg_views: avg(shops.viewCount),
        })
        .from(shops)
        .where(buildWhereConditions(filters, shops))
        .groupBy(shops.verified);

      return {
        entity: "shops",
        statId: "verification",
        data: verification.map((v) => ({
          verified: v.verified,
          count: Number(v.count),
          avg_products: Number(v.avg_products || 0),
          avg_views: Number(v.avg_views || 0),
        })),
      };

    case "growth":
      const groupBy = filters.group_by || "month";
      const growth = await db
        .select({
          period: sql<string>`DATE_TRUNC('${sql.raw(groupBy)}', ${shops.createdAt
            })`,
          count: count(),
          total_products: sum(shops.productCount),
        })
        .from(shops)
        .where(buildWhereConditions(filters, shops))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`));

      return {
        entity: "shops",
        statId: "growth",
        data: growth.map((g) => ({
          period: g.period,
          count: Number(g.count),
          total_products: Number(g.total_products || 0),
        })),
      };

    default:
      const summary = await db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${shops.isActive} = true THEN 1 END)`,
          verified: sql<number>`count(CASE WHEN ${shops.verified} = true THEN 1 END)`,
          featured: sql<number>`count(CASE WHEN ${shops.featured} = true THEN 1 END)`,
          total_products: sum(shops.productCount),
          total_views: sum(shops.viewCount),
          total_balance: sum(shops.balance),
          avg_products: avg(shops.productCount),
          avg_views: avg(shops.viewCount),
          avg_balance: avg(shops.balance),
          last_month: sql<number>`count(CASE WHEN ${shops.createdAt} >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END)`,
        })
        .from(shops)
        .where(buildWhereConditions(filters, shops));

      return {
        entity: "shops",
        statId: "summary",
        data: summary[0]
          ? {
            total: Number(summary[0].total),
            active: Number(summary[0].active),
            verified: Number(summary[0].verified),
            featured: Number(summary[0].featured),
            total_products: Number(summary[0].total_products || 0),
            total_views: Number(summary[0].total_views || 0),
            total_balance: Number(summary[0].total_balance || 0),
            avg_products: Number(summary[0].avg_products || 0),
            avg_views: Number(summary[0].avg_views || 0),
            avg_balance: Number(summary[0].avg_balance || 0),
            last_month: Number(summary[0].last_month),
          }
          : null,
        metadata: { total: Number(summary[0]?.total || 0) },
      };
  }
}

export async function getProductStats(
  filters: StatsFilters = {},
): Promise<StatsResponse> {
  const statId = filters.statId;

  switch (statId) {
    case "status":
      const status = await db
        .select({
          status: products.status,
          count: count(),
          avg_price: avg(products.price),
          total_views: sum(products.viewCount),
        })
        .from(products)
        .where(buildWhereConditions(filters, products))
        .groupBy(products.status)
        .orderBy(desc(count()));

      return {
        entity: "products",
        statId: "status",
        data: status.map((s) => ({
          status: s.status,
          count: Number(s.count),
          avg_price: Number(s.avg_price || 0),
          total_views: Number(s.total_views || 0),
        })),
      };

    case "games":
      const games = await db
        .select({
          game: sql<string>`COALESCE(${products.game}, 'Unknown')`,
          count: count(),
          avg_price: avg(products.price),
          total_sold: sql<number>`count(CASE WHEN ${products.status} = 'VENDU' THEN 1 END)`,
        })
        .from(products)
        .where(buildWhereConditions(filters, products))
        .groupBy(products.game)
        .orderBy(desc(count()))
        .limit(filters.limit || 10);

      return {
        entity: "products",
        statId: "games",
        data: games.map((g) => ({
          game: g.game,
          count: Number(g.count),
          avg_price: Number(g.avg_price || 0),
          total_sold: Number(g.total_sold || 0),
        })),
      };

    case "platforms":
      const platforms = await db
        .select({
          platform: products.platform,
          count: count(),
          avg_price: avg(products.price),
          total_views: sum(products.viewCount),
        })
        .from(products)
        .where(buildWhereConditions(filters, products))
        .groupBy(products.platform)
        .orderBy(desc(count()));

      return {
        entity: "products",
        statId: "platforms",
        data: platforms.map((p) => ({
          platform: p.platform,
          count: Number(p.count),
          avg_price: Number(p.avg_price || 0),
          total_views: Number(p.total_views || 0),
        })),
      };

    case "growth":
      const groupBy = filters.group_by || "month";
      const growth = await db
        .select({
          period: sql<string>`DATE_TRUNC('${sql.raw(groupBy)}', ${products.createdAt
            })`,
          count: count(),
          avg_price: avg(products.price),
          total_sold: sql<number>`count(CASE WHEN ${products.status} = 'VENDU' THEN 1 END)`,
        })
        .from(products)
        .where(buildWhereConditions(filters, products))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`));

      return {
        entity: "products",
        statId: "growth",
        data: growth.map((g) => ({
          period: g.period,
          count: Number(g.count),
          avg_price: Number(g.avg_price || 0),
          total_sold: Number(g.total_sold || 0),
        })),
      };

    default:
      const summary = await db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${products.isActive} = true THEN 1 END)`,
          visible: sql<number>`count(CASE WHEN ${products.isVisible} = true THEN 1 END)`,
          featured: sql<number>`count(CASE WHEN ${products.isFeatured} = true THEN 1 END)`,
          negotiable: sql<number>`count(CASE WHEN ${products.isNegotiable} = true THEN 1 END)`,
          sold: sql<number>`count(CASE WHEN ${products.status} = 'VENDU' THEN 1 END)`,
          reserved: sql<number>`count(CASE WHEN ${products.status} = 'RESERVE' THEN 1 END)`,
          total_views: sum(products.viewCount),
          avg_price: avg(products.price),
          max_price: max(products.price),
          min_price: min(products.price),
          total_value: sum(products.price),
          last_month: sql<number>`count(CASE WHEN ${products.createdAt} >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END)`,
        })
        .from(products)
        .where(buildWhereConditions(filters, products));

      return {
        entity: "products",
        statId: "summary",
        data: summary[0]
          ? {
            total: Number(summary[0].total),
            active: Number(summary[0].active),
            visible: Number(summary[0].visible),
            featured: Number(summary[0].featured),
            negotiable: Number(summary[0].negotiable),
            sold: Number(summary[0].sold),
            reserved: Number(summary[0].reserved),
            total_views: Number(summary[0].total_views || 0),
            avg_price: Number(summary[0].avg_price || 0),
            max_price: Number(summary[0].max_price || 0),
            min_price: Number(summary[0].min_price || 0),
            total_value: Number(summary[0].total_value || 0),
            last_month: Number(summary[0].last_month),
          }
          : null,
        metadata: { total: Number(summary[0]?.total || 0) },
      };
  }
}

export async function getTournamentStats(
  filters: StatsFilters = {},
): Promise<StatsResponse> {
  const statId = filters.statId;

  switch (statId) {
    case "status":
      const status = await db
        .select({
          status: tournaments.status,
          count: count(),
          avg_participants: avg(sql`${tournaments.maxParticipantsPerEdition}`),
          avg_prize_pool: avg(sql`${tournaments.totalPrizePool}`),
        })
        .from(tournaments)
        .where(buildWhereConditions(filters, tournaments))
        .groupBy(tournaments.status)
        .orderBy(desc(count()));

      return {
        entity: "tournaments",
        statId: "status",
        data: status.map((s) => ({
          status: s.status,
          count: Number(s.count),
          avg_participants: Number(s.avg_participants || 0),
          avg_prize_pool: Number(s.avg_prize_pool || 0),
        })),
      };

    case "games":
      const games = await db
        .select({
          game: tournaments.game,
          count: count(),
          avg_editions: avg(tournaments.totalEditions),
          total_participants: sum(tournaments.totalParticipants),
          total_prize_pool: sum(tournaments.totalPrizePool),
        })
        .from(tournaments)
        .where(buildWhereConditions(filters, tournaments))
        .groupBy(tournaments.game)
        .orderBy(desc(count()))
        .limit(filters.limit || 10);

      return {
        entity: "tournaments",
        statId: "games",
        data: games.map((g) => ({
          game: g.game,
          count: Number(g.count),
          avg_editions: Number(g.avg_editions || 0),
          total_participants: Number(g.total_participants || 0),
          total_prize_pool: Number(g.total_prize_pool || 0),
        })),
      };

    case "platforms":
      const platforms = await db
        .select({
          platform: tournaments.platform,
          count: count(),
          avg_participants: avg(tournaments.maxParticipantsPerEdition),
          total_views: sum(tournaments.viewCount),
        })
        .from(tournaments)
        .where(buildWhereConditions(filters, tournaments))
        .groupBy(tournaments.platform)
        .orderBy(desc(count()));

      return {
        entity: "tournaments",
        statId: "platforms",
        data: platforms.map((p) => ({
          platform: p.platform,
          count: Number(p.count),
          avg_participants: Number(p.avg_participants || 0),
          total_views: Number(p.total_views || 0),
        })),
      };

    case "visibility":
      const visibility = await db
        .select({
          visibility: tournaments.visibility,
          count: count(),
          avg_followers: avg(tournaments.followerCount),
          avg_views: avg(tournaments.viewCount),
        })
        .from(tournaments)
        .where(buildWhereConditions(filters, tournaments))
        .groupBy(tournaments.visibility)
        .orderBy(desc(count()));

      return {
        entity: "tournaments",
        statId: "visibility",
        data: visibility.map((v) => ({
          visibility: v.visibility,
          count: Number(v.count),
          avg_followers: Number(v.avg_followers || 0),
          avg_views: Number(v.avg_views || 0),
        })),
      };

    case "growth":
      const groupBy = filters.group_by || "month";
      const growth = await db
        .select({
          period: sql<string>`DATE_TRUNC('${sql.raw(groupBy)}', ${tournaments.createdAt
            })`,
          count: count(),
          avg_prize_pool: avg(tournaments.totalPrizePool),
          total_participants: sum(tournaments.totalParticipants),
        })
        .from(tournaments)
        .where(buildWhereConditions(filters, tournaments))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`));

      return {
        entity: "tournaments",
        statId: "growth",
        data: growth.map((g) => ({
          period: g.period,
          count: Number(g.count),
          avg_prize_pool: Number(g.avg_prize_pool || 0),
          total_participants: Number(g.total_participants || 0),
        })),
      };

    default:
      const summary = await db
        .select({
          total: count(),
          active: sql<number>`count(CASE WHEN ${tournaments.isActive} = true THEN 1 END)`,
          featured: sql<number>`count(CASE WHEN ${tournaments.featured} = true THEN 1 END)`,
          verified: sql<number>`count(CASE WHEN ${tournaments.verified} = true THEN 1 END)`,
          private: sql<number>`count(CASE WHEN ${tournaments.visibility} = 'PRIVATE' THEN 1 END)`,
          total_editions: sum(tournaments.totalEditions),
          total_participants: sum(tournaments.totalParticipants),
          total_prize_pool: sum(tournaments.totalPrizePool),
          total_views: sum(tournaments.viewCount),
          total_followers: sum(tournaments.followerCount),
          avg_editions: avg(tournaments.totalEditions),
          avg_participants: avg(tournaments.totalParticipants),
          avg_prize_pool: avg(tournaments.totalPrizePool),
          avg_views: avg(tournaments.viewCount),
          last_month: sql<number>`count(CASE WHEN ${tournaments.createdAt} >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END)`,
        })
        .from(tournaments)
        .where(buildWhereConditions(filters, tournaments));

      return {
        entity: "tournaments",
        statId: "summary",
        data: summary[0]
          ? {
            total: Number(summary[0].total),
            active: Number(summary[0].active),
            featured: Number(summary[0].featured),
            verified: Number(summary[0].verified),
            private: Number(summary[0].private),
            total_editions: Number(summary[0].total_editions || 0),
            total_participants: Number(summary[0].total_participants || 0),
            total_prize_pool: Number(summary[0].total_prize_pool || 0),
            total_views: Number(summary[0].total_views || 0),
            total_followers: Number(summary[0].total_followers || 0),
            avg_editions: Number(summary[0].avg_editions || 0),
            avg_participants: Number(summary[0].avg_participants || 0),
            avg_prize_pool: Number(summary[0].avg_prize_pool || 0),
            avg_views: Number(summary[0].avg_views || 0),
            last_month: Number(summary[0].last_month),
          }
          : null,
        metadata: { total: Number(summary[0]?.total || 0) },
      };
  }
}

export async function getTransactionStats(
  filters: StatsFilters = {},
): Promise<StatsResponse> {
  const statId = filters.statId;

  switch (statId) {
    case "types":
      const types = await db
        .select({
          type: walletTransactions.type,
          count: count(),
          total_amount: sum(walletTransactions.amount),
          avg_amount: avg(walletTransactions.amount),
          total_fees: sum(walletTransactions.fees),
        })
        .from(walletTransactions)
        .where(buildWhereConditions(filters, walletTransactions))
        .groupBy(walletTransactions.type)
        .orderBy(desc(sum(walletTransactions.amount)));

      return {
        entity: "transactions",
        statId: "types",
        data: types.map((t) => ({
          type: t.type,
          count: Number(t.count),
          total_amount: Number(t.total_amount || 0),
          avg_amount: Number(t.avg_amount || 0),
          total_fees: Number(t.total_fees || 0),
        })),
      };

    case "status":
      const status = await db
        .select({
          status: walletTransactions.status,
          count: count(),
          total_amount: sum(walletTransactions.amount),
          avg_amount: avg(walletTransactions.amount),
        })
        .from(walletTransactions)
        .where(buildWhereConditions(filters, walletTransactions))
        .groupBy(walletTransactions.status)
        .orderBy(desc(count()));

      return {
        entity: "transactions",
        statId: "status",
        data: status.map((s) => ({
          status: s.status,
          count: Number(s.count),
          total_amount: Number(s.total_amount || 0),
          avg_amount: Number(s.avg_amount || 0),
        })),
      };

    case "growth":
      const groupBy = filters.group_by || "month";
      const growth = await db
        .select({
          period: sql<string>`DATE_TRUNC('${sql.raw(groupBy)}', ${walletTransactions.createdAt
            })`,
          count: count(),
          total_amount: sum(walletTransactions.amount),
          total_fees: sum(walletTransactions.fees),
          avg_amount: avg(walletTransactions.amount),
        })
        .from(walletTransactions)
        .where(buildWhereConditions(filters, walletTransactions))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`));

      return {
        entity: "transactions",
        statId: "growth",
        data: growth.map((g) => ({
          period: g.period,
          count: Number(g.count),
          total_amount: Number(g.total_amount || 0),
          total_fees: Number(g.total_fees || 0),
          avg_amount: Number(g.avg_amount || 0),
        })),
      };

    case "hourly":
      const hourly = await db
        .select({
          hour: sql<number>`EXTRACT(HOUR FROM ${walletTransactions.createdAt})`,
          count: count(),
          total_amount: sum(walletTransactions.amount),
        })
        .from(walletTransactions)
        .where(buildWhereConditions(filters, walletTransactions))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`));

      return {
        entity: "transactions",
        statId: "hourly",
        data: hourly.map((h) => ({
          hour: h.hour,
          count: Number(h.count),
          total_amount: Number(h.total_amount || 0),
        })),
      };

    default:
      const summary = await db
        .select({
          total: count(),
          total_amount: sum(walletTransactions.amount),
          total_fees: sum(walletTransactions.fees),
          avg_amount: avg(walletTransactions.amount),
          max_amount: max(walletTransactions.amount),
          min_amount: min(walletTransactions.amount),
          pending: sql<number>`count(CASE WHEN ${walletTransactions.status} = 'PENDING' THEN 1 END)`,
          completed: sql<number>`count(CASE WHEN ${walletTransactions.status} = 'COMPLETED' THEN 1 END)`,
          failed: sql<number>`count(CASE WHEN ${walletTransactions.status} = 'FAILED' THEN 1 END)`,
          refunded: sql<number>`count(CASE WHEN ${walletTransactions.status} = 'REFUNDED' THEN 1 END)`,
          today: sql<number>`count(CASE WHEN ${walletTransactions.createdAt} >= CURRENT_DATE THEN 1 END)`,
          last_7_days: sql<number>`count(CASE WHEN ${walletTransactions.createdAt} >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)`,
          last_30_days: sql<number>`count(CASE WHEN ${walletTransactions.createdAt} >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)`,
        })
        .from(walletTransactions)
        .where(buildWhereConditions(filters, walletTransactions));

      return {
        entity: "transactions",
        statId: "summary",
        data: summary[0]
          ? {
            total: Number(summary[0].total),
            total_amount: Number(summary[0].total_amount || 0),
            total_fees: Number(summary[0].total_fees || 0),
            avg_amount: Number(summary[0].avg_amount || 0),
            max_amount: Number(summary[0].max_amount || 0),
            min_amount: Number(summary[0].min_amount || 0),
            pending: Number(summary[0].pending),
            completed: Number(summary[0].completed),
            failed: Number(summary[0].failed),
            refunded: Number(summary[0].refunded),
            today: Number(summary[0].today),
            last_7_days: Number(summary[0].last_7_days),
            last_30_days: Number(summary[0].last_30_days),
          }
          : null,
        metadata: { total: Number(summary[0]?.total || 0) },
      };
  }
}

// ============================================================================
// III. DERNIÈRES ACTIVITÉS
// ============================================================================

export async function getRecentActivities(
  limit: number = 10,
): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];

    // Nouveaux utilisateurs
    const newUsers = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    activities.push(
      ...newUsers.map((user) => ({
        id: user.id,
        type: "user" as const,
        action: "user_registered",
        description: `Nouvel utilisateur: ${user.username || user.fullName || "Anonyme"
          }`,
        entity_id: user.id,
        user_id: user.id,
        user_name: user.username ?? undefined,
        timestamp: user.createdAt!,
        icon: "👤",
        color: "text-blue-600",
      })),
    );

    // Nouveaux produits
    const newProducts = await db
      .select({
        id: products.id,
        name: products.name,
        shopId: products.shopId,
        createdAt: products.createdAt,
        shopName: shops.name,
      })
      .from(products)
      .leftJoin(shops, eq(products.shopId, shops.id))
      .orderBy(desc(products.createdAt))
      .limit(limit);

    activities.push(
      ...newProducts.map((product) => ({
        id: product.id,
        type: "product" as const,
        action: "product_created",
        description: `Nouveau produit: ${product.name} dans ${product.shopName || "boutique inconnue"
          }`,
        entity_id: product.id,
        user_id: product.shopId,
        timestamp: product.createdAt!,
        icon: "🛍️",
        color: "text-green-600",
      })),
    );

    // Nouveaux tournois
    const newTournaments = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        organizerId: tournaments.organizerId,
        createdAt: tournaments.createdAt,
        username: users.username,
      })
      .from(tournaments)
      .leftJoin(users, eq(tournaments.organizerId, users.id))
      .orderBy(desc(tournaments.createdAt))
      .limit(limit);

    activities.push(
      ...newTournaments.map((tournament) => ({
        id: tournament.id,
        type: "tournament" as const,
        action: "tournament_created",
        description: `Nouveau tournoi: ${tournament.name} par ${tournament.username || "organisateur inconnu"
          }`,
        entity_id: tournament.id,
        user_id: tournament.organizerId ?? undefined,
        user_name: tournament.username ?? undefined,
        timestamp: tournament.createdAt!,
        icon: "🏆",
        color: "text-yellow-600",
      })),
    );

    // Nouvelles commandes
    const newOrders = await db
      .select({
        id: orders.id,
        price: orders.price,
        buyerId: orders.buyerId,
        createdAt: orders.createdAt,
        username: users.username,
      })
      .from(orders)
      .leftJoin(users, eq(orders.buyerId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    activities.push(
      ...newOrders.map((order) => ({
        id: order.id,
        type: "order" as const,
        action: "order_created",
        description: `Nouvelle commande: ${order.price} GTC par ${order.username || "acheteur inconnu"
          }`,
        entity_id: order.id,
        user_id: order.buyerId,
        user_name: order.username ?? undefined,
        timestamp: order.createdAt!,
        icon: "💰",
        color: "text-purple-600",
      })),
    );

    // Nouvelles transactions
    const fromUsers = alias(users, "fromUsers");
    const toUsers = alias(users, "toUsers");

    const newTransactions = await db
      .select({
        id: walletTransactions.id,
        amount: walletTransactions.amount,
        type: walletTransactions.type,
        fromUserId: walletTransactions.fromUserId,
        toUserId: walletTransactions.toUserId,
        createdAt: walletTransactions.createdAt,
        fromUsername: fromUsers.username,
        toUsername: toUsers.username,
      })
      .from(walletTransactions)
      .leftJoin(fromUsers, eq(walletTransactions.fromUserId, fromUsers.id))
      .leftJoin(toUsers, eq(walletTransactions.toUserId, toUsers.id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);

    activities.push(
      ...newTransactions.map((transaction) => ({
        id: transaction.id as string,
        type: "transaction" as const,
        action: `transaction_${transaction.type?.toLowerCase() || "transfer"}`,
        description: `Transaction ${transaction.type}: ${transaction.amount
          } GTC de ${transaction.fromUsername || "expéditeur inconnu"} à ${transaction.toUsername || "destinataire inconnu"
          }`,
        entity_id: transaction.id as string,
        user_id: (transaction.fromUserId as string) ?? undefined,
        user_name: (transaction.fromUsername as string) ?? undefined,
        timestamp: (transaction.createdAt as Date) || new Date(),
        icon: "💸",
        color: "text-indigo-600",
      })),
    );

    // Trier par date et limiter
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
}

// ============================================================================
// IV. FONCTION PRINCIPALE
// ============================================================================

export async function getStats(
  filters: StatsFilters = {},
): Promise<StatsResponse> {
  try {
    const { entity, statId } = filters;

    // Si pas d'entité, retourner les stats globales
    if (!entity) {
      const globalStats = await getGlobalStats(filters);
      return {
        entity: "global",
        statId: "summary",
        data: globalStats,
        metadata: {
          total: Object.values(globalStats).reduce(
            (sum, val) => sum + (typeof val === "number" ? val : 0),
            0,
          ),
        },
      };
    }

    // Dispatcher par entité
    switch (entity) {
      case "users":
        return await getUserStats(filters);
      case "shops":
        return await getShopStats(filters);
      case "products":
        return await getProductStats(filters);
      case "tournaments":
        return await getTournamentStats(filters);
      case "transactions":
        return await getTransactionStats(filters);
      case "global":
        const globalStats = await getGlobalStats(filters);
        return {
          entity: "global",
          statId: "summary",
          data: globalStats,
          metadata: {
            total: Object.values(globalStats).reduce(
              (sum, val) => sum + (typeof val === "number" ? val : 0),
              0,
            ),
          },
        };
      case "recent":
        const activities = await getRecentActivities(filters.limit || 10);
        return {
          entity: "recent",
          statId: "activities",
          data: activities,
          metadata: { total: activities.length },
        };
      // Ajouter d'autres cas pour les autres entités selon les besoins
      case "teams":
      case "posts":
      case "messages":
      case "groups":
      case "interactions":
      case "notifications":
      case "themes":
      case "announcements":
      case "claims":
      case "searches":
      case "traces":
      case "categories":
      case "games":
      case "vip":
      case "orders":
      case "editions":
      case "matches":
        // Implémenter les fonctions spécifiques pour ces entités si nécessaire
        return {
          entity,
          statId: "not_implemented",
          data: { message: `Stats for ${entity} not yet implemented` },
        };
      default:
        throw new Error(`Entité de statistique non supportée: ${entity}`);
    }
  } catch (error) {
    console.error("Erreur dans getStats:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES SUPPLEMENTAIRES
// ============================================================================

export async function getDashboardStats() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // Format YYYY-MM-DD
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Convertir en string pour les requêtes
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

    // Créer des filtres vides pour utiliser buildWhereConditions
    const emptyFilters: StatsFilters = {};

    const [
      usersStats,
      shopsStats,
      productsStats,
      tournamentsStats,
      transactionsStats,
      ordersStats,
    ] = await Promise.all([
      // Users stats - UTILISEZ buildWhereConditions
      db
        .select({
          total: count(),
          today: sql<number>`count(CASE WHEN DATE(${users.createdAt}) = ${todayStr} THEN 1 END)`,
          this_week: sql<number>`count(CASE WHEN DATE(${users.createdAt}) >= ${startOfWeekStr} THEN 1 END)`,
          this_month: sql<number>`count(CASE WHEN DATE(${users.createdAt}) >= ${startOfMonthStr} THEN 1 END)`,
          active: sql<number>`count(CASE WHEN ${users.isActive} = true THEN 1 END)`,
          vip: sql<number>`count(CASE WHEN ${users.isVip} = true THEN 1 END)`,
          admin: sql<number>`count(CASE WHEN ${users.isAdmin} = true THEN 1 END)`,
          verified: sql<number>`count(CASE WHEN ${users.emailVerified} = true THEN 1 END)`,
          anonymous: sql<number>`count(CASE WHEN ${users.isAnonymous} = true THEN 1 END)`,
        })
        .from(users)
        .where(buildWhereConditions(emptyFilters, users)),

      // Shops stats
      db
        .select({
          total: count(),
          today: sql<number>`count(CASE WHEN DATE(${shops.createdAt}) = ${todayStr} THEN 1 END)`,
          active: sql<number>`count(CASE WHEN ${shops.isActive} = true THEN 1 END)`,
          verified: sql<number>`count(CASE WHEN ${shops.verified} = true THEN 1 END)`,
        })
        .from(shops)
        .where(buildWhereConditions(emptyFilters, shops)),

      // Products stats
      db
        .select({
          total: count(),
          today: sql<number>`count(CASE WHEN DATE(${products.createdAt}) = ${todayStr} THEN 1 END)`,
          active: sql<number>`count(CASE WHEN ${products.isActive} = true THEN 1 END)`,
          sold: sql<number>`count(CASE WHEN ${products.status} = 'VENDU' THEN 1 END)`,
          total_value: sum(products.price),
        })
        .from(products)
        .where(buildWhereConditions(emptyFilters, products)),

      // Tournaments stats
      db
        .select({
          total: count(),
          today: sql<number>`count(CASE WHEN DATE(${tournaments.createdAt}) = ${todayStr} THEN 1 END)`,
          active: sql<number>`count(CASE WHEN ${tournaments.isActive} = true THEN 1 END)`,
          upcoming: sql<number>`count(CASE WHEN ${tournaments.status} = 'UPCOMING' THEN 1 END)`,
          live: sql<number>`count(CASE WHEN ${tournaments.status} = 'LIVE' THEN 1 END)`,
        })
        .from(tournaments)
        .where(buildWhereConditions(emptyFilters, tournaments)),

      // Transactions stats
      db
        .select({
          total_today: sql<number>`count(CASE WHEN DATE(${walletTransactions.createdAt}) = ${todayStr} THEN 1 END)`,
          volume_today: sql<number>`sum(CASE WHEN DATE(${walletTransactions.createdAt}) = ${todayStr} THEN ${walletTransactions.amount} ELSE 0 END)`,
          total_month: sql<number>`count(CASE WHEN DATE(${walletTransactions.createdAt}) >= ${startOfMonthStr} THEN 1 END)`,
          volume_month: sql<number>`sum(CASE WHEN DATE(${walletTransactions.createdAt}) >= ${startOfMonthStr} THEN ${walletTransactions.amount} ELSE 0 END)`,
          pending: sql<number>`count(CASE WHEN ${walletTransactions.status} = 'PENDING' THEN 1 END)`,
        })
        .from(walletTransactions)
        .where(buildWhereConditions(emptyFilters, walletTransactions)),

      // Orders stats
      db
        .select({
          total_today: sql<number>`count(CASE WHEN DATE(${orders.createdAt}) = ${todayStr} THEN 1 END)`,
          volume_today: sql<number>`sum(CASE WHEN DATE(${orders.createdAt}) = ${todayStr} THEN ${orders.price} ELSE 0 END)`,
          pending: sql<number>`count(CASE WHEN ${orders.status} = 'PENDING' THEN 1 END)`,
          completed: sql<number>`count(CASE WHEN ${orders.status} = 'ACCEPTED' THEN 1 END)`,
        })
        .from(orders)
        .where(buildWhereConditions(emptyFilters, orders)),
    ]);

    return {
      users: {
        total: Number(usersStats[0]?.total || 0),
        today: Number(usersStats[0]?.today || 0),
        this_week: Number(usersStats[0]?.this_week || 0),
        this_month: Number(usersStats[0]?.this_month || 0),
        active: Number(usersStats[0]?.active || 0),
        vip: Number(usersStats[0]?.vip || 0),
        admin: Number(usersStats[0]?.admin || 0),
        verified: Number(usersStats[0]?.verified || 0),
        anonymous: Number(usersStats[0]?.anonymous || 0),
      },
      shops: {
        total: Number(shopsStats[0]?.total || 0),
        today: Number(shopsStats[0]?.today || 0),
        active: Number(shopsStats[0]?.active || 0),
        verified: Number(shopsStats[0]?.verified || 0),
      },
      products: {
        total: Number(productsStats[0]?.total || 0),
        today: Number(productsStats[0]?.today || 0),
        active: Number(productsStats[0]?.active || 0),
        sold: Number(productsStats[0]?.sold || 0),
        total_value: Number(productsStats[0]?.total_value || 0),
      },
      tournaments: {
        total: Number(tournamentsStats[0]?.total || 0),
        today: Number(tournamentsStats[0]?.today || 0),
        active: Number(tournamentsStats[0]?.active || 0),
        upcoming: Number(tournamentsStats[0]?.upcoming || 0),
        live: Number(tournamentsStats[0]?.live || 0),
      },
      transactions: {
        total_today: Number(transactionsStats[0]?.total_today || 0),
        volume_today: Number(transactionsStats[0]?.volume_today || 0),
        total_month: Number(transactionsStats[0]?.total_month || 0),
        volume_month: Number(transactionsStats[0]?.volume_month || 0),
        pending: Number(transactionsStats[0]?.pending || 0),
      },
      orders: {
        total_today: Number(ordersStats[0]?.total_today || 0),
        volume_today: Number(ordersStats[0]?.volume_today || 0),
        pending: Number(ordersStats[0]?.pending || 0),
        completed: Number(ordersStats[0]?.completed || 0),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
}

export async function getPerformanceMetrics(
  timeframe: "day" | "week" | "month" = "day",
) {
  try {
    const now = new Date();
    let startDateStr: string;

    switch (timeframe) {
      case "day":
        const dayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        startDateStr = dayStart.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDateStr = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDateStr = monthStart.toISOString().split("T")[0];
        break;
      default:
        startDateStr = now.toISOString().split("T")[0];
    }

    const [
      userGrowth,
      transactionGrowth,
      orderGrowth,
      productGrowth,
      engagementStats,
    ] = await Promise.all([
      // User growth
      db
        .select({
          period: sql<string>`DATE_TRUNC('hour', ${users.createdAt})`,
          count: count(),
        })
        .from(users)
        .where(sql`DATE(${users.createdAt}) >= ${startDateStr}`)
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`)),

      // Transaction growth
      db
        .select({
          period: sql<string>`DATE_TRUNC('hour', ${walletTransactions.createdAt})`,
          count: count(),
          volume: sum(walletTransactions.amount),
        })
        .from(walletTransactions)
        .where(gte(walletTransactions.createdAt, sql`${startDateStr}::date`))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`)),

      // Order growth
      db
        .select({
          period: sql<string>`DATE_TRUNC('hour', ${orders.createdAt})`,
          count: count(),
          volume: sum(orders.price),
        })
        .from(orders)
        .where(gte(orders.createdAt, sql`${startDateStr}::date`))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`)),

      // Product growth
      db
        .select({
          period: sql<string>`DATE_TRUNC('hour', ${products.createdAt})`,
          count: count(),
          value: sum(products.price),
        })
        .from(products)
        .where(gte(products.createdAt, sql`${startDateStr}::date`))
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`)),

      // Engagement stats
      db
        .select({
          total_interactions: count(),
          likes: sql<number>`count(CASE WHEN ${interactions.type} = 'LIKE' THEN 1 END)`,
          follows: sql<number>`count(CASE WHEN ${interactions.type} = 'FOLLOW' THEN 1 END)`,
          posts: count(),
          messages: count(),
        })
        .from(interactions)
        .leftJoin(posts, eq(interactions.entityId, posts.id))
        .leftJoin(messages, eq(interactions.entityId, messages.id))
        .where(gte(interactions.createdAt, sql`${startDateStr}::date`)),
    ]);

    return {
      user_growth: userGrowth.map((g) => ({
        period: g.period,
        count: Number(g.count),
      })),
      transaction_growth: transactionGrowth.map((g) => ({
        period: g.period,
        count: Number(g.count),
        volume: Number(g.volume || 0),
      })),
      order_growth: orderGrowth.map((g) => ({
        period: g.period,
        count: Number(g.count),
        volume: Number(g.volume || 0),
      })),
      product_growth: productGrowth.map((g) => ({
        period: g.period,
        count: Number(g.count),
        value: Number(g.value || 0),
      })),
      engagement: engagementStats[0]
        ? {
          total_interactions: Number(engagementStats[0].total_interactions),
          likes: Number(engagementStats[0].likes),
          follows: Number(engagementStats[0].follows),
          posts: Number(engagementStats[0].posts),
          messages: Number(engagementStats[0].messages),
        }
        : null,
      timeframe,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting performance metrics:", error);
    throw error;
  }
}
