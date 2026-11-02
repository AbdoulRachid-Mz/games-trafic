// lib/actions/users.ts
"use server";

import {
  users,
  type User,
  type NewUser,
  shops,
  tournaments,
  interactions,
  posts,
  messages,
  userTraces,
  searchHistory,
  claims,
  userWallets,
  vipSubscriptions,
  products,
  notifications,
  announcements,
  walletTransactions,
  session,
  account,
  verification,
  themes,
  themePurchases,
  groups,
  groupMembers,
  announcementReads,
  financialAccounts,
  passkey,
} from "@/database/schema";
import { getAccountBalance } from "@/lib/ledger/ledger-utils";
import { WalletUtils } from "@/lib/wallet/wallet-utils";
import {
  eq,
  and,
  or,
  like,
  ilike,
  inArray,
  between,
  desc,
  asc,
  sql,
  count,
  gt,
  lt,
  gte,
  lte,
  isNull,
  isNotNull,
  exists,
} from "drizzle-orm";
import {
  type UserFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";

import { db } from "@/lib/db";
// NOTE: AuthService (lib/auth/service.ts) was removed — canonical helpers are in lib/auth/session.ts
import { PAGINATION_DEFAULTS, USER_MINI_COLUMNS } from "@/types/view-models";
import { getCurrentUser, getServerSession } from "@/lib/auth/session";
// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

export interface UserWithAllRelations extends User {
  wallet?: typeof userWallets.$inferSelect;
  vipSubscription?: typeof vipSubscriptions.$inferSelect;
  shops?: (typeof shops.$inferSelect)[];
  products?: (typeof products.$inferSelect)[];
  tournaments?: (typeof tournaments.$inferSelect)[];
  posts?: (typeof posts.$inferSelect)[];
  notifications?: {
    unread: (typeof notifications.$inferSelect)[];
    read: (typeof notifications.$inferSelect)[];
    all: (typeof notifications.$inferSelect)[];
  };
  announcements?: {
    unread: (typeof announcements.$inferSelect)[];
    read: (typeof announcements.$inferSelect)[];
    all: (typeof announcements.$inferSelect)[];
  };
  transactions?: (typeof walletTransactions.$inferSelect)[];
  interactions?: (typeof interactions.$inferSelect)[];
  searches?: {
    products: (typeof searchHistory.$inferSelect)[];
    shops: (typeof searchHistory.$inferSelect)[];
    tournaments: (typeof searchHistory.$inferSelect)[];
    users: (typeof searchHistory.$inferSelect)[];
    all: (typeof searchHistory.$inferSelect)[];
  };
  sessions?: (typeof session.$inferSelect)[];
  accounts?: (typeof account.$inferSelect)[];
  verifications?: (typeof verification.$inferSelect)[];
  themes?: {
    created: (typeof themes.$inferSelect)[];
    purchased: (typeof themePurchases.$inferSelect)[];
  };
  groups?: {
    created: (typeof groups.$inferSelect)[];
    memberships: (typeof groupMembers.$inferSelect)[];
  };
  traces?: (typeof userTraces.$inferSelect)[];
  claims?: (typeof claims.$inferSelect)[];
  // Status flags
  hasWallet?: boolean;
  hasShops?: boolean;
  hasProducts?: boolean;
  hasTournaments?: boolean;
  hasActiveSubscription?: boolean;
  hasPasskey?: boolean;
  ledgerBalance?: string;
}

export type ProfileMode = "minimal" | "partial" | "full";

export interface ProfileOptions {
  mode?: ProfileMode; // Mode de chargement (minimal par défaut)
  includeFullData?: boolean; // Remplacé par mode: "full"
  includeRelations?: string[]; // Liste spécifique de relations à inclure (mode "partial")
  limitPerRelation?: number; // Limite par relation pour l'optimisation
}

/**
 * Récupère le profil complet d'un utilisateur
 * Si userId = "me", récupère l'utilisateur courant
 */
export async function getProfile(
  userIdOrMe: string,
  options: ProfileOptions = {},
): Promise<UserWithAllRelations | null> {
  try {
    let userId = userIdOrMe;

    // Si c'est "me", on récupère l'utilisateur courant depuis la session
    if (userIdOrMe === "me") {
      const session = await getServerSession();
      if (!session?.user?.id) return null;
      userId = session.user.id;
    }

    // Récupération de l'utilisateur de base
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult.length) return null;

    const user = userResult[0];

    // Si c'est l'utilisateur lui-même, on peut adapter le mode
    const isSelf = userIdOrMe === "me" || userId === userIdOrMe;

    // Détermination du mode final
    const mode = options.mode || (options.includeFullData ? "full" : "minimal");

    // Si minimal est demandé, on ne charge AUCUNE relation lourde
    if (mode === "minimal") {
      // Pour minimal, on ne récupère que les infos de base + existence de wallet/vip
      const [wallet, vip, pk] = await Promise.all([
        db
          .select({ id: userWallets.id, financialAccountId: userWallets.financialAccountId, cardNumberHash: userWallets.cardNumberHash, isActive: userWallets.isActive, isLocked: userWallets.isLocked })
          .from(userWallets)
          .where(eq(userWallets.userId, userId))
          .limit(1)
          .then(async (res) => {
            const w = res[0];
            if (w?.financialAccountId) {
              const balance = await getAccountBalance(w.financialAccountId);
              const isDefaultPin = await WalletUtils.isDefaultPin((w as any).pinHash || "");
              return { ...w, balance: balance.toString(), isDefaultPin };
            }
            return w;
          }),
        db
          .select({ id: vipSubscriptions.id })
          .from(vipSubscriptions)
          .where(
            and(
              eq(vipSubscriptions.userId, userId),
              eq(vipSubscriptions.status, "ACTIVE"),
            ),
          )
          .limit(1)
          .then((res) => res[0]),
        db
          .select({ id: passkey.id })
          .from(passkey)
          .where(eq(passkey.userId, userId))
          .limit(1)
          .then((res) => res[0]),
      ]);

      let ledgerBalance = "0";
      if (wallet?.financialAccountId) {
        const balance = await getAccountBalance(wallet.financialAccountId);
        ledgerBalance = balance.toString();
      }

      return {
        ...user,
        hasWallet: !!wallet,
        hasActiveSubscription: !!vip,
        hasPasskey: !!pk,
        wallet: wallet as any,
        vipSubscription: vip as any,
        ledgerBalance,
      } as UserWithAllRelations;
    }

    // Liste des relations à inclure pour PARTIAL ou FULL
    const relationsToInclude =
      mode === "full"
        ? [
          "wallet",
          "vipSubscription",
          "shops",
          "products",
          "tournaments",
          "posts",
          "notifications",
          "announcements",
          "transactions",
          "interactions",
          "searches",
          "sessions",
          "accounts",
          "verifications",
          "themes",
          "groups",
          "traces",
          "claims",
        ]
        : options.includeRelations || [
          "wallet",
          "vipSubscription",
          "shops",
          "tournaments",
          "posts",
        ];

    const limit =
      options.limitPerRelation ?? (mode === "full" ? undefined : 10);

    // Récupération parallèle des données
    const dataPromises: Record<string, Promise<any>> = {};

    // Wallet
    if (relationsToInclude.includes("wallet")) {
      dataPromises.wallet = db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, userId))
        .limit(1)
        .then(async (res) => {
          const w = res[0];
          if (w?.financialAccountId) {
            const balance = await getAccountBalance(w.financialAccountId);
            const isDefaultPin = await WalletUtils.isDefaultPin((w as any).pinHash || "");
            return { ...w, balance: balance.toString(), isDefaultPin };
          }
          return w;
        });
    }

    // Abonnement VIP
    if (relationsToInclude.includes("vipSubscription")) {
      dataPromises.vipSubscription = db
        .select()
        .from(vipSubscriptions)
        .where(
          and(
            eq(vipSubscriptions.userId, userId),
            eq(vipSubscriptions.status, "ACTIVE"),
          ),
        )
        .limit(1)
        .then((res) => res[0]);
    }

    // Boutiques
    if (relationsToInclude.includes("shops")) {
      dataPromises.shops = db
        .select()
        .from(shops)
        .where(and(eq(shops.ownerId, userId), eq(shops.isDeleted, false)))
        .limit(limit ?? 10)
        .orderBy(desc(shops.createdAt));
    }

    // Produits
    if (relationsToInclude.includes("products")) {
      dataPromises.products = db
        .select()
        .from(products)
        .where(and(eq(products.userId, userId), eq(products.isDeleted, false)))
        .limit(limit ?? 10)
        .orderBy(desc(products.createdAt));
    }

    // Tournois
    if (relationsToInclude.includes("tournaments")) {
      dataPromises.tournaments = db
        .select()
        .from(tournaments)
        .where(
          and(
            eq(tournaments.organizerId, userId),
            eq(tournaments.isDeleted, false),
          ),
        )
        .limit(limit ?? 10)
        .orderBy(desc(tournaments.createdAt));
    }

    // Posts
    if (relationsToInclude.includes("posts")) {
      dataPromises.posts = db
        .select()
        .from(posts)
        .where(and(eq(posts.authorId, userId), eq(posts.isDeleted, false)))
        .limit(limit ?? 10)
        .orderBy(desc(posts.createdAt));
    }

    // Notifications (unread/read séparés)
    if (relationsToInclude.includes("notifications")) {
      dataPromises.notifications = Promise.all([
        // Notifications non lues
        db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.read, false),
              eq(notifications.isDeleted, false),
            ),
          )
          .orderBy(desc(notifications.createdAt))
          .limit(isSelf ? 50 : 10),
        // Notifications lues (plus récentes)
        db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.read, true),
              eq(notifications.isDeleted, false),
            ),
          )
          .orderBy(desc(notifications.createdAt))
          .limit(isSelf ? 20 : 5),
      ]).then(([unread, read]) => ({
        unread,
        read,
        all: [...unread, ...read],
      }));
    }

    // Annonces (unread/read séparés)
    if (relationsToInclude.includes("announcements")) {
      dataPromises.announcements = Promise.all([
        // Toutes les annonces actives
        db
          .select()
          .from(announcements)
          .where(
            and(
              eq(announcements.isActive, true),
              eq(announcements.isDeleted, false),
            ),
          )
          .orderBy(desc(announcements.createdAt))
          .limit(20),
        // Annonces lues par l'utilisateur
        db
          .select({ announcementId: announcementReads.announcementId })
          .from(announcementReads)
          .where(eq(announcementReads.userId, userId)),
      ]).then(([allAnnouncements, readAnnouncements]) => {
        const readIds = new Set(readAnnouncements.map((r) => r.announcementId));
        const unread = allAnnouncements.filter((a) => !readIds.has(a.id));
        const read = allAnnouncements.filter((a) => readIds.has(a.id));

        return {
          unread,
          read,
          all: allAnnouncements,
        };
      });
    }

    // Transactions
    if (relationsToInclude.includes("transactions") && isSelf) {
      dataPromises.transactions = db
        .select()
        .from(walletTransactions)
        .where(
          or(
            eq(walletTransactions.fromUserId, userId),
            eq(walletTransactions.toUserId, userId),
          ),
        )
        .orderBy(desc(walletTransactions.createdAt))
        .limit(limit || 20);
    }

    // Interactions
    if (relationsToInclude.includes("interactions") && isSelf) {
      dataPromises.interactions = db
        .select()
        .from(interactions)
        .where(
          and(
            eq(interactions.userId, userId),
            eq(interactions.isDeleted, false),
          ),
        )
        .orderBy(desc(interactions.createdAt))
        .limit(limit || 20);
    }

    // Historique de recherche (par entité)
    if (relationsToInclude.includes("searches") && isSelf) {
      dataPromises.searches = Promise.all([
        // Recherches de produits
        db
          .select()
          .from(searchHistory)
          .where(
            and(
              eq(searchHistory.userId, userId),
              ilike(searchHistory.query, "%product:%"),
            ),
          )
          .orderBy(desc(searchHistory.createdAt))
          .limit(10),
        // Recherches de boutiques
        db
          .select()
          .from(searchHistory)
          .where(
            and(
              eq(searchHistory.userId, userId),
              ilike(searchHistory.query, "%shop:%"),
            ),
          )
          .orderBy(desc(searchHistory.createdAt))
          .limit(10),
        // Recherches de tournois
        db
          .select()
          .from(searchHistory)
          .where(
            and(
              eq(searchHistory.userId, userId),
              ilike(searchHistory.query, "%tournament:%"),
            ),
          )
          .orderBy(desc(searchHistory.createdAt))
          .limit(10),
        // Recherches d'utilisateurs
        db
          .select()
          .from(searchHistory)
          .where(
            and(
              eq(searchHistory.userId, userId),
              ilike(searchHistory.query, "%user:%"),
            ),
          )
          .orderBy(desc(searchHistory.createdAt))
          .limit(10),
        // Toutes les recherches
        db
          .select()
          .from(searchHistory)
          .where(eq(searchHistory.userId, userId))
          .orderBy(desc(searchHistory.createdAt))
          .limit(30),
      ]).then(([products, shops, tournaments, users, all]) => ({
        products,
        shops,
        tournaments,
        users,
        all,
      }));
    }

    // Sessions (seulement pour soi-même)
    if (relationsToInclude.includes("sessions") && isSelf) {
      dataPromises.sessions = db
        .select()
        .from(session)
        .where(eq(session.userId, userId))
        .orderBy(desc(session.createdAt))
        .limit(10);
    }

    // Comptes liés (seulement pour soi-même)
    if (relationsToInclude.includes("accounts") && isSelf) {
      dataPromises.accounts = db
        .select()
        .from(account)
        .where(eq(account.userId, userId))
        .orderBy(desc(account.createdAt));
    }

    // Vérifications (seulement pour soi-même)
    if (relationsToInclude.includes("verifications") && isSelf) {
      dataPromises.verifications = db
        .select()
        .from(verification)
        .where(eq(verification.identifier, userId))
        .orderBy(desc(verification.createdAt));
    }

    // Thèmes
    if (relationsToInclude.includes("themes")) {
      dataPromises.themes = Promise.all([
        // Thèmes créés
        db
          .select()
          .from(themes)
          .where(and(eq(themes.creatorId, userId), eq(themes.isDeleted, false)))
          .orderBy(desc(themes.createdAt))
          .limit(limit || 10),
        // Thèmes achetés
        db
          .select()
          .from(themePurchases)
          .where(eq(themePurchases.userId, userId))
          .orderBy(desc(themePurchases.createdAt))
          .limit(limit || 10),
      ]).then(([created, purchased]) => ({
        created,
        purchased,
      }));
    }

    // Groupes
    if (relationsToInclude.includes("groups")) {
      dataPromises.groups = Promise.all([
        // Groupes créés
        db
          .select()
          .from(groups)
          .where(eq(groups.creatorId, userId))
          .orderBy(desc(groups.createdAt))
          .limit(limit || 10),
        // Adhésions aux groupes
        db
          .select()
          .from(groupMembers)
          .where(eq(groupMembers.userId, userId))
          .orderBy(desc(groupMembers.joinedAt))
          .limit(limit || 10),
      ]).then(([created, memberships]) => ({
        created,
        memberships,
      }));
    }

    // Traces (seulement pour soi-même)
    if (relationsToInclude.includes("traces") && isSelf) {
      dataPromises.traces = db
        .select()
        .from(userTraces)
        .where(eq(userTraces.userId, userId))
        .orderBy(desc(userTraces.createdAt))
        .limit(limit || 50);
    }

    // Réclamations (seulement pour soi-même)
    if (relationsToInclude.includes("claims") && isSelf) {
      dataPromises.claims = db
        .select()
        .from(claims)
        .where(and(eq(claims.userId, userId), eq(claims.isDeleted, false)))
        .orderBy(desc(claims.createdAt))
        .limit(limit || 20);
    }

    // Exécution parallèle de toutes les promesses
    const results = await Promise.all(
      Object.values(dataPromises).map((p) =>
        p.catch((e) => {
          console.error("Error loading relation:", e);
          return null;
        }),
      ),
    );

    // Construction de l'objet final
    const relationData: any = {};
    Object.keys(dataPromises).forEach((key, index) => {
      relationData[key] = results[index];
    });

    // Calculer les flags de statut
    const [pk] = await db
      .select({ id: passkey.id })
      .from(passkey)
      .where(eq(passkey.userId, userId))
      .limit(1);

    const userFlags = {
      hasWallet: !!relationData.wallet,
      hasActiveSubscription: !!relationData.vipSubscription,
      hasPasskey: !!pk,
      hasShops: false,
      hasProducts: false,
      hasTournaments: false,
    };

    userFlags.hasShops = (relationData.shops?.length || 0) > 0;
    userFlags.hasProducts = (relationData.products?.length || 0) > 0;
    userFlags.hasTournaments = (relationData.tournaments?.length || 0) > 0;

    // Si on a besoin de comptes réels (seulement si non inclus mais flags requis)
    // Mais ici on favorise la performance: si on n'a pas chargé les relations,
    // on ne fait pas de count() à moins que ce soit explicitement demandé.

    // Si on a le wallet, on calcule le solde via ledger
    let ledgerBalance = "0";
    if (relationData.wallet?.financialAccountId) {
      const balance = await getAccountBalance(relationData.wallet.financialAccountId);
      ledgerBalance = balance.toString();
    }

    return {
      ...user,
      ...relationData,
      ...userFlags,
      ledgerBalance,
    } as UserWithAllRelations;
  } catch (error) {
    console.error("Error getting profile:", error);
    return null;
  }
}

