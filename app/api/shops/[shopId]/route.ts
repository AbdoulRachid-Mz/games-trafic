// app/api/shops/[shopId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getShopById,
  updateShop,
  deleteShop,
  incrementShopViews,
} from "@/actions/shops";
import { getCurrentUser } from "@/lib/auth/session";

// GET /api/shops/[shopId] - Récupère une boutique par son ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const populate = searchParams.get("populate")?.split(",") || [];

    const shop = await getShopById(shopId, { populate });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Incrémente les vues de manière asynchrone (ne bloque pas la réponse)
    incrementShopViews(shopId).catch(console.error);

    return NextResponse.json(shop);
  } catch (error) {
    console.error("GET /api/shops/[shopId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}

// PATCH /api/shops/[shopId] - Met à jour une boutique
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  try {
    const session = await getCurrentUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const shop = await getShopById(shopId);

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Vérifie que l'utilisateur est le propriétaire de la boutique
    if (shop.ownerId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedShop = await updateShop(shopId, body);
    return NextResponse.json(updatedShop);
  } catch (error) {
    console.error("PATCH /api/shops/[shopId] error:", error);
    return NextResponse.json(
      { error: "Failed to update shop" },
      { status: 500 }
    );
  }
}

// DELETE /api/shops/[shopId] - Supprime une boutique (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  try {
    const session = await getCurrentUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = await getShopById(shopId);

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Vérifie que l'utilisateur est le propriétaire de la boutique
    if (shop.ownerId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deletedShop = await deleteShop(shopId);
    return NextResponse.json(deletedShop);
  } catch (error) {
    console.error("DELETE /api/shops/[shopId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete shop" },
      { status: 500 }
    );
  }
}
