"use server";

import {
  tournamentEditions,
  editionRegistrations,
  registrationPayments,
  userWallets,
  tournamentMembers,
  teams,
  TournamentEditionWithRelations,
  tournamentPhases,
  phaseGroupParticipants,
  matches,
  editionResults,
  type NewTournamentEdition,
} from "@/database/schema";
import { db } from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { validateEditionWinnerCandidate } from "./tournaments/editions";
import { isUserTournamentOrganizer } from "./tournaments/tournaments";
import {
  calculateTransactionFees,
  executeFinancialOperation,
  getOrCreateSystemAccount,
  buildTournamentEntryPostings,
} from "@/lib/finance";
import { verifyWalletPin } from "./wallets";

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
  userInfo: {
    username: string;
    image?: string | null;
    /** Nom de joueur proposé dans le formulaire d'inscription. */
    playerName?: string;
    /** Équipe existante (id réel) ou nom d'équipe à créer. */
    teamId?: string;
    teamName?: string;
  },
  options?: {
    payWithWallet?: boolean;
    pin?: string;
  }
): Promise<{
  success: boolean;
  message?: string;
  registration?: typeof editionRegistrations.$inferSelect;
  /** Identifiants réels renvoyés par le serveur pour la redirection. */
  memberId?: string;
  tournamentId?: string;
  registrationStatus?: string;
  paymentRequired?: boolean;
  paymentDetails?: {
    amount: string;
    currency: string;
    editionName: string;
  };
}> {
  try {
    // L'identité provient de la session serveur, jamais du client.
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "Vous devez être connecté pour vous inscrire." };
    }
    userId = currentUser.id;

    return await db.transaction(async (tx) => {
      // 1. Lock and fetch Edition with tournament info (P1-F1)
      const [edition] = await tx
        .select()
        .from(tournamentEditions)
        .where(eq(tournamentEditions.id, editionId))
        .for("update");

      if (!edition) throw new Error("Edition introuvable");

      // 2. Strict business rule validations (I2-01)
      const tournament = await tx.query.tournaments.findFirst({
        where: (t, { eq }) => eq(t.id, edition.tournamentId),
      });

      // Le créateur/organisateur peut participer à sa propre édition :
      // plus aucun blocage lié au rôle.

      if (edition.status !== "UPCOMING") {
        return {
          success: false,
          message: "Les inscriptions sont fermées. Le tournoi a déjà commencé ou est terminé.",
        };
      }

      const now = new Date();
      if (edition.registrationOpens && now < new Date(edition.registrationOpens)) {
        return {
          success: false,
          message: "Les inscriptions ne sont pas encore ouvertes pour cette édition.",
        };
      }

      if (edition.registrationDeadline && now > new Date(edition.registrationDeadline)) {
        return {
          success: false,
          message: "La date limite d'inscription est dépassée.",
        };
      }

      const currentParticipants = edition.currentParticipants || 0;
      const maxParticipants = edition.maxParticipants || 0;
      if (maxParticipants > 0 && currentParticipants >= maxParticipants) {
        return {
          success: false,
          message: "Désolé, cette édition est déjà complète.",
        };
      }

      // 3. Resolve Tournament Member
      const { getTournamentMembers, addTournamentMember } = await import("./members");

      const displayName =
        userInfo.playerName?.trim() || userInfo.username?.trim() || "Joueur";
      const requestedTeamName = userInfo.teamName?.trim();

      const memberRes = await getTournamentMembers({
        filters: { tournamentId: edition.tournamentId, userId },
      });

      let member = memberRes.data[0];

      // Équipe : id existant transmis, sinon création avec le nom choisi.
      let teamId = userInfo.teamId;
      if (!teamId && requestedTeamName) {
        const [createdTeam] = await tx
          .insert(teams)
          .values({
            name: requestedTeamName,
            captainId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        teamId = createdTeam.id;
      }

      if (!member) {
        member = await addTournamentMember({
          tournamentId: edition.tournamentId,
          userId,
          role: "PARTICIPANT",
          displayName,
          avatar: userInfo.image,
          teamId,
        });
      } else if (
        (userInfo.playerName && member.displayName !== displayName) ||
        (teamId && member.teamId !== teamId)
      ) {
        const [updatedMember] = await tx
          .update(tournamentMembers)
          .set({
            displayName: userInfo.playerName ? displayName : member.displayName,
            teamId: teamId ?? member.teamId,
            updatedAt: new Date(),
          })
          .where(eq(tournamentMembers.id, member.id))
          .returning();
        member = updatedMember;
      }

      // 4. Check for Existing Registration (anti-doublon)
      const existingRegistration = await tx.query.editionRegistrations.findFirst({
        where: and(
          eq(editionRegistrations.editionId, editionId),
          eq(editionRegistrations.memberId, member.id),
          eq(editionRegistrations.isDeleted, false),
        ),
      });

      if (existingRegistration) {
        return {
          success: true,
          message: "Vous êtes déjà inscrit à cette édition.",
          registration: existingRegistration,
          memberId: member.id,
          tournamentId: edition.tournamentId,
          registrationStatus: existingRegistration.status ?? "REGISTERED",
        };
      }

      // 5. Handle Paid Editions Atomically (P1-F1, I2-02, I2-04)
      const entryFee = Number(edition.entryFee || 0);
      let paidTransactionId: string | null = null;

      if (entryFee > 0) {
        if (!options?.payWithWallet) {
          return {
            success: false,
            paymentRequired: true,
            memberId: member.id,
            tournamentId: edition.tournamentId,
            registrationStatus: "PAYMENT_PENDING",
            paymentDetails: {
              amount: edition.entryFee || "0",
              currency: edition.prizeCurrency || "GTC",
              editionName: edition.name || `Édition #${edition.editionNumber}`,
            },
          };
        }

        // Fetch user wallet
        const [userWallet] = await tx
          .select()
          .from(userWallets)
          .where(eq(userWallets.userId, userId))
          .for("update");

        if (!userWallet || !userWallet.financialAccountId) {
          throw new Error("Portefeuille introuvable ou compte financier manquant");
        }

        // Validate PIN if configured
        if (userWallet.pinHash) {
          if (!options.pin) {
            throw new Error("Code PIN requis pour valider le paiement d'inscription.");
          }
          const pinRes = await verifyWalletPin(userWallet.id, options.pin);
          if (!pinRes.success) {
            throw new Error(pinRes.error || "Code PIN incorrect.");
          }
        }

        // Compte destination : prize pool de l'édition ou escrow plateforme
        const targetAccount =
          edition.financialAccountId
            ? { id: edition.financialAccountId }
            : await getOrCreateSystemAccount(tx, "ESCROW");

        // Convention §3.2 : le payeur est débité de `entryFee + frais`,
        // le pool reçoit le brut, les frais vont à PLATFORM_FEES.
        const feeCalc = await calculateTransactionFees(
          "TOURNAMENT_PARTICIPATION",
          entryFee
        );
        const fees = feeCalc.fees;
        const totalDebit = Math.round((entryFee + fees) * 100) / 100;

        const feeAccount =
          fees > 0 ? await getOrCreateSystemAccount(tx, "FEES") : null;

        const paymentPostings = buildTournamentEntryPostings({
          participantAccountId: userWallet.financialAccountId,
          poolAccountId: targetAccount.id,
          feeAccountId: feeAccount?.id ?? null,
          entryFee,
          fees,
        });

        // Paiement atomique via moteur finance V2 (I2-02, I2-04, §3.2 frais tournoi)
        const transferRes = await executeFinancialOperation({
          kind: "POST",
          type: "TOURNAMENT_PARTICIPATION",
          status: "COMPLETED",
          amount: entryFee,
          walletId: userWallet.id,
          walletAccountId: userWallet.financialAccountId,
          fromUserId: userId,
          toUserId: null,
          description: `Frais d'inscription tournoi: ${edition.name || edition.id}`,
          reason: "Paiement frais d'inscription tournoi",
          metadata: {
            editionId,
            tournamentId: edition.tournamentId,
            entryFee: entryFee.toString(),
            fees: fees.toString(),
            totalDebit: totalDebit.toString(),
          },
          postings: paymentPostings,
          fees,
          netAmount: entryFee,
          createdByUserId: userId,
          idempotencyKey: `tournament-join:${editionId}:${userId}`,
          idempotencyScope: "tournament:join",
          client: tx,
        });

        paidTransactionId = transferRes.transaction.id;
      }

      // 6. Create Registration
      const [registration] = await tx
        .insert(editionRegistrations)
        .values({
          editionId,
          memberId: member.id,
          status: "REGISTERED",
          checkedIn: false,
          feePaid: true,
          registrationFee: entryFee.toFixed(2),
          paymentTransactionId: paidTransactionId,
        })
        .returning();

      // 7. If paid, link registration payment atomically
      if (entryFee > 0 && paidTransactionId) {
        await tx.insert(registrationPayments).values({
          registrationId: registration.id,
          transactionId: paidTransactionId,
          amount: entryFee.toFixed(2),
          currency: edition.prizeCurrency || "GTC",
          status: "COMPLETED",
          paymentMethod: "WALLET",
          paidAt: new Date(),
          metadata: { editionId },
        });
      }

      // 8. Increment participant counter on locked edition
      await tx
        .update(tournamentEditions)
        .set({
          currentParticipants: currentParticipants + 1,
          updatedAt: new Date(),
        })
        .where(eq(tournamentEditions.id, editionId));

      revalidatePath(`/tournaments/${edition.tournamentId}/editions/${editionId}`);
      revalidatePath(`/tournaments/${edition.tournamentId}/members/${member.id}`);

      return {
        success: true,
        registration,
        memberId: member.id,
        tournamentId: edition.tournamentId,
        registrationStatus: registration.status ?? "REGISTERED",
      };
    });
  } catch (error) {
    console.error("Error joining edition:", error);
    throw error;
  }
}

