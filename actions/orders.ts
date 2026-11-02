'use server';

import {
  financialAccounts,
  orders,
  products,
  shops,
  userWallets,
  walletTransactions,
} from '@/database/schema';
import { and, count, eq, inArray, sql, SQL } from 'drizzle-orm';
import { OrderFilters, OrderStats, OrderStatus, PaginationResponse } from '@/types/api';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { executeTransaction, getOrCreatePlatformAccount, getAccountBalance } from '@/lib/ledger/ledger-utils';
import { encryptData, decryptData } from '@/lib/encryption';
import {
  type OrderCard, type UserMini, type ShopMini,
  USER_MINI_COLUMNS, SHOP_MINI_COLUMNS, ORDER_CARD_COLUMNS,
  PAGINATION_DEFAULTS,
} from '@/types/view-models';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Creates a new product order and reserves the product.
 */
export async function createProductOrder(
  data: {
    productId: string;
    buyerInstructions?: string;
    // NOTE: totalAmount is intentionally removed — price is always read from the
    // product record in the database to prevent client-side price manipulation.
  },
  options?: { allowDuplicate?: boolean }
): Promise<{ success: boolean; orderId?: string; error?: string; transactionId?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Non authentifié");

    return await db.transaction(async (tx) => {
      // 1. Fetch product and shop info
      const product = await tx.query.products.findFirst({
        where: eq(products.id, data.productId),
        with: { shop: true }
      });

      if (!product) throw new Error("Produit non trouvé");
      if (product.status !== 'NON_VENDU') throw new Error("Produit non disponible");
      if (product.shop?.ownerId === user.id || product.userId === user.id) throw new Error("Vous ne pouvez pas acheter votre propre produit");

      if (!options?.allowDuplicate) {
        const existing = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(
            and(
              eq(orders.productId, product.id),
              eq(orders.buyerId, user.id),
              inArray(orders.status, ['PENDING', 'ACCEPTED_BY_SHOP', 'PROCESSING_BY_ADMIN'])
            )
          )
          .limit(1);
        if (existing.length > 0) {
          throw new Error("Une commande similaire est déjà en cours");
        }
      }

      // 2. Fetch Buyer Wallet
      const buyerWallet = await tx.query.userWallets.findFirst({
        where: eq(userWallets.userId, user.id)
      });

      if (!buyerWallet || !buyerWallet.financialAccountId) {
        throw new Error("Wallet non configuré. Veuillez créer un wallet.");
      }

      // 3. Check Balance
      const balance = await getAccountBalance(buyerWallet.financialAccountId);
      const unitPrice = parseFloat(product.price);
      // SEC-06 FIX: price is always sourced from the DB — never from client input.
      const price = unitPrice;

      if (balance < price) {
        throw new Error(`Solde insuffisant. Requis: ${price} GTC, Disponible: ${balance} GTC`);
      }

      // 4. Debit immediately to Escrow
      const escrowAccount = await getOrCreatePlatformAccount(tx, 'PLATFORM_ESCROW');
      const { transaction } = await executeTransaction({
        tx,
        fromAccountId: buyerWallet.financialAccountId,
        toAccountId: escrowAccount.id,
        amount: price,
        type: 'ORDER_PURCHASE',
        status: 'PENDING',
        description: `Réservation du produit: ${product.name}`,
        userId: user.id,
        walletId: buyerWallet.id,
        metadata: {
          productId: product.id,
          shopId: product.shopId
        }
      });

      // 5. Create Order
      const [newOrder] = await tx.insert(orders).values({
        productId: product.id,
        buyerId: user.id,
        shopId: product.shopId,
        price: price.toFixed(2),
        status: 'PENDING',
        buyerInstructions: data.buyerInstructions,
        walletTransactionId: transaction.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Update tx metadata if needed later
      // The below line was removed because an empty set({}) throws 'No values to set' in Drizzle
      // await tx.update(orders).set({  }).where(eq(orders.id, newOrder.id));

      // 6. Mark product as reserved
      await tx.update(products)
        .set({ status: 'RESERVE' })
        .where(eq(products.id, product.id));

      return { success: true, orderId: newOrder.id, transactionId: transaction.id };
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message || "Erreur lors de la création de la commande" };
  }
}

/**
 * Shop owner accepts the order and provides credentials.
 */
export async function approveOrderShop(orderId: string, credentials: { login: string; pass: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Non authentifié");

    return await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { shop: true, product: true }
      });

      if (!order) throw new Error("Commande non trouvée");
      if (order.shop?.ownerId !== user.id) throw new Error("Action non autorisée");
      if (order.status !== 'PENDING') throw new Error("Statut de commande invalide");

      // SEC-012 FIX: Encrypt gaming account credentials before persisting to DB
      const encryptedPass = credentials.pass ? encryptData(credentials.pass) : "";

      await tx.update(orders).set({
        status: 'ACCEPTED_BY_SHOP',
        sellerCredentials: {
          login: credentials.login,
          encryptedPass: encryptedPass,
        },
        updatedAt: new Date()
      }).where(eq(orders.id, orderId));

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error approving order by shop:", error);
    return { success: false, error: error.message || "Erreur lors de l'approbation" };
  }
}

