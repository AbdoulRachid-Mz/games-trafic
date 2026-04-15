"use server";

import {
  tournamentEditions,
  editionRegistrations,
  TournamentEditionWithRelations,
  tournamentPhases,
  phaseGroupParticipants,
  matches,
  type NewTournamentEdition,
} from "@/database/schema";
import { db } from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getMatchesWithParticipants } from "./phases";

import { Parser } from "@json2csv/plainjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  editionId: string,
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
        eq(tournamentPhases.isDeleted, false),
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
  userInfo: { username: string; image?: string | null },
): Promise<{
  success: boolean;
  message?: string;
  registration?: typeof editionRegistrations.$inferSelect;
  paymentRequired?: boolean;
  paymentDetails?: {
    amount: string;
    currency: string;
    editionName: string;
  };
}> {
  try {
    // 1. Get Edition
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
    });

    if (!edition) throw new Error("Edition not found");

    // 2. Check/Create Tournament Member using the new members action
    const { getTournamentMembers, addTournamentMember } =
      await import("./members");

    const memberRes = await getTournamentMembers({
      filters: { tournamentId: edition.tournamentId, userId },
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
        eq(editionRegistrations.memberId, member.id),
      ),
    });

    if (existingRegistration) {
      return {
        success: true,
        message: "Déjà inscrit",
        registration: existingRegistration,
      };
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
          editionName: edition.name || `Édition #${edition.editionNumber}`,
        },
      };
    }

    // 5. Register
    const registration = await db
      .insert(editionRegistrations)
      .values({
        editionId,
        memberId: member.id,
        status: "REGISTERED",
        checkedIn: false,
        feePaid: true,
      })
      .returning();

    revalidatePath(
      `/tournaments/${edition.tournamentId}/editions/${editionId}`,
    );

    return { success: true, registration: registration[0] };
  } catch (error) {
    console.error("Error joining edition:", error);
    throw error;
  }
}

/**
 * Update Edition
 */
