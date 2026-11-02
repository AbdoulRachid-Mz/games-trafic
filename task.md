# REGISTRE OPÉRATIONNEL DES TÂCHES — GAMES-TRAFICS

> **Document de Référence** : `PROMPT.md`  
> **Source de Diagnostic** : `ANALYSIS.md`  
> **Plan d'Exécution** : `IMPLEMENTATION-PLAN.md`  
> **Statut Global** : Terminé avec succès (100% validé)

### Conventions de Statut :
- `[ ]` : À faire (Planifiée)
- `[/]` : En cours de réalisation
- `[x]` : Terminée et validée par tests
- `[!]` : Bloquée / Nécessite arbitrage

---

## LOT 0 : AUDIT & CARTOGRAPHIE INITIALE (PHASE 0)
- [x] `TASK-AUDIT-01` : Audit complet du code et des dépendances (`actions/`, `lib/`, `components/layout/`, `contexts/`, `tournaments/`).
- [x] `TASK-AUDIT-02` : Mise à jour de `ANALYSIS.md` avec cartographie détaillée des problèmes et flux réels.
- [x] `TASK-AUDIT-03` : Structuration du plan directeur dans `IMPLEMENTATION-PLAN.md`.
- [x] `TASK-AUDIT-04` : Initialisation du registre des tâches dans `TASK.md`.

---

## LOT 1 : APPLICATION SHELL, LAYOUTS & DÉMARRAGE RAPIDE (PHASE 1 — P0)

### `TASK-APP-01` : Élimination du blocage initial sur les routes publiques
- **Domaine** : UI Shell / Cycle de démarrage
- **Priorité** : P0 — Critique performance
- **Statut** : `[x]`
- **Fichiers concernés** : `components/layout/app-shell.tsx`, `lib/routes/resolver.ts`
- **Description** : `AppShell` affiche actuellement un loader plein écran `PulseLoading` tant que `!isInitialized || !welcomeChecked`, et bloque l'affichage tant que `refreshUser()` n'a pas répondu. Pour les routes publiques (ex: `/`, `/marketplace`, `/tournaments`, `/services`), le contenu doit s'afficher immédiatement sans attendre les vérifications de session.
- **Critères de validation** :
  - Sur une route publique, aucun loader bloquant n'apparaît.
  - La session se charge en arrière-plan et met à jour l'UI (bouton profil, notifications) sans figer la page.
  - Les routes protégées (`requireAuth: true` ou `requireAdmin: true`) conservent leur protection.

---

### `TASK-APP-02` : Déduplication des requêtes de profil & session au démarrage
- **Domaine** : State Management / Contexts
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `contexts/app-context.tsx`, `components/layout/app-shell.tsx`, `contexts/auth-context.tsx`
- **Description** : `useUserProfile` est appelé simultanément dans `AppShell` (avec relation `wallet`) et dans `AppProvider` (avec relation `announcements`), tandis que `useAuth` fait déjà un `getSession()` au chargement. Mutualiser ces requêtes pour éviter des allers-retours réseau superflus.
- **Critères de validation** :
  - Une seule requête de profil initial partagée via TanStack Query.
  - Suppression de l'appel forcé `refreshUser()` bloquant dans `AppShell`.

---

### `TASK-APP-03` : Différer les vérifications secondaires
- **Domaine** : UI Shell / UX
- **Priorité** : P2 — Moyenne
- **Statut** : `[x]`
- **Fichiers concernés** : `components/layout/app-shell.tsx`, `contexts/app-context.tsx`
- **Description** : Les annonces (`AnnouncementDialog`), la vérification de la première visite (`welcomeChecked`) et le mode maintenance non critique doivent être différés après le montage initial pour un premier rendu immédiat.
- **Critères de validation** :
  - Aucun délai perceptible au premier affichage.
  - L'affichage des modals ou bannières intervient de manière fluide après hydratation.

---

## LOT 2 : RESTRUCTURATION DU SYSTÈME PWA (PHASE 2 — P1)

