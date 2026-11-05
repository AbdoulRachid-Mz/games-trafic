/**
 * lib/api/projections.ts
 *
 * Projections publiques : jamais de champ sensible dans une réponse d'API
 * (email, téléphone, secrets, identifiants externes).
 */

const PUBLIC_USER_FIELDS = [
  "id",
  "name",
  "username",
  "avatar",
  "role",
  "level",
  "isVip",
  "walletNumber",
  "createdAt",
] as const;

export type PublicUser = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  role: string | null;
  level: string | null;
  isVip: boolean | null;
  walletNumber: string | null;
  createdAt: Date | null;
};

export function toPublicUser(user: Record<string, any>): PublicUser {
  const projected: Record<string, unknown> = {};
  for (const field of PUBLIC_USER_FIELDS) {
    projected[field] = user[field] ?? null;
  }
  return projected as PublicUser;
}
