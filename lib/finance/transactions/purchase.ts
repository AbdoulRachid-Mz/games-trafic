/**
 * lib/finance/transactions/purchase.ts
 *
 * Décomposition comptable des commandes produit (`ORDER_PURCHASE`) :
 * - capture : acheteur → escrow, montant brut, sans frais ;
 * - paiement : escrow → vendeur (net) + PLATFORM_FEES (commission).
 *
 * Ces fonctions sont pures : elles ne touchent ni la base ni la session et
 * sont réutilisées par `actions/orders.ts` ainsi que par les tests.
 */

export interface OrderPosting {
  accountId: string;
  debit?: number;
  credit?: number;
}

export interface OrderCapturePlan {
  buyerAccountId: string;
  escrowAccountId: string;
  amount: number;
}

export interface OrderPayoutPlan {
  escrowAccountId: string;
  sellerAccountId: string;
  feeAccountId?: string | null;
  amount: number;
  commission: number;
}

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function splitOrderAmount(
  amount: number,
  commission: number
): { sellerNet: number; commission: number } {
  const safeAmount = roundMoney(amount);
  const safeCommission = Math.min(
    Math.max(roundMoney(commission), 0),
    safeAmount
  );
  return {
    sellerNet: roundMoney(safeAmount - safeCommission),
    commission: safeCommission,
  };
}

export function buildOrderCapturePostings(
  plan: OrderCapturePlan
): OrderPosting[] {
  const amount = roundMoney(plan.amount);
  return [
    { accountId: plan.buyerAccountId, debit: amount },
    { accountId: plan.escrowAccountId, credit: amount },
  ];
}

export function buildOrderPayoutPostings(plan: OrderPayoutPlan): OrderPosting[] {
  const { sellerNet, commission } = splitOrderAmount(
    plan.amount,
    plan.commission
  );

  const postings: OrderPosting[] = [
    { accountId: plan.escrowAccountId, debit: roundMoney(plan.amount) },
    { accountId: plan.sellerAccountId, credit: sellerNet },
  ];

  if (commission > 0) {
    if (!plan.feeAccountId) {
      throw new Error(
        "FEE_ACCOUNT_REQUIRED: une commission positive exige un compte PLATFORM_FEES."
      );
    }
    postings.push({ accountId: plan.feeAccountId, credit: commission });
  }

  return postings;
}
