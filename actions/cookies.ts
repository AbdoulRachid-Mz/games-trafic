// @/actions/cookies.ts 
// import { cookies } from "@/next/headers";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
// Set a cookie with optimal settings
export async function setCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "strict" | "lax" | "none";
  }
) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    ...options,
  });
}

// Get a cookie value
export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

// Get all cookies
export async function getAllCookies() {
  const cookieStore = await cookies();
  return cookieStore.getAll();
}

// Delete a cookie
export async function deleteCookie(name: string, path: string = "/") {
  const cookieStore = await cookies();
  cookieStore.set(name, "", { path, maxAge: 0 });
}

// Clear all cookies matching a prefix
export async function clearCookiesByPrefix(prefix: string) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const promises = allCookies
    .filter((c) => c.name.startsWith(prefix))
    .map((c) => deleteCookie(c.name));
  await Promise.all(promises);
}

// Append cookie to NextResponse for API routes
export function appendCookieToResponse(
  response: NextResponse,
  name: string,
  value: string,
  options?: Parameters<typeof setCookie>[2]
) {
  const serialized = `${name}=${encodeURIComponent(value)}; Path=${
    options?.path ?? "/"
  }; Max-Age=${options?.maxAge ?? ""}; ${
    options?.expires ? `Expires=${options.expires.toUTCString()};` : ""
  } ${options?.domain ? `Domain=${options.domain};` : ""} ${
    options?.secure ?? process.env.NODE_ENV === "production" ? "Secure;" : ""
  } ${options?.httpOnly ?? true ? "HttpOnly;" : ""} SameSite=${
    options?.sameSite ?? "lax"
  }`;
  response.headers.append("Set-Cookie", serialized);
  return response;
}
