'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { 
  vipSubscriptions, 
  type VipSubscription, 
  type NewVipSubscription,
  users,
  walletTransactions,
  appSettings
} from '@/database/schema';
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
  exists 
} from 'drizzle-orm';
import { 
  type VipSubscriptionFilters, 
  type ListQuery, 
  type PaginationResponse, 
  type QueryOptions 
} from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un abonnement VIP par son ID
 */
export async function getVipSubscriptionById(
  id: string,
  options?: { populate?: string[] }
): Promise<VipSubscription | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.vipSubscriptions.findFirst({
        where: (vipSubscriptions, { eq }) => eq(vipSubscriptions.id, id),
        with: {
          user: options.populate.includes('user') ? true : undefined,
          transaction: options.populate.includes('transaction') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(vipSubscriptions)
      .where(eq(vipSubscriptions.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting VIP subscription by ID:', error);
    throw new Error('Failed to fetch VIP subscription');
  }
}

/**
 * Récupère l'abonnement VIP actif d'un utilisateur
 */
export async function getActiveVipSubscriptionByUserId(userId: string): Promise<VipSubscription | null> {
  try {
    const result = await db
      .select()
      .from(vipSubscriptions)
      .where(
        and(
          eq(vipSubscriptions.userId, userId),
          eq(vipSubscriptions.status, 'ACTIVE'),
          gt(vipSubscriptions.endDate, new Date())
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting active VIP subscription by user ID:', error);
    throw new Error('Failed to fetch active VIP subscription');
  }
}

/**
 * Liste les abonnements VIP avec pagination, filtres et options
 */
export async function getVipSubscriptions(
  query: ListQuery<VipSubscriptionFilters> = {}
): Promise<PaginationResponse<VipSubscription>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildVipSubscriptionWhereConditions(filters, options);

    const subscriptionsQuery = db
      .select()
      .from(vipSubscriptions)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof VipSubscription;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      subscriptionsQuery.orderBy(sortOrder(vipSubscriptions[sortField]));
    } else {
      subscriptionsQuery.orderBy(desc(vipSubscriptions.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(vipSubscriptions)
      .where(whereConditions);

    const [subscriptionsData, totalResult] = await Promise.all([
      subscriptionsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: subscriptionsData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  } catch (error) {
    console.error('Error getting VIP subscriptions:', error);
    throw new Error('Failed to fetch VIP subscriptions');
  }
}

/**
 * Récupère les statistiques des abonnements VIP
 */
export async function getVipSubscriptionStats(filters?: VipSubscriptionFilters) {
  try {
    const whereConditions = buildVipSubscriptionWhereConditions(filters || {});

    const [
      totalResult,
      activeResult,
      expiredResult,
      cancelledResult,
      monthlyResult,
      yearlyResult,
      lifetimeResult
    ] = await Promise.all([
      db.select({ count: count() }).from(vipSubscriptions).where(whereConditions),
      db.select({ count: count() }).from(vipSubscriptions).where(and(whereConditions, eq(vipSubscriptions.status, 'ACTIVE'))),
      db.select({ count: count() }).from(vipSubscriptions).where(and(whereConditions, eq(vipSubscriptions.status, 'EXPIRED'))),
      db.select({ count: count() }).from(vipSubscriptions).where(and(whereConditions, eq(vipSubscriptions.status, 'CANCELLED'))),
      db.select({ count: count() }).from(vipSubscriptions).where(and(whereConditions, eq(vipSubscriptions.planType, 'MONTHLY'))),
      db.select({ count: count() }).from(vipSubscriptions).where(and(whereConditions, eq(vipSubscriptions.planType, 'YEARLY'))),
      db.select({ count: count() }).from(vipSubscriptions).where(and(whereConditions, eq(vipSubscriptions.planType, 'LIFETIME')))
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      expired: expiredResult[0]?.count ?? 0,
      cancelled: cancelledResult[0]?.count ?? 0,
      monthly: monthlyResult[0]?.count ?? 0,
      yearly: yearlyResult[0]?.count ?? 0,
      lifetime: lifetimeResult[0]?.count ?? 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting VIP subscription stats:', error);
    throw new Error('Failed to fetch VIP subscription statistics');
  }
}

/**
 * Vérifie si un utilisateur a un abonnement VIP actif
 */
export async function checkUserVipStatus(userId: string): Promise<boolean> {
  try {
    const subscription = await getActiveVipSubscriptionByUserId(userId);
    return subscription !== null;
  } catch (error) {
    console.error('Error checking user VIP status:', error);
    return false;
  }
}

/**
 * Récupère les bénéfices VIP actifs d'un utilisateur
 */
export async function getUserVipBenefits(userId: string): Promise<Record<string, any> | null> {
  try {
    const subscription = await getActiveVipSubscriptionByUserId(userId);
    if (!subscription) {
      return null;
    }

    const settings = await db.select().from(appSettings).limit(1);
    const appSetting = settings[0];

    if (!appSetting) {
      return subscription.activeBenefits || {};
    }

    // Combine les bénéfices de l'abonnement avec les paramètres globaux
    const benefits = {
      ...(subscription.activeBenefits ? subscription.activeBenefits : {}),
      maxProducts: appSetting.maxProductsVip,
      maxShops: appSetting.maxShopsVip,
      maxTournaments: appSetting.maxTournamentsVip,
      maxStoriesPerDay: appSetting.maxStoriesPerDayVip,
      freeThemesLimit: appSetting.freeThemesLimitVip,
      maxThemeCreations: appSetting.maxThemeCreationsVip,
      canCreateThemes: appSetting.canVipCreateThemes,
      canSellThemes: appSetting.canVipSellThemes,
      transactionFeePercentage: appSetting.transactionFeePercentage,
      purchaseFeePercentage: appSetting.purchaseFeePercentage,
      prioritySupport: true,
      badgeDisplay: true
    };

    return benefits;
  } catch (error) {
    console.error('Error getting user VIP benefits:', error);
    return null;
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouvel abonnement VIP
 */
export async function createVipSubscription(
  subscriptionData: NewVipSubscription
): Promise<VipSubscription> {
  try {
    // SEC-09 FIX: Only admins can directly create VIP subscriptions.
    // User-initiated VIP purchases go through the wallet/payment flow instead.
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    if (!isAdmin) throw new Error('Accès réservé aux administrateurs — utilisez le flux d\'achat VIP');

    // Validation des données requises
    if (!subscriptionData.userId || !subscriptionData.endDate) {
      throw new Error('userId and endDate are required');
    }

    // Vérifier si l'utilisateur existe
    const user = await db.select().from(users).where(eq(users.id, subscriptionData.userId)).limit(1);
    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Vérifier s'il existe déjà un abonnement actif
    const existingActive = await getActiveVipSubscriptionByUserId(subscriptionData.userId);
    if (existingActive) {
      throw new Error('User already has an active VIP subscription');
    }

    // Déterminer le prix si non fourni
    let pricePaid = subscriptionData.pricePaid;
    if (!pricePaid) {
      const settings = await db.select().from(appSettings).limit(1);
      const appSetting = settings[0];
      
      if (appSetting) {
        switch (subscriptionData.planType) {
          case 'YEARLY':
            pricePaid = appSetting.vipYearlyPrice;
            break;
          case 'LIFETIME':
            pricePaid = '0'; // Prix personnalisé pour la vie
            break;
          case 'MONTHLY':
          default:
            pricePaid = appSetting.vipMonthlyPrice;
        }
      }
    }

    const result = await db
      .insert(vipSubscriptions)
      .values({
        ...subscriptionData,
        pricePaid,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Mettre à jour le statut VIP de l'utilisateur
    await db
      .update(users)
      .set({ isVip: true, updatedAt: new Date() })
      .where(eq(users.id, subscriptionData.userId));

    return result[0];
  } catch (error) {
    console.error('Error creating VIP subscription:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create VIP subscription');
  }
}

/**
 * Met à jour un abonnement VIP
 */
export async function updateVipSubscription(
  id: string,
  subscriptionData: Partial<NewVipSubscription>
): Promise<VipSubscription> {
  try {
    // SEC-09 FIX: Admin-only
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    if (!isAdmin) throw new Error('Accès réservé aux administrateurs');

    // Vérifier que l'abonnement existe
    const existingSubscription = await getVipSubscriptionById(id);
    if (!existingSubscription) {
      throw new Error('VIP subscription not found');
    }

    const result = await db
      .update(vipSubscriptions)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(vipSubscriptions.id, id))
      .returning();

    // Si le statut change à ACTIVE ou CANCELLED, mettre à jour le statut VIP de l'utilisateur
    if (subscriptionData.status) {
      const userId = existingSubscription.userId;
      const isVip = subscriptionData.status === 'ACTIVE';
      
      await db
        .update(users)
        .set({ isVip, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    return result[0];
  } catch (error) {
    console.error('Error updating VIP subscription:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update VIP subscription');
  }
}

/**
 * Annule un abonnement VIP
 * SEC-09 FIX: Owner (self-cancellation) or admin
 */
export async function cancelVipSubscription(id: string): Promise<VipSubscription> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    const subscription = await getVipSubscriptionById(id);
    if (!subscription) {
      throw new Error('VIP subscription not found');
    }

    // Only admin or the subscription owner can cancel
    if (!isAdmin && subscription.userId !== currentUser.id) {
      throw new Error('Accès refusé');
    }

    if (subscription.status === 'CANCELLED') {
      throw new Error('VIP subscription is already cancelled');
    }

    const result = await db
      .update(vipSubscriptions)
      .set({
        status: 'CANCELLED',
        autoRenew: false,
        updatedAt: new Date(),
      })
      .where(eq(vipSubscriptions.id, id))
      .returning();

    // Mettre à jour le statut VIP de l'utilisateur
    await db
      .update(users)
      .set({ isVip: false, updatedAt: new Date() })
      .where(eq(users.id, subscription.userId));

    return result[0];
  } catch (error) {
    console.error('Error cancelling VIP subscription:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to cancel VIP subscription');
  }
}

/**
 * Renouvelle un abonnement VIP
 */
export async function renewVipSubscription(
  id: string,
  newEndDate: Date,
  transactionId?: string
): Promise<VipSubscription> {
  try {
    const subscription = await getVipSubscriptionById(id);
    if (!subscription) {
      throw new Error('VIP subscription not found');
    }

    if (subscription.status === 'CANCELLED') {
      throw new Error('Cannot renew a cancelled VIP subscription');
    }

    const result = await db
      .update(vipSubscriptions)
      .set({
        endDate: newEndDate,
        status: 'ACTIVE',
        transactionId: transactionId || subscription.transactionId,
        updatedAt: new Date(),
      })
      .where(eq(vipSubscriptions.id, id))
      .returning();

    // S'assurer que l'utilisateur est marqué comme VIP
    await db
      .update(users)
      .set({ isVip: true, updatedAt: new Date() })
      .where(eq(users.id, subscription.userId));

    return result[0];
  } catch (error) {
    console.error('Error renewing VIP subscription:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to renew VIP subscription');
  }
}

/**
 * Supprime un abonnement VIP (soft delete)
 */
export async function deleteVipSubscription(id: string): Promise<VipSubscription> {
  try {
    const subscription = await getVipSubscriptionById(id);
    if (!subscription) {
      throw new Error('VIP subscription not found');
    }

    const result = await db
      .update(vipSubscriptions)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(vipSubscriptions.id, id))
      .returning();

    // Mettre à jour le statut VIP de l'utilisateur
    const activeSubscriptions = await db
      .select()
      .from(vipSubscriptions)
      .where(
        and(
          eq(vipSubscriptions.userId, subscription.userId),
          eq(vipSubscriptions.status, 'ACTIVE'),
          eq(vipSubscriptions.isDeleted, false)
        )
      )
      .limit(1);

    if (activeSubscriptions.length === 0) {
      await db
        .update(users)
        .set({ isVip: false, updatedAt: new Date() })
        .where(eq(users.id, subscription.userId));
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting VIP subscription:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete VIP subscription');
  }
}

/**
 * Restaure un abonnement VIP supprimé
 */
export async function restoreVipSubscription(id: string): Promise<VipSubscription> {
  try {
    const result = await db
      .update(vipSubscriptions)
      .set({
        isDeleted: false,
        updatedAt: new Date(),
      })
      .where(eq(vipSubscriptions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('VIP subscription not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error restoring VIP subscription:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore VIP subscription');
  }
}

/**
 * Traite l'expiration des abonnements VIP
 */
export async function processExpiredVipSubscriptions(): Promise<number> {
  try {
    const now = new Date();

    // Récupérer les abonnements expirés
    const expiredSubscriptions = await db
      .select()
      .from(vipSubscriptions)
      .where(
        and(
          eq(vipSubscriptions.status, 'ACTIVE'),
          lt(vipSubscriptions.endDate, now),
          eq(vipSubscriptions.isDeleted, false)
        )
      );

    if (expiredSubscriptions.length === 0) {
      return 0;
    }

    // Marquer les abonnements comme expirés
    const expiredIds = expiredSubscriptions.map(sub => sub.id);
    
    await db
      .update(vipSubscriptions)
      .set({
        status: 'EXPIRED',
        updatedAt: new Date(),
      })
      .where(inArray(vipSubscriptions.id, expiredIds));

    // Mettre à jour le statut VIP des utilisateurs
    for (const subscription of expiredSubscriptions) {
      const activeSubscriptions = await db
        .select()
        .from(vipSubscriptions)
        .where(
          and(
            eq(vipSubscriptions.userId, subscription.userId),
            eq(vipSubscriptions.status, 'ACTIVE'),
            eq(vipSubscriptions.isDeleted, false)
          )
        )
        .limit(1);

      if (activeSubscriptions.length === 0) {
        await db
          .update(users)
          .set({ isVip: false, updatedAt: new Date() })
          .where(eq(users.id, subscription.userId));
      }
    }

    return expiredSubscriptions.length;
  } catch (error) {
    console.error('Error processing expired VIP subscriptions:', error);
    throw new Error('Failed to process expired VIP subscriptions');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes VIP
 */
function buildVipSubscriptionWhereConditions(
  filters: VipSubscriptionFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(vipSubscriptions.isDeleted, false));
  }

  // Filtres spécifiques
  if (filters.userId) {
    conditions.push(eq(vipSubscriptions.userId, filters.userId));
  }

  if (filters.planTypes && filters.planTypes.length > 0) {
    conditions.push(inArray(vipSubscriptions.planType, filters.planTypes));
  }

  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(vipSubscriptions.status, filters.statuses));
  }

  if (typeof filters.autoRenew === 'boolean') {
    conditions.push(eq(vipSubscriptions.autoRenew, filters.autoRenew));
  }

  if (filters.currency) {
    conditions.push(eq(vipSubscriptions.currency, filters.currency));
  }

  // Filtres de prix
  if (filters.pricePaidMin !== undefined) {
    conditions.push(gte(vipSubscriptions.pricePaid, String(filters.pricePaidMin)));
  }

  if (filters.pricePaidMax !== undefined) {
    conditions.push(lte(vipSubscriptions.pricePaid, String(filters.pricePaidMax)));
  }

  // Filtres de date
  if (filters.startDateFrom) {
    conditions.push(gte(vipSubscriptions.startDate, new Date(filters.startDateFrom)));
  }

  if (filters.startDateTo) {
    conditions.push(lte(vipSubscriptions.startDate, new Date(filters.startDateTo)));
  }

  if (filters.endDateFrom) {
    conditions.push(gte(vipSubscriptions.endDate, new Date(filters.endDateFrom)));
  }

  if (filters.endDateTo) {
    conditions.push(lte(vipSubscriptions.endDate, new Date(filters.endDateTo)));
  }

  if (filters.startDateFrom) {
    conditions.push(gte(vipSubscriptions.createdAt, new Date(filters.startDateFrom)));
  }

  if (filters.startDateTo) {
    conditions.push(lte(vipSubscriptions.createdAt, new Date(filters.startDateTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
