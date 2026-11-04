/**
 * lib/finance/policies/admin-policy.ts
 *
 * Décisions pures de la politique d'administration financière A/B/C.
 * Aucune lecture de session ici : l'appelant fournit l'acteur relu en base.
 */

import type { AdminLevel } from "@/lib/auth/permissions";
import { FinanceError } from "../core/errors";
import type { FinancePolicy } from "./limits";

export type PolicyResult =
  | { allowed: true; requiresSecondApproval?: boolean }
  | { allowed: false; code: string; message: string };

const deny = (code: string, message: string): PolicyResult => ({
  allowed: false,
  code,
  message,
});

export function requiresSecondApproval(
  amount: number,
  policy: FinancePolicy
): boolean {
  return amount > policy.creditRequest.secondApprovalThreshold;
}

/**
 * Émission directe : A/B dans leur plafond, jamais C.
 */
export function canIssueDirectly(
  level: AdminLevel,
  amount: number,
  issuedToday: number,
  policy: FinancePolicy
): PolicyResult {
  if (level === "C") {
    return deny(
      "ISSUANCE_FORBIDDEN",
      "Le niveau C ne peut pas émettre directement de GTC."
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return deny("INVALID_AMOUNT", "Le montant doit être positif.");
  }
  if (amount < policy.issuance.min) {
    return deny(
      "BELOW_MINIMUM",
      `Le montant minimum d'émission est de ${policy.issuance.min} GTC.`
    );
  }
  if (amount > policy.issuance.max[level]) {
    return deny(
      "EXCEEDS_LEVEL_MAX",
      `Plafond d'émission ${level} dépassé (${policy.issuance.max[level]} GTC par opération). Créez une demande.`
    );
  }
  if (issuedToday + amount > policy.issuance.daily[level]) {
    return deny(
      "EXCEEDS_DAILY_LIMIT",
      `Plafond quotidien d'émission ${level} dépassé (${policy.issuance.daily[level]} GTC).`
    );
  }
  return { allowed: true };
}

export interface ApprovalDecisionInput {
  approverLevel: AdminLevel;
  approverId: string;
  requesterId: string;
  requesterLevel: AdminLevel;
  amount: number;
  policy: FinancePolicy;
  /** Premier approbateur déjà enregistré, le cas échéant. */
  firstApproverId?: string | null;
  firstApproverLevel?: AdminLevel | null;
}

/**
 * Approbation d'une demande de crédit.
 *
 * - jamais sa propre demande ;
 * - C ne peut jamais approuver ;
 * - sous le seuil : A peut tout, B uniquement les demandes de C ;
 * - au-dessus du seuil : deux approbateurs distincts, dont au moins un A.
 */
export function canApproveCreditRequest(
  input: ApprovalDecisionInput
): PolicyResult {
  const {
    approverLevel,
    approverId,
    requesterId,
    requesterLevel,
    amount,
    policy,
    firstApproverId,
    firstApproverLevel,
  } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    return deny("INVALID_AMOUNT", "Le montant doit être positif.");
  }
  if (approverLevel === "C") {
    return deny(
      "APPROVER_LEVEL_INSUFFICIENT",
      "Un administrateur de niveau C ne peut pas approuver une demande."
    );
  }
  if (approverId === requesterId) {
    return deny(
      "SELF_APPROVAL_FORBIDDEN",
      "Le demandeur ne peut pas approuver sa propre demande."
    );
  }

  const needsSecond = requiresSecondApproval(amount, policy);

  if (!needsSecond) {
    if (approverLevel === "B" && requesterLevel !== "C") {
      return deny(
        "B_CAN_ONLY_APPROVE_C",
        "Un administrateur B ne peut approuver que les demandes d'un administrateur C sous le seuil."
      );
    }
    return { allowed: true, requiresSecondApproval: false };
  }

  // Double approbation requise.
  if (firstApproverId) {
    if (firstApproverId === approverId) {
      return deny(
        "SECOND_APPROVER_MUST_DIFFER",
        "Le second approbateur doit être différent du premier."
      );
    }
    if (approverLevel !== "A" && firstApproverLevel !== "A") {
      return deny(
        "A_APPROVER_REQUIRED",
        "Au-dessus du seuil, au moins un des deux approbateurs doit être de niveau A."
      );
    }
    return { allowed: true, requiresSecondApproval: true };
  }

  // Premier approbateur d'une demande au-dessus du seuil.
  return { allowed: true, requiresSecondApproval: true };
}

/**
 * Remboursement : B sous son plafond, A dans le sien, jamais C.
 */
export function canRefund(
  level: AdminLevel,
  amount: number,
  policy: FinancePolicy
): PolicyResult {
  if (level === "C") {
    return deny(
      "REFUND_FORBIDDEN",
      "Le niveau C ne peut pas exécuter de remboursement."
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return deny("INVALID_AMOUNT", "Le montant doit être positif.");
  }
  if (amount > policy.refund.max[level]) {
    return deny(
      "REFUND_LIMIT_EXCEEDED",
      `Plafond de remboursement ${level} dépassé (${policy.refund.max[level]} GTC).`
    );
  }
  return { allowed: true };
}

export function assertPolicyAllowed(result: PolicyResult): void {
  if (!result.allowed) {
    throw new FinanceError("FORBIDDEN", result.message, {
      policyCode: result.code,
    });
  }
}
