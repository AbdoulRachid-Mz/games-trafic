/**
 * lib/auth/permissions.ts
 *
 * Source unique et faisant autorité pour les rôles, niveaux d'administration
 * et vérifications de permissions côté serveur dans Games-Trafics.
 */

export type AdminLevel = 'A' | 'B' | 'C';

export interface BaseUserContext {
  id: string;
  role?: string | null;
  isAdmin?: boolean | null;
  level?: AdminLevel | string | null;
  email?: string | null;
  accountTypes?: string[] | null;
}

const LEVEL_WEIGHTS: Record<AdminLevel, number> = {
  A: 3,
  B: 2,
  C: 1,
};

/**
 * Détermine si un utilisateur est administrateur.
 */
export function isAdmin(user: BaseUserContext | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.isAdmin === true;
}

/**
 * Récupère le niveau d'administration d'un utilisateur ('A' | 'B' | 'C').
 * Par défaut, tout administrateur sans niveau explicite reçoit 'C'.
 */
export function getAdminLevel(user: BaseUserContext | null | undefined): AdminLevel {
  if (!isAdmin(user)) return 'C';
  const rawLevel = user?.level;
  if (rawLevel === 'A' || rawLevel === 'B' || rawLevel === 'C') {
    return rawLevel;
  }
  return 'C';
}

/**
 * Vérifie si l'utilisateur possède au moins le niveau d'administration requis.
 * Niveau A (poids 3) > B (poids 2) > C (poids 1).
 */
export function hasAdminLevel(
  user: BaseUserContext | null | undefined,
  requiredLevel: AdminLevel
): boolean {
  if (!isAdmin(user)) return false;
  const userLevel = getAdminLevel(user);
  return LEVEL_WEIGHTS[userLevel] >= LEVEL_WEIGHTS[requiredLevel];
}

/**
 * Lance une exception si l'utilisateur n'est pas authentifié.
 */
export function assertAuthenticated(
  user: BaseUserContext | null | undefined
): asserts user is BaseUserContext {
  if (!user || !user.id) {
    throw new Error('Non authentifié');
  }
}

/**
 * Lance une exception si l'utilisateur n'est pas administrateur ou n'a pas le niveau requis.
 */
export function assertAdmin(
  user: BaseUserContext | null | undefined,
  requiredLevel: AdminLevel = 'C'
): asserts user is BaseUserContext {
  assertAuthenticated(user);
  if (!isAdmin(user)) {
    throw new Error('Accès réservé aux administrateurs');
  }
  if (!hasAdminLevel(user, requiredLevel)) {
    throw new Error(`Accès refusé: Niveau d'administration ${requiredLevel} requis`);
  }
}

/**
 * Lance une exception si l'utilisateur n'est ni propriétaire de la ressource ni admin avec le niveau requis.
 */
export function assertOwnerOrAdmin(
  user: BaseUserContext | null | undefined,
  ownerId: string,
  requiredAdminLevel: AdminLevel = 'C'
): asserts user is BaseUserContext {
  assertAuthenticated(user);
  if (user.id === ownerId) {
    return;
  }
  if (isAdmin(user) && hasAdminLevel(user, requiredAdminLevel)) {
    return;
  }
  throw new Error('Accès refusé: Vous devez être le propriétaire ou administrateur');
}

// ============================================================================
// Gardes Spécialisés Financiers & Système
// ============================================================================

/**
 * Gestion des frais et de la tarification VIP réservée exclusivement au Niveau A (Super Admin).
 */
export function assertCanManageFees(user: BaseUserContext | null | undefined): void {
  assertAdmin(user, 'A');
}

/**
 * Dépôts manuels sur wallets réservés au Niveau A.
 */
export function assertCanDeposit(user: BaseUserContext | null | undefined): void {
  assertAdmin(user, 'A');
}

/**
 * Approbation et rejet des demandes de retrait/financement (Niveau B minimum).
 */
export function assertCanApproveRequests(user: BaseUserContext | null | undefined): void {
  assertAdmin(user, 'B');
}

/**
 * Exécution des remboursements (Niveau B minimum).
 */
export function assertCanRefund(user: BaseUserContext | null | undefined): void {
  assertAdmin(user, 'B');
}

/**
 * Gestion administrative et clôture d'ordres (Niveau B minimum).
 */
export function assertCanManageOrders(user: BaseUserContext | null | undefined): void {
  assertAdmin(user, 'B');
}
