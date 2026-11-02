# PLAN D'EXÉCUTION ET STRATÉGIE DE REFONTE — GAMES-TRAFICS

> **Objectif** : Transformer progressivement et méthodiquement le projet en une application hautement sécurisée, performante, maintenable et alignée sur l'identité de marque **H³ Infinity Gaming** (« Joue, échange, domine — L'infini du gaming commence ici. »).  
> **Source d'audit** : `ANALYSIS.md`  
> **Registre des tâches** : `TASK.md`  
> **Avancement** : Phase A ✅ | Phase B ✅ | Phase C ✅ | Phase D ✅ | Phase E ✅ | Phase F ✅ | Phase G ✅

---

## 1. PRINCIPES FONDAMENTAUX DE MISE EN ŒUVRE

1. **Sécurité et intégrité d'abord** : Aucune optimisation de performance ou refonte visuelle ne sera priorisée avant la neutralisation complète des failles critiques (P0/P1) de vol de compte, de création arbitraire de monnaie et de falsification de prix.
2. **Ne jamais faire confiance au client** : Toute mutation, création ou suppression doit être validée de manière autoritaire sur le serveur (vérification de la session Better Auth, vérification des rôles, vérification de la propriété de la ressource ciblée).
3. **Travail par lots isolés et maîtrisés** : Chaque lot traite un ensemble restreint de fichiers cohérents, validé immédiatement avant d'entamer le lot suivant.
4. **Préservation des fonctionnalités et des données** : Les schémas de base de données existants sont respectés, les migrations nécessaires sont rétrocompatibles, et aucun composant ou fichier utilisateur n'est supprimé sans vérification préalable.
5. **Validation continue** : Chaque phase dispose de critères d'entrée, d'indicateurs de progrès et de critères de sortie stricts basés sur des tests vérifiables.

---

## 2. DÉPENDANCES ET ARBRE D'ORDONNANCEMENT

```
[Phase A : Risques Critiques & Stabilisation]
      │
      ├── Neutralisation crédit arbitraire (TASK-SEC-01)
      ├── Protection Users & Anti-Account-Takeover (TASK-SEC-02, TASK-SEC-03)
      ├── Verrouillage API Wallets (TASK-SEC-04)
      ├── Fix altération prix commandes (TASK-SEC-06)
      ├── Suppression secret en dur (TASK-SEC-11)
      └── Activation Middleware HTTP (TASK-SEC-13)
      │
      ▼
[Phase B : Contrôles d'Autorisation & Intégrité Métier]
      │
      ├── Anti-IDOR Produits & Boutiques (TASK-SEC-05)
      ├── Sécurisation Tournois & Brackets (TASK-SEC-07)
      ├── Confidentialité Messagerie Privée (TASK-SEC-08)
      ├── Sécurisation Flux VIP (TASK-SEC-09)
      ├── Validation Serveur Code PIN (TASK-SEC-10)
      └── Chiffrement Identifiants Gaming (TASK-SEC-12)
      │
      ▼
[Phase C : Architecture, Contrats & Nettoyage]
      │
      ├── Unification Couche Authentification (TASK-ARCH-01)
      ├── Nettoyage Code Mort & Fichiers Orphelins (TASK-ARCH-02)
      └── Stabilisation Outils & Fix ESLint/Zod (TASK-ARCH-03)
      │
      ▼
[Phase D : Base de Données & Performances]
      │
      ├── Singleton Pool Neon PostgreSQL (TASK-PERF-01)
      └── Optimisation Recherche & Indexation (TASK-PERF-02)
      │
      ▼
[Phase E : Design System & Tokens H³ Infinity]
      │
      ├── Intégration Marque & Slogan H³ Infinity (TASK-UI-01)
      └── Harmonisation Tokens Tailwind v4 & Dark Mode (TASK-UI-02)
      │
      ▼
[Phase F : Refonte UI/UX des Parcours Métier]
      │
      ├── Refonte Pages Auth, Dashboard & Wallet
      ├── Refonte Marketplace & Fiches Produits
      ├── Refonte Hub Tournois & Visualisation Brackets
      └── Refonte Messagerie & Espace Communautaire
      │
      ▼
[Phase G : Suite de Tests & Validation Finale de Production]
      ├── Infrastructure Vitest & Tests Unitaires (TASK-TEST-01)
      ├── Tests d'Intégration Sécurité (Non-régression P0/P1)
      └── Validation Compilation TypeScript, Lint & Build Production
```

