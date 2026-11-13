import type { DocumentBrand } from "./types";

/**
 * Identité officielle Games-Trafics utilisée dans tous les documents.
 *
 * Uniquement des informations vérifiées dans l'application :
 * - email support : app/contact/page.tsx
 * - localisation : app/contact/page.tsx
 * - logo : icônes publiques du projet
 *
 * Aucun téléphone, version d'application, site web ou adresse non vérifiée
 * n'est déclaré ici. Les champs absents ne sont simplement pas affichés.
 */
export const GAMES_TRAFICS_BRAND: DocumentBrand = {
  name: "Games-Trafics",
  tagline: "Plateforme gaming & esports",
  logoPath: "/icons/icon-128.png",
  email: "support@games-trafics.com",
  address: "Tahoua, Niger",
};

export function getDocumentBrand(): DocumentBrand {
  return { ...GAMES_TRAFICS_BRAND };
}