### `TASK-PWA-01` : Nettoyage et centralisation du cycle de vie PWA
- **Domaine** : PWA / Service Worker
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `providers/pwa-provider.tsx`, `components/pwa/PWAManager.tsx`, `components/pwa/disable-sw-in-dev.tsx`
- **Description** : Consolider la désactivation en mode dev et l'enregistrement propre du Service Worker en production pour éviter tout doublon d'écouteurs ou vérification excessive lors des changements de page.
- **Critères de validation** :
  - Un seul point d'enregistrement de SW.
  - Zéro re-render parasite provoqué par les événements PWA.

---

### `TASK-PWA-02` : Exclusion absolue de mise en cache sur contextes financiers
- **Domaine** : PWA / Sécurité Financière
- **Priorité** : P0 — Critique sécurité
- **Statut** : `[x]`
- **Fichiers concernés** : `public/sw.js` (ou générateur de SW), `next.config.ts`
- **Description** : Vérifier et forcer l'interdiction de mise en cache pour tous les endpoints et Server Actions traitant des soldes, wallets, devises et ledger.
- **Critères de validation** :
  - Aucune réponse financière ne provient du CacheStorage du Service Worker.

---

## LOT 3 : SÉCURITÉ & REFONTE DU SYSTÈME FINANCIER (PHASE 3 — P0)

### `TASK-FIN-01` : Centralisation du moteur de calcul de frais (`fee-engine`)
- **Domaine** : Finance / Fees
- **Priorité** : P0 — Critique intégrité
- **Statut** : `[x]`
- **Fichiers concernés** : `lib/finance/fees/fee-engine.ts`, `actions/transactions.ts`, `lib/ledger/ledger-utils.ts`
- **Description** : Regrouper toutes les règles de calcul de commission (taux fixes, pourcentages, paliers de retrait/transfert) dans une fonction pure autoritaire côté serveur. Éliminer les divergences de calcul entre `actions/transactions.ts` et `lib/ledger/`.
- **Critères de validation** :
  - Unicité de la formule de calcul de frais.
  - Tests unitaires couvrant tous les montants (petits montants, arrondis, montants élevés).

---

### `TASK-FIN-02` : Structuration du Ledger Engine et atomicité transactionnelle
- **Domaine** : Finance / Ledger
- **Priorité** : P0 — Critique comptable
- **Statut** : `[x]`
- **Fichiers concernés** : `lib/finance/ledger/ledger-engine.ts`, `actions/transactions.ts`, `actions/wallets.ts`
- **Description** : S'assurer que chaque mouvement financier (débit, crédit, retenue escrow, transfert, commission) s'exécute au sein d'une transaction SQL atomique (`tx`) et produit des écritures strictement équilibrées (somme des débits = somme des crédits).
- **Critères de validation** :
  - Aucune transaction orpheline sans écriture de ledger correspondante.
  - Idempotence sur les opérations de paiement.

---

### `TASK-FIN-03` : Modularisation des Server Actions financières
- **Domaine** : Finance / API
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `actions/transactions.ts`, `actions/wallets.ts`, `actions/orders.ts`
- **Description** : Rendre les Server Actions très légères : validation Zod des entrées, vérification de session serveur (`getCurrentUser()`), délégation aux services métier sous `lib/finance/`, et retour de résultats typés.
- **Critères de validation** :
  - Les Server Actions ne contiennent plus de calculs complexes inline.
  - Prévention totale contre l'altération de prix ou de soldes par le client.

---

## LOT 4 : TOURNAMENT ENGINE & ALGORITHMES PURS (PHASE 4 — P1)

### `TASK-TOURN-01` : Normalisation du modèle de Participant (Individuel & Équipe)
- **Domaine** : Tournois / Modèle
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `lib/tournaments/core/types.ts`, `lib/tournaments/generators.ts`
- **Description** : Unifier la représentation d'un participant dans le moteur de tournoi, qu'il s'agisse d'un joueur individuel (`userId`) ou d'une équipe (`teamId`), avec résolution transparente de son nom d'affichage et de son logo pour les brackets et classements.
- **Critères de validation** :
  - Le moteur gère indifféremment les tournois solo et par équipes sans duplication de logique.

