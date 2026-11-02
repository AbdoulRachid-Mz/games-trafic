# CARTOGRAPHIE & AUDIT INITIAL D'ARCHITECTURE — GAMES-TRAFICS

> **Date** : 2026-11-02  
> **Auteur** : Assistant IA d'Ingénierie  
> **Statut** : Document de référence pour la refonte technique globale  
> **Source d'exigences** : `PROMPT.md`

---

## 1. Vue d'Ensemble & État des Lieux

L'application **Games-Trafics** est une plateforme esport et marketplace gaming construite sur **Next.js (App Router, Turbopack)**, **PostgreSQL (Neon)** avec **Drizzle ORM**, **Better Auth**, **TanStack Query** et **Tailwind CSS**.

Plusieurs audits et stabilisations ont déjà été menés (fermeture des failles critiques P0 financières et anti-takeover en Phase A-B, puis fiabilisation du Tournament Engine et du driver PostgreSQL avec support des transactions).

Cependant, comme identifié dans le cahier des charges de `PROMPT.md`, plusieurs chantiers structurels majeurs subsistent :

1. **Cycle de démarrage & Application Shell (P0)** : Des cascades de vérifications asynchrones (`refreshUser`, `useUserProfile`, `getAppSettings`, `canSkipWelcome`) bloquent l'affichage de l'UI avec des loaders intempestifs.
2. **Système PWA & Service Worker (P1)** : Initialisation dispersée, risque de cache non maîtrisé sur les contextes financiers, gestion des workers à simplifier.
3. **Architecture Financière & Ledger (P0)** : Bien que les failles critiques aient été fermées, le code financier est dispersé dans `actions/transactions.ts`, `actions/wallets.ts`, `lib/ledger/ledger-utils.ts`, avec des calculs de frais non centralisés et des modules transactionnels à modulariser.
4. **Moteur de Tournois (Tournament Engine) (P1)** : Des actions géantes (`actions/phases.ts` fait ~4800 lignes) mélangent accès DB, règles métier, formats de compétition et gestion des participants.
5. **Composants d'export & UI des compétitions (P2)** : Pages et modals de compétition contenant des logiques métier redondantes.

---

## 2. Analyse Détaillée par Domaine

### 2.1. Domaine 1 : Application Shell, Layouts & Démarrage (P0)

