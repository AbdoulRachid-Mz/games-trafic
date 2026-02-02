// lib/auth/logic.ts

import type { betterAuth } from "better-auth";
import { db } from "@/lib/db";
import { shops, userWallets, orders } from "@/database/schema"; // adapte selon ton schéma
import { eq } from "drizzle-orm";
import { AuthUser } from "./types";

/**
 * Liste des rôles disponibles
 * Tu peux en ajouter : "MODERATOR", "SELLER", etc.
 */
export type Role = "ADMIN" | "VIP" | "USER" | "SELLER";

/**
 * Permissions par rôle
 */
export const RolePermissions: Record<Role, string[]> = {
  ADMIN: [
    "manage_users",
    "manage_shops",
    "manage_products",
    "manage_transactions",
    "access_admin_dashboard",
  ],

  VIP: [
    "priority_support",
    "create_offers",
    "edit_profile",
    "use_wallet",
  ],

  SELLER: [
    "create_shop",
    "manage_shop",
    "list_products",
    "edit_profile",
  ],

  USER: [
    "buy_products",
    "use_wallet",
    "edit_profile",
  ],
};

/**
 * Récupère les permissions d'un utilisateur
 */
export function getUserPermissions(accountTypes: string[]): string[] {
  const roles = accountTypes as Role[];
  const permissions = new Set<string>();

  roles.forEach(role => {
    const perms = RolePermissions[role as Role] || [];
    perms.forEach(p => permissions.add(p));
  });

  return Array.from(permissions);
}

/**
 * Vérifie si un utilisateur possède une permission spécifique
 */
export function hasPermission(user: { accountTypes: string[] }, permission: string) {
  const perms = getUserPermissions(user.accountTypes);
  return perms.includes(permission);
}

/**
 * Vérifie si un utilisateur possède un rôle donné
 */
export function hasRole(user: { accountTypes: string[] }, role: Role) {
  return user.accountTypes.includes(role);
}

/**
 * Enrichit un utilisateur Better Auth avec
 * - permissions
 * - rôles
 * - wallet
 * - shops
 * - stats
 */
export async function enrichUser(user: AuthUser | null) {
  if (!user) return null;

  const roles = user.accountTypes as Role[];
  const permissions = getUserPermissions(user.accountTypes);

  // Récupère le wallet
  const wallet = await db.query.userWallets.findFirst({
    where: eq(userWallets.userId, user.id),
  });

  // Shops du user
  const userShops = await db.query.shops.findMany({
    where: eq(shops.ownerId, user.id),
  });

  // Statistiques utilisateur (exemple)
  const products = await db.query.orders.findMany({
    where: eq(orders.buyerId, user.id),
  });

  return {
    ...user,
    roles,
    permissions,
    wallet,
    shops: userShops,
    stats: {
      productsCount: products.length,
    },
  };
}
