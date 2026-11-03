// @/app/api/cookies/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  setCookie,
  getCookie,
  deleteCookie,
  clearCookiesByPrefix,
  getAllCookies,
} from "@/actions/cookies";
import { getCurrentUser } from "@/lib/auth/session";

const SENSITIVE_COOKIE_PATTERNS = [
  /session/i,
  /auth/i,
  /token/i,
  /better-auth/i,
  /secret/i,
  /key/i,
  /csrf/i,
];

export function isSensitiveCookie(name: string): boolean {
  return SENSITIVE_COOKIE_PATTERNS.some((pattern) => pattern.test(name));
}

async function verifyAdminAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }
  const isAdmin = user.role === "admin" || (user as any).isAdmin === true;
  if (!isAdmin) {
    return { authorized: false, status: 403, error: "Forbidden: Seuls les administrateurs sont autorisés" };
  }
  return { authorized: true, user };
}

export async function GET(request: NextRequest) {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (name) {
    if (isSensitiveCookie(name)) {
      return NextResponse.json(
        { error: "Access to sensitive cookies is strictly prohibited" },
        { status: 403 }
      );
    }
    const value = await getCookie(name);
    return NextResponse.json({ value });
  }

  const cookies = await getAllCookies();
  const safeCookies: Record<string, string> = {};
  cookies.forEach((cookie) => {
    if (!isSensitiveCookie(cookie.name)) {
      safeCookies[cookie.name] = cookie.value;
    }
  });
  return NextResponse.json({ cookies: safeCookies });
}

export async function POST(request: NextRequest) {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const body = await request.json();
  const { name, value, ...options } = body;
  if (!name || value === undefined) {
    return NextResponse.json({ error: "Missing name or value" }, { status: 400 });
  }
  if (isSensitiveCookie(name)) {
    return NextResponse.json({ error: "Cannot modify sensitive cookies" }, { status: 403 });
  }
  await setCookie(name, value, options);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const path = searchParams.get("path") || undefined;
  if (!name) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
  }
  if (isSensitiveCookie(name)) {
    return NextResponse.json({ error: "Cannot delete sensitive cookies" }, { status: 403 });
  }
  await deleteCookie(name, path);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix");
  if (!prefix) {
    return NextResponse.json({ error: "Missing prefix parameter" }, { status: 400 });
  }
  if (isSensitiveCookie(prefix)) {
    return NextResponse.json({ error: "Cannot clear sensitive cookie prefix" }, { status: 403 });
  }
  await clearCookiesByPrefix(prefix);
  return NextResponse.json({ success: true });
}