/**
 * Update Edition
 * Sécurisé : seul l'organisateur du tournoi (ou un admin) peut modifier.
 */
export async function updateEdition(
  id: string,
  data: Partial<NewTournamentEdition>,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin =
      currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const existing = await getTournamentEditionById(id);
    if (!existing) throw new Error("Édition introuvable");

    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(
        existing.tournamentId,
        currentUser.id,
      );
      if (!isOrganizer) {
        throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
      }
    }

    // Champs sensibles non modifiables via une mise à jour générique.
    const safeData: Partial<NewTournamentEdition> = { ...data };
    delete (safeData as any).id;
    delete (safeData as any).createdAt;
    if (!isAdmin) {
      delete (safeData as any).tournamentId;
      delete (safeData as any).financialAccountId;
      delete (safeData as any).winnerId;
      delete (safeData as any).currentParticipants;
    }

    const result = await db
      .update(tournamentEditions)
      .set({
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(tournamentEditions.id, id))
      .returning();

    if (result[0]) {
      revalidatePath(`/tournaments/${result[0].tournamentId}/editions/${id}`);
      revalidatePath(`/tournaments/${result[0].tournamentId}`);
    }
    revalidateTag("tournaments", "max");
    revalidateTag(`tournament-edition-${id}`, "max");
    return { success: true };
  } catch (error) {
    console.error("Update failed", error);
    throw error;
  }
}