/**
 * Admin verifies credentials and completes the transfer.
 */
export async function completeOrderAdmin(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    // In a real app, check for isAdmin role
    if (!user || user.role !== 'admin') throw new Error("Accès refusé");

    return await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { shop: true, product: true, buyer: true }
      });

      if (!order) throw new Error("Commande non trouvée");
      if (order.status !== 'ACCEPTED_BY_SHOP') throw new Error("La boutique n'a pas encore validé");

      // 1. Ensure Shop has a financial account
      let shopAccountId = order.shop?.financialAccountId;
      if (!shopAccountId) {
        const [fa] = await tx.insert(financialAccounts).values({
          ownerShopId: order.shopId,
          type: 'SHOP_WALLET',
          currency: 'GTC',
          isActive: true,
          createdAt: new Date()
        }).returning();

        await tx.update(shops).set({ financialAccountId: fa.id }).where(eq(shops.id, order.shopId));
        shopAccountId = fa.id;
      }

      // 2. Original transaction is already in escrow, update its status
      const escrowAccount = await getOrCreatePlatformAccount(tx, 'PLATFORM_ESCROW');
      const amount = parseFloat(order.price);

      if (order.walletTransactionId) {
        await tx.update(walletTransactions)
          .set({ status: 'COMPLETED' })
          .where(eq(walletTransactions.id, order.walletTransactionId));
      }

      // 3. Move funds from Escrow to Shop
      const ownerWallet = await tx.query.userWallets.findFirst({
        where: eq(userWallets.userId, order.shop!.ownerId)
      });

      if (!ownerWallet) throw new Error("Wallet du propriétaire de la boutique introuvable");

      const { transaction: shopTransaction } = await executeTransaction({
        tx,
        fromAccountId: escrowAccount.id,
        toAccountId: shopAccountId!,
        amount: amount,
        type: 'TRANSFER',
        description: `Paiement pour commande #${order.id.slice(0, 8)}`,
        metadata: { orderId: order.id, type: 'SHOP_PAYOUT' },
        walletId: ownerWallet.id
      });

      // 4. Finalize Order and Product
      await tx.update(orders).set({
        status: 'COMPLETED',
        updatedAt: new Date()
      }).where(eq(orders.id, order.id));
      await tx.update(products).set({
        status: 'VENDU',
        deliveredToUserId: order.buyerId,
        shopId: sql`null`,
        userId: order.buyerId,
        deliveredAt: new Date()
      }).where(eq(products.id, order.productId));

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error completing order by admin:", error);
    return { success: false, error: error.message || "Erreur lors de la finalisation admin" };
  }
}

/**
 * Reject or Cancel an order and refund.
 */
export async function rejectOrder(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Non authentifié");

    return await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { buyer: true, shop: true }
      });

      if (!order) throw new Error("Commande non trouvée");

      const isBuyer = order.buyerId === user.id;
      const isShop = order.shop?.ownerId === user.id;
      const isAdmin = user.role === 'admin';

      if (!isBuyer && !isShop && !isAdmin) throw new Error("Non autorisé");
      if (['COMPLETED', 'CANCELLED', 'REJECTED_BY_SHOP', 'REJECTED_BY_ADMIN'].includes(order.status as string)) {
        throw new Error("Commande déjà traitée");
      }

      // Determine new status
      let newStatus: any = 'CANCELLED';
      if (isShop) newStatus = 'REJECTED_BY_SHOP';
      if (isAdmin) newStatus = 'REJECTED_BY_ADMIN';

      // Refund only if funds were already captured
      if (order.walletTransactionId) {
        const escrowAccount = await getOrCreatePlatformAccount(tx, 'PLATFORM_ESCROW');
        const buyerWallet = await tx.query.userWallets.findFirst({
          where: eq(userWallets.userId, order.buyerId)
        });

        if (buyerWallet?.financialAccountId) {
          await executeTransaction({
            fromAccountId: escrowAccount.id,
            toAccountId: buyerWallet.financialAccountId,
            amount: parseFloat(order.price),
            type: 'REFUND',
            description: `Remboursement de la commande #${order.id.slice(0, 8)}: ${reason}`,
            metadata: { orderId: order.id, refundReason: reason },
            walletId: buyerWallet.id,
            userId: order.buyerId,
            tx,
          });
        }
      }

      await tx.update(orders).set({
        status: newStatus,
        rejectionReason: reason,
        updatedAt: new Date()
      }).where(eq(orders.id, order.id));

      await tx.update(products).set({ status: 'NON_VENDU' }).where(eq(products.id, order.productId));

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error rejecting order:", error);
    return { success: false, error: error.message || "Erreur lors de l'annulation" };
  }
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Récupère les commandes d'une boutique
 */