/**
 * Raccourci pour récupérer le profil de l'utilisateur courant
 */
export async function getMyProfile(
  options?: Omit<ProfileOptions, "includeFullData">,
) {
  return getProfile("me", {
    ...options,
    mode: options?.mode || "full",
  });
}

export async function getUserProfile(userId: string, options?: ProfileOptions) {
  return getProfile(userId, options);
}

/**
 * Récupère les contacts récents de l'utilisateur courant
 */
export async function getRecentRecipients(limitSize = 10) {
  try {
    const sessionUser = await getServerSession();
    if (!sessionUser?.user?.id) return [];

    const transactions = await db
      .select({
        toUserId: walletTransactions.toUserId,
      })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.fromUserId, sessionUser.user.id),
          eq(walletTransactions.type, "TRANSFER"),
          isNotNull(walletTransactions.toUserId)
        )
      )
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limitSize * 5); // Fetch more to get unique

    if (!transactions.length) return [];

    // Extract unique user ids
    const uniqueUserIds = Array.from(
      new Set(transactions.map((t) => t.toUserId).filter(Boolean) as string[])
    ).slice(0, limitSize);

    if (!uniqueUserIds.length) return [];

    const recentUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, uniqueUserIds));

    // Get their wallets
    const wallets = await Promise.all(
      recentUsers.map((u) =>
        db
          .select()
          .from(userWallets)
          .where(eq(userWallets.userId, u.id))
          .limit(1)
          .then((res) => res[0])
      )
    );

    return recentUsers.map((u, idx) => {
      const wallet = wallets[idx];
      return {
        id: u.id,
        walletId: wallet?.id || "",
        user: {
          id: u.id,
          name: (u as any).fullName || (u as any).username || "Utilisateur",
          email: u.email,
          avatar: u.profileImage,
          walletNumber: wallet?.cardNumberHash || wallet?.id || "",
        },
        wallet: {
          isActive: !!wallet?.isActive,
          isLocked: !!wallet?.isLocked,
        },
      };
    }).filter(r => r.walletId !== "");
  } catch (error) {
    console.error("Error fetching recent recipients:", error);
    return [];
  }
}

