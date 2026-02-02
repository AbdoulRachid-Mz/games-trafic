import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appSettings } from "@/database/schema";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.type || !data.amount) {
      return NextResponse.json(
        { error: "Type et montant requis" },
        { status: 400 }
      );
    }

    // Récupérer les paramètres d'application
    const settings = await db.query.appSettings.findFirst();
    
    let feePercentage = 0;
    const amount = parseFloat(data.amount);

    // Déterminer le pourcentage selon le type
    switch (data.type) {
      case "THEME_PURCHASE":
        feePercentage = parseFloat(settings?.purchaseFeePercentage?.toString() || "0.01");
        break;
      case "VIP_SUBSCRIPTION":
        feePercentage = parseFloat(settings?.transactionFeePercentage?.toString() || "0.005");
        break;
      case "PRODUCT_PURCHASE":
        feePercentage = parseFloat(settings?.purchaseFeePercentage?.toString() || "0.02");
        break;
      case "TOURNAMENT_PARTICIPATION":
        feePercentage = parseFloat(settings?.tournamentParticipationFeePercentage?.toString() || "0.015");
        break;
      case "GAME_ITEM_PURCHASE":
        feePercentage = parseFloat(settings?.gameItemCommissionPercentage?.toString() || "0.03");
        break;
      case "DEPOSIT":
        feePercentage = parseFloat(settings?.depositFeePercentage?.toString() || "0.001");
        break;
      case "WITHDRAWAL":
        feePercentage = parseFloat(settings?.withdrawalFeePercentage?.toString() || "0.02");
        break;
      case "TRANSFER":
        feePercentage = parseFloat(settings?.transferFeePercentage?.toString() || "0.005");
        break;
      default:
        feePercentage = 0.01;
    }

    const fees = amount * feePercentage;
    const totalAmount = amount + fees;

    return NextResponse.json({
      feePercentage,
      fees,
      totalAmount,
      currency: "GTC"
    });
  } catch (error) {
    console.error("Error calculating fees:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul des frais" },
      { status: 500 }
    );
  }
}
