/**
 * lib/finance/core/hash.ts
 *
 * Hachage stable des payloads d'idempotence (pur, sans base).
 */

import { createHash } from "crypto";

/**
 * Sérialise un payload de manière stable (clés triées) avant hachage.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

/**
 * Hash SHA-256 du payload d'une requête financière.
 */
export function hashRequestPayload(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}
