import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { resolveRoute } from "@/lib/routes/resolver";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = getSessionCookie(request);

  const isAuthenticated = Boolean(sessionCookie);

  const resolved = resolveRoute(pathname, {
    isAuthenticated,
    isAdmin: false, // on ne vérifie pas ici
    isVip: false,
    hasWallet: true, // ⚠️ important si tu ne vérifies pas encore en DB
  });

  if (!resolved.hasAccess) {
    const url = new URL(
      resolved.redirectTo ||
        `/sign-in?redirect=${encodeURIComponent(pathname)}`,
      request.url
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
