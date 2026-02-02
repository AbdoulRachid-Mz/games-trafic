import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { userWallets } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const data = await request.json();

    // Validation des données
    if (!data.documentType || !data.documentNumber || !data.documentFront) {
      return NextResponse.json(
        { error: "Informations de document manquantes" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a un wallet
    const wallet = await db.query.userWallets.findFirst({
      where: eq(userWallets.userId, session.id),
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le wallet avec les informations de vérification
    await db
      .update(userWallets)
      .set({
        identityDocumentType: data.documentType,
        identityDocumentUrl: data.documentFront,
        verificationStatus: "PENDING",
        updatedAt: new Date(),
      })
      .where(eq(userWallets.id, wallet.id));

    // Ici, vous pourriez:
    // 1. Envoyer les données à un service de vérification tiers
    // 2. Notifier l'équipe d'administration
    // 3. Programmer une vérification automatique

    return NextResponse.json({
      success: true,
      message: "Vérification soumise avec succès",
      data: {
        verificationId: `VER-${Date.now()}`,
        estimatedTime: "24-48 heures",
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Error submitting verification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission de la vérification" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer le statut de vérification
    const wallet = await db.query.userWallets.findFirst({
      where: eq(userWallets.userId, session.id),
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: wallet.verificationStatus,
      documentType: wallet.identityDocumentType,
      submittedAt: wallet.updatedAt,
      verifiedAt: wallet.verifiedAt,
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}