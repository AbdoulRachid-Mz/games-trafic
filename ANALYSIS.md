# AUDIT COMPLET ET DIAGNOSTIC TECHNIQUE — GAMES-TRAFICS / H³ INFINITY GAMING

> **Date de l'audit** : 27 Octobre 2026  
> **Auteur** : Équipe Senior Architecture Full-Stack & Sécurité  
> **Statut** : Document de référence — Version 1.0  
> **Projet** : Évolution de Games-Trafics vers **H³ Infinity Gaming**  
> **Slogan de marque** : « Joue, échange, domine — L'infini du gaming commence ici. »

---

## 1. RÉSUMÉ EXÉCUTIF

Cet audit exhaustif du projet **Games-Trafics** (en cours de transition vers **H³ Infinity Gaming**) a été réalisé afin d'analyser en profondeur l'architecture, la sécurité, l'intégrité des données financières et relationnelles, les performances, l'ergonomie (UI/UX) et la maintenabilité globale du codebase.

### Principaux enseignements
1. **Sécurité critique (P0)** : Plusieurs failles majeures et immédiatement exploitables ont été découvertes dans la couche serveur (Server Actions et Route Handlers). Notamment, la création de transactions de dépôt/bonus sans contrôle de preuve financière (crédit arbitraire de wallet), l'absence de vérification d'authentification et d'autorisation sur la mise à jour/suppression/bannissement d'utilisateurs (`/api/users/[id]`), la manipulation de portefeuilles (`/api/wallets/[id]`), et l'altération du prix d'achat côté client (`createProductOrder`).
2. **Architecture & Couche d'accès serveur** : Fragmentation importante entre Server Actions (`actions/`), Route Handlers (`app/api/`) et services (`lib/auth/service.ts`). De nombreuses Server Actions marquées `"use server"` exposent des mutations critiques sans aucune validation de session ni contrôle de propriété (IDOR/BOLA), reposant à tort sur le fait que la page client masquait l'interface.
3. **Absence de Middleware actif** : Le fichier `proxy.ts` contient la logique de contrôle d'accès aux routes, mais il n'existe aucun fichier `middleware.ts` à la racine de Next.js, rendant la protection des routes par middleware inactive au niveau HTTP standard.
4. **Intégrité financière & Ledger** : Bien qu'un système de comptabilité en partie double (Double-Entry Ledger) soit présent dans `lib/ledger/ledger-utils.ts`, ses invariants sont contournés par les Server Actions et les API de haut niveau (débit non vérifié sur les dépôts, absence de validation du code PIN serveur).
5. **Validation et Outillage** : Le projet ne possède aucun test unitaire, d'intégration ou E2E automatisé. L'exécution de `eslint` échoue en raison d'un conflit de dépendance entre `zod@^4.3.5` et `eslint-plugin-react-hooks`. `tsc` échoue sur un fichier corrompu de cache Next.js (`.next/dev/types/validator.ts`).
6. **Identité visuelle & UI/UX** : Le projet oscille entre l'ancienne identité "Games-Trafics" (GTC) et "H³ Infinity Gaming". Des textes temporaires (notamment un texte copié de WhatsApp pour le chat) et des composants non reliés subsistent.

---

## 2. ÉTAT RÉEL DU PROJET & CARTOGRAPHIE

### 2.1 Stack technique et versions réelles détectées
- **Framework** : Next.js `16.1.6` (App Router, Turbopack compatible, Server Actions activées).
- **Runtime & UI** : React `19.2.4`, React-DOM `19.2.4`.
- **Typage** : TypeScript `5.x`, `@types/node` `20.x`.
- **Base de données & ORM** : PostgreSQL (Neon Serverless), Drizzle ORM `0.45.1`, Drizzle-Kit `0.31.9`, client `postgres` `3.4.8`.
- **Authentification** : Better Auth `1.5.1` (`@better-auth/passkey`, plugins: `admin`, `anonymous`, `lastLoginMethod`, `oneTap`).
- **State Management & Caching client** : TanStack React Query `5.90.19`, Zustand `5.0.10`.
- **Styles & Design System** : Tailwind CSS `v4` (`@tailwindcss/postcss`), Radix UI, Lucide React `0.562.0`, Framer Motion `12.27.1`, GSAP `3.14.2`.
- **Validation** : Zod `4.3.5` (Beta/v4 preview), `@hookform/resolvers` `5.2.2`, React Hook Form `7.71.1`.
- **Gestionnaire de paquets** : Mismatch détecté. Le dépôt contenait historiquement `pnpm` (`pnpm-lock.yaml`), mais les dépendances ont récemment été manipulées avec `bun` (`bun.lock` présent, binaires `.bunx` dans `node_modules/.bin`), causant des avertissements et déplacements de paquets par `pnpm`.

