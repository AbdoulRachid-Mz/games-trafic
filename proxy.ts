import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { resolveRoute } from "@/lib/routes/resolver";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1️⃣ Lire le cookie
  const sessionCookie = getSessionCookie(request);

  const isAuthenticated = Boolean(sessionCookie);

  // ⚠️ Ici on ne peut pas interroger la DB directement.
  // Donc on considère que le rôle admin doit être dans le JWT.
  let isAdmin = false;
  let isVip = false;
  let hasWallet = true;

  if (sessionCookie) {
    try {
      // Si ton cookie est un JWT :
      const payload = JSON.parse(
        Buffer.from(sessionCookie.split(".")[1], "base64").toString()
      );

      isAdmin = payload.role === "admin";
      isVip = payload.role === "vip";
      hasWallet = !!payload.walletId;
    } catch {
      // fallback silencieux
    }
  }

  // 2️⃣ Résolution via ta config
  const resolved = resolveRoute(pathname, {
    isAuthenticated,
    isAdmin,
    isVip,
    hasWallet,
  });

  // 3️⃣ Gestion accès refusé
  if (!resolved.hasAccess) {
    const redirectTo =
      resolved.redirectTo ||
      `/sign-in?redirect=${encodeURIComponent(pathname)}`;

    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}
