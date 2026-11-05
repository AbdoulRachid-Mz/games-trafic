"use server";

import { db } from "@/lib/db";
import { partners, users, interactions } from "@/database/schema";
import type { Partner, NewPartner } from "@/database/schema";
import {
  createPartnerSchema,
  updatePartnerSchema,
  partnerFiltersSchema,
  type CreatePartnerInput,
  type UpdatePartnerInput,
  type PartnerFilters,
} from "@/validations/partners";
import { eq, and, or, like, desc, asc, sql, count } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import {
  type PartnerCard,
  type PartnerDetail,
  PARTNER_CARD_COLUMNS,
  PAGINATION_DEFAULTS,
} from "@/types/view-models";

// Helper function to check if user is admin
async function checkAdminAccess(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.isAdmin ?? false;
}

// Create a new partner (admin only)
export async function createPartner(
  data: CreatePartnerInput,
  userId: string,
): Promise<{ success: boolean; data?: Partner; error?: string }> {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess(userId);
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate input
    const validatedData = createPartnerSchema.parse(data);

    // Generate slug if not provided
    const slug =
      validatedData.slug ||
      validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Create partner
    const [partner] = await db
      .insert(partners)
      .values({
        ...validatedData,
        slug,
      })
      .returning();

    revalidateTag("partners", "max");
    return { success: true, data: partner };
  } catch (error) {
    console.error("Error creating partner:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create partner",
    };
  }
}

// Update a partner (admin only)
export async function updatePartner(
  id: string,
  data: UpdatePartnerInput,
  userId: string,
): Promise<{ success: boolean; data?: Partner; error?: string }> {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess(userId);
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate input
    const validatedData = updatePartnerSchema.parse(data);

    // Update partner
    const [partner] = await db
      .update(partners)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, id))
      .returning();

    if (!partner) {
      return { success: false, error: "Partner not found" };
    }

    revalidateTag("partners", "max");
    return { success: true, data: partner };
  } catch (error) {
    console.error("Error updating partner:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update partner",
    };
  }
}

// Delete a partner (admin only - soft delete)
export async function deletePartner(
  id: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess(userId);
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Soft delete
    await db
      .update(partners)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, id));

    revalidateTag("partners", "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting partner:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete partner",
    };
  }
}

// Get partners with filters (public)
export async function getPartners(
  filters: PartnerFilters = {
    limit: PAGINATION_DEFAULTS.FEED,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  }
): Promise<{
  success: boolean;
  data?: PartnerCard[];
  total?: number;
  error?: string;
}> {
  try {
    // Validate filters
    const validatedFilters = partnerFiltersSchema.parse(filters);

    // Build where conditions
    const conditions = [eq(partners.isDeleted, false)];

    if (validatedFilters.type) {
      conditions.push(eq(partners.type, validatedFilters.type));
    }

    if (validatedFilters.status) {
      conditions.push(eq(partners.status, validatedFilters.status));
    }

    if (validatedFilters.verified !== undefined) {
      conditions.push(eq(partners.verified, validatedFilters.verified));
    }

    if (validatedFilters.isActive !== undefined) {
      conditions.push(eq(partners.isActive, validatedFilters.isActive));
    }

    if (validatedFilters.isVisible !== undefined) {
      conditions.push(eq(partners.isVisible, validatedFilters.isVisible));
    }

    if (validatedFilters.search) {
      conditions.push(
        or(
          like(partners.name, `%${validatedFilters.search}%`),
          like(partners.description, `%${validatedFilters.search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(partners)
      .where(whereClause);

    // Get partners
    const sortableColumns = {
      name: partners.name,
      createdAt: partners.createdAt,
      viewCount: partners.viewCount,
      totalInvestment: partners.totalInvestment,
    } as const;

    const sortColumn = sortableColumns[validatedFilters.sortBy];
    const orderBy =
      validatedFilters.sortOrder === "asc"
        ? asc(sortColumn)
        : desc(sortColumn);

    const partnersList = await db.query.partners.findMany({
      columns: PARTNER_CARD_COLUMNS,
      where: whereClause,
      orderBy: orderBy,
      limit: validatedFilters.limit,
      offset: validatedFilters.offset,
    });

    return { success: true, data: partnersList, total: count };
  } catch (error) {
    console.error("Error fetching partners:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch partners",
    };
  }
}

// Get a single partner by ID (public)
export async function getPartnerById(
  id: string,
): Promise<{ success: boolean; data?: PartnerDetail; error?: string }> {
  try {
    const [partner] = await db
      .select()
      .from(partners)
      .where(and(eq(partners.id, id), eq(partners.isDeleted, false)))
      .limit(1);

    if (!partner) {
      return { success: false, error: "Partner not found" };
    }

    // Increment view count
    await db
      .update(partners)
      .set({
        viewCount: sql`${partners.viewCount} + 1`,
      })
      .where(eq(partners.id, id));

    // Get follower count
    const [followerCount] = await db
      .select({ count: count() })
      .from(interactions)
      .where(and(eq(interactions.entityId, id), eq(interactions.entityType, 'PARTNER'), eq(interactions.type, 'LIKE')));

    return {
      success: true,
      data: {
        ...partner,
        stats: {
          totalPartnerships: partner.totalPartnerships || 0,
          totalInvestment: partner.totalInvestment || '0',
          viewCount: (partner.viewCount || 0) + 1,
          followerCount: followerCount?.count || 0,
        }
      }
    };
  } catch (error) {
    console.error("Error fetching partner:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch partner",
    };
  }
}

// Get featured partners for home page (public)
export async function getFeaturedPartners(): Promise<{
  success: boolean;
  data?: Partner[];
  error?: string;
}> {
  try {
    const featuredPartners = await db
      .select()
      .from(partners)
      .where(
        and(
          eq(partners.isDeleted, false),
          eq(partners.isActive, true),
          eq(partners.isVisible, true),
          eq(partners.verified, true),
          eq(partners.status, "ACTIVE"),
        ),
      )
      .orderBy(desc(partners.viewCount))
      .limit(6);

    return { success: true, data: featuredPartners };
  } catch (error) {
    console.error("Error fetching featured partners:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch featured partners",
    };
  }
}
