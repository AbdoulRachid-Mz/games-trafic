// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    // Return strictly what is in the session (fast)
    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
