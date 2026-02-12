import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { resolveRoute } from "@/lib/routes/resolver";
import { getServerSession } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let isAuthenticated = false;
  let isAdmin = false;
  let isVip = false;
  const session = await getServerSession();
  if (session?.user) {
    isAuthenticated = true;
    isAdmin = Boolean((session.user as any).isAdmin);
    isVip = Boolean((session.user as any).isVip);
  } else {
    const sessionCookie = getSessionCookie(request);
    isAuthenticated = Boolean(sessionCookie);
  }
  const resolved = resolveRoute(pathname, {
    isAuthenticated,
    isAdmin,
    isVip,
    hasWallet: false,
    userId: (session?.user?.id as string) || undefined,
  });
  if (!resolved.hasAccess) {
    const url = new URL(resolved.redirectTo || `/sign-in?redirect=${encodeURIComponent(pathname)}`, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Matcher toutes les routes sauf les fichiers statiques et l'API
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
