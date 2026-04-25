import { db } from "@/lib/db";
import { 
  matches, 
  bracketNodes, 
  phaseGroups, 
  tournamentPhases, 
  tournamentEditions,
  phaseGroupParticipants,
  editionResults,
  editionRegistrations
} from "@/database/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { syncStandingsWithMatches, rankParticipants, ParticipantStats } from "./standings.engine";
import { computeAggregatedWinner, computeWinner, getRequiredWins } from "./bracket-engine";
import { getDefaultScheduledTime } from "./utils";

export interface ProgressionResult {
  isNodeComplete: boolean;
  isGroupComplete: boolean;
  isPhaseComplete: boolean;
  isEditionComplete: boolean;
  qualifiers?: any[];
  winners?: any[];
  nextLevelToOrganize?: { type: 'NODE' | 'GROUP' | 'PHASE' | 'EDITION', id: string, name: string };
  competitionMode?: string;
}

export async function progressTournamentAfterMatch(matchId: string): Promise<ProgressionResult> {
  const result: ProgressionResult = {
    isNodeComplete: false,
    isGroupComplete: false,
    isPhaseComplete: false,
    isEditionComplete: false,
  };

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: {
      edition: true,
      phase: true,
      group: true,
      bracketNode: true,
    }
  });

  if (!match || match.status !== "COMPLETED") return result;

  const editionConfig = (match.edition?.editionConfig as any) || {};
  const competitionMode = editionConfig.competitionMode || "AUTO";
  result.competitionMode = competitionMode;

  // 1. Check Node Completion (Bracket)
  if (match.bracketNodeId) {
    const nodeMatches = await db.query.matches.findMany({
      where: eq(matches.bracketNodeId, match.bracketNodeId)
    });
    
    const allCompleted = nodeMatches.every(m => m.status === "COMPLETED");
    if (allCompleted && nodeMatches.length > 0) {
      result.isNodeComplete = true;
      // Identifier le vainqueur du noeud
      if (match.winnerRegistrationId) {
         result.qualifiers = [match.winnerRegistrationId];
      }

      if (competitionMode === "AUTO") {
        await propagateBracketNode(match.bracketNodeId);
      } else {
        const node = await db.query.bracketNodes.findFirst({ where: eq(bracketNodes.id, match.bracketNodeId) });
        if (node?.parentNodeId) {
           result.nextLevelToOrganize = { type: 'NODE', id: node.parentNodeId, name: 'Prochain match' };
        }
      }
    }
  }

  // 2. Check Group Completion
  if (match.groupId) {
    const groupMatches = await db.query.matches.findMany({
      where: eq(matches.groupId, match.groupId)
    });
    
    const allCompleted = groupMatches.every(m => m.status === "COMPLETED");
    if (allCompleted && groupMatches.length > 0) {
      result.isGroupComplete = true;
      
      // Mettre à jour le statut du groupe
      await db.update(phaseGroups).set({ isCompleted: true }).where(eq(phaseGroups.id, match.groupId));

      // Calculer les classements
      const groupParticipants = await db.query.phaseGroupParticipants.findMany({
        where: eq(phaseGroupParticipants.groupId, match.groupId)
      });
      const participantIds = groupParticipants.map(p => p.registrationId);
      
      const config = (match.group?.config as any) || {};
      const statsMap = syncStandingsWithMatches(participantIds, groupMatches as any[], config);
      const ranked = rankParticipants(statsMap, config);

      const advanceCount = config.advanceCount || 2;
      
      const qualifiers = [];
      for (let i = 0; i < ranked.length; i++) {
        const { registrationId, stats } = ranked[i];
        const isQualified = i < advanceCount;
        if (isQualified) qualifiers.push(registrationId);

        await db.update(phaseGroupParticipants)
          .set({ 
            position: i + 1, 
            qualified: isQualified,
            matchesPlayed: stats.matchesPlayed,
            matchesWon: stats.matchesWon,
            matchesDrawn: stats.matchesDrawn,
            matchesLost: stats.matchesLost,
            points: stats.points,
            scoreFor: stats.scoreFor,
            scoreAgainst: stats.scoreAgainst,
            updatedAt: new Date()
          })
          .where(and(eq(phaseGroupParticipants.groupId, match.groupId), eq(phaseGroupParticipants.registrationId, registrationId)));
      }

      result.qualifiers = qualifiers;

      // La propagation groupe vers phase suivante se fait généralement à la fin de TOUTE la phase.
    }
  }

  // 3. Check Phase Completion
  const phaseMatches = await db.query.matches.findMany({
    where: eq(matches.phaseId, match.phaseId)
  });
  
  const allPhaseCompleted = phaseMatches.every(m => m.status === "COMPLETED");
  if (allPhaseCompleted && phaseMatches.length > 0) {
    result.isPhaseComplete = true;
    await db.update(tournamentPhases).set({ isCompleted: true }).where(eq(tournamentPhases.id, match.phaseId));
    
    // Si c'est un Bracket et pas un groupe, le vainqueur de la phase c'est le vainqueur de la finale
    if (!match.groupId && match.bracketNode) {
      // Trouver le noeud racine (qui n'a pas de parent)
      const rootNode = await db.query.bracketNodes.findFirst({
        where: and(eq(bracketNodes.phaseId, match.phaseId), eq(bracketNodes.depth, 0))
      });
      if (rootNode && rootNode.winnerRegistrationId) {
        result.winners = [rootNode.winnerRegistrationId];
      } else if (match.winnerRegistrationId) { // Fallback si le depth n'est pas bien set
        result.winners = [match.winnerRegistrationId];
      }
    }

    const allPhases = await db.query.tournamentPhases.findMany({
      where: eq(tournamentPhases.editionId, match.editionId),
      orderBy: [asc(tournamentPhases.order)]
    });

    const currentIndex = allPhases.findIndex(p => p.id === match.phaseId);
    if (currentIndex !== -1 && currentIndex + 1 < allPhases.length) {
      const nextPhase = allPhases[currentIndex + 1];
      result.nextLevelToOrganize = { type: 'PHASE', id: nextPhase.id, name: nextPhase.name };
      
      if (competitionMode === "AUTO") {
        // En mode AUTO, propager les qualifiés vers la phase suivante (déjà implémenté en partie via markGroupCompleteAction, mais on centralise ici)
        await propagatePhaseToNextPhase(match.phaseId, nextPhase.id);
      }
    } else {
      // Pas de prochaine phase = Fin de l'édition !
      result.isEditionComplete = true;
    }
  }

  // 4. Edition Completion — Attribution du champion
  if (result.isEditionComplete) {
    const winnerRegId = result.winners?.[0] || match.winnerRegistrationId;
    if (winnerRegId) {
      // Récupérer les infos complètes du gagnant pour le snapshot winnerMetadata
      const winnerReg = await db.query.editionRegistrations.findFirst({
        where: eq(editionRegistrations.id, winnerRegId),
        with: {
          member: {
            with: {
              user: true,
            }
          }
        }
      });

      const winnerMemberId = winnerReg?.memberId;
      const winnerMetadata = winnerReg ? {
        displayName: winnerReg.member?.displayName || winnerReg.member?.user?.username || "Champion",
        avatar: winnerReg.member?.avatar || winnerReg.member?.user?.image || null,
        gameTag: winnerReg.member?.gameTag || null,
        clubName: winnerReg.member?.clubName || null,
        registrationId: winnerRegId,
        memberId: winnerMemberId,
        confirmedAt: new Date().toISOString(),
      } : {};

      await db.update(tournamentEditions).set({
        status: "COMPLETED",
        endDate: new Date(),
        winnerId: winnerMemberId || null,
        winnerMetadata,
      }).where(eq(tournamentEditions.id, match.editionId));

      // Mettre à jour la position finale dans editionResults (1er = champion)
      if (winnerRegId) {
        await db.insert(editionResults)
          .values({
            editionId: match.editionId,
            registrationId: winnerRegId,
            position: 1,
            tier: "GOLD",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [editionResults.editionId, editionResults.registrationId],
            set: { position: 1, tier: "GOLD", updatedAt: new Date() },
          });
      }
    }
  }

  return result;
}


