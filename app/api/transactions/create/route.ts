import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/actions/transactions";
import { getUserWalletById } from "@/actions/wallets";
import { getCurrentUser } from "@/lib/auth/session";
import { isFinanceError } from "@/lib/finance";

function getErrorStatus(error: unknown): number {
    if (isFinanceError(error)) {
        switch (error.code) {
            case "UNAUTHENTICATED":
                return 401;
            case "FORBIDDEN":
                return 403;
            case "ACCOUNT_NOT_FOUND":
            case "TRANSACTION_NOT_FOUND":
                return 404;
            case "IDEMPOTENCY_CONFLICT":
            case "PRICE_CHANGED":
            case "COOLDOWN_ACTIVE":
            case "IDEMPOTENCY_IN_PROGRESS":
            case "INVALID_TRANSITION":
            case "TRANSACTION_ALREADY_REFUNDED":
            case "REFUND_EXCEEDS_REMAINING":
                return 409;
            case "INSUFFICIENT_BALANCE":
            case "NEGATIVE_BALANCE_NOT_ALLOWED":
            case "UNBALANCED_LEDGER":
                return 422;
            case "VALIDATION_ERROR":
            case "INVALID_LEDGER_ENTRY":
            case "INVALID_TRANSACTION_TYPE":
            case "INVALID_STATUS":
            case "SUPPLY_UNAVAILABLE":
            case "FEE_POLICY_UNAVAILABLE":
                return 400;
            default:
                return 500;
        }
    }

    const message = error instanceof Error ? error.message : String(error);
    if (/Non autorisé|Accès refusé|Unauthorized|UNAUTHORIZED|FORBIDDEN/i.test(message)) return 403;
    if (/Non authentifié|UNAUTHENTICATED/i.test(message)) return 401;
    if (/introuvable|not found/i.test(message)) return 404;
    if (/INVALID_FLOW|IDEMPOTENCY_KEY_REQUIRED|DUPLICATE_|PRICE_CHANGED|déjà en cours|cooldown|invalide|requis/i.test(message)) return 400;
    if (/Solde insuffisant|INSUFFICIENT_BALANCE/i.test(message)) return 422;
    return 500;
}

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

        // SEC-001: Bloquer tout crédit arbitraire direct (DEPOSIT, BONUS, REFUND) par un utilisateur non-admin
        const creditTypes = ["DEPOSIT", "BONUS", "REFUND"];
        if (creditTypes.includes(data.type) && !isAdmin) {
            return NextResponse.json(
                { error: "Action non autorisée: les dépôts et crédits directs doivent passer par une passerelle de paiement certifiée." },
                { status: 403 }
            );
        }

        // Les dépôts/retraits utilisateur doivent passer par le workflow de demande.
        if (!isAdmin && (data.type === "DEPOSIT" || data.type === "WITHDRAWAL")) {
            return NextResponse.json(
                { error: "INVALID_FLOW: les dépôts et retraits doivent être effectués via une demande (createRequest)." },
                { status: 400 }
            );
        }

        // Vérification de la propriété du wallet
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

        const idempotencyKey =
            typeof data.idempotencyKey === "string"
                ? data.idempotencyKey
                : typeof data.metadata?.idempotencyKey === "string"
                  ? data.metadata.idempotencyKey
                  : undefined;

        const passkeyProof =
            data.passkeyProof &&
            typeof data.passkeyProof.challengeId === "string" &&
            data.passkeyProof.assertion
                ? {
                      challengeId: data.passkeyProof.challengeId as string,
                      assertion: data.passkeyProof.assertion as unknown,
                  }
                : undefined;

        const transaction = await createTransaction({
            walletId: data.walletId,
            type: data.type,
            amount: String(data.amount),
            description: data.description,
            metadata: {
                ...(data.metadata ?? {}),
                ...(idempotencyKey ? { idempotencyKey } : {}),
            },
            pin: typeof data.pin === "string" ? data.pin : undefined,
            passkeyProof,
        });

        return NextResponse.json({
            success: true,
            data: transaction,
        });
    } catch (error: unknown) {
        console.error("Error creating transaction API:", error);
        const message = error instanceof Error ? error.message : "Erreur lors de la création de la transaction";
        return NextResponse.json(
            {
                error: message,
                code: isFinanceError(error) ? error.code : undefined,
            },
            { status: getErrorStatus(error) }
        );
    }
}
