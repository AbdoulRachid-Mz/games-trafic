# TASK — SUIVI PROGRESSIF

## Statut global
- [x] Push git initial
- [x] Phase 1 AppShell / sticky
- [x] Phase 2 — Dashboard matchs + filtres + "Mes matchs" + onView
- [x] Phase 3 — Composants réutilisables (GroupCard, MatchCard, onView unifié)
- [x] Phase 4 — Responsive participants (MemberCard grid/list, breakpoints sm→xl)
- [x] Phase 5 Classements (bracket-standings, 3ème/4ème place)
- [x] Phase 6 Organisation & animations (EditionStructureRevealDialog)
- [x] Phase 7 Troisième place (Petite Finale, generators, progression-engine)
- [x] Phase 8 Validation finale

## Tâches détaillées

### Phase 2 — Dashboard & Matchs (✅ COMPLET)
- [x] `buildMatchWhereConditions` : supprimé le throw, ajouté soft-delete, search, memberRegistrationId.
- [x] `getMatchesWithParticipants` : tri dynamique + relation bracketNode.
- [x] `useMatchList` : clé de cache include filters + pagination + options.
- [x] `dashboard/matches/page.tsx` : sync sortBy/sortOrder, error UI, lien "Gérer".
- [x] `edition-matches-tab.tsx` : search debounce 300ms, "Mes matchs" prioritization, badge visuel.
- [x] `edition-matches-client.tsx` : filtres statut/recherche/phase/group, toggle "Mes matchs", prioritization.
- [x] `match-card.tsx` : badge "Votre combat", onView, footer toujours accessible.
- [x] `app-shell-store.ts` : getAppShellStickyOffset, useAppShellStickyOffset.
- [x] `edition-detail-header.tsx` : sticky tabs lié au scroll de page (sentinelRef au-dessus des tabs).
- [x] `match-control-client.tsx` : canConfirmMatch admin + bannière edit active.

### Phase 3 — Composants (✅ COMPLET)
- [x] `GroupCard` : compact/list/grid viewModes, props onView/onEdit/onDelete/onManageGroup.
- [x] `GroupCard` intégré dans `phase-detail-client.tsx` avec onView.
- [x] `MatchCard` : onView unifié sur group-detail-client, edition-brackets-tab, member page.
- [x] `edition-brackets-tab.tsx` : onView → router.push vers page match.
- [x] `group-detail-client.tsx` : toutes les MatchCard utilisent onView + router.refresh.
- [x] TypeScript clean (tsc --noEmit = 0 erreurs).

### Phase 4 — Responsive participants (✅ COMPLET)
- [x] `EditionParticipantsList` : toggle grid/list, search, export PDF/CSV/JSON.
- [x] `MemberCard` : grid (1→2→3→4 colonnes) + list (flex colonne) + compact.
- [x] Breakpoints sm/md/lg/xl couverts.

### Phase 5 — Classements (✅ COMPLET)
- [x] `computeBracketStandings` : classement 1er/2ème/3ème/4ème place (nœuds consolation / isThirdPlace).
- [x] `bracket-standings.test.ts` : 5/5 tests validés.
- [x] Type check + tests OK.

### Phase 6 — Animations (✅ COMPLET)
- [x] `EditionStructureRevealDialog` : composant de révélation multi-étapes (Phase, Group, Participant, Bracket, Match).
- [x] Progress stepper, "Tout révéler", accessible + dark esports.
- [x] Intégré dans `organize-wizard-client.tsx` après `organizeEditionStructure()`.
- [x] Type check + build OK.

### Phase 7 — Troisième place (✅ COMPLET)
- [x] `generators.ts` : option `thirdPlaceMatch`, génération "Petite Finale (3ème Place)", `groupType: 'CONSOLATION'`, `isThirdPlace: true`.
- [x] `structure-engine.ts` : transmission de l'option à `setupEliminationGroups`.
- [x] `progression-engine.ts` : avance les perdants des demi-finales au nœud 3ème place, `isEliminationPhaseComplete` = Grand Final + Petite Finale.
- [x] `edition-brackets-tab.tsx` : badge bronze "Petite Finale (3ème Place)" visuel.
- [x] `organize-wizard-client.tsx` : checkbox `thirdPlaceMatch` en mode auto + manuel.
- [x] Type check + tests OK.

### Phase 8 — Validation Finale (✅ COMPLET)
- [x] `bun x tsc --noEmit` → 0 erreurs TypeScript
- [x] `bun x vitest run tests/unit` → 270/270 tests passés (29 fichiers)
- [x] `bun run lint` → 0 erreurs (fix `hooks/use-stats.ts` : `useQueries` remplace `.map(useEntityStats)`)
- [x] `bun run build` → 100% succès (0 erreurs, 193 pages et routes compilées/prerendered)
- [x] Documentation → `REFONTE-FINALE.md`
