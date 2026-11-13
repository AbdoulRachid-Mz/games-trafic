# Documentation Architecture — Games-Trafics

## Vue d'ensemble
Architecture documentaire centralisée en 4 couches :

```
Data Builders (serveur) → DocumentModel (sérialisable) → Format Renderers → Engine
```

## Couches
1. **Builders purs** (`lib/documents/builders/*.ts`)
   - `common.ts` : méta, brand, helpers.
   - `edition.ts` : participants, matchs, standings, bracket, feuille de match,
     rapport multi-feuilles.
   - `shop.ts` : produits, commandes, clients, portefeuille.
   - `transaction.ts` : reçus (masque les comptes, jamais de secrets).
   - Aucune dépendance aux libs de rendu.

2. **Modèle** (`lib/documents/types.ts`)
   - `DocumentModel`, sections, tables, champs, métadonnées, brand.
   - Sérialisable (JSON-safe) pour transit client/serveur.

3. **Templates** (`lib/documents/templates.ts`)
   - Pur : titres par défaut, formats supportés, préfixes de nommage.

4. **Renderers** (`lib/documents/renderers/*.ts`)
   - `pdf.ts`, `xlsx.ts`, `csv.ts`, `json.ts`, `text.ts`, `shared.ts`.
   - Imports dynamiques des libs lourdes (jsPDF, XLSX, file-saver).

5. **Engine** (`lib/documents/engine.ts`)
   - `generateDocument`, `downloadDocument`, `openDocumentPreview`.
   - Point d'entrée unique de rendu/téléchargement.

## Données & sécurité
- Construction côté serveur via `actions/documents.ts` (9 actions).
- Authentification + permissions vérifiées avant toute lecture.
- Client : uniquement identifiants/filtres.
- CSV : `lib/documents/csv.ts` (protection formules OWASP).
- HTML imprimable : `lib/documents/html.ts` (échappement systématique).
- Identité : `lib/documents/app-info.ts` (support@games-trafics.com,
  Abidjan, Côte d'Ivoire, /icons/gt-primary.png).

## Classements
- Moteurs officiels : `lib/tournaments/standings.engine.ts`,
  `lib/tournaments/qualification.ts`.
- `lib/tournaments/edition-standings.ts` : `computeEditionStandings` (pur).
- `lib/tournaments/bracket-standings.ts` : `computeBracketStandings` (repli).
- `getEditionStandings` / `getPhaseStandings` dans `actions/phases/queries.ts`.

## Flux d'export
1. UI déclenche `downloadDocument(model, format)`.
2. Modèle obtenu via action serveur `get*Document(...)`.
3. Engine rend le format demandé et télécharge.
