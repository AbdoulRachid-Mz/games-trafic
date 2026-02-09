"use server";

import {
    tournamentMembers,
    teams,
    users,
    TournamentMember,
    NewTournamentMember,
} from "@/database/schema";
import { db } from "@/lib/db";
import { eq, and, or, desc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    type TournamentMemberFilters,
    type ListQuery,
    type PaginationResponse,
} from "@/types/api";

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
