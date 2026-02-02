import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  userWallets,
  walletTransactions,
  appSettings,
  themes,
  vipSubscriptions,
  products,
  tournaments,
  gameItems,
  users,
  themePurchases,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { createTransaction as createTransactionAction } from "@/actions/transactions";
import { createVipSubscription } from "@/actions/vip";
import { ApiHandler } from "@/lib/api-handler";
import { getTransactionFees } from "@/actions/transactions";

export async function POST(request: NextRequest) {
  return ApiHandler.handleRequest(request, async (req, ctx) => {
    const userId = ctx?.user?.id;
    if (!userId) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Non authentifié" } };
    }

    const data = await req.json();

    if (!data.type || !data.amount || !data.walletId) {
      return {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Type, montant et walletId sont requis",
        },
      };
    }

    const wallet = await db.query.userWallets.findFirst({
      where: and(eq(userWallets.id, data.walletId), eq(userWallets.userId, userId)),
    });

    if (!wallet) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Wallet non trouvé" },
      };
    }

    if (!wallet.isActive) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Wallet inactif" },
      };
    }

    if (wallet.isLocked) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Wallet verrouillé" },
      };
    }

    const walletBalance = parseFloat(wallet.balance || "0");
    const amount = parseFloat(data.amount);
    const feeCalc = await getTransactionFees(data.type, amount);
    const totalAmount = amount + feeCalc.fees;

    if (walletBalance < totalAmount) {
      return {
        success: false,
        error: { code: "BAD_REQUEST", message: "Solde insuffisant" },
      };
    }

    switch (data.type) {
      case "THEME_PURCHASE":
        if (!data.targetId) {
          return {
            success: false,
            error: { code: "BAD_REQUEST", message: "ID du thème requis" },
          };
        }
        const theme = await db.query.themes.findFirst({
          where: eq(themes.id, data.targetId),
        });
        if (!theme) {
          return {
            success: false,
            error: { code: "NOT_FOUND", message: "Thème non trouvé" },
          };
        }
        break;

      case "VIP_SUBSCRIPTION":
        const existingVip = await db.query.vipSubscriptions.findFirst({
          where: and(eq(vipSubscriptions.userId, userId), eq(vipSubscriptions.status, "ACTIVE")),
        });
        if (existingVip) {
          return {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Vous avez déjà un abonnement VIP actif",
            },
          };
        }
        break;

      case "PRODUCT_PURCHASE":
        if (!data.targetId) {
          return {
            success: false,
            error: { code: "BAD_REQUEST", message: "ID du produit requis" },
          };
        }
        const product = await db.query.products.findFirst({
          where: eq(products.id, data.targetId),
        });
        if (!product) {
          return {
            success: false,
            error: { code: "NOT_FOUND", message: "Produit non trouvé" },
          };
        }
        if (
          ["VENDU", "RESERVE", "ANNULER", "EN_ECHANGE", "LIVRE"].includes(
            product.status as string
          )
        ) {
          return {
            success: false,
            error: { code: "BAD_REQUEST", message: "Produit indisponible" },
          };
        }
        break;

      case "TOURNAMENT_PARTICIPATION":
        if (!data.targetId) {
          return {
            success: false,
            error: { code: "BAD_REQUEST", message: "ID du tournoi requis" },
          };
        }
        const tournament = await db.query.tournaments.findFirst({
          where: eq(tournaments.id, data.targetId),
        });
        if (!tournament) {
          return {
            success: false,
            error: { code: "NOT_FOUND", message: "Tournoi non trouvé" },
          };
        }
        break;

      case "GAME_ITEM_PURCHASE":
        if (!data.targetId) {
          return {
            success: false,
            error: { code: "BAD_REQUEST", message: "ID de l'item requis" },
          };
        }
        const gameItem = await db.query.gameItems.findFirst({
          where: eq(gameItems.id, data.targetId),
        });
        if (!gameItem) {
          return {
            success: false,
            error: { code: "NOT_FOUND", message: "Item de jeu non trouvé" },
          };
        }
        break;
    }

    const transactionData = {
      walletId: data.walletId,
      amount: data.amount.toString(),
      type: data.type,
      description: getTransactionDescription(data.type, data.metadata),
      metadata: {
        ...data.metadata,
        targetId: data.targetId,
        userId: userId,
      },
    };

    const transaction = await createTransactionAction({
      walletId: transactionData.walletId,
      amount: transactionData.amount,
      type: transactionData.type,
      description: transactionData.description,
      metadata: transactionData.metadata,
    });

    return {
      success: true,
      message: "Transaction effectuée avec succès",
      data: {
        ...transaction,
        reference: `TX-${transaction.id.slice(-8)}`,
      },
    };
  });
}

function getTransactionDescription(type: string, metadata: any): string {
  switch (type) {
    case "THEME_PURCHASE":
      return `Achat du thème "${metadata?.themeName || "Inconnu"}"`;
    case "VIP_SUBSCRIPTION":
      return "Abonnement VIP mensuel";
    case "PRODUCT_PURCHASE":
      return `Achat du produit "${metadata?.productName || "Inconnu"}"`;
    case "TOURNAMENT_PARTICIPATION":
      return `Participation au tournoi "${
        metadata?.tournamentName || "Inconnu"
      }"`;
    case "GAME_ITEM_PURCHASE":
      return `Achat d'items de jeu "${metadata?.itemName || "Inconnu"}"`;
    case "DEPOSIT":
      return "Dépôt de fonds";
    case "TRANSFER":
      return `Transfert à ${metadata?.recipientName || "utilisateur"}`;
    default:
      return "Transaction";
  }
}

async function handleThemePurchase(
  themeId: string,
  userId: string,
  transactionId: string
) {
  // Enregistrer l'achat du thème
  // theme_purchases table does not have a transactionId column, so we omit it
  await db.insert(themePurchases).values({
    userId,
    themeId,
    createdAt: new Date(),
  });
}

async function handleVipSubscription(
  userId: string,
  amount: number,
  transactionId: string
) {
  // Calculate end date for 1 month
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Create VIP subscription using the server action
  await createVipSubscription({
    userId,
    planType: "MONTHLY",
    status: "ACTIVE",
    startDate: new Date(),
    endDate,
    pricePaid: amount.toString(),
    transactionId,
    activeBenefits: [
      "theme_creation",
      "multiple_shops",
      "priority_support",
      "no_ads",
    ],
  });

  // No need to manually update the user here since createVipSubscription already does it
}

async function handleProductPurchase(
  productId: string,
  userId: string,
  transactionId: string
) {
  // Mettre à jour le statut du produit
  await db
    .update(products)
    .set({
      status: "VENDU",
      deliveredToUserId: userId,
      deliveredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}
