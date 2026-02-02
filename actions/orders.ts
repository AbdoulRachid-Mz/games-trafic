'use server';

import { orders, type Order, type Neworder, products, shops, users } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, between, desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { type OrderFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une commande par son ID avec relations optionnelles
 */
export async function getOrderById(
  id: string,
  options?: { populate?: string[] }
): Promise<Order | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, id),
        with: {
          product: options.populate.includes('product') ? true : undefined,
          buyer: options.populate.includes('buyer') ? true : undefined,
          shop: options.populate.includes('shop') ? true : undefined,
          orderedProduct: options.populate.includes('orderedProduct') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw new Error('Failed to fetch order');
  }
}

/**
 * Liste les commandes avec pagination, filtres et options
 */
export async function getOrders(
  query: ListQuery<OrderFilters> = {}
): Promise<PaginationResponse<Order>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;
    const whereConditions = buildOrderWhereConditions(filters, options);
    const ordersQuery = db
      .select()
      .from(orders)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Order;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      ordersQuery.orderBy(sortOrder(orders[sortField]));
    } else {
      ordersQuery.orderBy(desc(orders.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(orders)
      .where(whereConditions);

    const [ordersData, totalResult] = await Promise.all([
      ordersQuery,
      countQuery
    ]);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);
    return {
      data: ordersData,
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
    console.error('Error getting orders:', error);
    throw new Error('Failed to fetch orders');
  }
}

/**
 * Récupère les commandes d'une boutique
 */
export async function getOrdersByShopId(
  shopId: string,
  query: ListQuery<OrderFilters> = {}
): Promise<PaginationResponse<Order>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const shopOrders = await getOrders({
      pagination,
      filters: { ...filters, shopId },
      options
    });
    return shopOrders;
  } catch (error) {
    console.error('Error getting orders by shop ID:', error);
    throw new Error('Failed to fetch shop orders');
  }
}

/**
 * Récupère les commandes par produit
 */
export async function getOrdersByProductId(
  productId: string,
  query: ListQuery<OrderFilters> = {}
): Promise<PaginationResponse<Order>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const productOrders = await getOrders({
      pagination,
      filters: { ...filters, productId },
      options
    });
    return productOrders;
  } catch (error) {
    console.error('Error getting orders by product ID:', error);
    throw new Error('Failed to fetch product orders');
  }
}

/**
 * Récupère les commandes par acheteur
 */
export async function getOrdersByBuyerId(
  buyerId: string,
  query: ListQuery<OrderFilters> = {}
): Promise<PaginationResponse<Order>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const buyerOrders = await getOrders({
      pagination,
      filters: { ...filters, buyerId },
      options
    });
    return buyerOrders;
  } catch (error) {
    console.error('Error getting orders by buyer ID:', error);
    throw new Error('Failed to fetch buyer orders');
  }
}

/**
 * Récupère les commandes par statut
 */
export async function getOrdersByStatus(
  statuses: ('PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED')[],
  query: ListQuery<OrderFilters> = {}
): Promise<PaginationResponse<Order>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const statusOrders = await getOrders({
      pagination,
      filters: { ...filters, statuses },
      options
    });
    return statusOrders;
  } catch (error) {
    console.error('Error getting orders by status:', error);
    throw new Error('Failed to fetch orders by status');
  }
}

/**
 * Récupère les statistiques des commandes
 */
