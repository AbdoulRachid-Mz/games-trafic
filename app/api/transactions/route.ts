import { NextRequest, NextResponse } from "next/server";
import { getWalletTransactions } from "@/actions/transactions";
import { getCurrentUser } from "@/lib/auth/session";

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

    const filters: any = {};
    if (walletId) filters.walletId = walletId;
    if (status) filters.statuses = [status];
    if (type) filters.types = [type];
    if (startDate) filters.createdFrom = startDate;
    if (endDate) filters.createdTo = endDate;

    const transactions = await getWalletTransactions(walletId || "", {
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

    const transactionData = {
      ...data,
      fromUserId: data.type === "WITHDRAWAL" ? session.id : undefined,
      toUserId: data.type === "DEPOSIT" ? session.id : undefined,
    };

    return NextResponse.json({
      success: true,
      message: "Transaction créée avec succès",
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la transaction" },
      { status: 500 }
    );
  }
}