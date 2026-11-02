// lib/db/index.ts
// Uses drizzle-orm/neon-serverless (WebSocket Pool) to support db.transaction().
// The neon-http driver does NOT support transactions; this driver does.
//
// Singleton pattern: in development (HMR), the Pool is reused via globalThis
// to avoid exhausting Neon's connection limit on every hot reload.
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/database/schema";

// Required for Node.js environments (Next.js server, Server Actions, middleware).
// In the browser this is not needed; neonConfig ignores it silently.
neonConfig.webSocketConstructor = ws;

// Declare the global Pool slot for HMR-safe singleton in development.
declare global {
  // eslint-disable-next-line no-var
  var __neonPool: Pool | undefined;
}

// Reuse the existing pool in development to avoid exhausting the connection
// limit on every HMR reload. In production a fresh pool is created per cold
// start, which is fine given serverless lifecycle semantics.
const pool: Pool =
  globalThis.__neonPool ??
  new Pool({ connectionString: process.env.DATABASE_URL! });

if (process.env.NODE_ENV !== "production") {
  globalThis.__neonPool = pool;
}

export const db = drizzle(pool, { schema });