export async function getOrdersByShopId(
  shopId: string,
  filters: { status?: OrderStatus | OrderStatus[]; limit?: number; page?: number } = {}
) {
  try {
    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    const offset = (page - 1) * limit;

    const whereClause = (qb: any, { eq, and, inArray }: any) => {
      const conds: any[] = [eq(orders.shopId, shopId)];

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          conds.push(inArray(orders.status, filters.status));
        } else {
          conds.push(eq(orders.status, filters.status));
        }
      }

      return conds.length > 1 ? and(...conds) : conds[0];
    };

    const [data, totalResult] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              featuredImage: true,
              price: true,
            }
          },
          buyer: { columns: USER_MINI_COLUMNS },
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(orders)
        .where(whereClause(orders, { eq, and, inArray })),
    ]);
    const total = totalResult[0]?.total || 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting shop orders:", error);
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false } };
  }
}

/**
 * Récupère les commandes avec filtres (Admin/General)
 */
export async function getOrders(
  filters: OrderFilters = {}
): Promise<PaginationResponse<OrderCard>> {
  'use cache';
  cacheTag('orders');
  cacheLife('minutes');
  try {
    const results = await db.query.orders.findMany({
      columns: ORDER_CARD_COLUMNS,
      where: (orders, { eq, and, inArray }) => {
        const conds: any[] = [];
        if (filters.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
          conds.push(inArray(orders.status, statuses));
        }
        if (filters.buyerId) conds.push(eq(orders.buyerId, filters.buyerId));
        if (filters.shopId) conds.push(eq(orders.shopId, filters.shopId));
        return and(...conds);
      },
      with: {
        buyer: { columns: USER_MINI_COLUMNS },
        shop: { columns: SHOP_MINI_COLUMNS },
        product: {
          columns: {
            id: true,
            name: true,
            featuredImage: true,
            price: true,
          }
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit: filters.limit || PAGINATION_DEFAULTS.FEED,
      offset: filters.page ? (filters.page - 1) * (filters.limit || PAGINATION_DEFAULTS.FEED) : 0,
    });

    const totalResult = await db.select({ count: count() }).from(orders);
    const total = totalResult[0]?.count || 0;
    const limit = filters.limit || PAGINATION_DEFAULTS.FEED;
    const totalPages = Math.ceil(total / limit);

    return {
      data: results as OrderCard[],
      pagination: {
        page: filters.page || 1,
        limit,
        total,
        totalPages,
        hasNext: (filters.page || 1) < totalPages,
        hasPrev: (filters.page || 1) > 1
      }
    };
  } catch (error) {
    console.error("Error getting orders:", error);
    throw new Error("Failed to fetch orders");
  }
}

// orderStats
export async function getOrderStats() {
  try {
    // Build a single aggregate query that returns counts for each status
    const rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(orders.status);

    // Map raw rows to zero-filled counts
    const counts: OrderStats = {
      total: 0,
      completed: 0,
      cancelled: 0,
      rejectedByShop: 0,
      rejectedByAdmin: 0,
    };

    for (const r of rows) {
      counts.total += r.count;
      switch (r.status as OrderStatus) {
        case 'COMPLETED':
          counts.completed = r.count;
          break;
        case 'CANCELLED':
          counts.cancelled = r.count;
          break;
        case 'REJECTED_BY_SHOP':
          counts.rejectedByShop = r.count;
          break;
        case 'REJECTED_BY_ADMIN':
          counts.rejectedByAdmin = r.count;
          break;
      }
    }

    return counts;
  } catch (error) {
    console.error('Error getting order stats:', error);
    throw new Error('Failed to fetch order stats');
  }
}

// shop orders stats
export async function getShopOrderStats(shopId: string) {
  try {
    // Build a single aggregate query that returns counts for each status
    const rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(eq(orders.shopId, shopId))
      .groupBy(orders.status);

    // Map raw rows to zero-filled counts
    const counts: OrderStats = {
      total: 0,
      completed: 0,
      cancelled: 0,
      rejectedByShop: 0,
      rejectedByAdmin: 0,
    };
    for (const r of rows) {
      counts.total += r.count;
      switch (r.status) {
        case 'COMPLETED':
          counts.completed = r.count;
          break;
        case 'CANCELLED':
          counts.cancelled = r.count;
          break;
        case 'REJECTED_BY_SHOP':
          counts.rejectedByShop = r.count;
          break;
        case 'REJECTED_BY_ADMIN':
          counts.rejectedByAdmin = r.count;
          break;
      }
    }
    return counts;
  } catch (error) {
    console.error('Error getting shop order stats:', error);
    throw new Error('Failed to fetch shop order stats');
  }
}

// user orders stats
export async function getUserOrderStats(userId: string) {
  try {
    // Build a single aggregate query that returns counts for each status
    const rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(eq(orders.buyerId, userId))
      .groupBy(orders.status);
       // Map raw rows to zero-filled counts
    const counts: OrderStats = {
      total: 0,
      completed: 0,
      cancelled: 0,
      rejectedByShop: 0,
      rejectedByAdmin: 0,
    };
    for (const r of rows) {
      counts.total += r.count;
      switch (r.status) {
        case 'COMPLETED':
          counts.completed = r.count;
          break;
        case 'CANCELLED':
          counts.cancelled = r.count;
          break;
        case 'REJECTED_BY_SHOP':
          counts.rejectedByShop = r.count;
          break;
        case 'REJECTED_BY_ADMIN':
          counts.rejectedByAdmin = r.count;
          break;
      }
    }
    return counts;
  } catch (error) {
    console.error('Error getting user order stats:', error);
    throw new Error('Failed to fetch user order stats');
  }
}

/**
 * Récupère les identifiants d'un compte gaming acheté.
 * SEC-012 FIX: Strictly accessible ONLY when status is COMPLETED (escrow finalized).
 * Automatically decrypts credentials.
 */
export async function getOrderCredentialsForBuyer(orderId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) {
    throw new Error("Commande non trouvée");
  }
  if (order.buyerId !== user.id) {
    throw new Error("Accès refusé");
  }

  // Seul le statut COMPLETED permet à l'acheteur d'accéder aux identifiants
  if (order.status !== "COMPLETED") {
    throw new Error("Les identifiants ne sont disponibles qu'après la validation finale de la commande par l'administrateur.");
  }

  const credentials = order.sellerCredentials as any;
  if (!credentials) return null;

  let password = credentials?.pass || credentials?.password || null;
  if (credentials?.encryptedPass) {
    password = decryptData(credentials.encryptedPass);
  }

  return {
    login: credentials?.login || credentials?.accountLogin || null,
    password,
  };
}

/**
 * Récupère les identifiants pour vérification par un administrateur.
 * SEC-012 FIX: Admin only
 */
export async function getOrderCredentialsForAdmin(orderId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && !(user as any).isAdmin)) {
    throw new Error("Accès réservé aux administrateurs");
  }
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) {
    throw new Error("Commande non trouvée");
  }

  const credentials = order.sellerCredentials as any;
  if (!credentials) return null;

  let password = credentials?.pass || credentials?.password || null;
  if (credentials?.encryptedPass) {
    password = decryptData(credentials.encryptedPass);
  }

  return {
    login: credentials?.login || credentials?.accountLogin || null,
    password,
  };
}

