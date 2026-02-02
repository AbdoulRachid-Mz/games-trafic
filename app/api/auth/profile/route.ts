// app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProfile, getMyProfile } from "@/actions/users";
import { AuthService } from "@/lib/auth/service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const me = searchParams.get("me") === "true";
    const relations = searchParams.get("relations")?.split(",") || [];
    const isMinimal = searchParams.get("minimal") === "true";
    const mode =
      (searchParams.get("mode") as any) || (isMinimal ? "minimal" : "partial");

    let userData;
    const userId = searchParams.get("userId");
    const relationsToInclude = relations.filter((relation) => {
      return relation !== "wallet";
    });
    
    if (me) {
      // Vérifier la session d'abord
      const session = await AuthService.getSession();
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Not authenticated",
          },
          { status: 401 },
        );
      }

      userData = await getMyProfile({
        mode: mode || "full",
        includeRelations:
          relationsToInclude.length > 0
            ? (relationsToInclude as any)
            : undefined,
        limitPerRelation: mode === "minimal" ? 0 : 20,
      });
    } else if (userId) {
      userData = await getProfile(userId, {
        mode: mode || "partial",
        includeRelations: relationsToInclude.length > 0 ? relationsToInclude : undefined,
        limitPerRelation: 10,
      });
    } else {
      const session = await AuthService.getSession();
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Not authenticated",
          },
          { status: 401 },
        );
      }

      userData = await getProfile(session.user.id, {
        mode: mode || "partial",
        includeRelations:
          relationsToInclude.length > 0
            ? relationsToInclude
            : ["shops", "tournaments", "products"],
        limitPerRelation: 20,
      });
    }

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
