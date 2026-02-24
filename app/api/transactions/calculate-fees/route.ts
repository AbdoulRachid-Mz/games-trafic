import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type invalide" },
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

    const settings = await db.query.appSettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: "Paramètres de l'application introuvables" },
        { status: 500 }
      );
    }

    let feePercentage = 0;
    const amount = Number(data.amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    switch (data.type) {
      case "THEME_PURCHASE":
      case "PRODUCT_PURCHASE":
      case "GAME_ITEM_PURCHASE":
      case "ORDER_PURCHASE":
        feePercentage = Number(settings.purchaseFeePercentage ?? 0);
        break;

      case "VIP_SUBSCRIPTION":
        feePercentage = Number(settings.transactionFeePercentage ?? 0);
        break;

      case "TOURNAMENT_PARTICIPATION":
        feePercentage = Number(settings.tournamentParticipationFeePercentage ?? 0);
        break;

      case "DEPOSIT":
        feePercentage = Number(settings.depositFeePercentage ?? 0);
        break;

      case "WITHDRAWAL":
        feePercentage = Number(settings.withdrawalFeePercentage ?? 0);
        break;

      case "TRANSFER":
        feePercentage = Number(settings.transferFeePercentage ?? 0);
        break;

      default:
        return NextResponse.json(
          { error: "Type de transaction invalide" },
          { status: 400 }
        );
    }

    const fees = Number((amount * feePercentage).toFixed(2));
    const totalAmount = Number(amount.toFixed(2));

    return NextResponse.json({
      feePercentage,
      fees,
      totalAmount,
      currency: "GTC",
    });
  } catch (error) {
    console.error("Error calculating fees:", error);

    return NextResponse.json(
      {
        error: "Erreur lors du calcul des frais",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
