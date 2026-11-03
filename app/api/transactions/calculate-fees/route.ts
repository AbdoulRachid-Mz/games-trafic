import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateTransactionFees } from "@/lib/finance";

// POST /api/transactions/calculate-fees (S5-01, S5-02)
export async function POST(request: NextRequest) {
  try {
    // 🛡️ S5-01: Authentication required
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized: Authentification requise pour calculer les frais" },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type invalide (application/json attendu)" },
        { status: 415 }
      );
    }

    const data = await request.json();

    if (!data?.type || typeof data.amount !== "number") {
      return NextResponse.json(
        { error: "Type et montant requis" },
        { status: 400 }
      );
    }

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre strictement positif" },
        { status: 400 }
      );
    }

    // 💡 S5-01: Use canonical financial engine with user's VIP status
    const feeCalculation = await calculateTransactionFees(data.type, amount, {
      isVip: !!sessionUser.isVip,
    });

    // 🎯 S5-02: Consistent payload: { fees, totalDebit, netAmount, ... }
    return NextResponse.json({
      feePercentage: feeCalculation.feePercentage,
      fees: feeCalculation.fees,
      totalDebit: feeCalculation.totalAmount,
      netAmount: feeCalculation.netAmount,
      currency: "GTC",
    });
  } catch (error) {
    console.error("Error in /api/transactions/calculate-fees:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du calcul des frais",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
