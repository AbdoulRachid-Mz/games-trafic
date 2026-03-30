// @/app/api/cookies/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  setCookie,
  getCookie,
  deleteCookie,
  clearCookiesByPrefix,
  getAllCookies,
} from "@/actions/cookies";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  // if "all" is not provided, default to true
  const all = searchParams.get("all") !== "false";

  if (name) {
    const value = await getCookie(name);
    return NextResponse.json({ value });
  }

  // default behavior: return all cookies
  const cookies = await getAllCookies();
  const allCookies: Record<string, string> = {};
  cookies.forEach((cookie) => {
    allCookies[cookie.name] = cookie.value;
  });
  return NextResponse.json({ cookies: allCookies });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, value, ...options } = body;
  if (!name || value === undefined) {
    return NextResponse.json({ error: "Missing name or value" }, { status: 400 });
  }
  await setCookie(name, value, options);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const path = searchParams.get("path") || undefined;
  if (!name) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
  }
  await deleteCookie(name, path);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix");
  if (!prefix) {
    return NextResponse.json({ error: "Missing prefix parameter" }, { status: 400 });
  }
  await clearCookiesByPrefix(prefix);
  return NextResponse.json({ success: true });
}