### 2.2 Inventaire des commandes officielles
- **Installation** : `bun install` (ou `pnpm install` après synchronisation du lockfile).
- **Développement** : `bun run dev` / `next dev`.
- **Type-Check** : `tsc --noEmit`.
- **Linter** : `eslint .` (actuellement en échec sur `zod/v4`).
- **Base de données** :
  - `db:generate` : `drizzle-kit generate:pg`
  - `db:migrate` : `tsx scripts/db/migrate.ts`
  - `db:reset` : `tsx scripts/db/reset.ts`
  - `db:seed` : `tsx database/seed.ts`
- **Tests** : Aucun script ni framework de test configuré dans `package.json`.

---

## 3. CARTOGRAPHIE DES MODULES ET FLUX DE DONNÉES

### 3.1 Arborescence fonctionnelle
```
├── actions/                  # Server Actions (Mutations & Queries métier)
│   ├── app-settings.ts       # Paramètres système & tarifs VIP/frais
│   ├── messages.ts           # Messagerie directe, groupe et commentaires
│   ├── orders.ts             # Commandes marketplace et flux d'escrow
│   ├── phases.ts             # Gestion des phases, brackets et matches de tournoi
│   ├── products.ts           # Produits numériques et identifiants de comptes
│   ├── shops.ts              # Boutiques vendeurs et catégories
│   ├── tournaments.ts        # Tournois, éditions et inscriptions
│   ├── transactions.ts       # Création et historique des transactions financières
│   ├── users.ts              # Profils, rôles, bannissements et statistiques
│   ├── vip.ts                # Abonnements et avantages VIP
│   └── wallets.ts            # Portefeuilles utilisateurs, solde et verrouillage
├── app/                      # Next.js App Router
│   ├── (auth)/               # Pages d'authentification (sign-in, sign-up, reset)
│   ├── (protected)/          # Dashboard, wallet, notifications
│   ├── admin/                # Back-office administration
│   ├── api/                  # Route Handlers REST
│   │   ├── auth/             # Endpoints Better Auth + customs
│   │   ├── shops/            # API Boutiques
│   │   ├── tournaments/      # API Tournois
│   │   ├── transactions/     # API Transactions financières
│   │   ├── users/            # API Utilisateurs et bannissement
│   │   └── wallets/          # API Portefeuilles
│   ├── chats/                # Messagerie et canaux communautaires
│   ├── marketplace/          # Catalogue et détail produit
│   ├── shops/                # Pages publiques des boutiques
│   ├── tournaments/          # Hub et arbres de tournois
│   ├── layout.tsx            # Root Layout avec 7 context providers
│   └── page.tsx              # Page d'accueil H³ Infinity Gaming
├── database/                 # Définition Drizzle ORM
│   ├── schema.ts             # Schéma unique unifié (2393 lignes)
│   └── seed.ts               # Données de test et d'initialisation
├── lib/                      # Services transversaux et utilitaires
│   ├── auth.ts               # Configuration centrale Better Auth
│   ├── db/index.ts           # Instance Drizzle ORM et client postgres
│   ├── encryption.ts         # Module de chiffrement AES-256-GCM
│   ├── ledger/ledger-utils.ts# Double-entry ledger (comptabilité)
│   └── tournaments/          # Moteurs de brackets et propagation
└── proxy.ts                  # Logique d'accès aux routes (non raccordée au middleware Next.js)
```

