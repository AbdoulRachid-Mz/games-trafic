"use server";

import {
  tournamentEditions,
  editionRegistrations,
  tournamentMembers,
  teams,
  users,
  TournamentEdition,
  NewEditionRegistration,
  TournamentEditionWithRelations,
} from "@/database/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Type for Edition with Relations
// export type TournamentEditionWithRelations = TournamentEdition & {
//   registrations?: (typeof editionRegistrations.$inferSelect & {
//     member: typeof tournamentMembers.$inferSelect & {
//       user: typeof users.$inferSelect | null;
//       team: typeof teams.$inferSelect | null;
//     };
//   })[];
//   tournament?: {
//     game: string | null;
//     description: string | null;
//     organizerId: string;
//   };
// };

/**
 * Get Tournament Edition with populated relations (Registrations -> Member -> Team/User)
 */
export async function getTournamentEditionWithRelations(
  editionId: string
): Promise<TournamentEditionWithRelations | null> {
  try {
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
      with: {
        tournament: true,
        registrations: {
          with: {
            member: {
              with: {
                user: true,
                team: true,
              },
            },
          },
        },
      },
    });

    if (!edition) return null;

    return {
      ...edition,
      tournament: edition.tournament
        ? edition.tournament
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching edition with relations:", error);
    return null;
  }
}

/**
 * Join an Edition
 * - Ensures User is a Tournament Member
 * - Ensures Member has a Team (Creates one if not, using User info)
 * - Creates Registration
 */
/**
 * Join an Edition
 * - Ensures User is a Tournament Member
 * - Ensures Member has a Team (Creates one if not, using User info)
 * - If Edition is Private/Paid: Returns payment requirement info
 * - If Edition is Public/Free: Creates Registration
 */
export async function joinEdition(
  editionId: string,
  userId: string,
  userInfo: { username: string; image?: string | null }
): Promise<{ 
  success: boolean; 
  message?: string; 
  registration?: typeof editionRegistrations.$inferSelect;
  paymentRequired?: boolean;
  paymentDetails?: {
    amount: string;
    currency: string;
    editionName: string;
  }
}> {
  try {
    // 1. Get Edition to know Tournament ID
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
    });

    if (!edition) throw new Error("Edition not found");

    // 2. Check/Create Tournament Member
    let member = await db.query.tournamentMembers.findFirst({
      where: and(
        eq(tournamentMembers.tournamentId, edition.tournamentId),
        eq(tournamentMembers.userId, userId)
      ),
      with: { team: true },
    });

    let teamId = member?.teamId;

    if (!member) {
      // Create Team first (Solo Team)
      // We create a team for the user so they can participate
      const validTeamName = userInfo.username || `Player-${userId.substring(0,6)}`;
      
      const newTeamResult = await db.insert(teams).values({
        name: validTeamName + (Math.floor(Math.random() * 1000)).toString(), // Simple unique fallback
        captainId: userId,
        logo: userInfo.image,
      }).returning();
      
      const newTeam = newTeamResult[0];
      teamId = newTeam.id;

      // Create Member
      const newMemberResult = await db.insert(tournamentMembers).values({
        tournamentId: edition.tournamentId,
        userId: userId,
        teamId: newTeam.id,
        role: "PARTICIPANT",
        displayName: userInfo.username,
        avatar: userInfo.image,
      }).returning();

      // We need to re-fetch to satisfy type constraints if needed, but here we can construct
      // member = { ...newMemberResult[0], team: newTeam }; // Optional, only if needed locally
      member = { ...newMemberResult[0], team: newTeam };
    } else if (!member.teamId) {
      // Legacy member without team? Should create one.
      const newTeamResult = await db.insert(teams).values({
        name: (member.displayName || userInfo.username || "Solo Team") + "-" + Date.now(),
        captainId: userId,
        logo: member.avatar || userInfo.image,
      }).returning();
      
      teamId = newTeamResult[0].id;
      
      await db.update(tournamentMembers)
        .set({ teamId })
        .where(eq(tournamentMembers.id, member.id));
        
      member.teamId = teamId;
      member.team = newTeamResult[0];
    }

    // 3. Check for Existing Registration
    const existingRegistration = await db.query.editionRegistrations.findFirst({
      where: and(
        eq(editionRegistrations.editionId, editionId),
        eq(editionRegistrations.memberId, member.id)
      ),
    });

    if (existingRegistration) {
      return { success: true, message: "Already registered", registration: existingRegistration };
    }

    // 4. Handle Private/Paid Editions
    // The schema field is 'entryFee' and it's numeric string.
    const entryFee = Number(edition.entryFee || 0);
    const isPrivate = entryFee > 0; // Semantic choice: if there is a fee, we treat it as "Private/Paid" flow

    if (isPrivate) {
      return { 
        success: false, 
        paymentRequired: true, 
        paymentDetails: {
          amount: edition.entryFee || "0",
          currency: edition.prizeCurrency || "GTC",
          editionName: edition.name || `Edition #${edition.editionNumber}`
        }
      };
    }

    // 5. Register (Free/Public)
    const registration = await db.insert(editionRegistrations).values({
      editionId,
      memberId: member.id,
      status: "REGISTERED",
      checkedIn: false,
      feePaid: true, // It's free, so consider it paid/done
    }).returning();

    revalidatePath(`/tournaments/${edition.tournamentId}/editions/${editionId}`);
    
    return { success: true, registration: registration[0] };
  } catch (error) {
    console.error("Error joining edition:", error);
    throw error;
  }
}

/**
 * Update Edition
 */
export async function updateEdition(id: string, data: any) {
    try {
        await db.update(tournamentEditions)
            .set({ 
                ...data,
                updatedAt: new Date()
            })
            .where(eq(tournamentEditions.id, id));
            
        revalidatePath(`/tournaments`); // Broad revalidation might be needed
        return { success: true };
    } catch (error) {
        console.error("Update failed", error);
        throw error;
    }
}

/**
 * Delete Edition
 */
export async function deleteEdition(id: string) {
    try {
        await db.delete(tournamentEditions).where(eq(tournamentEditions.id, id));
        return { success: true };
    } catch (error) {
        console.error("Delete failed", error);
        throw error;
    }
}