/**
 * Delete Edition
 * Sécurisé : seul l'organisateur du tournoi (ou un admin) peut supprimer.
 */
export async function deleteEdition(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin =
      currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const edition = await getTournamentEditionById(id);
    if (!edition) throw new Error("Édition introuvable");

    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(
        edition.tournamentId,
        currentUser.id,
      );
      if (!isOrganizer) {
        throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
      }
    }

    await db.delete(tournamentEditions).where(eq(tournamentEditions.id, id));
    revalidatePath(`/tournaments/${edition.tournamentId}`);
    revalidateTag("tournaments", "max");
    revalidateTag(`tournament-edition-${id}`, "max");
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
 * Récupère les meilleures statistiques individuelles pour une édition
 */
export async function getEditionBestPlayersStats(editionId: string) {
  try {
    const participants = await db.query.phaseGroupParticipants.findMany({
      where: (t, { eq }) => eq(t.isDeleted, false),
      with: {
        registration: {
          with: {
            member: {
              with: {
                user: {
                  columns: {
                    username: true,
                    fullName: true,
                    profileImage: true,
                    image: true,
                  },
                },
                team: { columns: { name: true, logo: true } },
              },
            },
          },
        },
        group: { with: { phase: true } },
      },
    });

    // On ne garde que les participants de cette édition (filtre manuel car
    // la relation passe par groupe → phase).
    const validParticipants = participants.filter(
      (p) => p.group?.phase?.editionId === editionId,
    );

    if (validParticipants.length === 0) return null;

    // Agréger les stats par registrationId (un joueur peut être dans
    // plusieurs phases).
    const statsMap = new Map();

    validParticipants.forEach((p) => {
      const regId = p.registrationId as string;
      if (!statsMap.has(regId)) {
        statsMap.set(regId, {
          registration: p.registration,
          goalsFor: 0,
          goalsAgainst: 0,
          wins: 0,
          played: 0,
          points: 0,
        });
      }
      const s = statsMap.get(regId);
      s.goalsFor += p.scoreFor || 0;
      s.goalsAgainst += p.scoreAgainst || 0;
      s.wins += p.matchesWon || 0;
      s.played += p.matchesPlayed || 0;
      s.points += p.points || 0;
    });

    const aggregated = Array.from(statsMap.values());

    // Top Buteurs (Attaque)
    const topScorers = [...aggregated]
      .sort((a, b) => b.goalsFor - a.goalsFor)
      .slice(0, 5);

    // Meilleures Défenses (minimum 2 matchs joués pour être crédible)
    const bestDefense = [...aggregated]
      .filter((a) => a.played >= 2)
      .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
      .slice(0, 5);

    // Plus de victoires
    const mostWins = [...aggregated]
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5);

    return {
      topScorers,
      bestDefense,
      mostWins,
    };
  } catch (error) {
    console.error("Error getting best players stats:", error);
    return null;
  }
}