---

### `TASK-TOURN-02` : Moteur de simulation et prévisualisation avant génération
- **Domaine** : Tournois / Génération
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `lib/tournaments/generation/preview-engine.ts`
- **Description** : Développer une fonction pure permettant de simuler l'intégralité d'une structure de phase (nombre de poules, nombre de matchs, tours d'arbre, BYE, qualifiés) sans écrire dans la base de données, pour prévisualisation immédiate côté interface d'organisation.
- **Critères de validation** :
  - Retourne la structure complète et les métriques de la phase.
  - Zéro écriture en DB pendant la simulation.

---

### `TASK-TOURN-03` : Moteur de qualification et progression inter-phases
- **Domaine** : Tournois / Progression
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `lib/tournaments/progression-engine.ts`, `lib/tournaments/standings.engine.ts`
- **Description** : Fiabiliser le passage automatique ou manuel des qualifiés d'une phase de poules vers un arbre d'élimination (ex: 2 premiers de chaque groupe qualifiés pour les 1/4 de finale) avec injection déterministe dans les nœuds cibles.
- **Critères de validation** :
  - Tests unitaires validant l'attribution des slots sans placeholders résiduels.

---

## LOT 5 : DÉCOMPOSITION DES ACTIONS SURCHARGÉES (PHASE 5 — P1)

### `TASK-ACT-01` : Modularisation de `actions/phases.ts` (~4880 lignes)
- **Domaine** : Architecture / Server Actions
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `actions/phases.ts`, `actions/phases/*.ts`
- **Description** : Décomposer ce fichier massif en sous-modules thématiques (`queries.ts`, `mutations.ts`, `groups.ts`, `generation.ts`, `standings.ts`, `progression.ts`) tout en conservant `actions/phases.ts` comme façade de réexportation (`export * from ...`) pour une compatibilité absolue à 100% avec les imports existants.
- **Critères de validation** :
  - Aucun fichier ne dépasse 700 lignes.
  - Aucun import cassé dans l'application.
  - `bunx tsc --noEmit` avec 0 erreur.

---

### `TASK-ACT-02` : Modularisation de `actions/tournaments.ts` (~1400 lignes)
- **Domaine** : Architecture / Server Actions
- **Priorité** : P1 — Élevée
- **Statut** : `[x]`
- **Fichiers concernés** : `actions/tournaments.ts`, `actions/tournaments/*.ts`
- **Description** : Découper en sous-modules cohérents (`queries.ts`, `mutations.ts`, `members.ts`, `editions.ts`) avec façade de réexportation rétrocompatible.
- **Critères de validation** :
  - Fichiers modulaires et isolés.
  - Rétrocompatibilité garantie.

---

## LOT 6 : PAGES, COMPOSANTS & HOOKS DES TOURNOIS (PHASE 6 — P1/P2)
- [x] `TASK-UI-01` : Allègement des composants d'affichage de matchs et de groupes (suppression des calculs de classement dans le JSX).
- [x] `TASK-UI-02` : Unification des hooks TanStack Query pour les tournois et les phases avec clés de cache cohérentes.

---

## LOT 7 : EXPORTS & RAPPORTS (PHASE 7 — P2)
- [x] `TASK-EXP-01` : Consolidation des exports brackets & classements (PDF, Excel, CSV, JSON) avec données enrichies et marque "Games-Trafics".

---

## LOT 8 : TESTS & VALIDATION GLOBALE (PHASE 8 — OBLIGATOIRE)
- [x] `TASK-TEST-01` : Enrichissement de la suite de tests (moteur de frais, transactions atomiques, simulation tournois).
- [x] `TASK-TEST-02` : Validation globale Vitest (`bunx vitest run`) avec 100% de réussite (111/111 tests).
- [x] `TASK-TEST-03` : Vérification TypeScript sans régression (`bunx tsc --noEmit` avec 0 erreur).
- [x] `TASK-TEST-04` : Production du rapport final récapitulatif.
