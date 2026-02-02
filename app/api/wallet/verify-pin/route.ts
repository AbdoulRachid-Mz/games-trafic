import { NextRequest, NextResponse } from "next/server";
import { verifyWalletPin } from "@/actions/wallets";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { walletId, pin } = await request.json();

    if (!walletId || !pin) {
      return NextResponse.json(
        { error: "Wallet ID et PIN requis" },
        { status: 400 }
      );
    }

    const result = await verifyWalletPin(walletId, pin);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes("incorrect") ? 401 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PIN vérifié",
    });
  } catch (error) {
    console.error("Verify PIN error:", error);
    return NextResponse.json(
      { error: "Erreur vérification" },
      { status: 500 }
    );
  }
}