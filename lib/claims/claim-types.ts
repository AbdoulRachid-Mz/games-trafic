// Types de réclamations partagés entre utilisateur, admin et API.
// La colonne `claims.type` est texte : les anciens types (PAYMENT, DELIVERY,
// ACCOUNT, TECHNICAL...) restent reconnaissables pour l'affichage historique.

export const CLAIM_TYPES = [
  "TRANSACTION_ISSUE",
  "WALLET_LOCKED",
  "VERIFICATION_ISSUE",
  "SECURITY_CONCERN",
  "OTHER",
] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CLAIM_TYPE_LABELS: Record<string, string> = {
  // Types actuels
  TRANSACTION_ISSUE: "Problème de transaction",
  WALLET_LOCKED: "Wallet bloqué",
  VERIFICATION_ISSUE: "Problème de vérification",
  SECURITY_CONCERN: "Problème de sécurité",
  OTHER: "Autre",
  // Types historiques (compatibilité affichage)
  PAYMENT: "Paiement",
  DELIVERY: "Livraison",
  PRODUCT: "Produit",
  SERVICE: "Service",
  ACCOUNT: "Compte",
  TECHNICAL: "Technique",
};

export const CLAIM_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  REJECTED: "Rejeté",
  CLOSED: "Fermé",
};

export function claimTypeLabel(type: string): string {
  return CLAIM_TYPE_LABELS[type] || type;
}

export function claimStatusLabel(status: string): string {
  return CLAIM_STATUS_LABELS[status] || status;
}
