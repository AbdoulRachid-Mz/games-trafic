"use server";

import {
    tournamentMembers,
    teams,
    users,
    TournamentMember,
    NewTournamentMember,
} from "@/database/schema";
import { db } from "@/lib/db";
import { eq, and, or, desc, count, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    type TournamentMemberFilters,
    type ListQuery,
    type PaginationResponse,
} from "@/types/api";
import { editionRegistrations, tournamentEditions } from "@/database/schema";

/**
 * Auto-génère des participants guests pour une édition
 */
export async function autoGenerateGuestParticipantsAction(editionId: string, count: number, config: { teamPrefix?: string, playerPrefix?: string }) {
    try {
        const edition = await db.query.tournamentEditions.findFirst({
            where: eq(tournamentEditions.id, editionId),
        });
        if (!edition) throw new Error("Édition introuvable");

        const teamPrefix = config.teamPrefix || "Team";
        const playerPrefix = config.playerPrefix || "Joueur";

        return await db.transaction(async (tx) => {
            const createdRegistrations = [];

            for (let i = 0; i < count; i++) {
                const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                const displayName = `${playerPrefix} ${uniqueCode}`;
                
                // 1. Créer une équipe guest
                const [newTeam] = await tx.insert(teams).values({
                    name: `${teamPrefix} ${uniqueCode}`,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }).returning();

                // 2. Créer un membre guest dans le tournoi
                const [newMember] = await tx.insert(tournamentMembers).values({
                    tournamentId: edition.tournamentId,
                    role: 'PARTICIPANT',
                    displayName: displayName,
                    teamId: newTeam.id,
                    metadata: { isGuest: true, guestCode: uniqueCode },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }).returning();

                // 3. Inscrire le membre à l'édition
                const [registration] = await tx.insert(editionRegistrations).values({
                    editionId,
                    memberId: newMember.id,
                    status: 'REGISTERED',
                    checkedIn: true,
                    feePaid: true,
                    metadata: { registrationSource: 'AUTO_GENERATED' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }).returning();

                createdRegistrations.push(registration);
            }

            revalidatePath(`/tournaments/${edition.tournamentId}/editions/${editionId}/dashboard/participants`);
            return { success: true, count: createdRegistrations.length };
        });
    } catch (error) {
        console.error("Error generating guest participants:", error);
        throw error;
    }
}

/**
 * Lie un membre guest à un vrai utilisateur
 */
export async function linkGuestToUserAction(memberId: string, userId: string) {
    try {
        const member = await db.query.tournamentMembers.findFirst({
            where: eq(tournamentMembers.id, memberId),
        });
        if (!member) throw new Error("Membre introuvable");

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) throw new Error("Utilisateur introuvable");

        // Vérifier si l'utilisateur est déjà membre du tournoi
        const existingMember = await db.query.tournamentMembers.findFirst({
            where: and(
                eq(tournamentMembers.tournamentId, member.tournamentId),
                eq(tournamentMembers.userId, userId)
            ),
        });

        if (existingMember) {
            throw new Error("Cet utilisateur est déjà membre de ce tournoi.");
        }

        return await db.transaction(async (tx) => {
            // Mettre à jour le membre avec les infos de l'utilisateur
            await tx.update(tournamentMembers)
                .set({
                    userId: userId,
                    displayName: user.username || user.fullName || member.displayName,
                    avatar: user.profileImage || user.image || member.avatar,
                    contactEmail: user.email,
                    metadata: { 
                        ...(member.metadata as any || {}), 
                        isGuest: false, 
                        linkedAt: new Date().toISOString(),
                        originalGuestName: member.displayName 
                    },
                    updatedAt: new Date(),
                })
                .where(eq(tournamentMembers.id, memberId));

            revalidatePath(`/tournaments/${member.tournamentId}`);
            return { success: true };
        });
    } catch (error: any) {
        console.error("Error linking guest to user:", error);
        throw error;
    }
}

/**
 * Récupère un membre de tournoi par son ID
 */
export async function getTournamentMemberById(id: string) {
    try {
        const member = await db.query.tournamentMembers.findFirst({
            where: eq(tournamentMembers.id, id),
            with: {
                user: true,
                team: true,
            },
        });
        return member || null;
    } catch (error) {
        console.error("Error getting tournament member by ID:", error);
        throw new Error("Failed to fetch tournament member");
    }
}

/**
 * Ajoute un membre à un tournoi
 */
