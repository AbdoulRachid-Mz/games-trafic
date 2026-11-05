import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getTransactionStats } from "@/actions/transactions";

// export const dynamic = 'force-dynamic';
import { getCurrentUser2 } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { userWallets } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser2(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const walletId = searchParams.get("walletId");

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

    // Récupérer les statistiques
    const stats = await getTransactionStats({
      walletId: finalWalletId,
    });

    // Ajouter des statistiques supplémentaires
    const monthlyChange = 12.5; // À calculer avec les données réelles
    const pendingTransactions = stats.pending || 0;

    return NextResponse.json({
      totalTransactions: stats.total || 0,
      totalAmount: parseFloat(stats.totalAmount?.toString() || "0"),
      monthlyChange,
      pendingTransactions,
      successRate: stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100) 
        : 100,
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error fetching wallet stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}