---

## 3. PHASES D'EXÉCUTION DÉTAILLÉES

### PHASE A — Risques Critiques & Stabilisation Fondamentale
- **Objectif** : Fermer immédiatement toutes les portes d'entrée permettant l'altération de données ou le vol financier.
- **Tâches couvertes** : `TASK-SEC-01`, `TASK-SEC-02`, `TASK-SEC-03`, `TASK-SEC-04`, `TASK-SEC-06`, `TASK-SEC-11`, `TASK-SEC-13`.
- **Modules concernés** :
  - `actions/transactions.ts`
  - `actions/users.ts`
  - `actions/orders.ts`
  - `app/api/transactions/create/route.ts`
  - `app/api/users/[id]/route.ts`
  - `app/api/users/[id]/ban/route.ts`
  - `app/api/wallets/[id]/route.ts`
  - `lib/encryption.ts`
  - `middleware.ts` / `proxy.ts`
- **Risques de régression** : Risque de bloquer des requêtes légitimes du frontend si les cookies de session ne sont pas correctement transmis dans les Server Actions ou Route Handlers.
- **Stratégie d'atténuation** :
  - S'appuyer systématiquement sur `getCurrentUser()` de `lib/auth/session.ts` qui lit les cookies via `next/headers`.
  - Retourner des codes HTTP standardisés (`401 Unauthorized`, `403 Forbidden`) et des messages d'erreur clairs.
- **Critères de sortie de phase** :
  - Aucune transaction de dépôt direct ne peut être initiée par un client.
  - Aucune modification de profil ou élévation de rôle non autorisée n'est acceptée.
  - Le prix des commandes provient à 100% de la base de données.
  - Le middleware Next.js filtre effectivement les accès anonymes aux routes privées.

---

### PHASE B — Contrôles d'Autorisation & Intégrité Métier
- **Objectif** : Éliminer les vulnérabilités de type BOLA/IDOR sur les domaines métier (boutiques, tournois, messages, VIP, identifiants).
- **Tâches couvertes** : `TASK-SEC-05`, `TASK-SEC-07`, `TASK-SEC-08`, `TASK-SEC-09`, `TASK-SEC-10`, `TASK-SEC-12`.
- **Modules concernés** :
  - `actions/products.ts`
  - `actions/shops.ts`
  - `actions/phases.ts`
  - `actions/messages.ts`
  - `actions/vip.ts`
  - `actions/wallets.ts`
- **Risques de régression** : Échec d'affichage pour les organisateurs de tournois ou les gérants de boutiques légitimes si les relations en base de données sont incohérentes.
- **Stratégie d'atténuation** :
  - Rédiger des helpers de vérification réutilisables (`assertShopOwner(shopId, userId)`, `assertTournamentOrganizer(editionId, userId)`).
  - Fournir des messages d'erreur explicites facilitant le diagnostic.
- **Critères de sortie de phase** :
  - Un utilisateur ne peut agir que sur ses propres boutiques, produits et messages.
  - Les phases et brackets de tournois ne peuvent être modifiés que par l'organisateur assigné.
  - Tout transfert de fonds requiert la vérification serveur du code PIN.
  - Les identifiants de jeux sont chiffrés et protégés contre les lectures prématurées.

---

### PHASE C — Architecture, Contrats & Nettoyage
- **Objectif** : Unifier la stack d'authentification, éliminer la duplication de code et résoudre les blocages d'outillage.
- **Tâches couvertes** : `TASK-ARCH-01`, `TASK-ARCH-02`, `TASK-ARCH-03`.
- **Modules concernés** :
  - `lib/auth/`
  - `contexts/auth-context.tsx`
  - `hooks/use-auth.ts`
  - `package.json`
  - `eslint.config.mjs`
  - Nettoyage `card.txt` et fichiers vides
- **Risques de régression** : Déconnexion inopinée de l'utilisateur ou régression des composants de navigation dépendant de `useAuth`.
- **Stratégie d'atténuation** :
  - Conserver l'interface TypeScript de `useAuth` en la connectant directement à `authClient.useSession()` sans casser les composants consommateurs.
- **Critères de sortie de phase** :
  - Suppression des endpoints redondants `/api/auth/*`.
  - `eslint .` s'exécute avec succès.

