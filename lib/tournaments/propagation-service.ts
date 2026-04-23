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
 * @deprecated La propagation est maintenant gérée par markGroupCompleteAction et markBracketNodeCompleteAction
 * Cette fonction est conservée pour compatibilité avec le mode MANUAL.
 */
export async function propagatePhaseResults(phaseId: string) {
  console.warn("[DEPRECATED] propagatePhaseResults is deprecated. Propagation is now handled by markGroupCompleteAction and markBracketNodeCompleteAction.");
  
  return await db.transaction(async (tx) => {
    // Garder l'ancienne logique pour compatibilité
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

    const allQualifiers = phase.groups.flatMap(g => 
      g.participants.map((p, idx) => ({
        registrationId: p.registrationId,
        placeholder: `QUALIFIER_${idx + 1}_GROUP_${g.name.split(' ').pop()}` 
      }))
    );

    const nodes = await tx.select().from(bracketNodes).where(eq(bracketNodes.phaseId, nextPhase.id));
    
    for (const node of nodes) {
      const metadata = (node.metadata as any) || {};
      const participants = metadata.participants || [];
      
      let updated = false;
      const newParticipants = participants.map((p: string) => {
        if (p.startsWith("QUALIFIER_")) {
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
      }
    }

    return { success: true, propagatedCount: allQualifiers.length };
  });
}