export async function getOrdersByBuyerId(
  buyerId: string,
  filters: { status?: OrderStatus | OrderStatus[]; limit?: number; page?: number } = {}
) {
  try {
    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    const offset = (page - 1) * limit;

    const whereClause = (qb: any, { eq, and, inArray }: any) => {
      const conds: any[] = [eq(orders.buyerId, buyerId)];

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          conds.push(inArray(orders.status, filters.status));
        } else {
          conds.push(eq(orders.status, filters.status));
        }
      }

      return conds.length > 1 ? and(...conds) : conds[0];
    };

    const [data, totalResult] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        with: {
          shop: { columns: SHOP_MINI_COLUMNS },
          product: {
            columns: {
              id: true,
              name: true,
              featuredImage: true,
              price: true,
            }
          }
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(orders)
        .where(whereClause(orders, { eq, and, inArray })),
    ]);
    const total = totalResult[0]?.total || 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error getting orders by buyer id:', error);
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false } };
  }
}

/**
 * Récupère une commande par son ID
 */
export async function getOrderById(orderId: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        shop: { columns: SHOP_MINI_COLUMNS },
        buyer: { columns: USER_MINI_COLUMNS },
        product: {
          columns: {
            id: true,
            name: true,
            featuredImage: true,
            price: true,
            description: true,
            images: true,
            game: true,
            platform: true,
            status: true,
          }
        },
      },
    });

    return order;
  } catch (error) {
    console.error('Error getting order by id:', error);
    throw new Error('Failed to fetch order');
  }
}




