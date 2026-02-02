// @/api/game-clips/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getGameClips, createGameClip } from "@/actions/game-clips";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      page: parseInt(searchParams.get("page") || "0"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      authorId: searchParams.get("authorId") || undefined,
      shopId: searchParams.get("shopId") || undefined,
      gameId: searchParams.get("gameId") || undefined,
    };

    const result = await getGameClips({
      filters,
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
