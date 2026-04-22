import { db } from "@/lib/db";
import { 
  tournamentPhases, 
  phaseGroups, 
  phaseGroupParticipants, 
  bracketNodes, 
  matches,
  editionRegistrations,
  tournamentMembers
} from "@/database/schema";
import { eq, and, inArray, isNull, sql } from "drizzle-orm";
import { shuffle, chunk } from "./utils";
import { setupLeaguePhase, setupGroupPhase, setupBracketPhase, setupSwissPhase } from "./generators";

export interface PhaseBlueprint {
  name: string;
  phaseType: any;
  order: number;
  config: any;
  participantSource: 'EDITION' | 'PHASE_QUALIFIED' | 'PREVIOUS_PHASE';
}

export interface StructureEngineOptions {
  dryRun?: boolean;
  clearExisting?: boolean;
  clearExistingInPhase?: boolean; // If true, clears structure only for targetPhaseId
  autoInitializeFirstPhase?: boolean;
  targetPhaseId?: string; // If provided, populates this specific phase instead of creating new ones
}

/**
 * StructureEngine - Responsible for building the tournament skeleton and progression.
 */
export async function createStructureEngine({
  editionId,
  phases,
  participantRegIds,
  options = {}
}: {
  editionId: string;
  phases: PhaseBlueprint[];
  participantRegIds: string[];
  options?: StructureEngineOptions;
}) {
  const { dryRun = false, clearExisting = false, autoInitializeFirstPhase = true } = options;

  if (dryRun) {
    return await generatePreview(phases, participantRegIds);
  }

  return await db.transaction(async (tx) => {
    // 1. Clear existing structure if requested
    if (clearExisting) {
      // Deleting phases cascades to groups, nodes, and matches
      await tx.delete(tournamentPhases).where(eq(tournamentPhases.editionId, editionId));
    } else if (options.clearExistingInPhase && options.targetPhaseId) {
      // Localized clearing for a specific phase
      const pId = options.targetPhaseId;
      await tx.delete(matches).where(eq(matches.phaseId, pId));
      await tx.delete(bracketNodes).where(eq(bracketNodes.phaseId, pId));
      await tx.delete(phaseGroups).where(eq(phaseGroups.phaseId, pId));
    }

    // 2. Insert or Retrieve Phases
    let createdPhases: any[] = [];
    
    if (options.targetPhaseId) {
      const existingPhase = await tx.query.tournamentPhases.findFirst({
        where: eq(tournamentPhases.id, options.targetPhaseId)
      });
      if (!existingPhase) throw new Error("Phase cible introuvable");
      
      // Optionnel: Mettre à jour le type de phase si nécessaire
      if (existingPhase.phaseType !== phases[0].phaseType) {
        await tx.update(tournamentPhases)
          .set({ phaseType: phases[0].phaseType, updatedAt: new Date() })
          .where(eq(tournamentPhases.id, options.targetPhaseId));
      }
      
      createdPhases = [existingPhase];
    } else {
      createdPhases = await tx
        .insert(tournamentPhases)
        .values(
          phases.map((p) => ({
            ...p,
            editionId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
        .returning();
    }

    if (!autoInitializeFirstPhase || !participantRegIds || participantRegIds.length === 0) {
      return { success: true, phaseCount: createdPhases.length };
    }

    // 3. Initialize Phases and Propagation
    // Intelligent seeding: Group by team/club to avoid collisions in first phase
    const participantsWithInfo = await getParticipantsInfo(participantRegIds);
    const seededParticipants = intelligentSeeding(participantsWithInfo);
    
    let currentPhaseParticipants = seededParticipants.map(p => p.registrationId);

    for (let i = 0; i < createdPhases.length; i++) {
      const phase = createdPhases[i];
      const blueprint = phases[i];
      const phaseConfig = blueprint.config || {};

      const genOptions = {
        generateGroups: phaseConfig.generateGroups !== false,
        generateNodes: phaseConfig.generateNodes !== false,
        generateMatches: phaseConfig.generateMatches !== false,
        isHomeAway: phaseConfig.isHomeAway || false,
        nodePrefix: phaseConfig.nodePrefix,
      };

      if (phase.phaseType === "ROUND_ROBIN") {
        await setupLeaguePhase(tx, editionId, phase, currentPhaseParticipants, genOptions);
      } else if (phase.phaseType === "GROUP_STAGE") {
        const groups = await setupGroupPhase(tx, editionId, phase, currentPhaseParticipants, {
          ...genOptions,
          groupsCount: phaseConfig.groupsCount,
          participantsPerGroup: phaseConfig.participantsPerGroup,
        });

        // Look-ahead for knockout propagation
        const advanceCount = phaseConfig.advanceCount || 2;
        const totalQualifiers = (groups?.length || 0) * advanceCount;
        currentPhaseParticipants = Array.from({ length: totalQualifiers }, (_, idx) => `QUALIFIER_${idx + 1}`);
      } else if (phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT") {
        await setupBracketPhase(tx, editionId, phase, currentPhaseParticipants, genOptions);
        currentPhaseParticipants = ["WINNER"];
      } else if (phase.phaseType === "SWISS") {
        await setupSwissPhase(tx, editionId, phase, currentPhaseParticipants, {
          ...genOptions,
          roundsCount: phaseConfig.roundsCount,
        });
        const advanceCount = phaseConfig.advanceCount || 8;
        currentPhaseParticipants = Array.from({ length: advanceCount }, (_, idx) => `QUALIFIER_${idx + 1}`);
      }
    }

    return { success: true, phaseCount: createdPhases.length };
  });
}

/**
 * Fetches additional info about participants (team, club) for intelligent seeding.
 */
async function getParticipantsInfo(regIds: string[]) {
  if (!regIds || regIds.length === 0) return [];

  // Filter out placeholders (e.g. QUALIFIER_1) from query
  const realRegIds = regIds.filter(id => id && id.includes("-")); // Simple uuid check
  if (realRegIds.length === 0) return [];

  const registrations = await db.query.editionRegistrations.findMany({
    where: inArray(editionRegistrations.id, realRegIds),
    with: {
      member: true
    }
  });

  return registrations.map(reg => ({
    registrationId: reg.id,
    teamId: (reg.member as any)?.teamId,
    clubName: (reg.member as any)?.clubName
  }));
}

/**
 * Distributes participants to avoid team collisions in the same groups.
 */
function intelligentSeeding(participants: any[]) {
  // Group by team or club
  const teamGroups: Record<string, any[]> = {};
  const noTeam: any[] = [];

  participants.forEach(p => {
    const key = p.teamId || p.clubName;
    if (key) {
      if (!teamGroups[key]) teamGroups[key] = [];
      teamGroups[key].push(p);
    } else {
      noTeam.push(p);
    }
  });

  // Interleave participants from different teams
  const sorted: any[] = [];
  const teamLists = Object.values(teamGroups);
  
  let maxLen = Math.max(...teamLists.map(l => l.length), 0);
  
  for (let i = 0; i < maxLen; i++) {
    for (const list of teamLists) {
      if (list[i]) sorted.push(list[i]);
    }
  }

  return [...sorted, ...shuffle(noTeam)];
}

/**
 * Generates a preview of the structure without saving to DB.
 */
async function generatePreview(phases: PhaseBlueprint[], participantRegIds: string[]) {
  const preview: any = {
    phases: [],
    totalParticipants: participantRegIds.length,
    totalMatches: 0,
    estimatedDays: 0
  };

  let currentParticipantsCount = participantRegIds.length;
  let totalMatches = 0;
  let maxPhaseRounds = 0;

  phases.forEach((p, idx) => {
    const phasePreview: any = {
      name: p.name,
      type: p.phaseType,
      participantCount: currentParticipantsCount,
      groups: [],
      seedingNote: idx === 0 ? "Répartition initiale par équipe" : "Qualificatifs de la phase précédente",
      matchesCount: 0
    };

    let phaseMatches = 0;

    if (p.phaseType === "GROUP_STAGE") {
      const groupsCount = p.config.groupsCount || Math.ceil(currentParticipantsCount / (p.config.participantsPerGroup || 4));
      const perGroup = Math.ceil(currentParticipantsCount / groupsCount);
      const matchesPerGroup = (perGroup * (perGroup - 1)) / 2;
      
      for (let i = 0; i < groupsCount; i++) {
        phasePreview.groups.push({
          name: `Groupe ${String.fromCharCode(65 + i)}`,
          participantCount: perGroup,
          matchesCount: matchesPerGroup
        });
        phaseMatches += matchesPerGroup;
      }
      currentParticipantsCount = groupsCount * (p.config.advanceCount || 2);
    } else if (p.phaseType === "ROUND_ROBIN") {
      const matches = (currentParticipantsCount * (currentParticipantsCount - 1)) / 2;
      const totalRRMatches = p.config.isHomeAway ? matches * 2 : matches;
      phasePreview.groups.push({
        name: "Ligue",
        participantCount: currentParticipantsCount,
        matchesCount: totalRRMatches
      });
      phaseMatches += totalRRMatches;
      currentParticipantsCount = p.config.advanceCount || Math.min(8, currentParticipantsCount);
    } else if (p.phaseType === "ELIMINATION" || p.phaseType === "KNOCKOUT") {
      const rounds = Math.ceil(Math.log2(currentParticipantsCount));
      const totalKMatches = currentParticipantsCount - 1;
      phasePreview.groups.push({
        name: "Tableau",
        participantCount: currentParticipantsCount,
        matchesCount: totalKMatches,
        rounds
      });
      phaseMatches += totalKMatches;
      currentParticipantsCount = 1;
    }

    phasePreview.matchesCount = phaseMatches;
    
    // Only count matches that will be actually created NOW (real participants)
    const isRealPhase = idx === 0 || p.participantSource === 'EDITION';
    if (isRealPhase) {
      preview.totalMatches += phaseMatches;
    }
    
    preview.phases.push(phasePreview);
  });

  return preview;
}