---

### PHASE D — Base de Données & Performances
- **Objectif** : Sécuriser la montée en charge sur Neon PostgreSQL et accélérer les temps de réponse.
- **Tâches couvertes** : `TASK-PERF-01`, `TASK-PERF-02`.
- **Modules concernés** :
  - `lib/db/index.ts`
  - `actions/search.ts`
  - `database/schema.ts`
- **Critères de sortie de phase** :
  - Singleton Neon PostgreSQL actif empêchant les fuites de connexions.
  - Requêtes de recherche allégées avec filtres pertinents et pagination.

---

### PHASE E — Design System & Tokens Games-Trafics
- **Objectif** : Établir les fondations visuelles de l'identité **Games-Trafics**.
- **Slogan officiel** : « Joue, échange, domine — L'infini du gaming commence ici. »
- **Tâches couvertes** : `TASK-UI-01`, `TASK-UI-02`.
- **Modules concernés** :
  - `app/globals.css`
  - `app/layout.tsx`
  - `components/ui/`
  - `components/layout/app-shell.tsx`
- **Critères de sortie de phase** :
  - Tokens Tailwind v4 harmonisés.
  - Présence affirmée de l'identité de marque et de son slogan sur les pages clés.

---

### PHASE F — Refonte UI/UX par Domaine Fonctionnel
- **Objectif** : Rénover l'expérience utilisateur des différents espaces de la plateforme.
- **Périmètre** :
  1. **Accueil & Découverte** : Hero immersif avec le slogan de marque, écosystème de jeu, statistiques globales.
  2. **Espace Compétitif (Tournois)** : Visualisation claire des brackets d'élimination et des poules, saisie intuitive des scores.
  3. **Marketplace & Boutiques** : Fiches produits claires, mise en avant des vendeurs certifiés, tunnel de commande sécurisé.
  4. **Wallet H³ (GTC)** : Historique clair des transactions, dialogue de transfert fluide avec clavier PIN sécurisé.
  5. **Messagerie H³ Infinity** : Interface de chat épurée, responsive, sans faux texte WhatsApp, adaptée aux transactions et matches.

---

### PHASE G — Tests, Non-Régression & Validation Finale
- **Objectif** : Valider rigoureusement l'ensemble des couches et certifier l'aptitude au déploiement en production.
- **Tâches couvertes** : `TASK-TEST-01`.
- **Validations requises** :
  1. `tsc --noEmit` : 0 erreur de typage.
  2. `npm run lint` / `bun run lint` : 0 erreur de linting.
  3. Tests automatisés : 100% des tests de sécurité et de calcul du Ledger au vert.
  4. `npm run build` / `bun run build` : Compilation Next.js réussie sans avertissement critique.

---

## 4. CONDITIONS DE RETOUR ARRIÈRE (ROLLBACK)

En cas d'anomalie bloquante détectée lors d'un lot :
1. Chaque lot de modifications fera l'objet d'un ensemble de commits Git atomiques et documentés.
2. Si un lot provoque une régression fonctionnelle majeure, un retour arrière ciblé (`git revert`) sur le commit dudit lot sera immédiatement opéré sans impacter les lots précédents validés.
3. Aucune modification de structure de base de données irréversible (drop de colonne) ne sera effectuée sans sauvegarde préalable et script de rollback testé.

---

## 5. CRITÈRES DE FIN DE LA MISSION DE REFONTE

La refonte sera déclarée terminée lorsque :
- [ ] L'ensemble des tâches P0 et P1 de `TASK.md` sont cochées `[x]` avec preuve de test.
- [ ] Le middleware Next.js protège activement l'accès aux routes privées et d'administration.
- [ ] Les opérations financières et de ledger garantissent l'exactitude des soldes et l'impossibilité de créer de la monnaie sans source valide.
- [ ] L'identité **H³ Infinity Gaming** et son slogan « Joue, échange, domine — L'infini du gaming commence ici. » sont déployés de façon cohérente sur toute l'application.
- [ ] Les commandes de validation (`tsc`, `lint`, `test`, `build`) passent avec succès.
- [ ] Les trois documents de référence (`ANALYSIS.md`, `TASK.md`, `IMPLEMENTATION-PLAN.md`) sont synchronisés avec l'état réel final du projet.
