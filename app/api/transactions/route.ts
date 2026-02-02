import { NextRequest, NextResponse } from "next/server";
import { getWalletTransactions } from "@/actions/transactions";
// import { getSession } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/session";

import { db } from "@/lib/db";
import { userWallets } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Si walletId n'est pas fourni, utiliser le wallet de l'utilisateur
    let finalWalletId = walletId;
    if (!finalWalletId) {
      const wallet = await db.query.userWallets.findFirst({
        where: eq(userWallets.userId, session.id),
      });
      if (!wallet) {
        return NextResponse.json({ error: "Wallet non trouvé" }, { status: 404 });
      }
      finalWalletId = wallet.id;
    }

    const filters: any = {
      walletId: finalWalletId,
    };

    if (status) filters.statuses = [status];
    if (type) filters.types = [type];
    if (startDate) filters.createdFrom = startDate;
    if (endDate) filters.createdTo = endDate;

    const transactions = await getWalletTransactions(finalWalletId, {
      pagination: { page, limit },
      filters,
      options: { sortBy: "createdAt", sortOrder: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const data = await request.json();
    
    // Vérifier que l'utilisateur a un wallet
    const wallet = await db.query.userWallets.findFirst({
      where: eq(userWallets.userId, session.id),
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet non trouvé" }, { status: 404 });
    }

    // Créer la transaction
    const transactionData = {
      ...data,
      walletId: wallet.id,
      fromUserId: data.type === "WITHDRAWAL" ? session.id : undefined,
      toUserId: data.type === "DEPOSIT" ? session.id : undefined,
    };

    // Ici, vous appelleriez votre fonction createTransaction
    // const transaction = await createTransaction(transactionData);

    return NextResponse.json({
      success: true,
      message: "Transaction créée avec succès",
      // data: transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la transaction" },
      { status: 500 }
    );
  }
}