### 3.2 Analyse des flux de données réels
Un écart critique existe entre le flux théorique et le flux réel :
- **Flux théorique** : Interface → Validation Zod client → Route protégée par Middleware → Server Action avec vérification de session & permissions → Transaction SQL / Ledger double-entry → UI optimiste / Revalidation.
- **Flux réel constaté** :
  1. Le middleware HTTP n'est pas appelé (`proxy.ts` orphelin sans `middleware.ts`).
  2. Les Server Actions acceptent des identifiants (`userId`, `shopId`, `senderId`, `walletId`) directement passés par le client sans vérifier la correspondance avec la session de l'utilisateur connecté.
  3. Des calculs de montants financiers (ex: prix d'une commande) acceptent la valeur envoyée par le payload client (`totalAmount`) au lieu de la forcer depuis la base de données.
  4. Les codes secrets (PIN de portefeuille) sont contrôlés dans des fenêtres modales React, mais ne sont ni transmis ni validés par les Server Actions de mutation financière.

---

## 4. AUDIT DE SÉCURITÉ APPROFONDI (VULNÉRABILITÉS CONFIRMÉES)

| Identifiant | Gravité | Domaine | Description sommaire | Fichiers & Symboles clés |
|---|---|---|---|---|
| **SEC-001** | **P0 - Critique** | Finance / Wallet | Création arbitraire de monnaie (dépôt/bonus sans preuve de paiement) | `actions/transactions.ts:createTransaction`, `app/api/transactions/create/route.ts` |
| **SEC-002** | **P0 - Critique** | Auth / Accès | Prise de contrôle de compte & élévation admin sans authentification | `app/api/users/[id]/route.ts:PATCH`, `actions/users.ts:updateUser` |
| **SEC-003** | **P0 - Critique** | Modération | Bannissement et débannissement d'utilisateurs sans droit admin | `app/api/users/[id]/ban/route.ts:POST` |
| **SEC-004** | **P0 - Critique** | Finance / Wallet | Modification non authentifiée de solde, hash PIN et statut KYC | `app/api/wallets/[id]/route.ts:PUT`, `actions/wallets.ts:updateUserWallet` |
| **SEC-005** | **P0 - Critique** | Marketplace | BOLA/IDOR : Modification et suppression de boutiques/produits d'autrui | `actions/products.ts:updateProduct`, `actions/shops.ts:updateShop` |
| **SEC-006** | **P0 - Critique** | Transactions | Altération de prix d'achat contrôlé par le client dans `createProductOrder` | `actions/orders.ts:createProductOrder` (l.78-79) |
| **SEC-007** | **P0 - Critique** | Tournois | Manipulation et réinitialisation de tournois sans autorisation organisateur | `actions/phases.ts:updateMatch`, `resetEditionStructure` |
| **SEC-008** | **P0 - Critique** | Messagerie | Interception de discussions privées et usurpation d'expéditeur | `actions/messages.ts:getConversation`, `createMessage` |
| **SEC-009** | **P0 - Critique** | Monétisation | Obtention gratuite du statut VIP à vie par Server Action non vérifiée | `actions/vip.ts:createVipSubscription` |
| **SEC-010** | **P0 - Critique** | Sécurité Wallet | Validation PIN purement côté client; absent des Server Actions de transfert | `actions/transactions.ts`, `components/pages/transactions/create/pin-verification.tsx` |
| **SEC-011** | **P1 - Élevée** | Chiffrement | Clé secrète de secours codée en dur dans `lib/encryption.ts` | `lib/encryption.ts:4` (`your-secret-key-32-chars-long`) |
| **SEC-012** | **P1 - Élevée** | Données privées | Stockage en clair des identifiants de comptes gaming dans `orders` | `database/schema.ts:795`, `actions/orders.ts:approveOrderShop` |
| **SEC-013** | **P1 - Élevée** | Architecture | Middleware Next.js inactif (`proxy.ts` sans `middleware.ts` racine) | `proxy.ts`, racine du projet |
| **SEC-014** | **P2 - Moyenne** | Protection API | Absence de Rate Limiting sur les routes de login et d'actions financières | `lib/api/rate-limiter.ts`, `app/api/` |

### Détail des constats critiques (Preuves de code)

#### `SEC-001` — Création arbitraire de monnaie et contournement financier
- **Preuve** : Dans `actions/transactions.ts` (l. 356-363) :
  ```typescript
  } else if (creditTypes.includes(data.type)) {
    // Plateforme crédite user
    const platformAccount = await db.transaction(async (tx) => {
      return await getOrCreatePlatformAccount(tx, "SYSTEM_ADJUSTMENT");
    });
    fromAccountId = platformAccount.id;
    toAccountId = wallet.financialAccountId;
  }
  ```
  `creditTypes` comprend `["DEPOSIT", "BONUS", "REFUND"]`. Dans `lib/ledger/ledger-utils.ts` (l. 276), le contrôle `if (type !== "DEPOSIT" && fromBalance < amount)` dispense explicitement les dépôts de toute vérification de solde source.
- **Scénario d'attaque** : Un utilisateur connecté appelle `POST /api/transactions/create` ou exécute l'action avec `{ walletId: "son_wallet", type: "DEPOSIT", amount: "500000" }`. Le système débite immédiatement `SYSTEM_ADJUSTMENT` et crédite 500 000 GTC sur le compte du joueur sans passer par une passerelle de paiement ni vérification administrative.
- **Correction requise** : Interdire strictement la création directe de transactions de type `DEPOSIT`, `BONUS` ou `REFUND` par le client. Les dépôts doivent résulter exclusivement d'un webhook signé par un processeur de paiement externe (Stripe, Paypal, crypto) ou d'une action réservée aux super-administrateurs avec traçabilité.

#### `SEC-002` — Prise de contrôle de compte & escalade de privilèges
- **Preuve** : Dans `app/api/users/[id]/route.ts` (l. 37-58) :
  ```typescript
  export async function PATCH(req: NextRequest, { params }: Props) {
    const body = await req.json();
    const { id } = await params;
    const updatedUser = await updateUser(id, body);
    return NextResponse.json({ success: true, data: updatedUser });
  }
  ```
  Aucun appel à `getCurrentUser()` ni contrôle de session. De plus, `actions/users.ts:updateUser` ne vérifie pas non plus qui appelle l'action et applique l'intégralité de `userData` avec `db.update(users).set({ ...userData })`.
- **Scénario d'attaque** : Tout internaute non authentifié peut envoyer `PATCH /api/users/<victim-id>` avec `{"role": "admin", "isAdmin": true, "email": "attacker@domain.com"}` et s'octroyer les privilèges administrateur complets.
- **Correction requise** : Exiger une session valide, vérifier que `session.user.id === id || session.user.role === 'admin'`, et filtrer strictement les champs modifiables par un utilisateur standard (interdire `role`, `isAdmin`, `isVip`, `banned`).

#### `SEC-006` — Falsification du prix d'achat dans les commandes
- **Preuve** : Dans `actions/orders.ts` (l. 77-79) :
  ```typescript
  const unitPrice = parseFloat(product.price);
  const price = typeof data.totalAmount === 'number' && data.totalAmount > 0 ? data.totalAmount : unitPrice;
  ```
- **Scénario d'attaque** : Un acheteur soumet une commande pour un compte ou produit listé à 100 000 GTC en spécifiant `totalAmount: 0.01`. La condition `totalAmount > 0` est satisfaite, le système ne débite que 0.01 GTC de son wallet et passe la commande au statut `PENDING` puis réserve le produit.
- **Correction requise** : Supprimer l'argument `totalAmount` fourni par le client. Le prix doit toujours être extrait de l'enregistrement `product` en base de données de manière autoritaire.

#### `SEC-010` — Absence de contrôle serveur du code PIN de portefeuille
- **Preuve** : `actions/transactions.ts:createTransaction` prend en charge les transferts d'argent directs (`TRANSFER`), mais ne contient aucun paramètre `pin` ni aucun appel à `WalletUtils.verifyPin`. Le composant `components/pages/transactions/create/pin-verification.tsx` n'est qu'un écran de saisie superficiel dans le navigateur.
- **Scénario d'attaque** : Un attaquant qui exploite une faille XSS ou accède temporairement au navigateur d'une victime peut vider son portefeuille sans connaître son code PIN secret.
- **Correction requise** : Exiger le hash/signature de vérification du PIN côté serveur avant d'autoriser toute opération sortante de fonds.

---

## 5. AUDIT ARCHITECTURAL ET CONTRATS D'API

### 5.1 Duplication des mécanismes d'authentification
Le projet présente 3 implémentations concurrentes pour gérer l'authentification et l'utilisateur courant :
1. **Better Auth natif** : configuré dans `lib/auth.ts`, exposé via `/api/auth/[...all]`, consommé par `lib/auth-client.ts`.
2. **AuthService manuel** : dans `lib/auth/service.ts`, appelant Better Auth en interne mais ré-implémentant des méthodes personnalisées `signIn`, `signUp`, `getSession`.
3. **API Routes dédiées redondantes** : `app/api/auth/sign-in`, `app/api/auth/sign-up`, `app/api/auth/session` qui créent de la confusion et multiplient les surfaces d'attaque.
4. **Context client dupliqué** : `contexts/auth-context.tsx` interroge manuellement `/api/auth/session` via `hooks/use-auth.ts`, alors que Better Auth fournit déjà `authClient.useSession()`.

### 5.2 Confusion entre Server Actions et Route Handlers
- Plusieurs fonctionnalités (boutiques, tournois, utilisateurs, transactions) possèdent à la fois une Server Action dans `actions/` et un Route Handler dans `app/api/`.
- Les validations et règles de sécurité ne sont pas partagées : par exemple, `app/api/shops/[shopId]/route.ts` vérifie `shop.ownerId === session.id`, mais `actions/shops.ts:updateShop` ne le vérifie pas !
- Un client Next.js ou un script peut court-circuiter les contrôles des Route Handlers en invoquant directement les Server Actions exposées.

### 5.3 Modèle de données et duplication dans les tournois
- Les fichiers `lib/tournaments/` et `actions/phases.ts` souffrent d'une double source de vérité historique : stockage des participants dans `metadata.participants` (JSON) en concurrence avec la table relationnelle `phaseGroupParticipants`.
- Le fichier `PROMPT.md` du dépôt contenait déjà des directives pour uniformiser les participants vers `phaseGroupParticipants`, mais l'implémentation est restée partielle, laissant subsister des générateurs orphelins (`bracket.generator.ts`, `group.generator.ts`, `generators.ts`).

---

## 6. AUDIT DES PERFORMANCES ET DE LA BASE DE DONNÉES

### 6.1 Saturation des connexions Neon / PostgreSQL
- Dans `lib/db/index.ts` :
  ```typescript
  const client = postgres(process.env.DATABASE_URL!);
  export const db = drizzle(client, { schema });
  ```
- En environnement Serverless ou lors du rechargement à chaud (Fast Refresh) en développement, cette instanciation sans mise en cache sur `globalThis` ni restriction du pool (`max: 10`) génère de multiples clients TCP et sature rapidement les quotas de connexion de Neon.

### 6.2 Requêtes de recherche non indexées et séquentielles
- Dans `actions/search.ts:globalSearch`, chaque requête utilisateur déclenche en parallèle des scans `ILIKE '%terme%'` sur 8 tables distinctes (`shops`, `products`, `tournaments`, `themes`, `services`, `guides`, `blogs`, `posts`).
- En l'absence d'index `GIN` / `pg_trgm` ou d'index plein texte PostgreSQL (`tsvector`), ces requêtes effectuent des scans séquentiels complets (Seq Scans), entraînant une dégradation drastique du temps de réponse proportionnelle à la taille de la base.

### 6.3 Cascades de rendus (Render Waterfalls) et fournisseurs racine
- Le fichier `app/layout.tsx` empile 7 providers imbriqués (`QueryProvider`, `ThemeProvider`, `AuthProvider`, `PWAProvider`, `TrackingProviders`, `ExplanationManager`, `AppProvider`).
- Chaque changement dans le statut de l'authentification déclenche un re-rendu global de l'arborescence, y compris pour les parties purement statiques.

---

## 7. AUDIT UI/UX, DESIGN SYSTEM ET IDENTITÉ DE MARQUE

### 7.1 Identité Games-Trafics
- Le slogan officiel de la marque est :  
  **« Joue, échange, domine — L'infini du gaming commence ici. »**
- État actuel : De nombreuses pages mentionnent encore "Games-Trafics", "GT Messenger", "Portefeuille GTC" ou "Suivre le trafic de vos jeux" (metadata dans `app/layout.tsx`).
- L'harmonisation visuelle doit ancrer une identité gaming haut de gamme (sombre, néons équilibrés, lisibilité maximale, contrastes conformes WCAG AA).

### 7.2 Cohérence du Design System (Tailwind v4 & Tokens)
- `app/globals.css` définit des tokens CSS avec le format moderne `oklch()`, mais de nombreux composants utilisent des styles codés en dur ou des variables de chat non standardisées (`--chat-background`, `--chat-surface`).
- Des composants comme `components/cards/card.txt` (2671 lignes) contiennent du code non utilisé provenant d'un autre projet (arts martiaux, combattants, arbitres).

### 7.3 Expérience mobile et accessibilité
- Absence de retour clair sur certaines actions asynchrones (soumission de formulaire sans skeleton ou indicateur de progression).
- Éléments de navigation masqués arbitrairement sur mobile sans alternative accessible.

---

## 8. AUDIT DE LA QUALITÉ DU CODE ET DE LA COUVERTURE DE TESTS

1. **Couverture de tests actuelle : 0%**.
   - Aucun test unitaire (Vitest / Jest) pour valider les calculs du Ledger ou les règles de tournois.
   - Aucun test d'intégration pour vérifier les contrôles d'accès et l'isolation des données entre utilisateurs.
   - Aucun test E2E (Playwright) sur les parcours critiques (inscription, achat, progression de bracket).
2. **Analyse statique bloquée** :
   - `eslint` plante immédiatement : `Cannot find module 'zod/v4'`.
   - `tsc` est pollué par les fichiers de cache dev `.next/dev/types/validator.ts`.

---

## 9. LIMITES DE L'AUDIT INITIAL

- L'audit a été réalisé en analyse statique approfondie du code source et de la configuration sans exécuter d'actions de modification sur les données de production.
- La validation dynamique des WebSockets (`/api/ws/notifications`) confirme son inopérabilité structurelle dans l'environnement standard Next.js sans serveur custom Node.js.

---

## 10. MATRICE DE TRAÇABILITÉ (RÉFÉRENCES CROISÉES)

| Constat Audit | Tâche Opérationnelle (`TASK.md`) | Lot d'Implémentation (`IMPLEMENTATION-PLAN.md`) |
|---|---|---|
| `SEC-001` (Dépôt arbitraire / Balance) | `TASK-SEC-01` | Phase A (Stabilisation & P0) |
| `SEC-002` (Élévation / Prise de compte) | `TASK-SEC-02` | Phase A (Stabilisation & P0) |
| `SEC-003` (Bannissement non admin) | `TASK-SEC-03` | Phase A (Stabilisation & P0) |
| `SEC-004` (Altération wallet non auth) | `TASK-SEC-04` | Phase A (Stabilisation & P0) |
| `SEC-005` (BOLA/IDOR Marketplace) | `TASK-SEC-05` | Phase B (Sécurité & Autorisations) |
| `SEC-006` (Falsification prix commande)| `TASK-SEC-06` | Phase A (Stabilisation & P0) |
| `SEC-007` (Actions tournoi ouvertes) | `TASK-SEC-07` | Phase B (Sécurité & Autorisations) |
| `SEC-008` (Interception chats privés) | `TASK-SEC-08` | Phase B (Sécurité & Autorisations) |
| `SEC-009` (VIP gratuit sans paiement) | `TASK-SEC-09` | Phase B (Sécurité & Autorisations) |
| `SEC-010` (PIN non validé serveur) | `TASK-SEC-10` | Phase B (Sécurité & Autorisations) |
| `SEC-011` (Clé secrète par défaut) | `TASK-SEC-11` | Phase A (Stabilisation & P0) |
| `SEC-012` (Identifiants en clair JSON) | `TASK-SEC-12` | Phase B (Sécurité & Autorisations) |
| `SEC-013` (Middleware HTTP absent) | `TASK-SEC-13` | Phase A (Stabilisation & P0) |
| `ARCH-001` (Duplication Auth) | `TASK-ARCH-01` | Phase C (Architecture & Contrats) |
| `ARCH-002` (Nettoyage orphelins/card.txt)| `TASK-ARCH-02` | Phase C (Architecture & Contrats) |
| `PERF-001` (Pool connexion Neon) | `TASK-PERF-01` | Phase D (Base de données & Perf) |
| `PERF-002` (Optimisation recherche ILIKE)| `TASK-PERF-02` | Phase D (Base de données & Perf) |
| `UI-001` (Harmonisation Games-Trafics) | `TASK-UI-01` | Phase E & F (Design & UI/UX) |
| `TEST-001` (Mise en place suite de test)| `TASK-TEST-01`| Phase G (Tests & Validation) |
