import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/actions/transactions";
import { getUserWalletById } from "@/actions/wallets";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        const data = await request.json();

        if (!data.walletId || !data.type || !data.amount) {
            return NextResponse.json(
                { error: "WalletId, type et montant requis" },
                { status: 400 }
            );
        }

        const isAdmin = user.role === "admin" || (user as any).isAdmin === true;

        // 🛡️ SEC-001: Bloquer tout crédit arbitraire direct (DEPOSIT, BONUS, REFUND) par un utilisateur non-admin
        const creditTypes = ["DEPOSIT", "BONUS", "REFUND"];
        if (creditTypes.includes(data.type) && !isAdmin) {
            return NextResponse.json(
                { error: "Action non autorisée: les dépôts et crédits directs doivent passer par une passerelle de paiement certifiée." },
                { status: 403 }
            );
        }

        // 🛡️ Vérification de la propriété du wallet
        const wallet = await getUserWalletById(data.walletId);
        if (!wallet) {
            return NextResponse.json(
                { error: "Portefeuille introuvable" },
                { status: 404 }
            );
        }
        if (wallet.userId !== user.id && !isAdmin) {
            return NextResponse.json(
                { error: "Accès refusé au portefeuille spécifié" },
                { status: 403 }
            );
        }

        const transaction = await createTransaction({
            walletId: data.walletId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            metadata: data.metadata,
        });

        return NextResponse.json({
            success: true,
            data: transaction,
        });
    } catch (error: any) {
        console.error("Error creating transaction API:", error);
        return NextResponse.json(
            { error: error.message || "Erreur lors de la création de la transaction" },
            { status: 500 }
        );
    }
}