#### Problèmes confirmés dans `components/layout/app-shell.tsx` & `contexts/` :
- **Cascade d'effets bloquants** :
  1. `AppShell` attend `!isInitialized || !welcomeChecked` en affichant un `<PulseLoading size={150} message="Initialisation..." />`.
  2. `init()` déclenche `refreshUser()` systématiquement sur `useAuthContext`.
  3. `useAuth` exécute déjà une vérification de session au montage (`getSession()`). L'appel à `refreshUser()` est donc redondant au démarrage.
  4. En parallèle, `AppProvider` (`contexts/app-context.tsx`) appelle `useUserProfile({ relations: ["announcements"] })` et `getAppSettings()`.
  5. `useUserProfile` dans `AppShell` appelle une seconde fois le profil avec `relations: ["wallet"]`.
  6. Résultat : 4 requêtes asynchrones en cascade avant d'autoriser l'affichage de la page la plus simple (ex: page d'accueil ou marketplace publique).
- **Affichage bloqué sur routes publiques** :
  - Même pour `/marketplace`, `/tournaments` ou `/services`, l'utilisateur voit un écran de chargement plein écran alors qu'aucun privilège n'est requis.
- **Règles de sécurité côté client vs serveur** :
  - `proxy.ts` gère déjà la redirection des routes protégées côté serveur / Edge. `AppShell` refait une évaluation avec `resolveRoute()` qui peut être optimiste ou purement informative pour le layout.

---

### 2.2. Domaine 2 : Système PWA & Service Worker (P1)

#### État actuel :
- `providers/pwa-provider.tsx` : Enregistre le service worker `/sw.js` uniquement en production, nettoie en dev.
- `components/pwa/disable-sw-in-dev.tsx` : Désenregistre les SW en dev (doublon partiel avec `pwa-provider`).
- `components/pwa/PWAManager.tsx` : Gère le prompt d'installation.
- **Points de vigilance** :
  - Garantir l'interdiction absolue de mise en cache du cache storage sur `/api/wallet/*`, `/api/transactions/*`, et les Server Actions financières.
  - Découpler les prompts d'installation de la structure critique du shell.

---

### 2.3. Domaine 3 : Système Financier, Ledger & Transactions (P0)

#### État actuel :
- Le driver `neon-serverless` Pool avec WebSocket a été mis en place dans `lib/db/index.ts`, rendant enfin fonctionnel `db.transaction(async (tx) => ...)`.
- Les Server Actions dans `actions/transactions.ts` (~800 lignes) contiennent :
  - Validation PIN
  - Calcul de frais
  - Débits / crédits
  - Création de transaction et écritures de ledger
- **Faiblesses architecturales** :
  - Manque d'isolation pure entre le moteur comptable (`ledger-engine`), le calcul de frais (`fee-engine`), et le service métier de paiement (`payment-service`).
  - Duplication des règles de calcul de commission (dans `actions/transactions.ts` et `lib/ledger/ledger-utils.ts`).
  - Les Server Actions exposent parfois des helpers qui devraient rester strictement internes au backend.

---

### 2.4. Domaine 4 : Moteur de Compétition & Tournois (P1)

#### État actuel :
- `actions/phases.ts` : ~4880 lignes ! Ce fichier est surchargé et concentre des dizaines de responsabilités (création de phase, gestion de poules, génération de bracket, tirage au sort, validation de score, calcul des classements, etc.).
- `actions/tournaments.ts` : ~1400 lignes.
- `lib/tournaments/` :
  - `generators.ts` : Fonctions d'orchestration (`setupLeaguePhase`, `setupGroupPhase`, `setupEliminationGroups`, `setupSwissPhase`).
  - `match.generator.ts` : Fonctions de génération de matchs (Round Robin, élimination).
  - `standings.engine.ts` : Calcul des classements.
  - `bracket-engine.ts` : Calcul des vainqueurs et arbres.
- **Besoins d'amélioration** :
  - Découper `actions/phases.ts` et `actions/tournaments.ts` en sous-modules spécialisés sous `actions/phases/` et `actions/tournaments/` avec façades de réexportation rétrocompatibles.
  - Séparer strictement les algorithmes purs (sans DB) des services d'orchestration avec DB (`tx`).
  - Implémenter le simulateur / prévisualisateur de phase avant enregistrement en base.

---

## 3. Matrice de Risques & Dépendances

| Domaine | Risque Identifié | Impact | Stratégie d'Atténuation |
|---|---|---|---|
| **AppShell** | Régression sur la protection des routes | Élevé | Conserver la sécurité dans `proxy.ts` (serveur) et tester les routes protégées / publiques. |
| **AppShell** | Écran blanc si `resolveRoute` échoue | Moyen | Fallback immédiat sur rendu des children pour les routes publiques sans bloquer sur l'auth. |
| **Finance** | Régression sur le calcul de solde | Critique | S'appuyer sur la suite de tests Vitest existante (`tests/unit/wallet/`, `tests/unit/security/`) et enrichir. |
| **Tournois** | Rupture d'imports dans les pages de tournoi | Élevé | Façade de réexportation stricte (`export * from "./phases/..."`). Aucun import existant ne doit casser. |

---

## 4. Synthèse

Le plan de travail priorisé défini dans `PROMPT.md` est confirmé :
- **Phase 1 (Immédiate)** : Optimisation AppShell, déblocage du rendu initial sur routes publiques, élimination des cascades de requêtes au démarrage.
- **Phase 2** : Clarification PWA & cycle de vie.
- **Phase 3** : Structuration de la couche Finance (`lib/finance/`), centralisation des frais & transactions atomiques.
- **Phase 4 & 5** : Décomposition modulaire de `actions/phases.ts` et `actions/tournaments.ts`, pureté des moteurs de compétition.
- **Phase 6 & 7** : Consolidation UI, composants et exports.
- **Phase 8** : Tests complets et validation globale.
