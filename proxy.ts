import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // 1. Définir les routes protégées (qui nécessitent une connexion)
  const protectedPrefixes = [
    "/dashboard",
    "/admin",
    "/profile",
    "/wallet",
    "/chat",
    "/messages",
    "/orders",
    "/favorites",
    "/settings",
    "/notifications",
    "/communities",
  ];

  // Routes spécifiques nécessitant une auth (pas couvertes par les préfixes)
  const protectedSpecificRoutes = ["/shops/create", "/tournaments/create"];

  // 2. Définir les routes d'authentification (accessibles seulement si NON connecté)
  const authRoutes = ["/sign-in", "/sign-up", "/auth/signin", "/auth/signup"];

  // 3. Vérifier si la route actuelle est protégée
  const isProtected =
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    protectedSpecificRoutes.includes(pathname);

  // 4. Logique de redirection

  // Cas A: Utilisateur NON connecté tente d'accéder à une route protégée
  if (isProtected && !sessionCookie) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Cas B: Utilisateur CONNECTÉ tente d'accéder aux pages de login/signup
  if (authRoutes.includes(pathname) && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Cas C: Autoriser l'accès
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Matcher toutes les routes sauf les fichiers statiques et l'API
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
