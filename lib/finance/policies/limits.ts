/**
 * lib/finance/policies/limits.ts
 *
 * Politique financière configurable (plafonds A/B/C, seuil de double
 * approbation). Source de vérité : `app_settings.finance_policy`.
 * Les valeurs par défaut ci-dessous sont des propositions validées.
 */

import type { AdminLevel } from "@/lib/auth/permissions";

export interface LevelLimits {
  A: number;
  B: number;
  C: number;
}

export interface FinancePolicy {
  issuance: {
    min: number;
    max: LevelLimits;
    daily: LevelLimits;
  };
  creditRequest: {
    max: LevelLimits;
    daily: LevelLimits;
    secondApprovalThreshold: number;
  };
  refund: {
    max: LevelLimits;
  };
}

export const DEFAULT_FINANCE_POLICY: FinancePolicy = {
  issuance: {
    min: 1,
    max: { A: 100_000, B: 25_000, C: 0 },
    daily: { A: 500_000, B: 100_000, C: 0 },
  },
  creditRequest: {
    max: { A: 100_000, B: 50_000, C: 10_000 },
    daily: { A: 500_000, B: 100_000, C: 25_000 },
    secondApprovalThreshold: 50_000,
  },
  refund: {
    max: { A: 1_000_000, B: 25_000, C: 0 },
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const mergeLevelLimits = (
  raw: unknown,
  fallback: LevelLimits
): LevelLimits => {
  const record = isRecord(raw) ? raw : {};
  return {
    A: toNumber(record.A, fallback.A),
    B: toNumber(record.B, fallback.B),
    C: toNumber(record.C, fallback.C),
  };
};

/**
 * Fusionne la politique stockée avec les valeurs par défaut.
 * Toute valeur absente ou invalide retombe sur le défaut sûr.
 */
export function resolveFinancePolicy(raw: unknown): FinancePolicy {
  if (!isRecord(raw)) return DEFAULT_FINANCE_POLICY;

  const issuance = isRecord(raw.issuance) ? raw.issuance : {};
  const creditRequest = isRecord(raw.creditRequest) ? raw.creditRequest : {};
  const refund = isRecord(raw.refund) ? raw.refund : {};

  return {
    issuance: {
      min: toNumber(issuance.min, DEFAULT_FINANCE_POLICY.issuance.min),
      max: mergeLevelLimits(
        issuance.max,
        DEFAULT_FINANCE_POLICY.issuance.max
      ),
      daily: mergeLevelLimits(
        issuance.daily,
        DEFAULT_FINANCE_POLICY.issuance.daily
      ),
    },
    creditRequest: {
      max: mergeLevelLimits(
        creditRequest.max,
        DEFAULT_FINANCE_POLICY.creditRequest.max
      ),
      daily: mergeLevelLimits(
        creditRequest.daily,
        DEFAULT_FINANCE_POLICY.creditRequest.daily
      ),
      secondApprovalThreshold: toNumber(
        creditRequest.secondApprovalThreshold,
        DEFAULT_FINANCE_POLICY.creditRequest.secondApprovalThreshold
      ),
    },
    refund: {
      max: mergeLevelLimits(
        refund.max,
        DEFAULT_FINANCE_POLICY.refund.max
      ),
    },
  };
}

/**
 * Charge la politique depuis la base. Import dynamique pour ne pas coupler
 * les fonctions pures de test à Next.js / better-auth.
 */
export async function loadFinancePolicy(): Promise<FinancePolicy> {
  const { getAppSettings } = await import("@/actions/app-settings");
  const settings = await getAppSettings();
  const raw =
    settings && typeof settings === "object"
      ? (settings as { financePolicy?: unknown }).financePolicy
      : undefined;
  return resolveFinancePolicy(raw);
}
