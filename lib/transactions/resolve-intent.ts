/**
 * lib/transactions/resolve-intent.ts
 *
 * Résolution pure de l'intention de transaction à partir des paramètres
 * d'URL du parcours `/wallet/transactions/create`.
 *
 * Priorités (T8-01, T8-02) :
 * 1. `type` doit être un type connu ;
 * 2. pour `TOURNAMENT_PARTICIPATION`, `editionId` prime sur les autres ids ;
 * 3. `entityId` > `targetId` > `itemId` > `id` ;
 * 4. les ids contradictoires sont signalés, jamais fusionnés silencieusement.
 */

import {
  TRANSACTION_CONFIGS,
  type TransactionType,
} from "@/types/transaction-types";

export type IntentIssue =
  | "MISSING_TYPE"
  | "INVALID_TYPE"
  | "MISSING_ENTITY"
  | "INVALID_AMOUNT"
  | "CONTRADICTORY_ENTITIES";

export type EntityIdSource =
  | "editionId"
  | "entityId"
  | "targetId"
  | "itemId"
  | "id";

export interface ResolvedTransactionIntent {
  type: TransactionType | null;
  amount: number | null;
  entityId: string | null;
  entityIdSource: EntityIdSource | null;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentAccountId?: string;
  imageUrl?: string;
  issues: IntentIssue[];
}

type SearchParamsLike = Pick<URLSearchParams, "get">;

const ENTITY_SOURCES: EntityIdSource[] = [
  "editionId",
  "entityId",
  "targetId",
  "itemId",
  "id",
];

const hasConfig = (type: string): type is TransactionType =>
  Object.prototype.hasOwnProperty.call(TRANSACTION_CONFIGS, type);

export function resolveTransactionIntent(
  params: SearchParamsLike
): ResolvedTransactionIntent {
  const rawType = params.get("type");
  const issues: IntentIssue[] = [];

  if (!rawType) {
    return {
      type: null,
      amount: null,
      entityId: null,
      entityIdSource: null,
      issues: ["MISSING_TYPE"],
    };
  }

  if (!hasConfig(rawType)) {
    return {
      type: null,
      amount: null,
      entityId: null,
      entityIdSource: null,
      issues: ["INVALID_TYPE"],
    };
  }

  const type = rawType;
  const config = TRANSACTION_CONFIGS[type];

  const candidates = ENTITY_SOURCES.map((source) => ({
    source,
    value: params.get(source),
  })).filter((candidate): candidate is { source: EntityIdSource; value: string } =>
    Boolean(candidate.value)
  );

  const distinctValues = new Set(candidates.map((candidate) => candidate.value));
  if (distinctValues.size > 1) {
    issues.push("CONTRADICTORY_ENTITIES");
  }

  let chosen = candidates.find((candidate) => candidate.source === "entityId")
    ?? candidates.find((candidate) => candidate.source === "targetId")
    ?? candidates.find((candidate) => candidate.source === "itemId")
    ?? candidates.find((candidate) => candidate.source === "id")
    ?? candidates.find((candidate) => candidate.source === "editionId")
    ?? null;

  // T8-02 : l'édition est la source de vérité pour les tournois.
  if (type === "TOURNAMENT_PARTICIPATION") {
    const edition = candidates.find(
      (candidate) => candidate.source === "editionId"
    );
    if (edition) chosen = edition;
  }

  if ((config.requiresEntity || config.needsTargetId) && !chosen) {
    issues.push("MISSING_ENTITY");
  }

  const rawAmount = params.get("amount");
  let amount: number | null = null;
  if (rawAmount !== null && rawAmount !== "") {
    const parsed = Number(rawAmount);
    if (Number.isFinite(parsed) && parsed > 0) {
      amount = parsed;
    } else {
      issues.push("INVALID_AMOUNT");
    }
  }

  const intent: ResolvedTransactionIntent = {
    type,
    amount,
    entityId: chosen?.value ?? null,
    entityIdSource: chosen?.source ?? null,
    issues,
  };

  if (type === "DEPOSIT" || type === "WITHDRAWAL") {
    intent.paymentMethod = params.get("paymentMethod") ?? undefined;
    intent.paymentProvider = params.get("paymentProvider") ?? undefined;
    intent.paymentAccountId = params.get("paymentAccountId") ?? undefined;
  }

  const imageUrl = params.get("image");
  if (imageUrl) intent.imageUrl = imageUrl;

  return intent;
}
