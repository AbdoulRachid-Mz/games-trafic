// lib/validation/bulk-validation.ts
// ⚠️ CE FICHIER NE DOIT PAS ÊTRE IMPORTÉ DANS UN CLIENT COMPONENT
// Utiliser uniquement dans les Server Components et Server Actions

import { db } from "@/lib/db";
import {
  phaseGroups,
  matches,
  phaseGroupParticipants,
  tournamentPhases,
} from "@/database/schema";
import { eq } from "drizzle-orm";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide qu'une action bulk respecte les limites de la phase parente
 * À utiliser UNIQUEMENT côté serveur (Server Actions, API Routes)
 */
export async function validatePhaseConstraints(
  phaseId: string,
  actionType: "CREATE_GROUP" | "CREATE_MATCH" | "ADD_PARTICIPANT",
  count: number = 1,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
    });

    if (!phase) {
      errors.push("Phase introuvable");
      return { isValid: false, errors, warnings };
    }

    const config = (phase.config as any) || {};

    // Vérification selon le type d'action
    if (actionType === "CREATE_GROUP") {
      const existingGroups = await db.query.phaseGroups.findMany({
        where: eq(phaseGroups.phaseId, phaseId),
      });

      const maxGroups = config.maxGroups || 10;
      if (existingGroups.length + count > maxGroups) {
        errors.push(`Limite de groupes atteinte (max: ${maxGroups})`);
      }
    }

    if (actionType === "CREATE_MATCH") {
      const existingMatches = await db.query.matches.findMany({
        where: eq(matches.phaseId, phaseId),
      });

      const maxMatches = config.maxMatches || 100;
      if (existingMatches.length + count > maxMatches) {
        errors.push(`Limite de matchs atteinte (max: ${maxMatches})`);
      }
    }

    if (actionType === "ADD_PARTICIPANT") {
      const participants = await db.query.phaseGroupParticipants.findMany({
        where: eq(phaseGroupParticipants.groupId, phaseId),
      });

      const maxParticipants = config.maxParticipants || 32;
      if (participants.length + count > maxParticipants) {
        errors.push(
          `Limite de participants atteinte (max: ${maxParticipants})`,
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Erreur de validation: ${error}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Valide qu'un groupe peut accueillir des participants
 * À utiliser UNIQUEMENT côté serveur (Server Actions, API Routes)
 */
export async function validateGroupCapacity(
  groupId: string,
  additionalCount: number = 1,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const group = await db.query.phaseGroups.findFirst({
      where: eq(phaseGroups.id, groupId),
      with: { participants: true },
    });

    if (!group) {
      errors.push("Groupe introuvable");
      return { isValid: false, errors, warnings };
    }

    const config = (group.config as any) || {};
    const maxParticipants = config.maxParticipants || 8;
    const currentCount = group.participants?.length || 0;

    if (currentCount + additionalCount > maxParticipants) {
      errors.push(
        `Capacité du groupe dépassée (${currentCount}/${maxParticipants})`,
      );
    }

    if (group.isLocked) {
      errors.push("Ce groupe est verrouillé, modification impossible");
    }

    if (group.isCompleted) {
      errors.push("Ce groupe est terminé, modification impossible");
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Erreur de validation: ${error}`);
    return { isValid: false, errors, warnings };
  }
}