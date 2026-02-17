import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/actions/transactions";
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
