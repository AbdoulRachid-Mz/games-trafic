import { TransactionEntity, TransactionType } from "@/types/transaction-types";
import { buildTransactionReceiptDocument } from "@/lib/documents/builders/transaction";
import { downloadDocument } from "@/lib/documents/engine";
import { transactionTypeLabel } from "@/lib/documents/format";

/**
 * utils/receipt-templates.ts
 *
 * Façade de compatibilité pour les reçus de transaction.
 *
 * Toute la mise en page, les accents, la pagination, le logo et le nommage
 * viennent désormais du moteur documentaire central
 * (`lib/documents/engine.ts`). Ce fichier ne contient AUCUNE règle de rendu
 * et aucune coordonnée d'entreprise inventée.
 */

export interface ReceiptData {
  transactionId: string;
  amount: number;
  type: TransactionType;
  fees: number;
  /** Montant total débité (montant + frais), information d'affichage. */
  totalAmount: number;
  date: Date;
  reference: string;
  newBalance: number;
  entityData?: TransactionEntity;
  metadata?: Record<string, any>;
  /** Statut réel de la transaction (jamais deviné). */
  status?: string | null;
  /** Montant net enregistré en base, s'il est connu. */
  netAmount?: number | null;
  /** Devise réelle de la transaction. */
  currency?: string | null;
  /** Date de validation serveur, si disponible. */
  completedAt?: Date | null;
  /** Utilisateur concerné (jamais un compte tiers non autorisé). */
  userName?: string | null;
  senderName?: string | null;
  recipientName?: string | null;
  description?: string | null;
}

/**
 * Construit puis télécharge le reçu PDF d'une transaction.
 *
 * Le reçu n'expose jamais de secret : les comptes de retrait sont masqués par
 * le builder et aucun mot de passe de compte n'est lu.
 */
export async function generateEnhancedReceipt(
  data: ReceiptData,
): Promise<void> {
  const document = buildTransactionReceiptDocument({
    transactionId: data.transactionId,
    reference: data.reference,
    type: String(data.type),
    status: data.status ?? "COMPLETED",
    amount: data.amount,
    fees: data.fees,
    netAmount: data.netAmount ?? null,
    currency: data.currency ?? "GTC",
    balanceAfter: data.newBalance,
    createdAt: data.date,
    completedAt: data.completedAt ?? null,
    description: data.description ?? null,
    userName: data.userName ?? null,
    senderName: data.senderName ?? null,
    recipientName: data.recipientName ?? null,
    metadata: (data.metadata as Record<string, unknown> | undefined) ?? null,
    entity:
      (data.entityData as unknown as Record<string, unknown> | undefined) ??
      null,
  });

  await downloadDocument(document, "pdf");
}

/** Libellé français d'un type de transaction (utilisé par l'UI historique). */
export function getTransactionLabel(type: TransactionType): string {
  return transactionTypeLabel(type);
}