/**
 * Met à jour getCompleteUserData pour utiliser getProfile
 */
export async function getCompleteUserData(userId: string) {
  return getProfile(userId, { includeFullData: true });
}

/**
 * Récupère un utilisateur par son ID avec relations optionnelles
 */
export async function getUserById(
  id: string,
  options?: { populate?: string[] },
): Promise<User | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      // Utilisation des relational queries pour les relations
      const query = db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
        with: {
          wallet: options.populate.includes("wallet") ? true : undefined,
          vipSubscription: options.populate.includes("vipSubscription")
            ? true
            : undefined,
          shops: options.populate.includes("shops") ? true : undefined,
          posts: options.populate.includes("posts") ? true : undefined,
        },
      });

      return (await query) ?? null;
    }

    // Requête simple sans relations
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw new Error("Failed to fetch user");
  }
}

/**
 * Récupère un utilisateur par son auth_uid
 */
export async function getUserByAuthUid(authUid: string): Promise<User | null> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.authUid, authUid))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by auth UID:", error);
    throw new Error("Failed to fetch user");
  }
}

/**
 * Récupère un utilisateur par son email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error("Failed to fetch user");
  }
}

/**
 * Récupère un utilisateur par son username
 */
export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by username:", error);
    throw new Error("Failed to fetch user");
  }
}

