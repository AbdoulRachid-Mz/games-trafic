import { db } from "@/lib/db";
import { 
  matches, 
  bracketNodes, 
  phaseGroups, 
  phaseGroupParticipants,
  tournamentPhases
} from "@/database/schema";
import { eq, and, asc, isNull } from "drizzle-orm";

/**
 * PropagationService - Handles automatic progression between tournament phases.
 */
export async function propagatePhaseResults(phaseId: string) {
  return await db.transaction(async (tx) => {
    // 1. Get the current phase results
    const phase = await tx.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
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

    if (!phase) throw new Error("Phase not found");

    // 2. Find the next phase
    const nextPhase = await tx.query.tournamentPhases.findFirst({
      where: and(
        eq(tournamentPhases.editionId, phase.editionId),
        eq(tournamentPhases.order, phase.order + 1)
      ),
      with: {
        groups: true,
        bracketNodes: true
      }
    });

    if (!nextPhase) return { success: true, message: "No next phase to propagate to" };

    // 3. Map qualifiers to placeholders
    // Example: Group A, Pos 1 -> QUALIFIER_1_GROUP_A or similar
    // For now, let's use a simple sequential mapping for standard brackets
    const allQualifiers = phase.groups.flatMap(g => 
      g.participants.map((p, idx) => ({
        registrationId: p.registrationId,
        placeholder: `QUALIFIER_${idx + 1}_GROUP_${g.name.split(' ').pop()}` 
      }))
    );

    // 4. Update the next phase's nodes and matches
    // Find nodes in nextPhase that have qualifiers in their metadata or are pending
    const nodes = await tx.select().from(bracketNodes).where(eq(bracketNodes.phaseId, nextPhase.id));
    
    for (const node of nodes) {
      const metadata = (node.metadata as any) || {};
      const participants = metadata.participants || [];
      
      let updated = false;
      const newParticipants = participants.map((p: string) => {
        // If p is a placeholder, try to find the actual ID
        // Simplified: just use sequential mapping if placeholders are index-based
        if (p.startsWith("QUALIFIER_")) {
          // Find by index for now if not explicitly named
          const idx = parseInt(p.split('_')[1]) - 1;
          if (allQualifiers[idx]) {
            updated = true;
            return allQualifiers[idx].registrationId;
          }
        }
        return p;
      });

      if (updated) {
        await tx.update(bracketNodes)
          .set({ 
            metadata: { ...metadata, participants: newParticipants },
            updatedAt: new Date()
          })
          .where(eq(bracketNodes.id, node.id));

        // Also update any matches linked to this node
        // (This might be better handled by a MatchGenerationEngine refresh)
        const nodeMatches = await tx.select().from(matches).where(eq(matches.bracketNodeId, node.id));
        for (const match of nodeMatches) {
           // Logic to update participant1/2 based on new participants list
           // ...
        }
      }
    }

    return { success: true, propagatedCount: allQualifiers.length };
  });
}
