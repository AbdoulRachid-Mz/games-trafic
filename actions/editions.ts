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
  tournamentPhases,
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
          orderBy: (phases: any, { asc }: any) => [asc(phases.order)],
          with: {
            groups: {
              orderBy: (groups: any, { asc }: any) => [asc(groups.order)],
              with: {
                bracketNodes: true,
                participants: {
                  with: {
                    registration: true,
                  },
                },
              },
            },
            bracketNodes: true,
            matches: true,
          },
        },
        matches: true,
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
 * Get the active phase of an edition, or the most recent one if none is active
 */
export async function getEditionActivePhase(editionId: string) {
  try {
    const phases = await db.query.tournamentPhases.findMany({
      where: and(
        eq(tournamentPhases.editionId, editionId),
        eq(tournamentPhases.isDeleted, false)
      ),
      orderBy: (phases, { asc }) => [asc(phases.order)],
    });

    if (phases.length === 0) return null;

    const activePhase = phases.find((p) => p.isActive);
    if (activePhase) return activePhase;

    // If no active phase, return the last one (highest order)
    return phases[phases.length - 1];
  } catch (error) {
    console.error("Error fetching active phase:", error);
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
/**
 * Delete Edition Registration
 */
export async function deleteEditionRegistrationAction(id: string) {
  try {
    const registration = await db.query.editionRegistrations.findFirst({
      where: eq(editionRegistrations.id, id),
    });

    if (!registration) throw new Error("Registration not found");

    await db.delete(editionRegistrations).where(eq(editionRegistrations.id, id));

    revalidatePath(`/tournaments/${registration.editionId}/dashboard/participants`);
    return { success: true };
  } catch (error) {
    console.error("Delete registration failed", error);
    throw error;
  }
}

/**
 * Add Participant to Edition (Server Action)
 * This handles both existing tournament members and new users
 */
export async function addEditionParticipantAction(data: {
  editionId: string;
  tournamentId: string;
  userId?: string;
  displayName: string;
  email?: string;
  phone?: string;
}) {
  try {
    const { getTournamentMembers, addTournamentMember } = await import("./members");

    let member;

    // 1. Find or Create Member
    if (data.userId) {
      const memberRes = await getTournamentMembers({
        filters: { tournamentId: data.tournamentId, userId: data.userId }
      });
      member = memberRes.data[0];
    }

    if (!member) {
      member = await addTournamentMember({
        tournamentId: data.tournamentId,
        userId: data.userId || null,
        displayName: data.displayName,
        contactEmail: data.email || null,
        contactPhone: data.phone || null,
        role: "PARTICIPANT",
      });
    }

    // 2. Register for Edition
    const [registration] = await db.insert(editionRegistrations).values({
      editionId: data.editionId,
      memberId: member.id,
      status: "REGISTERED",
      checkedIn: false,
      feePaid: true, // Default to paid if added by organizer
    }).returning();

    revalidatePath(`/tournaments/${data.tournamentId}/editions/${data.editionId}/dashboard/participants`);

    return { success: true, registration };
  } catch (error) {
    console.error("Add participant failed", error);
    throw error;
  }
}

/**
 * Reorder Phases
 */
export async function reorderPhasesAction(data: {
  id: string;
  direction: "up" | "down";
  editionId: string;
  tournamentId: string;
}) {
  try {
    const { getTournamentPhases } = await import("./tournaments");
    const { updateTournamentPhase } = await import("./phases");

    const list = await getTournamentPhases({
      filters: { editionId: data.editionId },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });

    const phasesArr = list.data.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = phasesArr.findIndex((p) => p.id === data.id);

    if (idx === -1) return { success: false };

    const swapWith = data.direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= phasesArr.length) return { success: false };

    const a = phasesArr[idx];
    const b = phasesArr[swapWith];

    await updateTournamentPhase(a.id, { order: b.order ?? swapWith + 1 });
    await updateTournamentPhase(b.id, { order: a.order ?? idx + 1 });

    revalidatePath(`/tournaments/${data.tournamentId}/editions/${data.editionId}/dashboard/phases`);
    return { success: true };
  } catch (error) {
    console.error("Reorder failed", error);
    throw error;
  }
}

/**
 * Activate Phase (and deactivate others)
 */
export async function activatePhaseAction(data: {
  id: string;
  editionId: string;
  tournamentId: string;
}) {
  try {
    const { getTournamentPhases } = await import("./tournaments");
    const { updateTournamentPhase } = await import("./phases");

    const list = await getTournamentPhases({
      filters: { editionId: data.editionId },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });

    for (const p of list.data) {
      await updateTournamentPhase(p.id, { isActive: p.id === data.id });
    }

    revalidatePath(`/tournaments/${data.tournamentId}/editions/${data.editionId}/dashboard/phases`);
    return { success: true };
  } catch (error) {
    console.error("Activate phase failed", error);
    throw error;
  }
}