/**
 * Liste les utilisateurs avec pagination, filtres et options
 */
export async function getUsers(
  query: ListQuery<UserFilters> = {},
): Promise<PaginationResponse<User>> {
  try {
    const {
      pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED },
      filters = {},
      options = {},
    } = query;

    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildUserWhereConditions(filters, options);

    // Requête pour les données
    const usersQuery = db
      .select()
      .from(users)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof User;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      usersQuery.orderBy(sortOrder(users[sortField]));
    } else {
      usersQuery.orderBy(desc(users.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(users)
      .where(whereConditions);

    const [usersData, totalResult] = await Promise.all([
      usersQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: usersData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Failed to fetch users");
  }
}

/**
 * Récupère les statistiques des utilisateurs
 */
export async function getUserStats(filters?: UserFilters) {
  try {
    const whereConditions = buildUserWhereConditions(filters || {});

    // Multiple conditional counts require separate queries in Drizzle
    const [
      totalResult,
      verifiedResult,
      vipResult,
      adminResult,
      activeResult,
      deletedResult,
      avgResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users).where(whereConditions),
      db
        .select({ count: count() })
        .from(users)
        .where(and(whereConditions, eq(users.emailVerified, true))),
      db
        .select({ count: count() })
        .from(users)
        .where(and(whereConditions, eq(users.isVip, true))),
      db
        .select({ count: count() })
        .from(users)
        .where(and(whereConditions, eq(users.isAdmin, true))),
      db
        .select({ count: count() })
        .from(users)
        .where(and(whereConditions, eq(users.isActive, true))),
      db
        .select({ count: count() })
        .from(users)
        .where(and(whereConditions, eq(users.isDeleted, true))),
      db
        .select({
          averageShops:
            sql<number>`(select count(*)::float from ${shops} where ${shops.ownerId} = ${users.id})`.mapWith(
              Number,
            ),
          averageTournaments:
            sql<number>`(select count(*)::float from ${tournaments} where ${tournaments.organizerId} = ${users.id})`.mapWith(
              Number,
            ),
          averageFollowers:
            sql<number>`(select count(*)::float from ${interactions} where ${interactions.entityType} = 'USER' and ${interactions.type} = 'FOLLOW' and ${interactions.entityId} = ${users.id})`.mapWith(
              Number,
            ),
        })
        .from(users)
        .where(whereConditions),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      verified: verifiedResult[0]?.count ?? 0,
      vip: vipResult[0]?.count ?? 0,
      admin: adminResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
      averageShops: avgResult[0]?.averageShops ?? 0,
      averageTournaments: avgResult[0]?.averageTournaments ?? 0,
      averageFollowers: avgResult[0]?.averageFollowers ?? 0,
    };

    return stats;
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw new Error("Failed to fetch user statistics");
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(userData: NewUser): Promise<User> {
  try {
    // Validation des données requises
    if (!userData.authUid || !userData.email) {
      throw new Error("authUid and email are required");
    }

    // Vérification des doublons
    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.authUid, userData.authUid),
          eq(users.email, userData.email),
        ),
      )
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("User with this authUid or email already exists");
    }

    const result = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create user");
  }
}