export async function addTournamentMember(
    memberData: NewTournamentMember
): Promise<TournamentMember> {
    try {
        if (!memberData.tournamentId) {
            throw new Error("tournamentId is required");
        }

        // 1. Strict Duplicate Check
        const conditions = [];
        if (memberData.userId) {
            conditions.push(eq(tournamentMembers.userId, memberData.userId));
        }
        if (memberData.contactEmail) {
            conditions.push(eq(tournamentMembers.contactEmail, memberData.contactEmail));
        }
        if (memberData.contactPhone) {
            conditions.push(eq(tournamentMembers.contactPhone, memberData.contactPhone));
        }

        if (conditions.length > 0) {
            const existingMember = await db
                .select()
                .from(tournamentMembers)
                .where(
                    and(
                        eq(tournamentMembers.tournamentId, memberData.tournamentId),
                        or(...conditions)
                    )
                )
                .limit(1);

            if (existingMember.length > 0) {
                throw new Error("L'utilisateur est déjà membre de ce tournoi");
            }
        }

        // 2. Ensure Team Existence
        let teamId = memberData.teamId;
        if (!teamId) {
            const teamName = memberData.displayName || "Joueur " + Date.now();
            const newTeam = await db
                .insert(teams)
                .values({
                    name: teamName + "-" + Math.floor(Math.random() * 10000),
                    captainId: memberData.userId || undefined,
                })
                .returning();
            teamId = newTeam[0].id;
        }

        // 3. Insert Member
        const result = await db
            .insert(tournamentMembers)
            .values({
                ...memberData,
                teamId: teamId,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        revalidatePath(`/tournaments/${memberData.tournamentId}`);
        return result[0];
    } catch (error: any) {
        console.error("Error adding tournament member:", error);
        throw error;
    }
}

/**
 * Met à jour un membre de tournoi
 */
export async function updateTournamentMember(
    id: string,
    memberData: Partial<NewTournamentMember>
): Promise<TournamentMember> {
    try {
        const result = await db
            .update(tournamentMembers)
            .set({
                ...memberData,
                updatedAt: new Date(),
            })
            .where(eq(tournamentMembers.id, id))
            .returning();

        if (result.length === 0) {
            throw new Error("Tournament member not found");
        }

        // Revalidations
        const member = result[0];
        revalidatePath(`/tournaments/${member.tournamentId}/members/${id}`);

        return member;
    } catch (error) {
        console.error("Error updating tournament member:", error);
        throw error;
    }
}

/**
 * Liste les membres d'un tournoi
 */
export async function getTournamentMembers(
    query: ListQuery<TournamentMemberFilters> = {}
): Promise<PaginationResponse<TournamentMember>> {
    try {
        const { pagination = { page: 1, limit: 50 }, filters = {} } = query;
        const offset = (pagination.page - 1) * pagination.limit;

        const conditions = [];
        if (filters.tournamentId) conditions.push(eq(tournamentMembers.tournamentId, filters.tournamentId));
        if (filters.userId) conditions.push(eq(tournamentMembers.userId, filters.userId));
        if (filters.role) {
            if (Array.isArray(filters.role)) {
                conditions.push(or(...filters.role.map(r => eq(tournamentMembers.role, r))));
            } else {
                conditions.push(eq(tournamentMembers.role, filters.role));
            }
        }
        if (filters.isActive !== undefined) conditions.push(eq(tournamentMembers.isActive, filters.isActive));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const data = await db.query.tournamentMembers.findMany({
            where: whereClause,
            limit: pagination.limit,
            offset: offset,
            orderBy: [desc(tournamentMembers.createdAt)],
            with: {
                user: true,
                team: true,
            },
        });

        const totalRes = await db
            .select({ count: count() })
            .from(tournamentMembers)
            .where(whereClause);

        const total = totalRes[0].count;
        const totalPages = Math.ceil(total / pagination.limit);

        return {
            data: data as any,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages,
                hasNext: pagination.page < totalPages,
                hasPrev: pagination.page > 1,
            },
        };
    } catch (error) {
        console.error("Error getting tournament members:", error);
        throw error;
    }
}

/**
 * Récupère les inscriptions et stats d'un membre pour toutes les éditions d'un tournoi
 */
export async function getMemberStatsByEdition(memberId: string) {
    try {
        const stats = await db.query.editionRegistrations.findMany({
            where: (t, { eq, and }) => and(eq(t.memberId, memberId), eq(t.isDeleted, false)),
            with: {
                edition: true,
            },
            orderBy: (t, { desc }) => [desc(t.registeredAt)],
        });
        return stats;
    } catch (error) {
        console.error("Error getting member edition stats:", error);
        throw new Error("Failed to fetch edition stats");
    }
}

/**
 * Récupère tous les membres d'une équipe
 */
export async function getTeamMembers(teamId: string) {
    try {
        const members = await db.query.tournamentMembers.findMany({
            where: (t, { eq, and }) => and(eq(t.teamId, teamId), eq(t.isDeleted, false)),
            with: {
                user: true,
            },
        });
        return members;
    } catch (error) {
        console.error("Error getting team members:", error);
        throw new Error("Failed to fetch team members");
    }
}
