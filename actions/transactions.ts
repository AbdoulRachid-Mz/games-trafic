"use server";

import {
  walletTransactions,
  userWallets,
  vipSubscriptions,
  appSettings,
  type WalletTransaction,
  type NewWalletTransaction,
  type AppSettings,
  users,
  themePurchases,
  products,
  shops,
  tournamentEditions,
  tournamentMembers,
  editionRegistrations,
  registrationPayments,
  requests,
} from "@/database/schema";
import {
  eq,
  and,
  or,
  between,
  desc,
  asc,
  sql,
  count,
  gt,
  lt,
  gte,
  lte,
  inArray,
  isNull,
  isNotNull,
} from "drizzle-orm";
import {
  type WalletTransactionFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";
import { db } from "@/lib/db";
import { getAppSettings } from "./app-settings";
import { getUserWalletById, updateWalletBalance } from "./wallets";
import { createUserTrace } from "./user-traces";
import { getCurrentUser } from "@/lib/auth/session";
import { createOrder } from "./orders";
import { createNotification } from "./notifications";

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une transaction par son ID avec relations optionnelles
 */
export async function getTransactionById(
  id: string,
  options?: { populate?: string[] }
): Promise<WalletTransaction | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.walletTransactions.findFirst({
        where: (walletTransactions, { eq }) => eq(walletTransactions.id, id),
        with: {
          wallet: options.populate.includes("wallet") ? true : undefined,
          fromUser: options.populate.includes("fromUser") ? true : undefined,
          toUser: options.populate.includes("toUser") ? true : undefined,
          vipSubscription: options.populate.includes("vipSubscription")
            ? true
            : undefined,
          gameItemRequests: options.populate.includes("gameItemRequests")
            ? true
            : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting transaction by ID:", error);
    throw new Error("Failed to fetch transaction");
  }
}

/**
 * Récupère les transactions d'un wallet
 */
export async function getWalletTransactions(
  walletId: string,
  query: ListQuery<WalletTransactionFilters> = {}
): Promise<PaginationResponse<WalletTransaction>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildTransactionWhereConditions(
      { ...filters, walletId },
      options
    );

    // Requête pour les données
    const transactionsQuery = db
      .select()
      .from(walletTransactions)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof WalletTransaction;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      transactionsQuery.orderBy(sortOrder(walletTransactions[sortField]));
    } else {
      transactionsQuery.orderBy(desc(walletTransactions.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(walletTransactions)
      .where(whereConditions);

    const [transactionsData, totalResult] = await Promise.all([
      transactionsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: transactionsData,
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
    console.error("Error getting wallet transactions:", error);
    throw new Error("Failed to fetch wallet transactions");
  }
}

/**
 * Récupère les transactions entre deux utilisateurs
 */
export async function getUserToUserTransactions(
  fromUserId: string,
  toUserId: string,
  options?: { limit?: number; offset?: number }
): Promise<WalletTransaction[]> {
  try {
    const query = db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.fromUserId, fromUserId),
          eq(walletTransactions.toUserId, toUserId)
        )
      )
      .orderBy(desc(walletTransactions.createdAt));

    if (options?.limit) query.limit(options.limit);
    if (options?.offset) query.offset(options.offset);

    return await query;
  } catch (error) {
    console.error("Error getting user-to-user transactions:", error);
    throw new Error("Failed to fetch user transactions");
  }
}

/**
 * Récupère les statistiques des transactions
 */
export async function getTransactionStats(filters?: WalletTransactionFilters) {
  try {
    const whereConditions = buildTransactionWhereConditions(filters || {});

    const [
      totalResult,
      completedResult,
      pendingResult,
      failedResult,
      refundedResult,
      totalAmountResult,
      totalFeesResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(whereConditions),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(
          and(whereConditions, eq(walletTransactions.status, "COMPLETED"))
        ),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(whereConditions, eq(walletTransactions.status, "PENDING"))),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(whereConditions, eq(walletTransactions.status, "FAILED"))),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(whereConditions, eq(walletTransactions.status, "REFUNDED"))),
      db
        .select({ total: sql<number>`sum(${walletTransactions.amount})` })
        .from(walletTransactions)
        .where(
          and(whereConditions, eq(walletTransactions.status, "COMPLETED"))
        ),
      db
        .select({ total: sql<number>`sum(${walletTransactions.fees})` })
        .from(walletTransactions)
        .where(
          and(whereConditions, eq(walletTransactions.status, "COMPLETED"))
        ),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      completed: completedResult[0]?.count ?? 0,
      pending: pendingResult[0]?.count ?? 0,
      failed: failedResult[0]?.count ?? 0,
      refunded: refundedResult[0]?.count ?? 0,
      totalAmount: totalAmountResult[0]?.total ?? 0,
      totalFees: totalFeesResult[0]?.total ?? 0,
    };

    return stats;
  } catch (error) {
    console.error("Error getting transaction stats:", error);
    throw new Error("Failed to fetch transaction statistics");
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle transaction en tenant compte des frais depuis app_settings
 */
// export async function createTransaction(
//   transactionData: NewWalletTransaction
// ): Promise<WalletTransaction> {
//   try {
//     // Validation des données requises
//     if (!transactionData.walletId || !transactionData.amount) {
//       throw new Error('walletId and amount are required');
//     }

//     // Récupération des paramètres de frais depuis app_settings
//     const settings = await db
//       .select()
//       .from(appSettings)
//       .limit(1);

//     const appSettingsData = settings[0] as AppSettings | undefined;

//     // Calcul des frais selon le type de transaction
//     let fees = transactionData.fees || '0';
//     if (appSettingsData && !transactionData.fees) {
//       const amount = parseFloat(transactionData.amount);
//       let feePercentage = 0;

//       switch (transactionData.type) {
//         case 'PURCHASE':
//           feePercentage = parseFloat(
//             appSettingsData.purchaseFeePercentage?.toString() || '0.01'
//           );
//           break;
//         case 'VIP_SUBSCRIPTION':
//           feePercentage = parseFloat(
//             appSettingsData.transactionFeePercentage?.toString() || '0.001'
//           );
//           break;
//         case 'GAME_ITEM_PURCHASE':
//           feePercentage = parseFloat(
//             appSettingsData.gameItemCommissionPercentage?.toString() || '0.05'
//           );
//           break;
//         case 'DEPOSIT':
//           feePercentage = parseFloat(
//             appSettingsData.depositFeePercentage?.toString() || '0'
//           );
//           break;
//         case 'WITHDRAWAL':
//           feePercentage = parseFloat(
//             appSettingsData.withdrawalFeePercentage?.toString() || '0.02'
//           );
//           break;
//         case 'TRANSFER':
//           feePercentage = parseFloat(
//             appSettingsData.transferFeePercentage?.toString() || '0.005'
//           );
//           break;
//         case 'TOURNAMENT_PARTICIPATION':
//           feePercentage = parseFloat(
//             appSettingsData.tournamentParticipationFeePercentage?.toString() ||
//               '0.01'
//           );
//           break;
//         default:
//           feePercentage = parseFloat(
//             appSettingsData.transactionFeePercentage?.toString() || '0.001'
//           );
//       }

//       fees = (amount * feePercentage).toFixed(2);
//     }

//     const netAmount = (
//       parseFloat(transactionData.amount) - parseFloat(fees)
//     ).toFixed(2);

//     // Vérification du solde pour les dépenses
//     if (
//       ['PURCHASE', 'VIP_SUBSCRIPTION', 'WITHDRAWAL', 'TRANSFER'].includes(
//         transactionData.type
//       )
//     ) {
//       const wallet = await db
//         .select()
//         .from(userWallets)
//         .where(eq(userWallets.id, transactionData.walletId))
//         .limit(1);

//       if (!wallet[0]) {
//         throw new Error('Wallet not found');
//       }

//       const currentBalance = parseFloat(wallet[0].balance ?? '0');
//       const requiredAmount = parseFloat(transactionData.amount);

//       if (currentBalance < requiredAmount) {
//         throw new Error('Insufficient balance');
//       }
//     }

//     const result = await db
//       .insert(walletTransactions)
//       .values({
//         ...transactionData,
//         fees,
//         netAmount,
//         createdAt: new Date(),
//       })
//       .returning();

//     return result[0];
//   } catch (error) {
//     console.error('Error creating transaction:', error);
//     if (error instanceof Error) {
//       throw error;
//     }
//     throw new Error('Failed to create transaction');
//   }
// }

export async function createTransaction(data: {
  walletId: string;
  type: NewWalletTransaction["type"];
  amount: string;
  fees?: string;
  netAmount?: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<WalletTransaction> {
  try {
    // Validation
    if (!data.walletId || !data.type || !data.amount) {
      throw new Error("Données de transaction incomplètes");
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Utilisateur non authentifié");
    }

    // Récupérer le wallet
    const wallet = await getUserWalletById(data.walletId);
    if (!wallet) {
      throw new Error("Wallet non trouvé");
    }

    // Vérifier que le wallet appartient à l'utilisateur
    if (wallet.userId !== user.id) {
      throw new Error("Non autorisé");
    }

    // Vérifier le statut du wallet
    if (!wallet.isActive) {
      throw new Error("Wallet inactif");
    }

    if (wallet.isLocked) {
      throw new Error("Wallet verrouillé");
    }

    const amount = parseFloat(data.amount);
    const feeCalc = await getTransactionFees(data.type, amount);
    const fees = feeCalc.fees;
    const netAmount = amount - fees;
    const currentBalance = parseFloat(wallet.balance || "0");
    const totalDebit = amount + fees;
    let newBalance = currentBalance;
    if (
      [
        "PURCHASE",
        "TRANSFER",
        "VIP_SUBSCRIPTION",
        "THEME_PURCHASE",
        "PRODUCT_PURCHASE",
        "GAME_ITEM_PURCHASE",
        "TOURNAMENT_PARTICIPATION",
      ].includes(data.type)
    ) {
      newBalance = currentBalance - totalDebit;
    }

    // Vérifier le solde pour les transactions débiteuses
    const debitTypes = [
      "PURCHASE",
      "WITHDRAWAL",
      "TRANSFER",
      "VIP_SUBSCRIPTION",
      "THEME_PURCHASE",
      "PRODUCT_PURCHASE",
      "GAME_ITEM_PURCHASE",
      "TOURNAMENT_PARTICIPATION",
    ];

    if (debitTypes.includes(data.type) && newBalance < 0) {
      throw new Error("Solde insuffisant");
    }

    if (data.type === "ORDER_PURCHASE") {

      const targetId = data.metadata?.targetId as string | undefined;
      if (!targetId) {
        throw new Error("ID du produit requis");
      }
      const product = await db.query.products.findFirst({
        where: eq(products.id, targetId),
      });
      if (!product) {
        throw new Error("Produit non trouvé");
      }
      if (
        product.isDeleted ||
        !product.isActive ||
        ["VENDU", "RESERVE", "ANNULER", "EN_ECHANGE", "LIVRE"].includes(
          product.status as string
        )
      ) {
        throw new Error("Produit indisponible");
      }
      const [{ count: pendingCount }] = await db
        .select({ count: count() })
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.type as any, "PRODUCT_PURCHASE" as any),
            inArray(walletTransactions.status as any, ["PENDING", "PROCESSING"] as any),
            sql`(${walletTransactions.metadata} ->> 'targetId') = ${targetId}`
          )
        );
      if (Number(pendingCount) > 0) {
        throw new Error("Produit en cours d'achat");
      }
    }

    if (data.type === "VIP_SUBSCRIPTION") {
      const existingVip = await db.query.vipSubscriptions.findFirst({
        where: and(
          eq(vipSubscriptions.userId, user.id),
          eq(vipSubscriptions.status, "ACTIVE")
        ),
      });
      if (existingVip) {
        throw new Error("Abonnement VIP déjà actif");
      }
    }

    if (data.type === "TOURNAMENT_PARTICIPATION") {
      const editionId = data.metadata?.targetId as string | undefined;
      if (!editionId) {
        throw new Error("ID de l'édition requis pour la participation");
      }
      const edition = await db.query.tournamentEditions.findFirst({
        where: eq(tournamentEditions.id, editionId),
      });
      if (!edition) {
        throw new Error("Édition introuvable");
      }
      if (edition.isDeleted || !edition.isActive) {
        throw new Error("Édition indisponible");
      }
      const entryFee = parseFloat((edition.entryFee as any) || "0");
      if (entryFee <= 0) {
        throw new Error("Cette édition n'est pas payante");
      }
      const current = edition.currentParticipants || 0;
      const max = edition.maxParticipants || 0;
      if (max && current >= max) {
        throw new Error("Nombre de places déjà atteint pour cette édition");
      }
    }

    if (data.type === "TRANSFER") {
      const recipientWalletId = data.metadata?.recipientWalletId as string | undefined;
      if (!recipientWalletId) {
        throw new Error("Wallet destinataire requis");
      }
      const recipientWallet = await getUserWalletById(recipientWalletId);
      if (!recipientWallet) {
        throw new Error("Wallet destinataire non trouvé");
      }
      if (recipientWallet.id === wallet.id) {
        throw new Error("Transfert vers le même wallet interdit");
      }
    }

    // Créer la transaction
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        walletId: data.walletId,
        fromUserId: user.id,
        amount: data.amount,
        fees: fees.toFixed(2),
        netAmount: netAmount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        type: data.type,
        status: ["DEPOSIT", "WITHDRAWAL"].includes(data.type) ? "PENDING" : "COMPLETED",
        description: data.description,
        metadata: data.metadata || {},
        createdAt: new Date(),
      })
      .returning();

    // Mettre à jour le solde du wallet si finalisé
    if (!["DEPOSIT", "WITHDRAWAL"].includes(data.type)) {
      await updateWalletBalance(data.walletId, newBalance.toFixed(2));
    }

    // Actions spécifiques selon le type
    await handleTransactionType(
      data.type,
      data.metadata,
      user.id,
      transaction.id
    );

    // Journalisation
    await createUserTrace({
      userId: user.id,
      type: "OTHER",
      entityId: transaction.id,
      payload: {
        action: "TRANSACTION_CREATED",
        type: data.type,
        amount: amount,
        fees: fees,
        newBalance: newBalance,
      },
    });

    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

