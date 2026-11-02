# PLAN D'EXÉCUTION ET DE REFONTE TECHNIQUE GLOBALE — GAMES-TRAFICS

> **Document de Référence** : `PROMPT.md`  
> **Diagnostic & Cartographie** : `ANALYSIS.md`  
> **Registre des Tâches** : `TASK.md`  
> **Date de mise à jour** : 2026-11-02

---

## 1. Principes Directeurs d'Exécution

1. **Priorité Sécurité & Disponibilité** : Ne jamais supprimer ou contourner un contrôle de sécurité serveur pour un gain de performance client.
2. **Préservation des Acquis et Comportements Métier** : Les fonctionnalités existantes (boutique, tournois, profils, chat, portefeuille) doivent continuer de fonctionner sans régression.
3. **Travail par Lots Autonomes & Vérifiables** : Chaque phase ou sous-lot est validé par compilation TypeScript (`bunx tsc --noEmit`) et tests unitaires (`bunx vitest run`) avant de passer au lot suivant.
4. **Zéro Rupture d'Import** : Les refactorisations d'actions géantes (`actions/phases.ts`, `actions/tournaments.ts`) s'effectuent par façade de réexportation rétrocompatible (`export * from ...`).
5. **Gestion de Paquets Strictement Bun** : Utilisation exclusive de `bun` et `bunx`.

---

## 2. Découpage en Phases et Ordre Séquentiel

```
[Phase 0 : Audit, Cartographie & Documentation] ✅ TERMINÉE
      │
      ▼
[Phase 1 : Application Shell, Layout & Démarrage Rapide (P0)]
      │  ├── Découplage du rendu initial sur routes publiques (fin du loader bloquant)
      │  ├── Suppression des appels redondants (refreshUser, double useUserProfile)
      │  └── Réorganisation de AppShell en composants ciblés
      ▼
[Phase 2 : Restructuration PWA & Stratégies de Cache (P1)]
      │  ├── Nettoyage de l'initialisation du service worker
      │  ├── Sécurisation stricte du cache (exclusion contextes financiers)
      │  └── Composants PWA non intrusifs
      ▼
[Phase 3 : Refonte & Modularisation du Système Financier (P0)]
      │  ├── Organisation dans lib/finance/ (core, ledger, fees, payments, escrow)
      │  ├── Unification autoritaire du moteur de frais (fee-engine)
      │  ├── Atomicité et traçabilité des opérations de ledger
      │  └── Séparation des services internes et des Server Actions publiques
      ▼
[Phase 4 : Reconstruction du Moteur de Tournois (Tournament Engine) (P1)]
      │  ├── Pureté des algorithmes de brackets, poules et classements (sans DB)
      │  ├── Support normalisé des participants (individuels & équipes)
      │  ├── Simulation & prévisualisation des structures avant enregistrement
      │  └── Transitions de qualification et progression fiabilisées
      ▼
[Phase 5 : Décomposition des Server Actions Surchargées (P1)]
      │  ├── Découpage modulaire de actions/phases.ts (~4880 lignes)
      │  ├── Découpage modulaire de actions/tournaments.ts (~1400 lignes)
      │  └── Mise en place de façades de réexportation rétrocompatibles
      ▼
[Phase 6 : Pages, Composants & Hooks des Tournois (P1/P2)]
      │  ├── Élimination de la logique métier résiduelle dans les composants UI
      │  └── Optimisation des requêtes et états de chargement
      ▼
[Phase 7 : Exports et Rapports (P2)]
      │  ├── Consolidation des utilitaires d'export (PDF, Excel, CSV, JSON)
      │  └── Respect strict de l'appellation de marque "Games-Trafics"
      ▼
[Phase 8 : Suite de Tests Complète & Validation Globale]
         ├── Enrichissement des tests financiers et de tournois
         ├── Vérification TypeScript (0 erreur)
         └── Validation Vitest (100% passing)
```

---

## 3. Détail des Lots et Critères de Sortie

### Phase 1 — Application Shell, Layout & Démarrage Rapide (P0)
- **Objectif** : L'interface principale s'affiche instantanément sans écran de chargement bloquant sur les routes publiques.
- **Tâches** :
  - `TASK-APP-01` : Optimisation d'`AppShell` pour rendre le contenu immédiatement sur les routes publiques sans attendre `refreshUser()` ni `welcomeChecked`.
  - `TASK-APP-02` : Déduplication de `useUserProfile` entre `AppProvider` et `AppShell`.
  - `TASK-APP-03` : Différer les vérifications secondaires (annonces, maintenance non bloquante) après le premier affichage.
- **Critères d'acceptation** :
  - Accès aux pages d'accueil, marketplace et tournois sans spinner plein écran lors d'un premier chargement.
  - La sécurité des routes privées (`/dashboard`, `/wallet`, `/admin`) reste garantie par `proxy.ts` et `resolveRoute()`.

### Phase 2 — Restructuration PWA (P1)
- **Objectif** : Gestion propre et discrète du cycle de vie PWA.
- **Tâches** :
  - `TASK-PWA-01` : Unification de la logique de désactivation dev et enregistrement prod.
  - `TASK-PWA-02` : Règle stricte d'exclusion de mise en cache sur les routes et actions financières.
- **Critères d'acceptation** :
  - Pas d'écouteurs multiples ou d'inscriptions de SW répétitives lors des navigations.

### Phase 3 — Refonte & Modularisation Finance (P0)
- **Objectif** : Architecture financière robuste sous `lib/finance/` garantissant l'intégrité comptable.
- **Tâches** :
  - `TASK-FIN-01` : Création de `lib/finance/fees/fee-engine.ts` centralisant tout calcul de frais.
  - `TASK-FIN-02` : Modularisation du service de ledger et des opérations de transactions avec passage explicite du contexte `tx`.
  - `TASK-FIN-03` : Simplification de `actions/transactions.ts` qui devient une façade de validation et d'appel aux services métier.
- **Critères d'acceptation** :
  - Tout calcul de commission provient d'une source unique.
  - Équilibre strict débit/crédit dans le ledger.
  - 100% des tests financiers passent.

### Phase 4 & 5 — Tournament Engine & Décomposition des Actions (P1)
- **Objectif** : Actions allégées, algorithmes purs et moteurs modulaires.
- **Tâches** :
  - `TASK-TOURN-01` : Décomposition de `actions/phases.ts` en modules spécialisés sous `actions/phases/` avec réexportation dans `actions/phases.ts`.
  - `TASK-TOURN-02` : Décomposition de `actions/tournaments.ts` sous `actions/tournaments/` avec réexportation.
  - `TASK-TOURN-03` : Moteur de simulation/prévisualisation des structures de phases avant commit DB.
- **Critères d'acceptation** :
  - Aucun import existant cassé dans l'application.
  - Taille de chaque sous-module < 600 lignes.
  - Tests de génération de matchs, classements et brackets validés.

### Phase 6, 7 & 8 — UI, Exports, Tests & Stabilisation Finale
- **Objectif** : Cohérence de l'expérience utilisateur et couverture de tests maximale.
- **Tâches** :
  - `TASK-UI-TOURN-01` : Nettoyage des composants de tournois pour consommer les services normalisés.
  - `TASK-EXP-01` : Validation des exports (PDF, Excel, JSON).
  - `TASK-TEST-ALL` : Exécution complète de la suite de tests et audit TypeScript.
- **Critères d'acceptation** :
  - 0 erreur TypeScript.
  - 100% des tests Vitest au vert.
  - Rapport final complet.