export async function updateEdition(
  id: string,
  data: Partial<NewTournamentEdition>,
) {
  try {
    const result = await db
      .update(tournamentEditions)
      .set({
        ...data,
        updatedAt: new Date(),
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
 * Vérifie les dépendances avant suppression (matches, groupes)
 */
export async function deleteEditionRegistrationAction(id: string) {
  try {
    const registration = await db.query.editionRegistrations.findFirst({
      where: eq(editionRegistrations.id, id),
    });

    if (!registration) throw new Error("Registration not found");

    // ⚠️ Vérifier les dépendances avant suppression
    const deps = await checkParticipantDependencies(id);
    if (deps.hasBlockers) {
      throw new Error(
        `Impossible de retirer ce participant : il est impliqué dans ${
          deps.matchCount > 0 ? `${deps.matchCount} match(s)` : ""
        }${
          deps.groupCount > 0 ? `, ${deps.groupCount} groupe(s)` : ""
        }. Retirez-le d'abord de ces entités.`,
      );
    }

    await db
      .delete(editionRegistrations)
      .where(eq(editionRegistrations.id, id));
    revalidatePath(
      `/tournaments/${registration.editionId}/dashboard/participants`,
    );
    return { success: true };
  } catch (error) {
    console.error("Delete registration failed", error);
    throw error;
  }
}

/**
 * Helper: vérifie si une registration est utilisée dans des matches ou des groupes
 */
export async function checkParticipantDependencies(
  registrationId: string,
): Promise<{
  hasBlockers: boolean;
  matchCount: number;
  groupCount: number;
}> {
  const [groupParticipants, matchesAsP1, matchesAsP2] = await Promise.all([
    db.query.phaseGroupParticipants.findMany({
      where: eq(phaseGroupParticipants.registrationId, registrationId),
    }),
    db.query.matches.findMany({
      where: eq(matches.participant1RegistrationId, registrationId),
      columns: { id: true },
    }),
    db.query.matches.findMany({
      where: eq(matches.participant2RegistrationId, registrationId),
      columns: { id: true },
    }),
  ]);

  const matchCount = matchesAsP1.length + matchesAsP2.length;
  const groupCount = groupParticipants.length;

  return {
    hasBlockers: matchCount > 0 || groupCount > 0,
    matchCount,
    groupCount,
  };
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
    const { getTournamentMembers, addTournamentMember } =
      await import("./members");

    let member;

    // 1. Find or Create Member
    if (data.userId) {
      const memberRes = await getTournamentMembers({
        filters: { tournamentId: data.tournamentId, userId: data.userId },
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
    const [registration] = await db
      .insert(editionRegistrations)
      .values({
        editionId: data.editionId,
        memberId: member.id,
        status: "REGISTERED",
        checkedIn: false,
        feePaid: true, // Default to paid if added by organizer
      })
      .returning();

    revalidatePath(
      `/tournaments/${data.tournamentId}/editions/${data.editionId}/dashboard/participants`,
    );

    return { success: true, registrationId: registration.id };
  } catch (error: any) {
    console.error("Add participant failed", error);
    return { success: false, error: error.message || "Erreur inconnue" };
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

    const phasesArr = list.data
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = phasesArr.findIndex((p) => p.id === data.id);

    if (idx === -1) return { success: false };

    const swapWith = data.direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= phasesArr.length) return { success: false };

    const a = phasesArr[idx];
    const b = phasesArr[swapWith];

    await updateTournamentPhase(a.id, { order: b.order ?? swapWith + 1 });
    await updateTournamentPhase(b.id, { order: a.order ?? idx + 1 });

    revalidatePath(
      `/tournaments/${data.tournamentId}/editions/${data.editionId}/dashboard/phases`,
    );
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
    // 1. Deactivate all phases for this edition
    await db
      .update(tournamentPhases)
      .set({ isActive: false })
      .where(eq(tournamentPhases.editionId, data.editionId));

    // 2. Activate the target phase
    await db
      .update(tournamentPhases)
      .set({ isActive: true })
      .where(eq(tournamentPhases.id, data.id));

    revalidatePath(
      `/tournaments/${data.tournamentId}/editions/${data.editionId}/dashboard/phases`,
    );
    return { success: true };
  } catch (error) {
    console.error("Activate phase failed", error);
    throw error;
  }
}

/**
 * Termine formellement une édition (clôture)
 */
export async function finishEditionAction(editionId: string) {
  try {
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
    });

    if (!edition) throw new Error("Édition introuvable");
    if (edition.status === "COMPLETED") return { success: true };

    const result = await db
      .update(tournamentEditions)
      .set({
        status: "COMPLETED",
        endDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tournamentEditions.id, editionId))
      .returning();

    revalidatePath(
      `/tournaments/${edition.tournamentId}/editions/${editionId}`,
    );
    return { success: true, edition: result[0] };
  } catch (error) {
    console.error("Finish edition failed", error);
    throw error;
  }
}

/**
 * Export des participants d'une édition
 */
export async function exportEditionParticipants(
  editionId: string,
  format: "csv" | "json" | "pdf",
): Promise<{
  success: boolean;
  data?: string;
  error?: string;
  filename?: string;
}> {
  try {
    // 1. Récupérer les données enrichies
    const registrations = await db.query.editionRegistrations.findMany({
      where: eq(editionRegistrations.editionId, editionId),
      with: {
        member: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                profileImage: true,
              },
            },
            team: { columns: { id: true, name: true, logo: true } },
          },
        },
        results: true,
        groupParticipations: {
          with: { group: { with: { phase: true } } },
        },
      },
    });

    // 2. Transformer les données pour l'export
    const exportData = registrations.map((reg) => {
      const result = reg.results?.[0];
      return {
        Nom: reg.member?.displayName || reg.member?.user?.username || "N/A",
        Email: reg.member?.user?.email || reg.member?.contactEmail || "N/A",
        Équipe: reg.member?.team?.name || "Individuel",
        Statut: reg.status,
        "Check-in": reg.checkedIn ? "Oui" : "Non",
        Payé: reg.feePaid ? "Oui" : "Non",
        "Matches joués": result?.matchesPlayed || 0,
        Victoires: result?.matchesWon || 0,
        Défaites: result?.matchesLost || 0,
        // 'Points': result?.points || 0,
        Position: result?.position || "N/A",
        "Date inscription": reg.registeredAt
          ? new Date(reg.registeredAt).toLocaleDateString("fr-FR")
          : "N/A",
      };
    });

    let data: string | undefined;
    let filename: string | undefined;
    let contentType: string | undefined;

    if (format === "csv") {
      const parser = new Parser();
      data = parser.parse(exportData);
      filename = `participants_${editionId}_${Date.now()}.csv`;
      contentType = "text/csv";
    } else if (format === "json") {
      data = JSON.stringify(exportData, null, 2);
      filename = `participants_${editionId}_${Date.now()}.json`;
      contentType = "application/json";
    } else if (format === "pdf") {
      // Génération PDF avec jspdf
      const doc = new jsPDF({ orientation: "landscape" });

      // En-tête
      doc.setFontSize(16);
      doc.text(`Liste des participants - Édition ${editionId}`, 14, 15);
      doc.setFontSize(10);
      doc.text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
        14,
        25,
      );

      // Tableau
      const tableData = exportData.map((row) => [
        row["Nom"],
        row["Email"],
        row["Équipe"],
        row["Statut"],
        row["Check-in"],
        row["Payé"],
        row["Matches joués"].toString(),
        row["Victoires"].toString(),
        row["Défaites"].toString(),
        // row['Points'].toString(),
        row["Position"],
        row["Date inscription"].toString(),
      ]);

      autoTable(doc, {
        head: [
          [
            "Nom",
            "Email",
            "Équipe",
            "Statut",
            "Check-in",
            "Payé",
            "MJ",
            "V",
            "D",
            "Position",
            "Date inscription",
          ],
        ],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 98, 255], textColor: 255, fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      data = doc.output("datauristring");
      filename = `participants_${editionId}_${Date.now()}.pdf`;
      contentType = "application/pdf";
    }

    return { success: true, data, filename, error: undefined };
  } catch (error) {
    console.error("Export failed:", error);
    return {
      success: false,
      error: String(error),
      data: undefined,
      filename: undefined,
    };
  }
}

