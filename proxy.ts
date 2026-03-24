import { NextResponse, type NextRequest } from "next/server";
import { getCookieCache } from "better-auth/cookies";
import { resolveRoute } from "@/lib/routes/resolver";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1️⃣ Lire session correctement via Better Auth
  const session = await getCookieCache(request);
  const isAuthenticated = Boolean(session);

  let isAdmin = false;
  let isVip = false;
  let hasWallet = true;

  if (session?.user) {
    isAdmin =
      session.user.role === "admin" ||
      session.user.isAdmin === true;

    isVip =
      session.user.role === "vip" ||
      session.user.isVip === true;

    hasWallet = !!session.user.walletId;
  }

  // 2️⃣ Résolution via config routes
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

    // Éviter une boucle de redirection infinie
    if (redirectTo === pathname) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // 4️⃣ Gestion des routes guestOnly (ex: /sign-in quand déjà connecté)
  if (resolved.redirectTo && resolved.redirectTo !== pathname) {
    return NextResponse.redirect(new URL(resolved.redirectTo, request.url));
  }

  return NextResponse.next();
}
