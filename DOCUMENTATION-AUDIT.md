# Documentation Audit — Games-Trafics

## Scope
Audit de la refonte documentaire et des exports (PROMPT.md) : architecture,
rendu, sécurité, permissions et tests.

## Constats initiaux
- Exports legacy dispersés (`utils/export-utils.ts`, `lib/utils/member-export-utils.ts`,
  actions `exportEditionParticipants`, `exportEditionMatches`, `exportMatchesToFormat`,
  `exportStandingsAction`) mélangeaient données, mise en page et rendu côté client.
- `utils/receipt-templates.ts` contenait des coordonnées inventées
  (`+225 00 00 00 00 00`, `Tahoua, Niger`, `+227 XX XX XX XX`, `[EMAIL_ADDRESS]`,
  `contact@gamestrafics.com | +221 78 274 40 23`).
- Agrégation client des classements (standings-table.tsx) divergeant des moteurs
  officiels (`lib/tournaments/standings.engine.ts`, `qualification.ts`).
- Page phase sans classement ; pas de classement global d'édition.

## Correctifs appliqués
- Architecture centralisée : builders purs → `DocumentModel` sérialisable →
  renderers dynamiques (PDF/XLSX/CSV/JSON/texte) → `lib/documents/engine.ts`.
- `actions/documents.ts` : 9 actions serveur avec authentification + permissions
  (organisateur tournoi/admin, propriétaire boutique/admin).
- Données construites côté serveur ; le client n'envoie que des identifiants.
- Reçus : façade `generateEnhancedReceipt` async déléguant au moteur central ;
  montants/statuts issus des transactions serveur.
- Classements : `computeEditionStandings` (pur) + `getEditionStandings` ;
  `computeBracketStandings` en repli pour phases sans groupes.
- Standings de phase ajoutés à la page phase (groupes ou bracket).
- Classement global d'édition dans l'onglet standings (bascule global/phase).
- Sécurité : CSV (`lib/documents/csv.ts`) protégé contre l'injection de formules ;
  HTML imprimable (`lib/documents/html.ts`) échappe toutes les données.
- Identité officielle uniquement : `support@games-trafics.com`,
  `Abidjan, Côte d'Ivoire`, logo `/icons/gt-primary.png`.
- Suppression des exports legacy et de `utils/export-utils.ts`,
  `lib/utils/member-export-utils.ts`.

## Tests
- `tests/unit/tournaments/edition-standings.test.ts`
- `tests/unit/tournaments/bracket-standings.test.ts`
- `tests/unit/documents/csv-security.test.ts`
- `tests/unit/documents/html-security.test.ts`
- `tests/unit/documents/app-info.test.ts`
- `tests/unit/documents/builders.test.ts`
- `bun x tsc --noEmit` ✅
- `bun x vitest run tests/unit` ✅ (269 tests)
- `bun run build` ✅

## Restes / vigilance
- Les pages boutique (produits, commandes, clients, portefeuille) exposent un
  menu d'export via `ShopExportButton` ; les données restent côté serveur.
- Aucun secret (mot de passe de compte, token, clé) n'est sélectionné par les
  builders (colonnes DB limitées).
- `error-to-fixe.md` n'a pas été recréé.