/**
 * Propage un vainqueur de noeud bracket vers son noeud parent
 */

async function propagateBracketNode(nodeId: string, tx?: any) {
  const dbClient = tx || db;
  
  const currentNode = await dbClient.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
  });

  if (!currentNode?.parentNodeId) return;

  // Déterminer le gagnant du nœud courant
  const nodeMatches = await dbClient.query.matches.findMany({
    where: eq(matches.bracketNodeId, nodeId)
  });
  
  const metadata = (currentNode.metadata as any) || {};
  const isHomeAway = metadata.isHomeAway === true || metadata.format === "HOME_AWAY";
  
  let winnerRegistrationId: string | null = null;
  
  if (isHomeAway) {
    // Mode aller-retour - score agrégé
    const completedMatches = nodeMatches.filter((m: any) => m.status === "COMPLETED" && m.confirmedByAdmin);
    const { aggregateScore1, aggregateScore2 } = computeAggregatedWinner(completedMatches);
    if (aggregateScore1 > aggregateScore2) {
      winnerRegistrationId = nodeMatches[0]?.participant1RegistrationId;
    } else if (aggregateScore2 > aggregateScore1) {
      winnerRegistrationId = nodeMatches[0]?.participant2RegistrationId;
    }
  } else {
    // Mode BO1/BO3/BO5
    const requiredWins = getRequiredWins(metadata.matchFormat || "BEST_OF_1");
    const { winnerId } = computeWinner(nodeMatches, requiredWins);
    winnerRegistrationId = winnerId;
  }
  
  if (!winnerRegistrationId) return;

  // Mettre à jour le nœud courant
  await dbClient.update(bracketNodes)
    .set({ isCompleted: true, winnerRegistrationId })
    .where(eq(bracketNodes.id, nodeId));

  if (currentNode.parentNodeId) {
    const parentNode = await dbClient.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, currentNode.parentNodeId),
    });

    if (parentNode) {
      // ⚠️ Important: Vérifier si le parent a déjà un match
      let parentMatch = await dbClient.query.matches.findFirst({
        where: eq(matches.bracketNodeId, parentNode.id),
      });

      if (!parentMatch) {
        // Créer le match parent s'il n'existe pas
        [parentMatch] = await dbClient.insert(matches).values({
          editionId: currentNode.editionId,
          phaseId: parentNode.phaseId,
          groupId: parentNode.groupId,
          bracketNodeId: parentNode.id,
          status: "PENDING",
          round: parentNode.round || 1,
          matchNumber: parentNode.matchNumber || 1,
          matchCode: parentNode.nodeCode || `M${parentNode.id.slice(0, 8)}`,
          scheduledTime: getDefaultScheduledTime(parentNode.round || 1, parentNode.matchNumber || 1),
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
      }

      // Assigner le winner au bon slot
      const updateData: any = {};
      if (!parentMatch.participant1RegistrationId) {
        updateData.participant1RegistrationId = winnerRegistrationId;
      } else if (!parentMatch.participant2RegistrationId && parentMatch.participant1RegistrationId !== winnerRegistrationId) {
        updateData.participant2RegistrationId = winnerRegistrationId;
      }

      if (Object.keys(updateData).length > 0) {
        await dbClient.update(matches)
          .set(updateData)
          .where(eq(matches.id, parentMatch.id));
      }
    }
  }
}

