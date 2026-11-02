import { NextRequest, NextResponse } from "next/server";
import {
  getShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
} from "@/actions/shops";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";

// GET /api/shop – list shops (with optional query filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "50");

    // Simple filters
    const ownerId = searchParams.get("ownerId") || undefined;
    const name = searchParams.get("name") || undefined;
    const country = searchParams.get("country") || undefined;
    const verified = searchParams.get("verified") === "true";
    const featured = searchParams.get("featured") === "true";
    const isVisible = searchParams.get("isVisible") === "true";

    // Numeric filters
    const productCountMin = searchParams.get("productCountMin")
      ? Number(searchParams.get("productCountMin"))
      : undefined;
    const productCountMax = searchParams.get("productCountMax")
      ? Number(searchParams.get("productCountMax"))
      : undefined;
    const viewCountMin = searchParams.get("viewCountMin")
      ? Number(searchParams.get("viewCountMin"))
      : undefined;
    const viewCountMax = searchParams.get("viewCountMax")
      ? Number(searchParams.get("viewCountMax"))
      : undefined;
    const followerCountMin = searchParams.get("followerCountMin")
      ? Number(searchParams.get("followerCountMin"))
      : undefined;
    const followerCountMax = searchParams.get("followerCountMax")
      ? Number(searchParams.get("followerCountMax"))
      : undefined;
    const balanceMin = searchParams.get("balanceMin") || undefined;
    const balanceMax = searchParams.get("balanceMax") || undefined;

    // Date filters
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Sorting
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    // Options
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const filters = {
      ownerId,
      name,
      country,
      verified,
      featured,
      isVisible,
      productCountMin,
      productCountMax,
      viewCountMin,
      viewCountMax,
      followerCountMin,
      followerCountMax,
      balanceMin,
      balanceMax,
      startDate,
      endDate,
    };

    const options = {
      sortBy,
      sortOrder,
      includeDeleted,
      includeInactive,
    };

    const data = await getShops({
      pagination: { page, limit },
      filters: {
        ...filters,
        balanceMin: balanceMin ? Number(balanceMin) : undefined,
        balanceMax: balanceMax ? Number(balanceMax) : undefined,
      },
      options: {
        sortBy,
        sortOrder: sortOrder as "desc" | "asc",
        includeDeleted,
        includeInactive,
      },
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch shops" },
      { status: 500 }
    );
  }
}

// POST /api/shop – create a new shop
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();

    // Basic Zod schema for required fields
    const ShopBodySchema = z.object({
      ownerId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      profileImage: z.string().optional(),
      coverImage: z.string().optional(),
      phoneNumber: z.string().optional(),
      country: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
      socialMedia: z.record(z.string(), z.string()).optional(),
      themeId: z.string().uuid().optional(),
      customTheme: z.record(z.string(), z.any()).optional(),
      notificationSettings: z.record(z.string(), z.any()).optional(),
    });

    const parsed = ShopBodySchema.parse(body);

    const newShop = await createShop({
      ...parsed,
      isActive: true,
      isVisible: true,
      verified: false,
      featured: false,
      productCount: 0,
      viewCount: 0,
      balance: "0",
      isDeleted: false,
    });

    return NextResponse.json(newShop, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to create shop" },
      { status: 500 }
    );
  }
}
