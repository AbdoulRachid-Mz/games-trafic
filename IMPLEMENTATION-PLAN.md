# IMPLEMENTATION PLAN — REFONTE APP-SHELL / DASHBOARDS / TOURNOIS

## Principe
- Progression du moins impactant au plus complexe.
- Chaque grand changement : `bun x tsc --noEmit`.
- En fin de passe : `bun x vitest run tests/unit` puis `bun run build`.
- Le serveur reste source de vérité ; pas de recalcul métier client.

## Phase 0 — Préparation (FAIT)
- Push git effectué.
- Plan et tâches créés.

## Phase 1 — Stabilisation & observabilité (FAIT)
- Store AppShell (`stores/app-shell-store.ts`).
- Sync route/scroll/viewport/sidebars/top-middle/breadcrumbs.
- Tabs sticky dynamiques.
- Type check ✅, build ✅.

## Phase 2 — Données & affichage matchs (FAIT partiellement)
- Dashboard matchs utilise `getMatchesWithParticipants`.
- Boutons Voir/Gérer.
- Déverrouillage résultats admin.
- Reste : filtres unifiés, recherche, pagination, "mes matchs" public.

## Phase 3 — Composants réutilisables (prochaine)
1. Auditer `GroupCard` et compléter props (`onView`, `onEdit`, `onDelete`, `onUpdate`, `viewMode`, `isAdmin`, `extraActions`, phase info).
2. Utiliser `GroupCard` dans la page phase (`phase-detail-client.tsx`) sans casser actions existantes.
3. Vérifier `MatchCard` usages et harmoniser actions mobiles.
Type check après.

## Phase 4 — Responsive participants
1. Vue cartes mobile pour `participants-management-client.tsx` sous `md`.
2. Conserver table sur `md+` avec colonnes adaptatives.
3. Tester 320/375/390/640/768/1024/1280.
Type check + build.

## Phase 5 — Classements
1. Vérifier `getPhaseStandings` / `getPhaseLeagueStandings` / `computeBracketStandings`.
2. Ajouter classement global de phase dans `phase-detail-client.tsx` (déjà partiellement).
3. Vérifier classement global d'édition (`edition-standings-tab.tsx`).
Type check + tests.

## Phase 6 — Organisation & animations (complexe)
1. Créer `EditionStructureRevealDialog` + sous-composants.
2. Brancher après `organizeEditionStructure()`.
3. Réutiliser pour phase/groupe/bracket.
4. Gérer AUTO/MANUAL, BYE, rounds.
Type check + build.

## Phase 7 — Troisième place (complexe)
1. Ajouter option `thirdPlaceMatch` dans wizard édition et phase organize.
2. Persister dans config phase.
3. Générer node/match petite finale depuis perdants demi-finales.
4. Affichage arbre + animation.
5. Résultats/classement + clôture phase.
Type check + tests.

## Phase 8 — Validation finale
- TypeScript, lint, tests unitaires, build Next.js.
- Documentation mise à jour.