/**
 * Met à jour le mode de compétition d'une édition (AUTO vs MANUAL)
 */
export async function updateTournamentEditionModeAction(
  editionId: string,
  mode: "AUTO" | "MANUAL",
) {
  try {
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
    });

    if (!edition) throw new Error("Édition introuvable");

    const currentConfig = (edition.editionConfig as any) || {};
    const newConfig = {
      ...currentConfig,
      competitionMode: mode,
    };

    await db
      .update(tournamentEditions)
      .set({ editionConfig: newConfig })
      .where(eq(tournamentEditions.id, editionId));

    revalidatePath(
      `/tournaments/${edition.tournamentId}/editions/${editionId}/dashboard`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to update edition mode:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Désigne officiellement le vainqueur d'une édition
 *
 * Phase 1 (PROMPT.md) : le vainqueur est RECALCULÉ côté serveur depuis la
 * dernière phase (nationnel racine éliminatoire, qualifiers/leader RR).
 * Le candidat client n'est qu'un pré-chose : accepté uniquement s'il
 * correspond (registrationId ou memberId) à la vérité serveur — jamais
 * stocké tel quel, et winnerMetadata est reconstruit serveur uniquement.
 */
export async function designateEditionWinnerAction(
  editionId: string,
  winnerId: string, // memberId OU registrationId (candidat client)
  _winnerMetadata?: any // DEPRECATED : ignoré, reconstruit côté serveur
) {
  try {
    const serverWinnerRegistrationId =
      await validateEditionWinnerCandidate(editionId, undefined);
    if (!serverWinnerRegistrationId) {
      return {
        success: false,
        error: "Aucun vainqueur déterminable depuis les résultats de la dernière phase.",
      };
    }

    const serverReg = await db.query.editionRegistrations.findFirst({
      where: eq(editionRegistrations.id, serverWinnerRegistrationId),
      with: { member: { with: { user: true } } },
    });
    if (!serverReg?.memberId) {
      return { success: false, error: "Vainqueur recalculé introuvable." };
    }

    // Candidat accepté seulement s'il désigne le même gagnant.
    if (
      winnerId &&
      winnerId !== serverWinnerRegistrationId &&
      winnerId !== serverReg.memberId
    ) {
      return {
        success: false,
        error: "Vainqueur non conforme : ne correspond pas au classement recalculé côté serveur.",
      };
    }

    await db
      .update(tournamentEditions)
      .set({
        winnerId: serverReg.memberId,
        winnerMetadata: {
          displayName:
            serverReg.member?.displayName ||
            serverReg.member?.user?.username ||
            "Champion",
          avatar: serverReg.member?.avatar || serverReg.member?.user?.image || null,
          gameTag: serverReg.member?.gameTag || null,
          clubName: serverReg.member?.clubName || null,
          registrationId: serverReg.id,
          memberId: serverReg.memberId,
          confirmedAt: new Date().toISOString(),
        },
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(tournamentEditions.id, editionId));

    await db
      .insert(editionResults)
      .values({
        editionId,
        registrationId: serverReg.id,
        position: 1,
        tier: "GOLD",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [editionResults.editionId, editionResults.registrationId],
        set: { position: 1, tier: "GOLD", updatedAt: new Date() },
      });

    const edition = await getTournamentEditionById(editionId);
    if (edition) {
      revalidatePath(
        `/tournaments/${edition.tournamentId}/editions/${editionId}`,
      );
      revalidatePath(
        `/tournaments/${edition.tournamentId}/editions/${editionId}/dashboard`,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to designate winner:", error);
    return { success: false, error: String(error) };
  }
}
