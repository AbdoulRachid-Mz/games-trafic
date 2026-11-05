// app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getProfile, getMyProfile } from "@/actions/users";
import { getServerSession2 } from "@/lib/auth/session";

const SENSITIVE_RELATIONS = ["wallet", "transactions", "notifications", "claims", "requests"];
const ALLOWED_PUBLIC_RELATIONS = ["shops", "tournaments", "products"];

export async function GET(request: NextRequest) {
  try {
    // 🛡️ A1-01: Session authentication required on all profile endpoints
    const session = await getServerSession2(request.headers);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;
    const currentUserRole = (session.user as any).role;
    const isCurrentUserAdmin =
      currentUserRole === "admin" || (session.user as any).isAdmin === true;

    const searchParams = new URL(request.url).searchParams;
    const me = searchParams.get("me") === "true";
    const requestedUserId = searchParams.get("userId");
    const rawRelations = searchParams.get("relations")?.split(",") || [];
    const isMinimal = searchParams.get("minimal") === "true";
    const mode = (searchParams.get("mode") as any) || (isMinimal ? "minimal" : "partial");

    const targetUserId = !me && requestedUserId ? requestedUserId : currentUserId;
    const isSelf = targetUserId === currentUserId;

    // 🔒 A1-02: Strict relation filtering
    let allowedRelations: string[];
    if (isSelf || isCurrentUserAdmin) {
      // Owner or admin can access requested sensitive relations (e.g. wallet, transactions)
      allowedRelations = rawRelations;
    } else {
      // Non-owner, non-admin: strictly limited to public relations
      allowedRelations = rawRelations.filter((r) => ALLOWED_PUBLIC_RELATIONS.includes(r));
    }

    let userData;

    if (isSelf && me) {
      userData = await getMyProfile({
        mode: mode || "full",
        includeRelations: allowedRelations.length > 0 ? (allowedRelations as any) : undefined,
        limitPerRelation: mode === "minimal" ? 0 : 20,
      });
    } else {
      userData = await getProfile(targetUserId, {
        mode: isSelf || isCurrentUserAdmin ? mode : "minimal",
        includeRelations: allowedRelations.length > 0 ? allowedRelations : undefined,
        limitPerRelation: 10,
      });

      // Visiblity check for other users (A1-01)
      if (userData && !isSelf && !isCurrentUserAdmin && !userData.isPublicProfile) {
        // Return minimal public projection
        userData = {
          id: userData.id,
          username: userData.username,
          fullName: userData.fullName,
          image: userData.image,
          profileImage: userData.profileImage,
          isPublicProfile: false,
        } as any;
      }
    }

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...userData,
        hasWallet: (userData as any).hasWallet ?? !!(userData as any).wallet,
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