export async function getOrderStats(filters?: OrderFilters) {
  try {
    const whereConditions = buildOrderWhereConditions(filters || {});
    const [
      totalResult,
      pendingResult,
      acceptedResult,
      rejectedResult,
      cancelledResult,
      avgPriceResult,
      totalRevenueResult
    ] = await Promise.all([
      db.select({ count: count() }).from(orders).where(whereConditions),
      db.select({ count: count() }).from(orders).where(and(whereConditions, eq(orders.status, 'PENDING'))),
      db.select({ count: count() }).from(orders).where(and(whereConditions, eq(orders.status, 'ACCEPTED'))),
      db.select({ count: count() }).from(orders).where(and(whereConditions, eq(orders.status, 'REJECTED'))),
      db.select({ count: count() }).from(orders).where(and(whereConditions, eq(orders.status, 'CANCELLED'))),
      db.select({ avgPrice: sql<number>`avg(${orders.price})`.mapWith(Number) })
        .from(orders)
        .where(whereConditions),
      db.select({ totalRevenue: sql<number>`sum(${orders.price})`.mapWith(Number) })
        .from(orders)
        .where(and(whereConditions, eq(orders.status, 'ACCEPTED')))
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      pending: pendingResult[0]?.count ?? 0,
      accepted: acceptedResult[0]?.count ?? 0,
      rejected: rejectedResult[0]?.count ?? 0,
      cancelled: cancelledResult[0]?.count ?? 0,
      averagePrice: avgPriceResult[0]?.avgPrice ?? 0,
      totalRevenue: totalRevenueResult[0]?.totalRevenue ?? 0
    };
    return stats;
  } catch (error) {
    console.error('Error getting order stats:', error);
    throw new Error('Failed to fetch order statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle commande
 */
export async function createOrder(orderData: Neworder): Promise<Order> {
  try {
    // Validation des données requises
    if (!orderData.productId || !orderData.buyerId || !orderData.shopId || !orderData.price) {
      throw new Error('productId, buyerId, shopId and price are required');
    }

    // Vérification que le produit existe
    const productExists = await db
      .select()
      .from(products)
      .where(eq(products.id, orderData.productId))
      .limit(1);
    if (productExists.length === 0) {
      throw new Error('Product not found');
    }

    // Vérification que l'acheteur existe
    const buyerExists = await db
      .select()
      .from(users)
      .where(eq(users.id, orderData.buyerId))
      .limit(1);
    if (buyerExists.length === 0) {
      throw new Error('Buyer not found');
    }

    // Vérification que la boutique existe
    const shopExists = await db
      .select()
      .from(shops)
      .where(eq(shops.id, orderData.shopId))
      .limit(1);
    if (shopExists.length === 0) {
      throw new Error('Shop not found');
    }

    const result = await db
      .insert(orders)
      .values({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating order:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create order');
  }
}

/**
 * Met à jour une commande
 */
export async function updateOrder(
  id: string,
  orderData: Partial<Neworder>
): Promise<Order> {
  try {
    // Vérification que la commande existe
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const result = await db
      .update(orders)
      .set({
        ...orderData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating order:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update order');
  }
}

/**
 * Supprime une commande (soft delete)
 */
export async function deleteOrder(id: string): Promise<Order> {
  try {
    const order = await getOrderById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    const result = await db
      .update(orders)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete order');
  }
}

/**
 * Restaure une commande supprimée
 */
export async function restoreOrder(id: string): Promise<Order> {
  try {
    const result = await db
      .update(orders)
      .set({
        isDeleted: false,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error('Order not found');
    }
    return result[0];
  } catch (error) {
    console.error('Error restoring order:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore order');
  }
}

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(
  id: string,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
  rejectionReason?: string
): Promise<Order> {
  try {
    const updateData: Partial<Neworder> = {
      status,
      updatedAt: new Date(),
    };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    const result = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error('Order not found');
    }
    return result[0];
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update order status');
  }
}

/**
 * Accepte une commande
 */
export async function acceptOrder(id: string): Promise<Order> {
  return updateOrderStatus(id, 'ACCEPTED');
}

/**
 * Rejette une commande
 */
export async function rejectOrder(id: string, rejectionReason: string): Promise<Order> {
  return updateOrderStatus(id, 'REJECTED', rejectionReason);
}

/**
 * Annule une commande
 */
export async function cancelOrder(id: string): Promise<Order> {
  return updateOrderStatus(id, 'CANCELLED');
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes orders
 */
function buildOrderWhereConditions(
  filters: OrderFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(orders.isDeleted, false));
  }

  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(orders.id, filters.id));
  }
  if (filters.productId) {
    conditions.push(eq(orders.productId, filters.productId));
  }
  if (filters.buyerId) {
    conditions.push(eq(orders.buyerId, filters.buyerId));
  }
  if (filters.shopId) {
    conditions.push(eq(orders.shopId, filters.shopId));
  }
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(orders.status, filters.statuses));
  }
  if (filters.orderType) {
    conditions.push(eq(orders.orderType, filters.orderType));
  }
  if (filters.orderedProductId) {
    conditions.push(eq(orders.orderedProductId, filters.orderedProductId));
  }

  // Filtres de prix
  if (filters.priceMin !== undefined) {
    conditions.push(gte(orders.price, sql`${filters.priceMin}`));
  }
  if (filters.priceMax !== undefined) {
    conditions.push(lte(orders.price, sql`${filters.priceMax}`));
  }

  // Filtres de date d'expiration
  if (filters.expiresFrom) {
    conditions.push(gte(orders.expiresAt, new Date(filters.expiresFrom)));
  }
  if (filters.expiresTo) {
    conditions.push(lte(orders.expiresAt, new Date(filters.expiresTo)));
  }

  // Filtres de date de création
  if (filters.createdFrom) {
    conditions.push(gte(orders.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(orders.createdAt, new Date(filters.createdTo)));
  }

  // Filtres de recherche
  if (filters.search) {
    conditions.push(
      or(
        ilike(orders.message, `%${filters.search}%`),
        like(orders.rejectionReason, `%${filters.search}%`)
      )
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