/**
 * Export des matchs d'une édition
 */
// actions/editions.ts

/**
 * Export des matchs d'une édition
 * Formats: CSV, JSON, PDF
 */
export async function exportEditionMatches(
  editionId: string,
  format: "csv" | "json" | "pdf",
): Promise<{
  success: boolean;
  data?: string;
  error?: string;
  filename?: string;
}> {
  try {
    // 1. Récupérer les matchs enrichis
    const matchesRes = await getMatchesWithParticipants({
      filters: { editionId },
      pagination: { page: 1, limit: 1000 },
    });

    const matches = matchesRes.data;

    // 2. Transformer les données pour l'export
    const exportData = matches.map((m: any) => ({
      "Match #": m.matchNumber || "N/A",
      Code: m.matchCode || "N/A",
      Phase: m.phase?.name || "N/A",
      Groupe: m.group?.name || "N/A",
      Round: m.round || 1,
      "Joueur 1":
        m.participant1?.member?.displayName ||
        m.participant1?.member?.user?.username ||
        m.participant1?.member?.team?.name ||
        "TBD",
      "Tag 1": m.participant1?.member?.gameTag || "N/A",
      "Joueur 2":
        m.participant2?.member?.displayName ||
        m.participant2?.member?.user?.username ||
        m.participant2?.member?.team?.name ||
        "TBD",
      "Tag 2": m.participant2?.member?.gameTag || "N/A",
      Score:
        m.score1 !== null && m.score2 !== null
          ? `${m.score1} - ${m.score2}`
          : "N/A",
      Vainqueur:
        m.winnerRegistrationId === m.participant1RegistrationId
          ? "J1"
          : m.winnerRegistrationId === m.participant2RegistrationId
            ? "J2"
            : "N/A",
      Statut: getMatchStatusLabel(m.status),
      "Date planifiée": m.scheduledTime
        ? new Date(m.scheduledTime).toLocaleString("fr-FR")
        : "N/A",
      "Date réelle": m.actualStartTime
        ? new Date(m.actualStartTime).toLocaleString("fr-FR")
        : "N/A",
      "Durée (min)": m.duration || "N/A",
      Stream: m.streamLink || "N/A",
      Litige: m.disputed ? "Oui" : "Non",
    }));

    let data: string | undefined;
    let filename: string | undefined;
    let contentType: string | undefined;

    if (format === "csv") {
      const parser = new Parser();
      data = parser.parse(exportData);
      filename = `matches_${editionId}_${Date.now()}.csv`;
      contentType = "text/csv";
    } else if (format === "json") {
      data = JSON.stringify(exportData, null, 2);
      filename = `matches_${editionId}_${Date.now()}.json`;
      contentType = "application/json";
    } else if (format === "pdf") {
      // Génération PDF avec jspdf
      const doc = new jsPDF({ orientation: "landscape" });

      // En-tête
      doc.setFontSize(16);
      doc.text(`Calendrier des matchs - Édition ${editionId}`, 14, 15);
      doc.setFontSize(10);
      doc.text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
        14,
        25,
      );

      // Statistiques rapides
      const totalMatches = exportData.length;
      const completedMatches = exportData.filter(
        (m) => m.Statut === "Terminé",
      ).length;
      const pendingMatches = exportData.filter(
        (m) => m.Statut === "Programmé",
      ).length;

      doc.setFontSize(9);
      doc.text(
        `Total: ${totalMatches} matchs | Terminés: ${completedMatches} | À venir: ${pendingMatches}`,
        14,
        35,
      );

      // Tableau des matchs
      const tableData = exportData.map((row) => [
        row["Match #"].toString(),
        row["Phase"],
        row["Groupe"],
        row["Round"].toString(),
        row["Joueur 1"].substring(0, 20),
        row["Joueur 2"].substring(0, 20),
        row["Score"],
        row["Statut"],
        row["Date planifiée"].substring(0, 16),
      ]);

      autoTable(doc, {
        head: [
          [
            "#",
            "Phase",
            "Groupe",
            "R",
            "Joueur 1",
            "Joueur 2",
            "Score",
            "Statut",
            "Date",
          ],
        ],
        body: tableData,
        startY: 45,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 98, 255], textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 10 },
          4: { cellWidth: 40 },
          5: { cellWidth: 40 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
          8: { cellWidth: 35 },
        },
      });

      data = doc.output("datauristring");
      filename = `matches_${editionId}_${Date.now()}.pdf`;
      contentType = "application/pdf";
    }

    return { success: true, data, filename };
  } catch (error) {
    console.error("Export matches failed:", error);
    return { success: false, error: String(error) };
  }
}

function getMatchStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Programmé",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
    PENDING_REVIEW: "En attente",
    AWAITING_ADMIN_CONFIRMATION: "Validation admin",
    DISPUTED: "Litige",
  };
  return labels[status] || status;
}

// Ajouter dans actions/editions.ts

export type ExportFormat = "csv" | "json" | "pdf" | "excel";

export interface ExportMatchesFilters {
  editionId: string;
  phaseId?: string;
  groupId?: string;
  bracketNodeId?: string;
  status?: string;
  search?: string;
}

/**
 * Export des matchs avec support des filtres et différents formats
 */
export async function exportMatchesToFormat(
  editionId: string,
  format: ExportFormat,
  filters?: ExportMatchesFilters
): Promise<{
  success: boolean;
  data?: string;
  error?: string;
  filename?: string;
  count?: number;
}> {
  try {
    // Construire les filtres
    const matchFilters: any = { editionId };
    if (filters?.phaseId) matchFilters.phaseId = filters.phaseId;
    if (filters?.groupId) matchFilters.groupId = filters.groupId;
    if (filters?.bracketNodeId) matchFilters.bracketNodeId = filters.bracketNodeId;
    if (filters?.status) matchFilters.statuses = [filters.status];
    if (filters?.search) matchFilters.search = filters.search;

    // Récupérer les matchs enrichis
    const matchesRes = await getMatchesWithParticipants({
      filters: matchFilters,
      pagination: { page: 1, limit: 5000 },
      options: { sortBy: "scheduledTime", sortOrder: "asc" }
    });

    const matches = matchesRes.data;
    const totalCount = matchesRes.pagination.total;

    // Transformer les données pour l'export
    const exportData = matches.map((m: any) => ({
      "Match #": m.matchNumber || "N/A",
      "Code": m.matchCode || "N/A",
      "Phase": m.phase?.name || "N/A",
      "Groupe": m.group?.name || "N/A",
      "Round": m.round || 1,
      "Joueur 1": m.participant1?.member?.displayName || m.participant1?.member?.user?.username || m.participant1?.member?.team?.name || "TBD",
      "Tag 1": m.participant1?.member?.gameTag || "N/A",
      "Joueur 2": m.participant2?.member?.displayName || m.participant2?.member?.user?.username || m.participant2?.member?.team?.name || "TBD",
      "Tag 2": m.participant2?.member?.gameTag || "N/A",
      "Score": m.score1 !== null && m.score2 !== null ? `${m.score1} - ${m.score2}` : "N/A",
      "Vainqueur": m.winnerRegistrationId === m.participant1RegistrationId ? "J1" : m.winnerRegistrationId === m.participant2RegistrationId ? "J2" : "N/A",
      "Statut": getMatchStatusLabel(m.status),
      "Date planifiée": m.scheduledTime ? new Date(m.scheduledTime).toLocaleString("fr-FR") : "N/A",
      "Date réelle": m.actualStartTime ? new Date(m.actualStartTime).toLocaleString("fr-FR") : "N/A",
      "Durée (min)": m.duration || "N/A",
      "Stream": m.streamLink || "N/A",
      "Litige": m.disputed ? "Oui" : "Non",
    }));

    let data: string | undefined;
    let filename: string | undefined;
    let blob: Blob | undefined;

    const timestamp = Date.now();
    const filePrefix = `matches_${editionId}${filters?.phaseId ? `_phase_${filters.phaseId.slice(0, 8)}` : ""}${filters?.groupId ? `_group_${filters.groupId.slice(0, 8)}` : ""}`;

    if (format === "csv") {
      const parser = new Parser();
      data = parser.parse(exportData);
      filename = `${filePrefix}_${timestamp}.csv`;
      blob = new Blob([data], { type: "text/csv;charset=utf-8" });
    } else if (format === "json") {
      data = JSON.stringify(exportData, null, 2);
      filename = `${filePrefix}_${timestamp}.json`;
      blob = new Blob([data], { type: "application/json" });
    } else if (format === "excel") {
      // Pour Excel, on utilise une librairie comme xlsx
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Matchs");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      filename = `${filePrefix}_${timestamp}.xlsx`;
      data = URL.createObjectURL(blob);
    } else if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      
      // En-tête
      doc.setFontSize(16);
      doc.text(`Calendrier des matchs - Édition ${editionId}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 14, 25);
      
      // Filtres actifs
      let filterY = 35;
      if (filters?.phaseId) {
        doc.setFontSize(9);
        doc.text(`Phase: ${filters.phaseId.slice(0, 8)}...`, 14, filterY);
        filterY += 5;
      }
      if (filters?.status) {
        doc.text(`Statut: ${filters.status}`, 14, filterY);
        filterY += 5;
      }
      
      // Statistiques
      const totalMatches = exportData.length;
      const completedMatches = exportData.filter((m) => m.Statut === "Terminé").length;
      const pendingMatches = exportData.filter((m) => m.Statut === "En attente").length;
      
      doc.setFontSize(9);
      doc.text(`Total: ${totalMatches} matchs | Terminés: ${completedMatches} | En attente: ${pendingMatches}`, 14, filterY + 5);
      
      // Tableau des matchs
      const tableData = exportData.map((row) => [
        row["Match #"].toString(),
        row["Phase"],
        row["Groupe"],
        row["Round"].toString(),
        row["Joueur 1"].substring(0, 20),
        row["Joueur 2"].substring(0, 20),
        row["Score"],
        row["Statut"],
        row["Date planifiée"].substring(0, 16),
      ]);
      
      autoTable(doc, {
        head: [["#", "Phase", "Groupe", "R", "Joueur 1", "Joueur 2", "Score", "Statut", "Date"]],
        body: tableData,
        startY: filterY + 15,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 98, 255], textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 10 },
          4: { cellWidth: 40 },
          5: { cellWidth: 40 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
          8: { cellWidth: 35 },
        },
      });
      
      blob = doc.output("blob");
      filename = `${filePrefix}_${timestamp}.pdf`;
      data = URL.createObjectURL(blob);
    }

    return { success: true, data, filename, count: totalCount };
  } catch (error) {
    console.error("Export matches failed:", error);
    return { success: false, error: String(error) };
  }
}
