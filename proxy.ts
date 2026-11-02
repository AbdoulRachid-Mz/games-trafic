import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { resolveRoute } from "@/lib/routes/resolver";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1️⃣ Lire session correctement via Better Auth
  const session = await auth.api.getSession({
    headers: request.headers
  });
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

    hasWallet = !!session.user;
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
      "/sign-in?redirect=" + encodeURIComponent(pathname);

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

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js static files)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (root-level static files)
     * - /api/auth/*   (Better Auth internal routes — must remain public)
     * - Files with extensions (.png, .jpg, .svg, .woff2, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/auth|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot|css|js|map)$).*)',
  ],
};