/**
 * Propage les qualifiés d'une phase vers la phase suivante (via le bracket node)
 */
async function propagatePhaseToNextPhase(currentPhaseId: string, nextPhaseId: string) {
  const phase = await db.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, currentPhaseId),
    with: {
      groups: {
        with: {
          participants: {
            where: eq(phaseGroupParticipants.qualified, true),
            orderBy: [asc(phaseGroupParticipants.position)]
          }
        }
      }
    }
  });

  if (!phase) return;

  const allQualifiers = phase.groups.flatMap(g => 
    g.participants.map((p, idx) => ({
      registrationId: p.registrationId,
      placeholder: `QUALIFIER_${idx + 1}_GROUP_${g.name.split(' ').pop()}` 
    }))
  );

  const nodes = await db.query.bracketNodes.findMany({
     where: eq(bracketNodes.phaseId, nextPhaseId)
  });
  
  // Remplacer les placeholders dans metadata.participants
  for (const node of nodes) {
    const metadata = (node.metadata as any) || {};
    const participants = metadata.participants || [];
    
    let updated = false;
    const newParticipants = participants.map((p: string) => {
      if (p.startsWith("QUALIFIER_")) {
        // Logique basique de remplacement
        const idx = parseInt(p.split('_')[1]) - 1;
        if (allQualifiers[idx]) {
          updated = true;
          return allQualifiers[idx].registrationId;
        }
      }
      return p;
    });

    if (updated) {
      await db.update(bracketNodes)
        .set({ 
          metadata: { ...metadata, participants: newParticipants },
          updatedAt: new Date()
        })
        .where(eq(bracketNodes.id, node.id));
        
      // Propager aussi dans les matchs du noeud (participant1, participant2)
      // Ceci nécessite une logique plus complexe si les matchs existent déjà
      // Idéalement on utilise match-generation-engine pour regénérer les matchs
    }
  }
}
