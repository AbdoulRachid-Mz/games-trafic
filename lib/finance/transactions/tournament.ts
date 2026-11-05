/**
 * lib/finance/transactions/tournament.ts
 *
 * Décomposition comptable d'une inscription payante
 * (`TOURNAMENT_PARTICIPATION`) : le participant paie `entryFee + frais`,
 * le pool reçoit le brut, les frais vont à PLATFORM_FEES.
 */

export interface TournamentPosting {
  accountId: string;
  debit?: number;
  credit?: number;
}

export interface TournamentEntryPlan {
  participantAccountId: string;
  poolAccountId: string;
  feeAccountId?: string | null;
  entryFee: number;
  fees: number;
}

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function buildTournamentEntryPostings(
  plan: TournamentEntryPlan
): TournamentPosting[] {
  const entryFee = roundMoney(plan.entryFee);
  const fees = Math.max(roundMoney(plan.fees), 0);

  const postings: TournamentPosting[] = [
    {
      accountId: plan.participantAccountId,
      debit: roundMoney(entryFee + fees),
    },
    { accountId: plan.poolAccountId, credit: entryFee },
  ];

  if (fees > 0) {
    if (!plan.feeAccountId) {
      throw new Error(
        "FEE_ACCOUNT_REQUIRED: des frais positifs exigent un compte PLATFORM_FEES."
      );
    }
    postings.push({ accountId: plan.feeAccountId, credit: fees });
  }

  return postings;
}