/**
 * Recherche des utilisateurs par email ou username
 */
export async function searchUsersAction(query: string): Promise<User[]> {
  try {
    if (!query || query.length < 2) return [];

    const results = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isDeleted, false),
          or(
            ilike(users.email, `%${query}%`),
            ilike(users.username, `%${query}%`),
            ilike(users.fullName, `%${query}%`)
          )
        )
      )
      .limit(10);

    return results;
  } catch (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users");
  }
}

/**
 * Met à jour un utilisateur
 */
export async function updateUser(
  id: string,
  userData: Partial<NewUser>,
): Promise<User> {
  try {
    // 🛡️ SEC-002: Contrôle de session et d'autorisation
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Non authentifié");
    }

    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;
    if (currentUser.id !== id && !isAdmin) {
      throw new Error("Action non autorisée: vous ne pouvez modifier que votre propre compte");
    }

    // Filtrer les champs privilégiés pour les non-admins (Anti Privilege-Escalation)
    const safeData: Record<string, any> = { ...userData };
    if (!isAdmin) {
      delete safeData.role;
      delete safeData.isAdmin;
      delete safeData.isVip;
      delete safeData.banned;
      delete safeData.banReason;
      delete safeData.banExpires;
      delete safeData.accountTypes;
      delete safeData.level;
      delete safeData.isDeleted;
    }

    // Vérification que l'utilisateur existe
    const existingUser = await getUserById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Vérification des doublons d'email si l'email est modifié
    if (safeData.email && safeData.email !== existingUser.email) {
      const userWithEmail = await getUserByEmail(safeData.email);
      if (userWithEmail) {
        throw new Error("Email already exists");
      }
    }

    // Vérification des doublons d'username si l'username est modifié
    if (safeData.username && safeData.username !== existingUser.username) {
      const userWithUsername = await getUserByUsername(safeData.username);
      if (userWithUsername) {
        throw new Error("Username already exists");
      }
    }

    const result = await db
      .update(users)
      .set({
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update user");
  }
}

/**
 * Supprime un utilisateur (soft delete)
 */
export async function deleteUser(id: string): Promise<User> {
  try {
    // 🛡️ SEC-002: Contrôle de session et d'autorisation
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");

    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;
    if (currentUser.id !== id && !isAdmin) {
      throw new Error("Action non autorisée: vous ne pouvez supprimer que votre propre compte");
    }

    const result = await db
      .update(users)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("User not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete user");
  }
}

/**
 * Restaure un utilisateur supprimé
 */
export async function restoreUser(id: string): Promise<User> {
  try {
    // 🛡️ SEC-002: Seul un administrateur peut restaurer un compte
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");

    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;
    if (!isAdmin) {
      throw new Error("Seul un administrateur peut restaurer un compte supprimé");
    }

    const result = await db
      .update(users)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("User not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error restoring user:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore user");
  }
}

/**
 * Met à jour le dernier login d'un utilisateur
 */
export async function updateUserLastLogin(id: string): Promise<User> {
  try {
    const result = await db
      .update(users)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("User not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error updating user last login:", error);
    throw new Error("Failed to update last login");
  }
}

/**
 * Met à jour les statistiques d'un utilisateur
 */
/**
 * Met à jour les statistiques d'un utilisateur
 * Les stats sont calculées depuis les tables dédiées, pas depuis les champs users
 */
export async function updateUserStats(id: string): Promise<User> {
  try {
    // Calcul des statistiques depuis les tables sources
    const [
      shopsCountResult,
      tournamentsCountResult,
      followersCountResult,
      followingCountResult,
      postsCountResult,
    ] = await Promise.all([
      // Nombre de shops
      db
        .select({ count: count() })
        .from(shops)
        .where(and(eq(shops.ownerId, id), eq(shops.isDeleted, false))),

      // Nombre de tournois organisés
      db
        .select({ count: count() })
        .from(tournaments)
        .where(
          and(
            eq(tournaments.organizerId, id),
            eq(tournaments.isDeleted, false),
          ),
        ),

      // Nombre de followers (interactions de type FOLLOW sur l'utilisateur)
      db
        .select({ count: count() })
        .from(interactions)
        .where(
          and(
            eq(interactions.entityId, id),
            eq(interactions.entityType, "USER"),
            eq(interactions.type, "FOLLOW"),
            eq(interactions.isDeleted, false),
          ),
        ),

      // Nombre de personnes suivies (interactions de type FOLLOW faites par l'utilisateur)
      db
        .select({ count: count() })
        .from(interactions)
        .where(
          and(
            eq(interactions.userId, id),
            eq(interactions.type, "FOLLOW"),
            eq(interactions.isDeleted, false),
          ),
        ),

      // Nombre de posts
      db
        .select({ count: count() })
        .from(posts)
        .where(and(eq(posts.authorId, id), eq(posts.isDeleted, false))),
    ]);

    const stats = {
      shopsCount: shopsCountResult[0]?.count ?? 0,
      tournamentsCount: tournamentsCountResult[0]?.count ?? 0,
      followersCount: followersCountResult[0]?.count ?? 0,
      followingCount: followingCountResult[0]?.count ?? 0,
      postsCount: postsCountResult[0]?.count ?? 0,
    };

    // Mise à jour de l'utilisateur avec les stats calculées
    const result = await db
      .update(users)
      .set({
        ...stats,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("User not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw new Error("Failed to update user statistics");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes users
 */
function buildUserWhereConditions(
  filters: UserFilters,
  options: QueryOptions = {},
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(users.isDeleted, false));
  }

  if (!options.includeInactive) {
    conditions.push(eq(users.isActive, true));
  }

  // Filtres spécifiques
  if (filters.username) {
    conditions.push(ilike(users.username, `%${filters.username}%`));
  }

  if (filters.email) {
    conditions.push(ilike(users.email, `%${filters.email}%`));
  }

  if (filters.fullName) {
    conditions.push(ilike(users.fullName, `%${filters.fullName}%`));
  }

  if (filters.phoneNumber) {
    conditions.push(ilike(users.phoneNumber, `%${filters.phoneNumber}%`));
  }

  if (filters.country) {
    conditions.push(ilike(users.country, `%${filters.country}%`));
  }

  if (filters.accountTypes && filters.accountTypes.length > 0) {
    conditions.push(sql`${users.accountTypes} && ${filters.accountTypes}`);
  }

  if (filters.level && filters.level.length > 0) {
    conditions.push(inArray(users.level, filters.level));
  }

  if (typeof filters.emailVerified === "boolean") {
    conditions.push(eq(users.emailVerified, filters.emailVerified));
  }

  if (typeof filters.isVip === "boolean") {
    conditions.push(eq(users.isVip, filters.isVip));
  }

  if (typeof filters.isAdmin === "boolean") {
    conditions.push(eq(users.isAdmin, filters.isAdmin));
  }

  // Filtres sur les counts – calculés à la volée depuis les tables dédiées
  if (
    filters.shopsCreatedCountMin !== undefined ||
    filters.shopsCreatedCountMax !== undefined
  ) {
    const shopsCountSubquery = db
      .select({
        ownerId: shops.ownerId,
        count: count().as("shopsCount"),
      })
      .from(shops)
      .where(eq(shops.isDeleted, false))
      .groupBy(shops.ownerId)
      .as("shopsCountSubquery");

    conditions.push(
      exists(
        db
          .select()
          .from(shopsCountSubquery)
          .where(
            and(
              eq(shopsCountSubquery.ownerId, users.id),
              filters.shopsCreatedCountMin !== undefined
                ? gte(shopsCountSubquery.count, filters.shopsCreatedCountMin)
                : undefined,
              filters.shopsCreatedCountMax !== undefined
                ? lte(shopsCountSubquery.count, filters.shopsCreatedCountMax)
                : undefined,
            ),
          ),
      ),
    );
  }

  if (
    filters.tournamentsCreatedCountMin !== undefined ||
    filters.tournamentsCreatedCountMax !== undefined
  ) {
    const tournamentsCountSubquery = db
      .select({
        organizerId: tournaments.organizerId,
        count: count().as("tournamentsCount"),
      })
      .from(tournaments)
      .where(eq(tournaments.isDeleted, false))
      .groupBy(tournaments.organizerId)
      .as("tournamentsCountSubquery");

    conditions.push(
      exists(
        db
          .select()
          .from(tournamentsCountSubquery)
          .where(
            and(
              eq(tournamentsCountSubquery.organizerId, users.id),
              filters.tournamentsCreatedCountMin !== undefined
                ? gte(
                  tournamentsCountSubquery.count,
                  filters.tournamentsCreatedCountMin,
                )
                : undefined,
              filters.tournamentsCreatedCountMax !== undefined
                ? lte(
                  tournamentsCountSubquery.count,
                  filters.tournamentsCreatedCountMax,
                )
                : undefined,
            ),
          ),
      ),
    );
  }

  // if (filters.followersCountMin !== undefined || filters.followersCountMax !== undefined) {
  //   const followersCountSubquery = db
  //     .select({
  //       entityId: interactions.entityId,
  //       count: count().as('followersCount')
  //     })
  //     .from(interactions)
  //     .where(
  //       and(
  //         eq(interactions.entityType, 'USER'),
  //         eq(interactions.type, 'FOLLOW'),
  //         eq(interactions.isDeleted, false)
  //       )
  //     )
  //     .groupBy(interactions.entityId)
  //     .as('followersCountSubquery');

  //   conditions.push(
  //     exists(
  //       db
  //         .select()
  //         .from(followersCountSubquery)
  //         .where(
  //           and(
  //             eq(followersCountSubquery.entityId, users.id),
  //             filters.followersCountMin !== undefined
  //               ? gte(followersCountSubquery.count, filters.followersCountMin)
  //               : undefined,
  //             filters.followersCountMax !== undefined
  //               ? lte(followersCountSubquery.count, filters.followersCountMax)
  //               : undefined
  //           )
  //         )
  //     )
  //   );
  // }

  // Filtres de date
  if (filters.lastLoginFrom) {
    conditions.push(gte(users.lastLogin, new Date(filters.lastLoginFrom)));
  }
  if (filters.lastLoginTo) {
    conditions.push(lte(users.lastLogin, new Date(filters.lastLoginTo)));
  }

  if (filters.createdFrom) {
    conditions.push(gte(users.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(users.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

// anonymus
// Fonction de migration des données anonymes
export async function migrateAnonymousUserData(
  anonymousUserId: string,
  newUserId: string,
) {
  try {
    console.log(
      `Migration des données de l'utilisateur anonyme ${anonymousUserId} vers ${newUserId}`,
    );

    // Migration des interactions (likes, follows, bookmarks)
    await migrateInteractions(anonymousUserId, newUserId);

    // Migration des posts
    await migratePosts(anonymousUserId, newUserId);

    // Migration des messages
    await migrateMessages(anonymousUserId, newUserId);

    // Migration des traces utilisateur
    await migrateUserTraces(anonymousUserId, newUserId);

    // Migration de l'historique de recherche
    await migrateSearchHistory(anonymousUserId, newUserId);

    // Migration des réclamations
    await migrateClaims(anonymousUserId, newUserId);

    console.log(`Migration terminée pour l'utilisateur ${newUserId}`);
  } catch (error) {
    console.error("Erreur lors de la migration des données anonymes:", error);
    throw error;
  }
}

// Fonctions de migration spécifiques
export async function migrateInteractions(
  anonymousUserId: string,
  newUserId: string,
) {
  await db
    .update(interactions)
    .set({ userId: newUserId })
    .where(eq(interactions.userId, anonymousUserId));
}

export async function migratePosts(anonymousUserId: string, newUserId: string) {
  await db
    .update(posts)
    .set({ authorId: newUserId })
    .where(eq(posts.authorId, anonymousUserId));
}

export async function migrateMessages(
  anonymousUserId: string,
  newUserId: string,
) {
  // Messages envoyés
  await db
    .update(messages)
    .set({ senderId: newUserId })
    .where(eq(messages.senderId, anonymousUserId));

  // Messages reçus (si l'utilisateur anonyme était le destinataire)
  await db
    .update(messages)
    .set({ recipientId: newUserId })
    .where(eq(messages.recipientId, anonymousUserId));
}

export async function migrateUserTraces(
  anonymousUserId: string,
  newUserId: string,
) {
  await db
    .update(userTraces)
    .set({ userId: newUserId })
    .where(eq(userTraces.userId, anonymousUserId));
}

export async function migrateSearchHistory(
  anonymousUserId: string,
  newUserId: string,
) {
  await db
    .update(searchHistory)
    .set({ userId: newUserId })
    .where(eq(searchHistory.userId, anonymousUserId));
}

export async function migrateClaims(
  anonymousUserId: string,
  newUserId: string,
) {
  await db
    .update(claims)
    .set({ userId: newUserId })
    .where(eq(claims.userId, anonymousUserId));
}

