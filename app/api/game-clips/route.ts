// @/api/game-clips/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getGameClips, createGameClip } from "@/actions/game-clips";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      offset: parseInt(searchParams.get("offset") || "0"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
      authorId: searchParams.get("authorId") || undefined,
      shopId: searchParams.get("shopId") || undefined,
      gameId: searchParams.get("gameId") || undefined,
      sortBy: searchParams.get("sortBy") as "createdAt" | "likes" | "views" | undefined,
      sortOrder: searchParams.get("sortOrder") as "asc" | "desc" | undefined,
      isPublic: searchParams.get("isPublic") === "true" ? true : searchParams.get("isPublic") === "false" ? false : undefined,
    };

    const result = await getGameClips({
      filters: {
        offset: filters.offset,
        limit: filters.limit,
        search: filters.search,
        authorId: filters.authorId,
        shopId: filters.shopId,
        gameId: filters.gameId,
        sortBy: filters.sortBy ?? "createdAt",
        sortOrder: filters.sortOrder ?? "desc",
        isPublic: filters.isPublic,
      },
      userId: user?.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching game clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch game clips" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const clip = await createGameClip({
      data,
      userId: user.id,
    });

    return NextResponse.json(clip);
  } catch (error) {
    console.error("Error creating game clip:", error);
    return NextResponse.json(
      { error: "Failed to create game clip" },
      { status: 500 }
    );
  }
}