async function handleTransactionType(
  type: string,
  metadata: Record<string, any> | undefined,
  userId: string,
  transactionId: string
) {
  switch (type) {
    case "THEME_PURCHASE":
      if (metadata?.targetId) {
        await db.insert(themePurchases).values({
          userId,
          themeId: metadata.targetId,
          price: metadata.price || "0",
          createdAt: new Date(),
        });
      }
      break;

    case "PRODUCT_PURCHASE":
      if (metadata?.targetId) {
        const product = await db.query.products.findFirst({
          where: eq(products.id, metadata.targetId),
        });
        if (product) {
          await db
            .update(products)
            .set({
              status: "RESERVE",
              updatedAt: new Date(),
            })
            .where(eq(products.id, metadata.targetId));

          const order = await createOrder({
            productId: metadata.targetId,
            buyerId: userId,
            shopId: product.shopId as string,
            price: product.price as any,
            orderType: "PURCHASE",
            status: "PENDING",
            message: "",
          } as any);

          const shop = await db.query.shops.findFirst({
            where: eq(shops.id, product.shopId as string),
          });
          if (shop?.ownerId) {
            await createNotification({
              userId: shop.ownerId,
              title: "Nouvelle commande",
              message:
                "Un produit a été demandé et une commande a été créée dans votre boutique",
              type: "ORDER_REQUEST",
              linkUrl: `/shops/${product.shopId}/dashboard/orders`,
              shopId: product.shopId as string,
            });
          }
        }
      }
      break;

    case "VIP_SUBSCRIPTION":
      // Créer l'abonnement VIP
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await db.insert(vipSubscriptions).values({
        userId,
        planType: "MONTHLY",
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
        pricePaid: metadata?.amount || "0",
        transactionId,
        activeBenefits: [
          "theme_creation",
          "multiple_shops",
          "priority_support",
          "no_ads",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mettre à jour le statut VIP de l'utilisateur
      await db
        .update(users)
        .set({
          isVip: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      break;

    case "TRANSFER":
      if (metadata?.recipientWalletId) {
        // Créditer le wallet du destinataire
        const recipientWallet = await getUserWalletById(
          metadata.recipientWalletId
        );
        if (recipientWallet) {
          const recipientBalance = parseFloat(recipientWallet.balance || "0");
          const transferAmount = metadata.netAmount || metadata.amount;
          const newRecipientBalance =
            recipientBalance + parseFloat(transferAmount);

          await updateWalletBalance(
            metadata.recipientWalletId,
            newRecipientBalance.toString()
          );

          // Créer une transaction pour le destinataire
          await db.insert(walletTransactions).values({
            walletId: metadata.recipientWalletId,
            fromUserId: userId,
            toUserId: metadata.recipientUserId,
            amount: transferAmount,
            fees: "0",
            netAmount: transferAmount,
            balanceAfter: newRecipientBalance.toString(),
            type: "TRANSFER",
            status: "COMPLETED",
            description: `Transfert reçu de ${
              metadata.senderName || "utilisateur"
            }`,
            metadata: {
              originalTransactionId: transactionId,
              transferType: "received",
            },
            createdAt: new Date(),
          });
        }
      }
      break;

    case "DEPOSIT":
      {
        await db.insert(requests).values({
          userId,
          type: "DEPOSIT",
          amount: (metadata?.amount as any) ?? "0",
          currency: "GTC",
          status: "PENDING",
          paymentMethod: (metadata?.paymentMethod as any) ?? null,
          paymentProvider: (metadata?.paymentProvider as any) ?? null,
          paymentAccountId: (metadata?.paymentAccountId as any) ?? null,
          paymentReference: (metadata?.paymentReference as any) ?? null,
          paymentImage: (metadata?.paymentImage as any) ?? null,
          paymentMetadata: (metadata?.paymentMetadata as any) ?? {},
          userNotes: (metadata?.notes as any) ?? null,
          transactionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      break;

    case "WITHDRAWAL":
      {
        await db.insert(requests).values({
          userId,
          type: "WITHDRAWAL",
          amount: (metadata?.amount as any) ?? "0",
          currency: "GTC",
          status: "PENDING",
          paymentMethod: (metadata?.paymentMethod as any) ?? null,
          paymentProvider: (metadata?.paymentProvider as any) ?? null,
          paymentAccountId: (metadata?.paymentAccountId as any) ?? null,
          paymentReference: (metadata?.paymentReference as any) ?? null,
          paymentMetadata: (metadata?.paymentMetadata as any) ?? {},
          userNotes: (metadata?.notes as any) ?? null,
          transactionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      break;

    case "GAME_ITEM_PURCHASE":
      {
        await db.insert(requests).values({
          userId,
          type: "GAME_ITEMS",
          amount: (metadata?.amount as any) ?? "0",
          currency: "GTC",
          status: "PENDING",
          gameItemId: (metadata?.targetId as any) ?? null,
          quantity: (metadata?.quantity as any) ?? null,
          totalGtc: (metadata?.totalGtc as any) ?? (metadata?.amount as any) ?? "0",
          commission: "0",
          gameAccount: (metadata?.gameAccount as any) ?? null,
          encryptedPassword: (metadata?.encryptedPassword as any) ?? null,
          gameId: (metadata?.gameId as any) ?? null,
          additionalInfo: (metadata?.additionalInfo as any) ?? {},
          userNotes: (metadata?.notes as any) ?? null,
          transactionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      break;

    case "TOURNAMENT_PARTICIPATION":
      {
        const editionId = metadata?.targetId as string | undefined;
        if (!editionId) {
          return;
        }
        const edition = await db.query.tournamentEditions.findFirst({
          where: eq(tournamentEditions.id, editionId),
        });
        if (!edition) {
          return;
        }

        let member = await db.query.tournamentMembers.findFirst({
          where: and(
            eq(tournamentMembers.userId, userId),
            eq(tournamentMembers.tournamentId, edition.tournamentId)
          ),
        });
        if (!member) {
          const [createdMember] = await db
            .insert(tournamentMembers)
            .values({
              userId,
              tournamentId: edition.tournamentId,
              role: "PLAYER",
              isCoOrganizer: false,
              isVerified: true,
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          member = createdMember;
        }

        const [registration] = await db
          .insert(editionRegistrations)
          .values({
            editionId,
            memberId: member.id,
            registrationType: "PLAYER",
            feePaid: false,
            checkedIn: false,
            status: "REGISTERED",
            registeredAt: new Date(),
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        await db.insert(registrationPayments).values({
          registrationId: registration.id,
          transactionId,
          amount: (metadata?.amount || metadata?.netAmount || "0") as string,
          currency: "GTC",
          status: "PENDING",
          paymentMethod: "WALLET",
          paidAt: new Date(),
          metadata: {
            fromTransaction: transactionId,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      break;
  }
}

export async function getTransactionFees(type: string, amount: number) {
  try {
    const settings = await getAppSettings();

    let feePercentage = 0;
    switch (type) {
      case "THEME_PURCHASE":
      case "PRODUCT_PURCHASE":
      case "GAME_ITEM_PURCHASE":
        feePercentage = parseFloat(
          settings?.purchaseFeePercentage?.toString() || "0.02"
        );
        break;
      case "VIP_SUBSCRIPTION":
        feePercentage = parseFloat(
          settings?.transactionFeePercentage?.toString() || "0.001"
        );
        break;
      case "TOURNAMENT_PARTICIPATION":
        feePercentage = parseFloat(
          settings?.tournamentParticipationFeePercentage?.toString() || "0.015"
        );
        break;
      case "DEPOSIT":
        feePercentage = parseFloat(
          settings?.depositFeePercentage?.toString() || "0.001"
        );
        break;
      case "WITHDRAWAL":
        feePercentage = parseFloat(
          settings?.withdrawalFeePercentage?.toString() || "0.02"
        );
        break;
      case "TRANSFER":
        feePercentage = parseFloat(
          settings?.transferFeePercentage?.toString() || "0.005"
        );
        break;
      default:
        feePercentage = 0.01;
    }

    const sessionUser = await getCurrentUser();
    if (sessionUser) {
      const found = await db
        .select()
        .from(users)
        .where(eq(users.id, sessionUser.id))
        .limit(1);
      const isVip = !!found[0]?.isVip;
      if (isVip) {
        feePercentage = Math.max(0, feePercentage * 0.5);
      }
    }

    const fees = amount * feePercentage;
    const totalAmount = amount + fees;

    return {
      feePercentage,
      fees,
      totalAmount,
    };
  } catch (error) {
    console.error("Error calculating fees:", error);
    // Fallback
    const feePercentage = 0.01;
    const fees = amount * feePercentage;
    const totalAmount = amount + fees;
    return { feePercentage, fees, totalAmount };
  }
}

/**
 * Met à jour le statut d'une transaction
 */
export async function updateTransactionStatus(
  id: string,
  status: WalletTransaction["status"],
  metadata?: Record<string, any>
): Promise<WalletTransaction> {
  try {
    const updateData: Partial<NewWalletTransaction> = {
      status,
      //   updatedAt: new Date(),
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const result = await db
      .update(walletTransactions)
      .set(updateData)
      .where(eq(walletTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Transaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error updating transaction status:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update transaction status");
  }
}

/**
 * Annule (rembourse) une transaction
 */
export async function refundTransaction(
  id: string,
  reason?: string
): Promise<WalletTransaction> {
  try {
    // Récupération de la transaction originale
    const originalTransaction = await getTransactionById(id);
    if (!originalTransaction) {
      throw new Error("Transaction not found");
    }

    if (originalTransaction.status !== "COMPLETED") {
      throw new Error("Only completed transactions can be refunded");
    }

    // Création d'une transaction de remboursement
    const refundTransactionData: NewWalletTransaction = {
      walletId: originalTransaction.walletId,
      fromUserId: originalTransaction.toUserId,
      toUserId: originalTransaction.fromUserId,
      amount: originalTransaction.netAmount,
      fees: "0",
      netAmount: originalTransaction.netAmount,
      balanceAfter: originalTransaction.netAmount,
      type: "REFUND",
      status: "COMPLETED",
      description: `Refund for transaction ${id}${reason ? `: ${reason}` : ""}`,
      metadata: {
        originalTransactionId: id,
        refundReason: reason,
      },
    };

    const refundResult = await createTransaction({
      walletId: refundTransactionData.walletId,
      type: refundTransactionData.type,
      amount: refundTransactionData.amount,
      fees: refundTransactionData.fees ?? undefined,
      netAmount: refundTransactionData.netAmount,
      description: refundTransactionData.description ?? undefined,
      metadata: refundTransactionData.metadata as Record<string, any>,
    });

    // Mise à jour du statut de la transaction originale
    await updateTransactionStatus(id, "REFUNDED", {
      refundTransactionId: refundResult.id,
      refundReason: reason,
      refundedAt: new Date(),
    });

    return refundResult;
  } catch (error) {
    console.error("Error refunding transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to refund transaction");
  }
}

/**
 * Supprime une transaction (soft delete)
 */
export async function deleteTransaction(
  id: string
): Promise<WalletTransaction> {
  try {
    const result = await db
      .update(walletTransactions)
      .set({
        isDeleted: true,
        // updatedAt: new Date(),
      })
      .where(eq(walletTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Transaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error deleting transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete transaction");
  }
}

/**
 * Restaure une transaction supprimée
 */
export async function restoreTransaction(
  id: string
): Promise<WalletTransaction> {
  try {
    const result = await db
      .update(walletTransactions)
      .set({
        isDeleted: false,
        // updatedAt: new Date(),
      })
      .where(eq(walletTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Transaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error restoring transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore transaction");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes de transactions
 */
function buildTransactionWhereConditions(
  filters: WalletTransactionFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(walletTransactions.isDeleted, false));
  }

  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(walletTransactions.id, filters.id));
  }
  if (filters.walletId) {
    conditions.push(eq(walletTransactions.walletId, filters.walletId));
  }
  if (filters.fromUserId) {
    conditions.push(eq(walletTransactions.fromUserId, filters.fromUserId));
  }
  if (filters.toUserId) {
    conditions.push(eq(walletTransactions.toUserId, filters.toUserId));
  }
  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(walletTransactions.type, filters.types));
  }
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(walletTransactions.status, filters.statuses));
  }
  if (filters.currency) {
    conditions.push(eq(walletTransactions.currency, filters.currency));
  }
  if (filters.description) {
    conditions.push(
      sql`${walletTransactions.description} ILIKE ${`%${filters.description}%`}`
    );
  }

  // Filtres de montant
  if (filters.amountMin !== undefined) {
    conditions.push(
      gte(walletTransactions.amount, filters.amountMin.toString())
    );
  }
  if (filters.amountMax !== undefined) {
    conditions.push(
      lte(walletTransactions.amount, filters.amountMax.toString())
    );
  }
  if (filters.feesMin !== undefined) {
    conditions.push(gte(walletTransactions.fees, filters.feesMin.toString()));
  }
  if (filters.feesMax !== undefined) {
    conditions.push(lte(walletTransactions.fees, filters.feesMax.toString()));
  }
  if (filters.netAmountMin !== undefined) {
    conditions.push(
      gte(walletTransactions.netAmount, filters.netAmountMin.toString())
    );
  }
  if (filters.netAmountMax !== undefined) {
    conditions.push(
      lte(walletTransactions.netAmount, filters.netAmountMax.toString())
    );
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(
      gte(walletTransactions.createdAt, new Date(filters.createdFrom))
    );
  }
  if (filters.createdTo) {
    conditions.push(
      lte(walletTransactions.createdAt, new Date(filters.createdTo))
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
