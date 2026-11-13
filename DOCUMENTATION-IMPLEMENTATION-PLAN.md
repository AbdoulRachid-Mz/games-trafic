# Documentation Implementation Plan — Games-Trafics

## Phases réalisées
1. Fondations documentaires (`types.ts`, `app-info.ts`, `format.ts`, `csv.ts`,
   `html.ts`, `templates.ts`, `builders/common.ts`, `builders/transaction.ts`).
2. Renderers + engine (`renderers/*`, `engine.ts`).
3. Builders édition (`builders/edition.ts`) et boutique (`builders/shop.ts`).
4. Classements purs (`edition-standings.ts`, `bracket-standings.ts`) +
   `getEditionStandings`.
5. Actions serveur (`actions/documents.ts`) avec permissions.
6. Façade reçus (`utils/receipt-templates.ts`) + correction des 3 call sites.
7. Refonte UI exports :
   - `standings-table.tsx` (exports serveur, suppression agrégation client)
   - `edition-standings-tab.tsx` (bascule global/phase)
   - page phase + `phase-detail-client.tsx` (classement de phase)
   - `bracket-export-button.tsx`
   - `export-matches-button.tsx`
   - `edition-matches-tab.tsx`, `edition-matches-client.tsx`
   - `hooks/use-edition-manager.ts`
   - `participants-management-client.tsx`
   - `ShopExportButton` + pages boutique
8. Suppression legacy (`utils/export-utils.ts`, `lib/utils/member-export-utils.ts`,
   actions legacy).

## Phases restantes / améliorations
- Tests E2E des exports (optionnel).
- Monitoring/telemetry des exports (optionnel).
- Documentation utilisateur (guides) (optionnel).

## Validation
- `bun x tsc --noEmit` ✅
- `bun x vitest run tests/unit` ✅
- `bun run build` ✅
