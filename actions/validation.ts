// actions/validation.ts
"use server";

import { validatePhaseConstraints, validateGroupCapacity } from "@/lib/tournaments/bulk-validation";
import type { ValidationResult } from "@/lib/tournaments/bulk-validation";

/**
 * Server Action pour valider les contraintes d'une phase
 * Peut être appelée depuis des Client Components
 */
export async function validatePhaseConstraintsAction(
  phaseId: string,
  actionType: "CREATE_GROUP" | "CREATE_MATCH" | "ADD_PARTICIPANT",
  count: number = 1
): Promise<ValidationResult> {
  return validatePhaseConstraints(phaseId, actionType, count);
}

/**
 * Server Action pour valider la capacité d'un groupe
 * Peut être appelée depuis des Client Components
 */
export async function validateGroupCapacityAction(
  groupId: string,
  additionalCount: number = 1
): Promise<ValidationResult> {
  return validateGroupCapacity(groupId, additionalCount);
}