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
 * Get Tournament Edition by ID (Simple)
 */
export async function getTournamentEditionById(id: string) {
  try {
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, id),
    });
    return edition || null;
  } catch (error) {
    console.error("Error fetching edition:", error);
    return null;
  }
}

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
        phases: {
          orderBy: (phases, { asc }) => [asc(phases.order)],
          with: {
            groups: true,
          }
        }
      },
    });

    if (!edition) return null;

    return {
      ...edition,
      tournament: edition.tournament || undefined,
    } as any;
  } catch (error) {
    console.error("Error fetching edition with relations:", error);
    return null;
  }
}

/**
 * Join an Edition
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
    // 1. Get Edition
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
    });

    if (!edition) throw new Error("Edition not found");

    // 2. Check/Create Tournament Member using the new members action
    const { getTournamentMembers, addTournamentMember } = await import("./members");

    const memberRes = await getTournamentMembers({
      filters: { tournamentId: edition.tournamentId, userId }
    });

    let member = memberRes.data[0];

    if (!member) {
      member = await addTournamentMember({
        tournamentId: edition.tournamentId,
        userId: userId,
        role: "PARTICIPANT",
        displayName: userInfo.username,
        avatar: userInfo.image,
      });
    }

    // 3. Check for Existing Registration
    const existingRegistration = await db.query.editionRegistrations.findFirst({
      where: and(
        eq(editionRegistrations.editionId, editionId),
        eq(editionRegistrations.memberId, member.id)
      ),
    });

    if (existingRegistration) {
      return { success: true, message: "Déjà inscrit", registration: existingRegistration };
    }

    // 4. Handle Private/Paid Editions
    const entryFee = Number(edition.entryFee || 0);
    if (entryFee > 0) {
      return {
        success: false,
        paymentRequired: true,
        paymentDetails: {
          amount: edition.entryFee || "0",
          currency: edition.prizeCurrency || "GTC",
          editionName: edition.name || `Édition #${edition.editionNumber}`
        }
      };
    }

    // 5. Register
    const registration = await db.insert(editionRegistrations).values({
      editionId,
      memberId: member.id,
      status: "REGISTERED",
      checkedIn: false,
      feePaid: true,
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
    const result = await db.update(tournamentEditions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tournamentEditions.id, id))
      .returning();

    if (result[0]) {
      revalidatePath(`/tournaments/${result[0].tournamentId}/editions/${id}`);
    }
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
    const edition = await getTournamentEditionById(id);
    await db.delete(tournamentEditions).where(eq(tournamentEditions.id, id));
    if (edition) {
      revalidatePath(`/tournaments/${edition.tournamentId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Delete failed", error);
    throw error;
  }
}
