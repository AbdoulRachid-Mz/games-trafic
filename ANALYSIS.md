# GAMES-TRAFICS — ANALYSE FONCTIONNELLE ET TECHNIQUE COMPLÈTE

> **Date de l'analyse** : 2026-11-03
> **Périmètre** : l'intégralité du dépôt `games-trafics` (code applicatif, actions serveur, API, modèle de données, hooks, PWA, tests).
> **Nature du document** : cartographie descriptive du **code réellement présent**. Ce n'est ni un plan de refonte, ni une recette de validation.
> **Langue** : français.
> **Méthode** : lecture directe des fichiers structurants, inventaire exhaustif des pages/actions/routes/hooks, recoupement de quatre audits de domaine (socle/auth/PWA, finance, social/contenu/API, tournois). Les zones non lues sont explicitement signalées « à confirmer ».
> **Avertissement** : la section 17.E archive l'ancien contenu de `ANALYSIS.md`. Ce contenu annonçait une refonte totalement terminée et « 111/111 tests ». Ces affirmations ne sont **pas** confirmées par l'état du code et sont contredites sur plusieurs points (voir §15.4).

---

## 0. SYNTHÈSE EXÉCUTIVE

**Games-Trafics** est une plateforme web communautaire et marchande autour du gaming/esport. Elle réunit dans une même application :

- une **marketplace** (boutiques, produits, commandes avec escrow et remise d'identifiants) ;
- un **système de tournois** multi-éditions, multi-phases (groupes, élimination, ronde suisse, bracket) avec classements et progression ;
- un **wallet interne** en GTC adossé à une comptabilité en partie double (`ledger_entries`) ;
- un **réseau social** (posts/stories, blogs, guides, clips, chat, groupes, commentaires, interactions) ;
- des **services** (prestations), des **signaux** de modération, des **annonces**, des **notifications** ;
- une **administration** à trois niveaux (A/B/C), avec API publique à clés, logs et rate limiting ;
- une **PWA** avec service worker, cache hors-ligne et notifications push.

### 0.1 Chiffres clés (inventaire du dépôt)

| Élément | Volume |
|---|---|
| Pages Next.js (`app/**/page.tsx`) | **150** |
| Composants (`components/**`) | **375 fichiers** |
| Hooks (`hooks/*.ts[x]`) | **76** |
| Modules de Server Actions (`actions/**/*.ts`) | **56** |
| Routes API (`app/api/**/route.ts`) | **33** |
| Tables PostgreSQL déclarées (`pgTable`) | **61** |
| Fichiers de tests | **12** |
| Pages admin (`app/admin/**`) | **43** |

### 0.2 Ce qui fonctionne réellement

- Le **moteur comptable** `lib/finance/ledger/ledger-engine.ts` est correct dans son principe : verrouillage `SELECT … FOR UPDATE`, contrôle des comptes actifs/verrouillés, calcul du solde depuis le ledger, débit/crédit équilibrés avec un compte de frais.
- Le **moteur de frais** `lib/finance/fees/fee-engine.ts` centralise les taux et applique une réduction VIP.
- Le **moteur de tournois** est riche : générateurs round-robin (méthode du ruban), groupes, bracket, prévisualisation pure, classements avec tiebreakers, progression inter-phases, dédoublonnage des qualifiés.
- Le **Service Worker** exclut correctement les contextes sensibles (`/api/`, auth, wallet, transactions, paiement, admin) du cache et ne sert jamais une page financière depuis le cache.
- **Better Auth** est branché sérieusement (sessions, OAuth Google, passkey, one-tap, anonyme, admin).
- La **résolution de routes** est centralisée et compilée, avec une couverture de tests unitaires.

### 0.3 Ce qui est cassé, incohérent ou dangereux

| Gravité | Constat | Référence |
|---|---|---|
| **Critique** | `/api/cookies` non authentifié expose **tous** les cookies, y compris la session Better Auth | §11.6 |
| **Critique** | `GET/POST /api/users` non authentifié : énumération d'emails/téléphones et création d'utilisateurs | §11.6 |
| **Critique** | CRUD `/api/games` et `/api/services` non authentifié | §11.6 |
| **Critique** | Server Actions financières sans contrôle d'accès (`depositToWallet`, `transferMoney`, `updateTransactionFees`, `renewVipSubscription`, `createUserWallet`) | §5.10 |
| **Critique** | Deux implémentations de `createTransaction` ; celle de `actions/wallets.ts` ne verrouille pas, ne vérifie ni PIN ni auth | §5.10 |
| **Critique** | `actions/claims.ts` et `actions/app-settings.ts` : mutations sans auth (frais, prix VIP, maintenance) | §12.5 |
| **Élevé** | `joinEdition` sur édition payante ne déclenche **aucun** paiement : la demande s'arrête à `paymentRequired` | §6.3 |
| **Élevé** | Escrow des commandes structurellement négatif (frais comptés deux fois) | §7.3 |
| **Élevé** | `/api/auth/profile?userId=` sans contrôle de session/visibilité | §4.4 |
| **Élevé** | Chat : actions `messages`/`groups`/`interactions` font confiance aux IDs client ; élévation de privilèges possible | §8.5 |
| **Élevé** | Upload de pièces jointes factice dans le chat (aucun fichier réellement stocké) | §8.4 |
| **Élevé** | `vipSubscriptions.userId` unique global : impossible de renouveler après expiration | §5.6 |
| **Moyen** | Trois systèmes de permissions divergents, `level` A/B/C ignoré par la finance | §4.5, §12.4 |
| **Moyen** | `hasWallet` toujours faux/vrai selon le chemin, FAB wallet désactivés | §3.5 |
| **Moyen** | PWA : pas de gestion `waiting`/`controllerchange`, code `localStorage` mort dans le SW | §13.5 |
| **Moyen** | `conversations.unreadCount` jamais incrémenté ; badges non fiables | §8.6 |
| **Moyen** | Doublons structurels : deux handlers API, deux `getUserStats`, deux helpers de partage, trois chemins d'upload | §15.3 |

---

## 1. STACK TECHNIQUE ET OUTILLAGE

### 1.1 Socle

| Couche | Technologie | Remarques |
|---|---|---|
| Framework | **Next.js 16.4.3**, App Router, Turbopack | Server Components + Server Actions + routes handlers |
| UI | **React 19**, TypeScript | Composants clients massifs, `"use client"` fréquent |
| Styles | **Tailwind CSS** + composants façon shadcn/ui | `class-variance-authority`, `tailwind-merge`, icônes Lucide |
| Base | **PostgreSQL (Neon)** via `@neondatabase/serverless` + `drizzle-orm/neon-serverless` | Pool WebSocket → `db.transaction()` réellement supporté |
| ORM | **Drizzle ORM** | schéma unique `database/schema.ts` (≈3 480 lignes), migrations `drizzle/` |
| Auth | **Better Auth** | email/password, Google OAuth, passkey, anonyme, one-tap, plugin admin |
| Data client | **TanStack Query v5** | `staleTime` global 5 min, `refetchOnWindowFocus: false` |
| Validation | **Zod** | utilisé dans les routes API et certaines actions |
| Tests | **Vitest** + `@testing-library` / `jsdom` selon les cas | environnement Node, timeout 15 s |
| PWA | Service Worker maison (`public/sw.js`), manifest Next | push, offline, cache runtime |
| Realtime | **Aucun WebSocket/SSE** | chat = polling ; `useMessageSubscription` = placeholder |
| Paiement | **Aucun provider réel** | wallet interne uniquement, pas de Stripe/Mobile Money branché |

### 1.2 Organisation et conventions

- **Server Actions** : presque toute la logique métier est dans `actions/**`, exposée directement aux composants clients (`"use server"` implicite ou explicite). Ce sont les véritables endpoints métier, souvent plus utilisés que les routes REST.
- **Routes API** : réservées à l'auth, aux intégrations externes, aux API publiques à clé, et à quelques flux wallet/transaction.
- **Hooks** : couche TanStack Query au-dessus des Server Actions (`use-tournaments`, `use-wallets`, `use-messages`, etc.).
- **Config** : `config/routes-config.ts` (source déclarative), `config/admin-items.ts` (navigation et niveaux admin), `config/app-config.ts` (réglages par défaut).
- **Composants** : `components/pages/**` par domaine, `components/layout/**` pour le shell, `components/ui/**` pour les primitives.
- **Types** : `database/schema.ts` infère les types ; `types/api.ts` (≈50 Ko) centralise les filtres et réponses.

### 1.3 Variables d'environnement critiques

- `DATABASE_URL` (Neon, WebSocket) ;
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` ;
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ;
- `ADMIN_USER_IDS` (plugin admin Better Auth) ;
- `SEARCH_ENCRYPTION_KEY` (AES-256-GCM, Base64 32 octets) ;
- `REDIS_URL` (optionnel, rate limiting) ;
- configuration Firebase/VAPID pour le push (fichier `config/firebase`, à confirmer).

`lib/encryption.ts` échoue volontairement si `SEARCH_ENCRYPTION_KEY` est absente ou mal formée : c'est un point de rupture au démarrage des flux qui chiffrent les identifiants de commande.

### 1.4 Scripts et qualité

- Scripts probables : `dev`, `build`, `start`, `lint`, `test`, `test:run`, `db:generate`, `db:migrate`, `db:seed` (d'après `package.json`).
- `next.config.ts` : configuration images, en-têtes, éventuels rewrites (détail non exhaustif).
- `vitest.config.ts` : alias `@`, environnement `node`, `include: tests/**/*.test.ts[x]`.

---

## 2. CARTOGRAPHIE DU DÉPÔT

### 2.1 Arborescence de premier niveau

| Dossier | Rôle |
|---|---|
| `app/` | Routes Next (pages, layouts, routes API), 150 pages |
| `actions/` | Server Actions métier (56 modules), dont sous-modules `actions/phases/**` et `actions/tournaments/**` |
| `components/` | UI (375 fichiers), layout, pages par domaine, primitives |
| `contexts/` | Auth, App (settings/annonces), Chat, Tracing |
| `providers/` | Query, thème, PWA, tracking |
| `hooks/` | 76 hooks React Query / UI / PWA / tracing |
| `lib/` | Noyaux : `auth`, `api`, `finance`, `ledger`, `wallet`, `routes`, `tournaments`, `filters`, `services`, `ai`, `utils` |
| `database/` | `schema.ts`, `seed.ts`, `db.sql`, scripts |
| `config/` | Routes, admin, app settings |
| `validations/` | Schémas Zod (`game-clips`, `partners` uniquement) |
| `types/` | Types transverses (API, chat, trace, vues) |
| `stores/` | Zustand (audio chat, clips) |
| `utils/` | Export, PDF, QR, partage, crypto, images |
| `tests/unit/**` | 12 fichiers de tests |
| `public/` | `sw.js`, icônes, images, manifest |
| `docs/`, `drizzle/`, `scripts/` | Documentation interne, migrations, scripts |

### 2.2 Zones mortes ou quasi vides

- `error-to-fixe.md`, `IMPLEMENTATION-PLAN.md`, `TASK.md`, `TEXT.md` : **vides ou quasi vides**.
- `types/user.ts` : **2 octets**, fichier vide.
- `hooks/use-firebase-token.ts` : **entièrement commenté**, aucun export.
- `hooks/use-fab-actions.ts` et `hooks/use-fab-actions.tsx` coexistent.
- Shimmes de réexport : `actions/game-items.ts`, `actions/phases.ts`, `actions/tournaments.ts`, `actions/phases/index.ts`.
- `lib/auth/middleware.ts`, `lib/auth/logic.ts`, `lib/auth/errors.ts` : implémentations alternatives peu ou pas consommées.

---

## 3. DÉMARRAGE, PROVIDERS, ROUTING ET LAYOUTS

### 3.1 Arbre des providers (`app/layout.tsx`)

Ordre exact :

```
<html>
  <body>
    <Toaster />
    <DisableSWInDev />
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system">
        <AuthProvider>
          <PWAProvider>
            <TrackingProviders>
              <ExplanationManager />
              <AppProvider>
                <AppShell>{children}</AppShell>
              </AppProvider>
            </TrackingProviders>
          </PWAProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  </body>
</html>
```

Conséquences :

- **Un seul `QueryClient`** par session, créé via `useState`. `staleTime` 5 min, `refetchOnWindowFocus: false`.
- `AuthProvider` déclenche immédiatement `GET /api/auth/get-session` (clé `["auth","session"]`).
- `AppProvider` déclenche `getAppSettings()` et `useUserProfile({ mode: "minimal", relations: ["announcements"] })`.
- `AppShell` déclenche un **troisième** appel profil : `useUserProfile({ mode: "partial", relations: ["wallet"] })`.
- `AdminLayout` ajoute un **quatrième** appel profil (`mode` par défaut) pour les pages admin.
- `TracingProvider` retarde le premier rendu réel d'un paint (`canRender=false` → `useEffect`), même quand la redirection welcome est désactivée.

### 3.2 Cascade réelle au démarrage

1. Requête session Better Auth.
2. Si authentifié : profil minimal + annonces, profil partiel + wallet, réglages d'application.
3. En parallèle : initialisation du tracing (localStorage/sessionStorage), `trackPageView`, éventuelle création de session.
4. `AppShell` résout la route et décide du layout.
5. Sur `/admin/**`, une requête profil supplémentaire part du layout admin.

**Il n'y a aucune déduplication inter-clés** : `queryKey = ["userProfile", mode, ...relations]`. Les trois appels ne partagent pas le même cache. C'est une source directe de latence et de requêtes inutiles.

### 3.3 Résolution de routes

Deux couches coexistent :

1. **`config/routes-config.ts`** : source déclarative `ROUTE_CONFIG` (29 entrées `path`). Chaque entrée définit `requireAuth`, `requireAdmin`, `guestOnly`, `excludeLayout`, `styleGroup`, breadcrumbs, barres, FAB, etc.
2. **`lib/routes/resolver.ts`** : compile la config en regex, calcule un score de spécificité, résout le layout et les éléments de navigation. C'est la version réellement utilisée par `proxy.ts` et `AppShell`.

Fonctionnement :

- `compileRoutes` transforme `[param]` en `([^/]+)`, `*` en `[^/]*`, `**` en `.*`.
- Score = `priority * 1000 + spécificité` (statique 2, dynamique 1, `*` 0.5, `**` 0).
- `resolveLayout` : `excludeLayout` → `none` ; `dashboard|chat|wallet|profile` → `dashboard` ; `admin` → `admin` ; sinon `public`.
- `checkAccess` : admin prioritaire, puis auth, puis `guestOnly`.
- `buildResolvedRoute` produit `topMiddle`, `leftBar`, `rightBar`, `floatingDock`, `fabActions`, `breadcrumbs`, `aiAssistant`.

**Défauts constatés :**

- `findRouteConfig` retourne, en cas d'absence de correspondance, **la dernière entrée de `ROUTE_CONFIG`** (la config `/signals`), pas une config neutre.
- `canAccessRoute` ignore totalement `level` admin et le statut VIP.
- Doublons de routes : `/wallet/transactions` déclaré deux fois ; `/wallet/claims` après `/wallet/**`.
- `DEFAULT_ROUTE.hasAccess = true` pour tout chemin non interne et non reconnu : le resolver est permissif par défaut.
- `console.warn` à chaque route inconnue, y compris en production.
- `defaultFABActions` référence `/wallet/transactions/qr`, qui existe bien, mais le FAB `qr-scanner` est en réalité intercepté localement dans `MainLayout`.

### 3.4 `proxy.ts` (middleware)

Pour chaque requête matchée :

1. `auth.api.getSession({ headers })`.
2. Calcul de `isAdmin = role === "admin" || isAdmin === true`, `isVip`.
3. **`hasWallet = !!session.user`** : toujours vrai dès qu'un utilisateur est connecté. Le flag ne reflète jamais l'existence d'un wallet.
4. `resolveRoute(pathname, roles)`.
5. Redirection si `!hasAccess`, sinon redirection `guestOnly`.

Le matcher exclut `_next/*`, les fichiers statiques et `api/auth`, mais **pas** les autres `/api/*` : elles traversent le proxy, puis `isInternalPath` les laisse passer. Aucune protection CSRF/origin explicite au niveau du proxy.

### 3.5 `AppShell` et `MainLayout`

`components/layout/app-shell.tsx` :

- `welcomeChecked` est initialisé depuis `localStorage` puis **n'est jamais lu dans le rendu** : état mort.
- Il ne bloque le rendu avec `LoadingScreen` que si `resolved.requireAuth && authLoading`. Les routes publiques s'affichent donc directement : la promesse « non bloquant » de l'ancien audit est **partiellement vraie**.
- Il calcule `userRoles.hasWallet = !!profile?.wallet?.id || (user as any)?.hasWallet`. Or `/api/auth/profile` **retire systématiquement la relation `wallet`** (`relations.filter(r => r !== "wallet")`). Donc `hasWallet` est presque toujours faux, et les FAB `requireWallet` (scan QR) sont désactivés.
- Si `resolved && !resolved.hasAccess`, il affiche un spinner « Redirection en cours… » **sans rediriger** : si le proxy n'a pas traité la navigation (navigation client), l'utilisateur reste bloqué.
- Il gère le mode maintenance (`maintenanceMode && !isAdmin` → `/maintenance`).
- Il programme l'ouverture des annonces après 1 500 ms, en doublon avec un effet de `AppProvider`.
- Il gère aussi la redirection welcome, en doublon avec `TracingProvider`.

`components/layout/main-layout.tsx` :

- Barres gauche/droite toujours en `Sheet` (pas de sidebar desktop persistante).
- `AIAssistant` est **importé mais rendu commenté**.
- `OnTapPopup` conditionné par `showOnTap && isConnected`.
- `FloatingActionButton` affiché si actions ou liens de dock.
- `maintenanceMode` remplace les enfants par un écran maintenance.

### 3.6 Layouts

| Layout | Fichier | Garde |
|---|---|---|
| Racine | `app/layout.tsx` | Providers + shell |
| Auth | Aucun layout dédié | Chaque page de `app/(auth)/**` gère sa propre mise en page |
| Protégé | `app/(protected)/layout.tsx` | **Serveur** : session obligatoire, initialisation wallet, pas de contrôle `banned/isActive/isDeleted` |
| Dashboard protégé | `app/(protected)/dashboard/layout.tsx` | Client : `router.push` **pendant le rendu** si non connecté (anti-pattern) |
| Admin | `app/admin/layout.tsx` | **Client** : vérifie `user.isAdmin`, niveau, route courante |

L'admin est donc protégé trois fois : proxy serveur, layout protégé (si la route est sous `(protected)`), layout admin client. La sécurité réelle repose sur le proxy ; les layouts sont des doublons.

### 3.7 Redirections sûres

`lib/routes/safe-redirect.ts` :

- `getSafeRedirectUrl` est correct : rejet de `//`, `\`, protocoles, `\r\n\0`, pages auth ; retour au fallback.
- `ALLOWED_INTERNAL_PREFIXES` est déclaré mais **jamais utilisé** (liste morte).
- `canSkipWelcome` accepte trois noms de paramètre (`skipWelcome`, `skip_welcome`, `ignore_visite`).
- Les redirections de `checkAccess` ne conservent pas l'URL cible : le `?redirect=` du proxy est rarement alimenté.

### 3.8 Frontières d'erreur

- `app/error.tsx` : boundary de segment, bouton `reset()`, log console.
- `app/global-error.tsx` : boundary racine, bouton `window.location.reload()` + `reset()`.
- `app/not-found.tsx` : page 404 francophone avec retour accueil/contact, encapsulée dans `Suspense`.
- Aucun reporting d'erreur distant (Sentry ou équivalent) identifié.

---

## 4. AUTHENTIFICATION, SESSIONS ET PROFILS

### 4.1 Configuration Better Auth (`lib/auth.ts`)

- `drizzleAdapter(db, { provider: "pg" })` mappé sur `users`, `session`, `account`, `verification`, `passkey`.
- `session.cookieCache { enabled: true, maxAge: 300 }` : la session peut être servie depuis un cookie 5 minutes. Les changements de rôle, ban ou VIP ne sont **pas instantanés**.
- `emailAndPassword { enabled: true, requireEmailVerification: false }` : inscription utilisable sans email vérifié.
- Google OAuth (`GOOGLE_CLIENT_ID/SECRET`).
- Plugins : `admin({ adminUserIds: ADMIN_USER_IDS })`, `anonymous({ onLinkAccount: migrateAnonymousUserData })`, `lastLoginMethod({ storeInDatabase: true })`, `passkey()`, `oneTap()`, `nextCookies()`.
- Champs session exposés : `isAdmin`, `isVip`, `level` (A/B/C), `accountTypes`, `banned`, `banReason`, `banExpires`, `settings`, `socialMedia`, `address`, etc.
- `fullName`/`profileImage` mappés sur `name`/`image` (compatibilité Better Auth).

### 4.2 Helpers serveur (`lib/auth/session.ts`)

- `getServerSession`, `getServerSession2(headers)`, `isAuthenticated`, `getCurrentUser`, `getCurrentUser2`.
- Toutes les erreurs sont avalées (`catch → null`) : une panne DB est indistinguable d'un utilisateur anonyme. C'est confortable mais masque les incidents.

### 4.3 Client (`lib/auth-client.ts`)

- `createAuthClient` avec `baseURL: getAppUrlEnv()`.
- Plugins : `anonymousClient`, `adminClient`, `lastLoginMethodClient`, `passkeyClient`, `oneTapClient({ clientId, autoSelect: false, maxAttempts: 5 })`.

### 4.4 Contexte et hooks d'auth

`hooks/use-auth.ts` :

- `fetchSession` retourne `{ authenticated, user }` ou `{ false, null }` en cas d'erreur, sans throw.
- `getPermissions`/`getRoles` dérivent côté client :
  - admin → `admin:access`, `user:manage`, `content:manage`, `system:config` ;
  - VIP → `vip:access`, `theme:create`, `shop:create_multiple`, `tournament:create_multiple` ;
  - `accountTypes` → `product:sell`, `shop:create`, `tournament:create/manage`, `product:trade`, `exchange:create`.
- `signOut` appelle `authClient.signOut()` puis `resetQueries(["auth"])`.
- `refreshUser` invalide `["auth","session"]`.
- `verifyResetToken` est un **stub** qui retourne `"Utilisateur"` sans appel réseau.

`contexts/auth-context.tsx` :

- `useMemo(..., [auth])` où `auth` est un objet recréé à chaque rendu : le memo est **inopérant**, toute la valeur du contexte change à chaque rendu.
- Expose des hooks de compatibilité `useAuthState`, `usePermissions`, `useRoles`.

`hooks/use-profile.ts` :

- `GET /api/auth/profile?me=true&mode=…&relations=…`.
- `401 → null`.
- `queryKey` inclut mode + relations.
- `staleTime` 5 min (minimal) / 2 min (partial) / 1 min (full).
- `enabled: enabled && isAuthenticated`.

`hooks/use-profile-actions.ts` : mutation `updateUser(userId, data)` via Server Action, invalidation globale `["userProfile"]`, toasts.

`hooks/use-profile-completion.ts` : score pondéré sur 100 (fullName 15, bio 10, image 15, cover 15, website 5, socialMedia 10, country 10, téléphone 10, email vérifié 10).

`hooks/use-users.ts` : clés hiérarchiques `userKeys`, `useUserById`, `useUsers`, `staleTime` 5 min.

### 4.5 Trois systèmes de permissions divergents

| Système | Fichier | Contenu | Utilisé ? |
|---|---|---|---|
| Client « auth » | `hooks/use-auth.ts` | Permissions dérivées de `isAdmin`, `isVip`, `accountTypes` | Oui, par l'UI |
| Middleware API | `lib/auth/middleware.ts` | `verifyAuthToken`, `requireAuth`, `withAuth`, `getUserPermissions` (base + VIP + admin + level A) | **Non** par `proxy.ts` |
| Logique métier | `lib/auth/logic.ts` | `RolePermissions`, rôles `ADMIN|VIP|USER|SELLER`, `enrichUser` | **Non** branché |

Résultat : un même utilisateur peut être considéré admin par l'UI, refusé par un helper API, et ignoré par la finance (qui ne lit que `role`/`isAdmin`). C'est une dette de sécurité structurelle.

### 4.6 Route de profil (`app/api/auth/profile/route.ts`)

- `mode` est casté `as any` **sans validation**.
- `relations` est splitté sur `,`.
- `wallet` est **systématiquement retiré** des relations.
- Branches :
  - `me=true` : session obligatoire, 401 sinon, `getMyProfile`, `limitPerRelation: 0` en minimal.
  - `userId=…` : **aucune vérification de session ni de visibilité**. `getProfile` décide seul du filtrage, ce qui rend l'exposition dépendante de son internal.
  - sinon : session obligatoire + `getProfile(session.user.id, { relations par défaut shops/tournaments/products })`.
- Erreurs → 500 génériques.

### 4.7 Welcome, onboarding et tracing

`contexts/tracing-context.tsx` :

- Applique les options via `updateConfig`.
- Redirige vers `/welcome` si `gt_welcome_visited` absent, sauf `ignore_visite=true`.
- `canRender` n'est mis à `true` que dans le cas non redirigé.
- Effet `gt_explanations_disabled` → désactive les explications.

`hooks/use-tracing.ts` (≈900 lignes) :

- `initialize()` charge la config, récupère/crée un `SESSION_ID` en `sessionStorage`, charge les données, puis appelle `startNewSession()`.
- **Bug de course** : `startNewSession` lit la variable d'état `sessionId` encore vide → la session locale est enregistrée avec `id: ""` en plus de l'ID réel.
- `trackAction` : actif seulement si `isActive && enabled` ; `enabled` est `NODE_ENV === "production"` → **aucune trace en développement**.
- Throttle 2 s par clé, payload tronqué à 1 000 caractères, queue plafonnée avec rotation.
- `syncTraces` envoie par lots de 50 via `createUserTracesBatch` puis supprime les traces envoyées ; échec → conservation.
- `beforeunload` → `navigator.sendBeacon("/api/traces/batch", blob)`. **Cette route n'existe pas** : le beacon part en 404, les traces de fermeture sont perdues.
- `shouldSkipLowPriorityTrace` existe mais n'est jamais appelé.
- Nettoyage périodique toutes les 5 min (traces > 24 h, queue ≤ 500).

### 4.8 Failles et incohérences auth

1. `/api/cookies` non authentifié (voir §11.6) : exfiltration du cookie de session.
2. `/api/auth/profile?userId=` sans contrôle de session.
3. `session.cookieCache` 5 min : révocation différée.
4. `requireEmailVerification: false`.
5. Aucun contrôle `banned/isActive/isDeleted` dans le layout protégé ni dans le proxy.
6. `proxy.ts` : `hasWallet` toujours vrai ; `isVip` calculé mais aucune règle `requireVip` n'existe.
7. Redirections sans conservation de l'URL cible.
8. Trois tables de permissions divergentes.
9. `verifyResetToken` factice.

---

## 5. FINANCE, WALLET, LEDGER ET TRANSACTIONS

### 5.1 Modèle comptable

Le solde **n'est pas matérialisé** dans `user_wallets` ni dans `financial_accounts`. Il est toujours recalculé :

```
solde(account) = SUM(ledger_entries.credit) - SUM(ledger_entries.debit)
```

`wallet_transactions.balanceAfter` est un instantané informatif, jamais utilisé pour le contrôle de solde.

| Table | Rôle | Champs structurants |
|---|---|---|
| `financial_accounts` | Source de vérité des comptes | `ownerUserId`, `ownerShopId`, `ownerEditionId`, `type` (`USER_WALLET`, `SHOP_WALLET`, `PLATFORM_ESCROW`, `PLATFORM_FEES`, `TOURNAMENT_POOL`, `SYSTEM_ADJUSTMENT`), `currency`, `isActive`, `isLocked` |
| `user_wallets` | Portefeuille utilisateur | `userId` unique, `financialAccountId` nullable, `cardNumberHash`, `pinHash`, `isActive`, `isLocked`, `failedAttempts`, `verificationStatus` |
| `wallet_transactions` | Journal métier | `walletId`, `financialAccountId`, `fromUserId`, `toUserId`, `amount`, `fees`, `netAmount`, `balanceAfter`, `type`, `metadata`, `status`, `isDeleted` |
| `ledger_entries` | Partie double | `transactionId` (sans FK), `accountId` (FK), `debit`, `credit`, `currency` |
| `receipts` | Reçus | `userId`, `transactionId` FK cascade, `receiptNumber` unique |
| `registration_payments` | Paiements d'inscription tournoi | `registrationId` FK cascade, `transactionId` **non null**, `amount`, `status` text |
| `requests` | Demandes dépôt/retrait/items | `type`, `status` text, `transactionId` FK cascade |
| `claims` | Réclamations | `userId`, `transactionId` nullable, `type`, `title`, `status` text, `resolution` |

**Absences critiques** :

- pas d'`updatedAt` sur `wallet_transactions` ;
- pas de clé d'idempotence ni de contrainte métier unique ;
- pas de FK de `ledger_entries.transactionId` vers `wallet_transactions` ;
- pas de `CHECK (debit = 0 XOR credit = 0)` ni de contrainte d'équilibre ;
- `app_settings` est un singleton **sans contrainte d'unicité** ;
- `vip_subscriptions.userId` est **unique global**.

### 5.2 Moteur ledger (`lib/finance/ledger/ledger-engine.ts`)

`executeAtomicTransfer` :

1. Ouvre une transaction Drizzle.
2. `SELECT … FOR UPDATE` sur les comptes source et destination (verrous pessimistes).
3. Vérifie `isActive` et `isLocked`.
4. Calcule le solde source depuis le ledger.
5. Vérifie la suffisance du solde, sauf compte source `SYSTEM_ADJUSTMENT` ou type `DEPOSIT`/`BONUS`.
6. Insère :
   - débit source = `amount` ;
   - crédit destination = `netAmount` ;
   - crédit `PLATFORM_FEES` = `fees`.
7. L'équilibre tient : `amount = netAmount + fees`.

**Limites** :

- Le compte de frais n'est **jamais débité** lors d'un remboursement.
- `getOrCreatePlatformAccount` fait `SELECT … LIMIT 1` sans verrou sur une colonne `type` non unique → comptes plateforme dupliqués en concurrence.
- `getAccountBalance` et `verifyLedgerBalance` retournent respectivement `0` et `isValid: true` en cas d'erreur. `verifyLedgerBalance` ne compare jamais à un solde de référence : `isValid` est toujours vrai hors exception.

### 5.3 Moteur de frais (`lib/finance/fees/fee-engine.ts`)

- `calculatePureFee` applique les taux configurés, une réduction de **50 %** si VIP, et arrondit à 2 décimales ; `netAmount = amount - fees`.
- `calculateTransactionFees` charge les réglages via `getAppSettings()` et `getCurrentUser()`.
- **Fail-open** : toute erreur retourne des frais à 0.
- `executeAtomicTransfer` appelle `calculateTransactionFees(type, amount)` **sans** passer `settings` ni `isVip` : le taux dépend du cache et de la session courante. Hors session (cron, webhook), `isVip` est faux.

Taux par défaut (`app_settings`) : transaction 0,1 %, achat 1 %, dépôt 0 %, retrait 2 %, transfert 0,5 %, participation tournoi 1 %.

### 5.4 Types de transactions et sens

Enum `transaction_type` : `PURCHASE`, `VIP_SUBSCRIPTION`, `GAME_ITEM_PURCHASE`, `THEME_PURCHASE`, `DEPOSIT`, `WITHDRAWAL`, `REFUND`, `TRANSFER`, `ORDER_PURCHASE`, `TOURNAMENT_PARTICIPATION`, `BONUS`.

| Sens | Types |
|---|---|
| Débit wallet | `TRANSFER`, `WITHDRAWAL`, achats (`PURCHASE`, `VIP_SUBSCRIPTION`, `THEME_PURCHASE`, `GAME_ITEM_PURCHASE`, `TOURNAMENT_PARTICIPATION`), `ORDER_PURCHASE` (via `createProductOrder`) |
| Crédit wallet | `DEPOSIT`, `BONUS`, `REFUND` |

**Types fantômes** :

- `PRODUCT_PURCHASE` est testé dans `actions/transactions.ts` et `fee-engine.ts` mais **absent de l'enum**.
- `ORDER_PURCHASE` est dans l'enum mais **rejeté** par `createTransaction` (absent de `escrowDebitTypes` et de `creditTypes` → `else throw`).
- `PURCHASE` n'est géré nulle part dans `createTransaction` (tombe dans le `else`).
- `THEME_PURCHASE` est routé vers l'escrow mais **aucune écriture `theme_purchases`** n'est faite.

### 5.5 `createTransaction` (`actions/transactions.ts`) — flux central

Signature : `createTransaction(data, options?: { allowDuplicate?: boolean; isSystem?: boolean })`.

Séquence :

1. Validation de présence `walletId`, `type`, `amount`.
2. `getCurrentUser()` obligatoire.
3. `isAdmin = role === "admin" || isAdmin === true`.
4. **SEC-001** : `DEPOSIT`, `BONUS`, `REFUND` interdits si non-admin et non-système.
5. Chargement du wallet et de son compte financier.
6. Contrôle de propriété (ou admin).
7. `isActive` / `isLocked`.
8. PIN obligatoire pour `TRANSFER` et `WITHDRAWAL` si `pinHash` présent.
9. Montant > 0.
10. **Cooldown global de 60 s par wallet** (tous types confondus).
11. Anti-doublon pour `GAME_ITEM_PURCHASE`, `DEPOSIT`, `WITHDRAWAL`, `PRODUCT_PURCHASE`, `ORDER_PURCHASE` (recherche de transaction PENDING/PROCESSING).
12. `TRANSFER` : wallet-à-wallet direct via `metadata.recipientWalletId`.
13. Autres types : débit vers escrow, crédit depuis `SYSTEM_ADJUSTMENT`.
14. Création de `wallet_transactions` + entrées ledger.
15. **Après commit**, `handleTransactionTypeSafe` s'exécute dans une **nouvelle transaction DB** : ce n'est pas atomique avec la comptabilisation.
16. `handleTransactionTypeSafe` ne traite réellement que `TRANSFER` (un `SELECT … FOR UPDATE` du wallet destinataire), `VIP_SUBSCRIPTION`, `GAME_ITEM_PURCHASE`, `TOURNAMENT_PARTICIPATION`.

### 5.6 Flux métier de bout en bout

#### TRANSFER

- PIN requis, cooldown, anti-doublon.
- `executeAtomicTransfer` avec `transferFeePercentage`.
- `handleTransactionTypeSafe` verrouille le wallet destinataire mais **n'envoie aucune notification**.

#### DEPOSIT

- `createTransaction` exige admin ou système.
- Crée `SYSTEM_ADJUSTMENT → wallet`, statut `COMPLETED`.
- `actions/wallets.ts#depositToWallet` fait la même chose **sans aucun contrôle d'autorisation** via son propre `createTransaction`.
- Aucun lien avec `requests`, aucune référence de paiement externe, aucune idempotence.

#### WITHDRAWAL

- Routé vers `PLATFORM_ESCROW`, statut `COMPLETED` immédiat, PIN vérifié.
- Aucune `requests`, aucune validation admin, aucun provider de paiement.

#### VIP_SUBSCRIPTION

- Deux chemins : `createTransaction` (tout utilisateur avec solde suffisant) ou `actions/vip.ts#createVipSubscription` (admin only).
- Effets : `vipSubscriptions` avec `planType` **forcé `MONTHLY`**, `endDate = +1 mois`, `pricePaid = metadata.amount` (clé absente du metadata réel → `undefined`), `users.isVip = true`.
- L'index unique `userId` fait échouer toute deuxième souscription, **y compris après expiration**.

#### GAME_ITEM_PURCHASE

- Débit escrow + insertion `requests` type `GAME_ITEMS` `PENDING` (`gameItemId = metadata.targetId`, `quantity`).
- Aucune réservation de stock, aucun contrôle `gameItemsEnabled`/`min|maxGameItemRequest`.

#### TOURNAMENT_PARTICIPATION

- Débit escrow + `registrationPayments` avec `registrationId = metadata.registrationId` (colonne non null → **échec si absent**), statut `PENDING`.
- Aucune mise à jour de `editionRegistrations.feePaid`.

#### BONUS

- `createUserWallet` insère **manuellement** une transaction `BONUS` + deux lignes de ledger (`SYSTEM_ADJUSTMENT` débit, wallet crédit) au lieu d'appeler `executeAtomicTransfer`, contrairement au commentaire.
- Montant issu de `defaultUserBalance`.

#### REFUND

- `refundTransaction` exige une transaction `COMPLETED`, rembourse `netAmount` (pas `amount`), **sans auth**, **sans dédoublonnage**, puis passe l'original en `REFUNDED`.
- `rejectOrder` rembourse le prix complet mais ne passe pas la transaction d'origine en `REFUNDED` et ne récupère pas les frais déjà crédités à `PLATFORM_FEES`.

#### Émission admin de GTC

- Il n'existe **aucun module dédié** de demande/approbation/émission. On passe par `createTransaction` avec `isAdmin` ou `{ isSystem: true }`.
- Pas de plafond, pas de double validation, pas de journal d'audit dédié.

### 5.7 Création de wallet, PIN et carte

- `initializeUserWallet` crée un wallet avec **PIN par défaut `"123456"`**.
- `createUserWallet` :
  - génère un numéro de carte via `WalletUtils.generateSecureCardNumber()` qui utilise **`Math.random()`** ;
  - stocke ce numéro **en clair** dans `cardNumberHash` (le nom ment) ;
  - écrit le bonus de bienvenue hors `executeAtomicTransfer` ;
  - appelle `createUserTrace` dans la même transaction DB.
- `updateWalletPinAction` vérifie l'ancien PIN, valide la force du nouveau, hache en bcrypt (12 tours).
- `updateWalletBalance(walletId, newBalance)` **ignore `newBalance`** et ne met à jour que `updatedAt` : signature trompeuse.
- `toggleWalletLock` n'a **aucun contrôle d'accès**.

### 5.8 Réclamations, requêtes et reçus

- `actions/claims.ts` : CRUD complet, statuts text, `resolution`. Aucune auth sur les mutations, aucun `resolvedBy`/`resolvedAt`.
- `actions/requests.ts` : demandes dépôt/retrait/items, mais **non alimentées** par les flux wallet réels.
- `actions/receipt.ts#createReceipt` prend `userId: transaction.fromUserId!` : **nul pour un DEPOSIT/BONUS**, ce qui viole `NOT NULL`. Aucune vérification de propriété. `deleteReceipt` est un **hard delete** sans auth. Le fichier n'a pas de directive `'use server'`.

### 5.9 Surfaces admin finance

`app/admin/transactions`, `app/admin/wallets`, `app/admin/claims`, `app/admin/claims/create`, `app/admin/vip`, `app/admin/orders`, `app/admin/requests`.

Contrôles réels :

- `createTransaction` : `role === 'admin' || isAdmin`.
- `completeOrderAdmin` : `role === 'admin'` **strict** (ignore `isAdmin`).
- `createVipSubscription`/`updateVipSubscription` : admin.
- `cancelVipSubscription` : admin ou propriétaire.
- `renewVipSubscription`, `deleteVipSubscription`, `restoreVipSubscription`, `processExpiredVipSubscriptions` : **aucun contrôle**.
- `actions/claims.ts`, `actions/app-settings.ts`, `actions/wallets.ts` : **aucun contrôle** sur la plupart des mutations.

Aucun plafond par niveau, aucun circuit demande → approbation, aucun journal d'audit admin dédié.

### 5.10 Failles et bugs finance (récapitulatif)

1. **Auth absente** sur des Server Actions exportées : `depositToWallet`, `createTransaction` (wallets), `transferMoney`, `updateTransactionFees`, `updateVipPricing`, `resetAppSettings`, `renewVipSubscription`, `deleteVipSubscription`, `createUserWallet`, `createWalletServer`, `updateUserWallet`, `toggleWalletLock`, `createClaim`, `updateClaim`, `updateClaimStatus`, `deleteClaim`.
2. **Double implémentation** de `createTransaction` : ledger verrouillé vs insertions séquentielles hors transaction, sans PIN, avec TOCTOU.
3. `transferMoney` crée **deux** transactions `TRANSFER`, laisse l'escrow crédité et `SYSTEM_ADJUSTMENT` débité ; les frais ne vont jamais à `PLATFORM_FEES`.
4. `renewVipSubscription`/`deleteVipSubscription` : n'importe qui peut prolonger/supprimer l'abonnement d'autrui.
5. Numéro de carte `Math.random` + stockage en clair.
6. Frais **fail-open** à 0.
7. `getAccountBalance`/`verifyLedgerBalance` masquent les erreurs.
8. `getOrCreatePlatformAccount` non idempotent.
9. **Double comptage de frais** sur commande.
10. `rejectOrder` ne solde pas correctement l'escrow.
11. VIP non renouvelable (`userId` unique).
12. `receipts.userId` non nul sur les crédits.
13. Types `PRODUCT_PURCHASE`/`ORDER_PURCHASE` incohérents.
14. Cache `orders` non invalidé (`'use cache'` + `cacheTag('orders')` sans `revalidateTag`).
15. Cooldown global 60 s non idempotent.
16. `updateWalletBalance` trompeur.
17. Soft-delete non filtré dans `getTransactionById` et `getClaimById`.

---

## 6. TOURNOIS

### 6.1 Modèle de données

```
tournaments
  └── tournament_editions
        ├── edition_registrations ── registration_payments
        ├── tournament_phases
        │     ├── phase_groups
        │     │     ├── phase_group_participants
        │     │     └── bracket_nodes
        │     └── matches
        └── edition_results
tournament_members (participants permanents, liés à users ou teams)
```

- `tournaments` : nom, slug, organisateur, format, statut, jeux, règles, visibilité.
- `tournament_editions` : numéro d'édition, dates, capacité, `entryFee`, `prizePool`, `status`, `editionConfig` JSON, `currentParticipants`.
- `tournament_members` : `tournamentId` + `userId`/`teamId` uniques, rôle (`PARTICIPANT`, etc.), displayName, avatar.
- `edition_registrations` : `editionId` + `memberId` uniques, statut, `checkedIn`, `feePaid`.
- `registration_payments` : paiement lié à une inscription et à une transaction.
- `tournament_phases` : `order`, `phaseType` (ELIMINATION, GROUP_STAGE, ROUND_ROBIN, SWISS, KNOCKOUT, CUSTOM), `config` JSON, statut.
- `phase_groups` : poules/rounds, `groupType`, `config`, `isCompleted`, `isLocked`.
- `phase_group_participants` : `groupId` + `registrationId` uniques, position, `qualified`, statistiques.
- `bracket_nodes` : arbre (`parentNodeId`, `childPosition`, `depth`, `round`, `matchId`).
- `matches` : participants (registration IDs), scores, statut, `winnerRegistrationId`, preuves, format.
- `edition_results` : agrégat par édition et inscription (joués, gagnés, perdus, nuls, score, position).

**Détails de schéma importants** :

- `tournament_editions` porte `financialAccountId` (compte du prize pool), `winnerId → tournament_members.id`, `winnerMetadata`, et un `editionConfig` par défaut `{ checkinRequired: false, autoStart: true, seedMethod: "RANDOM", competitionType: "LDC", competitionMode: "AUTO", tiebreakerRules: {} }`.
- `edition_registrations` est le **pivot central** : `registrationType` (`REGULAR`, `INVITED`, `QUALIFIED`, `WILDCARD`, `STAFF`, `BYE`), `paymentTransactionId`, `qualifiedFromPrevious`, `previousEditionId`, check-in.
- `phase_group_participants.scoreDifference` est une **colonne générée** PostgreSQL (`score_for - score_against`), tandis que les autres statistiques sont matérialisées.
- `bracket_nodes` est un arbre auto-référencé (`parentNodeId`, `depth`, `childPosition` `UPPER|LOWER|WINNER|LOSER`), rattaché à un `groupId` qui représente le tour.
- `matches` est commentée « source unique de vérité » et contient les confirmations par participant et admin, les litiges (`disputed`, `disputeReason`, `resolvedBy`, `resolution`) et les preuves (`proofLinks`, `screenshot`).
- `edition_results.position` est `NOT NULL` et sert au tri ; la valeur `0` est utilisée comme sentinelle pour les lignes non finalisées, ce qui pollue les `ORDER BY position`.

### 6.2 Cycle de vie d'une édition

1. Création du tournoi (`createTournament`) et de l'édition (`createTournamentEdition`).
2. Inscriptions (`joinEdition`).
3. Génération de la structure (`organizeEditionStructure`, `generatePhaseMatches`, `generateBracketMatches`).
4. Saisie et confirmation des résultats (`submitMatchResult`, `confirmMatchResult`, `adminConfirmMatchResult`, `updateMatchResult`).
5. Progression (`progressTournamentAfterMatch`, `organizeNextPhaseAction`).
6. Clôture (`finalizeTournamentEditionAction`, `markPhaseCompleteAction`).

Points confirmés sur le cycle :

- `createTournament` force bien `organizerId` depuis `getCurrentUser()` et vérifie l'unicité du nom ; il revalide `tournaments`.
- `createTournamentEdition` gère la numérotation et l'unicité `(tournamentId, editionNumber)`.
- `finalizeTournamentEditionAction` passe l'édition `COMPLETED`, renseigne `winnerId` (un `tournamentMember.id`) et `winnerMetadata`, puis upsert `edition_results` (position 1, tier GOLD).
- `actions/editions.ts#finishEditionAction` et `designateEditionWinnerAction` **dupliquent partiellement** cette finalisation.
- Les exports sont présents : `exportEditionParticipants`, `exportEditionMatches`, `exportMatchesToFormat`, `exportStandingsAction`.
- Aucun reçu spécifique tournoi n'existe dans `actions/receipt.ts` (aucune occurrence de `tournament|edition|registration|match|prize`).

### 6.3 Inscription (`actions/editions.ts#joinEdition`)

Séquence :

1. Chargement de l'édition + tournoi.
2. Refus si l'organisateur s'inscrit à sa propre compétition.
3. Refus si `edition.status !== "UPCOMING"`.
4. Contrôle de capacité (`currentParticipants < maxParticipants`).
5. Recherche/création du `tournamentMember` via `actions/members.ts`.
6. Dédoublonnage de l'inscription (`editionId` + `memberId`).
7. **Si `entryFee > 0`** : retourne `{ success: false, paymentRequired: true, paymentDetails }` et **s'arrête là**.
8. Sinon : insertion `edition_registrations` avec `feePaid: true`, `revalidatePath`.

**Flux de paiement réel (et pourquoi il est cassé)** :

1. `EditionPaymentDialog` (`components/pages/tournaments/edition-detail/edition-payment-dialog.tsx`) existe et redirige vers `/wallet/transactions/create` avec :
   - `type=TOURNAMENT_PARTICIPATION` ;
   - `metadata={ editionId, memberId, redirectUrl }`.
2. Problème 1 : **aucune inscription n'a été créée** avant le paiement, puisque `joinEdition` retourne avant l'insertion dès que `entryFee > 0`.
3. Problème 2 : `createTransaction` attend `metadata.registrationId` (pas `editionId`/`memberId`) pour insérer `registration_payments`, dont la colonne `registrationId` est `NOT NULL`. Le handler échoue donc.
4. Problème 3 : `createRegistrationPayment` (`actions/tournaments/members.ts:755`) existe, mais **n'est appelée nulle part** dans l'UI ni dans les autres actions (seule sa définition a été trouvée).
5. Le bouton « Recharger maintenant » pointe vers `/wallet/deposit`, route qui **n'existe pas** (la route réelle est `/wallet` ou `/wallet/transactions/create`).
6. `joinEdition` **n'incrémente jamais `currentParticipants`** : le compteur de capacité peut diverger durablement du nombre réel d'inscriptions.

**Conclusion** : l'inscription payante est **amorcée mais non fonctionnelle de bout en bout**. Le type `TOURNAMENT_PARTICIPATION`, le dialogue et l'action de paiement existent, mais la chaîne inscription → transaction → `registration_payment` → confirmation n'est pas câblée.

### 6.4 Formats et générateurs

| Format | Générateur | Comportement |
|---|---|---|
| `ROUND_ROBIN` | `setupLeaguePhase` | Une poule « Classement », matchs aller/retour optionnels |
| `GROUP_STAGE` | `setupGroupPhase` | N poules, répartition, matchs round-robin par poule |
| `ELIMINATION` / `KNOCKOUT` | `setupEliminationGroups` | Arbre construit des finales vers le premier tour, `phaseGroups` par round, `bracketNodes` avec parent/enfant |
| `SWISS` | `setupSwissPhase` | Crée `roundsCount` nœuds (défaut 5) mais **ne génère que le round 1** ; aucun code ne génère les rounds suivants |
| `CUSTOM` | Aucun générateur | `createStructureEngine` n'a **aucune branche CUSTOM** : phases créées mais sans groupes, nœuds ni matchs |

Algorithmes purs :

- `generateRoundRobinMatches` : méthode du ruban (circle method), ajout d'un `BYE` si nombre impair.
- `generateGroupMatches` : round-robin par groupe.
- `generateEliminationMatches` : appariement par round.
- `checkDuplicateMatch` : évite les doublons, y compris inversés.
- `previewPhaseStructure` : **100 % déterministe**, sans DB, calcule matchs, rounds, byes, taille de bracket, groupes.
- `generateSingleEliminationBracket` : **déprécié**, conservé pour le mode manuel.

**Paramètres réellement consommés** : `groupsCount`, `participantsPerGroup`, `advanceCount`, `isHomeAway`, `generateGroups/generateNodes/generateMatches`, `nodePrefix`, `seedMethod` (RANDOM uniquement, via `shuffle`), `roundsCount` (suisse). En revanche, `qualifiedCount`, `advanceFromGroup`, `matchesPerParticipant`, `tiebreaker`, `matchFormat`/`BEST_OF_*` sont **présents dans les configs mais non appliqués** ; le format est figé à `BEST_OF_1` dans les inserts, sauf `isHomeAway`.

**Formats fantômes** :

- **Double élimination non implémentée** : `isDoubleElimination` et les valeurs `LOWER`/`LOSER` existent, mais tous les nœuds sont créés en `bracketType: "UPPER"` et aucune logique de bracket perdant n'existe.
- **Byes** : en round-robin, un pseudo-participant `{ id: "BYE" }` est inséré puis exclu des paires ; en élimination, un participant impair obtient simplement `participant2 = null`, sans nœud BYE ni avancement automatique.
- **`KNOCKOUT`** est traité strictement comme `ELIMINATION`.

**Doublon de générateur** : `setupEliminationGroups` existe **deux fois** — `lib/tournaments/generators.ts:249` (construit de la finale vers le round 1, avec `Map` par round) et `actions/phases/structure.ts:628` (construit du round 1 vers la finale, comportement divergent). Le second est exporté par `actions/phases/index.ts` et coexiste avec l'import du premier : collision de nom et risque d'incohérence structurelle.

### 6.5 Génération des matchs (`actions/phases/structure.ts`)

`generatePhaseMatches(phaseId, config)` :

- Chargement de la phase avec groupes, participants et nœuds de bracket.
- Si `forceRecreate` : suppression des matchs `PENDING` du groupe ou de la phase.
- `GROUP_STAGE` : génération round-robin par groupe.
- Phases à bracket : génération via les nœuds.
- Création des matchs avec participants, statut `PENDING`, format.

`setupEliminationGroups` :

- `totalRounds = ceil(log2(participantCount))`.
- Construit les rounds **des finales vers le premier tour**.
- Crée un `phaseGroup` par round (`getEliminationRoundName`).
- Crée les `bracketNodes` avec `parentNodeId`, `childPosition`, `depth`.
- Distribue les participants (ou des placeholders `TBD`).

### 6.6 Résultats, progression et classements

`submitMatchResult` :

- Enregistre score1/score2, preuve, auteur.
- Détermine le vainqueur (`winnerRegistrationId`).
- Passe le match au statut approprié (`COMPLETED`, `PENDING_REVIEW`, `AWAITING_ADMIN_CONFIRMATION` selon le format/les droits).
- Déclenche la progression.

`confirmMatchResult` / `adminConfirmMatchResult` :

- Valident le résultat, mettent à jour le vainqueur, propagent au nœud parent.
- `handleMatchProgression` remplit le premier slot libre du match parent.

`progressTournamentAfterMatch` (`lib/tournaments/progression-engine.ts`) :

- Vérifie que le match est `COMPLETED`.
- **Nœud de bracket** : si tous les matchs du nœud sont terminés → `isNodeComplete`. En mode `AUTO`, appelle `handleEliminationProgression`. En mode manuel, retourne `nextLevelToOrganize`.
- **Groupe** : si tous les matchs sont terminés → `isGroupComplete`, calcule le classement, marque `qualified` selon `advanceCount`, met à jour positions et statistiques.
- **Phase** : si tous les groupes sont terminés → `isPhaseComplete`.
- **Édition** : si la phase est la dernière → `isEditionComplete`.

`syncStandingsWithMatches` :

- Initialise tous les participants à 0.
- Pour chaque match terminé : joués, gagnés/nuls/perdus, points (3/1/0 par défaut), score pour/contre, différence.
- Ne retient que les matchs `COMPLETED|FINISHED` **ou** `confirmedByAdmin`.
- Utilise `winnerRegistrationId` si présent, sinon compare les scores.
- `rankParticipants` trie selon `tiebreakerRules` : `POINTS`, `GOAL_DIFF`, `GOALS_FOR`. **`HEAD_TO_HEAD` est accepté dans le type et cité dans les configs par défaut, mais n'est jamais implémenté** (aucune confrontation directe). Aucun départage par fair-play, cartons ou nombre de victoires.

**Trois implémentations de classement coexistent** :

1. `lib/tournaments/standings.engine.ts` (calcul pur, tiebreakers).
2. `actions/phases/progression.ts#recalculateGroupStandings` (recalcule uniquement les matchs `COMPLETED AND confirmedByAdmin`, écrit les statistiques dans `phase_group_participants` **sans calculer `position` ni `qualified`**).
3. `progressTournamentAfterMatch` (troisième agrégation via `syncStandingsWithMatches` + `rankParticipants`, puis écrit `position` et `qualified`).

De plus, **deux écritures d'`edition_results` divergent** :

- `updateEditionResultForParticipant` considère un nul si `score1 === score2` ;
- `recomputeParticipantEditionStats` se base uniquement sur `winnerRegistrationId`.

Deux joueurs peuvent donc obtenir des statistiques différentes selon le chemin emprunté.

`updateEditionResultForParticipant` :

- Agrège tous les matchs `COMPLETED` du participant.
- UPSERT `edition_results` sur `(editionId, registrationId)`.

`organizeNextPhaseAction` :

- Lit `editionConfig.competitionMode` (`AUTO`/manuel).
- En AUTO, applique `isHomeAwayElimination`/`isHomeAwayGroups`.
- Récupère les qualifiés de la phase précédente (`phaseGroupParticipants.qualified = true`).
- Fallback via `editionResults` et `advanceCount`.
- Fallback ultime : tous les inscrits.
- **Dédoublonne** les IDs (`Set`).
- Refuse moins de 2 participants.
- `force` supprime matchs, nœuds et groupes de la phase.
- Crée les groupes (GROUP_STAGE/ROUND_ROBIN) ou le bracket (ELIMINATION/KNOCKOUT), puis les matchs.
- Mode manuel : `customQualifiedIds` permet de forcer la liste.

### 6.7 UI tournois

Pages publiques (toutes imbriquées sous le tournoi) :

- `/tournaments`, `/tournaments/create`, `/tournaments/[tournamentId]`.
- `/tournaments/[tournamentId]/members`, `/tournaments/[tournamentId]/members/[memberId]`.
- `/tournaments/[tournamentId]/editions`, `/tournaments/[tournamentId]/editions/[editionId]`, `/tournaments/[tournamentId]/editions/[editionId]/calendar`.
- `/tournaments/[tournamentId]/editions/[editionId]/matches`, `/tournaments/[tournamentId]/editions/[editionId]/matches/[matchId]`.

Dashboards organisateur :

- `/tournaments/[tournamentId]/dashboard` (+ `editions`, `editions/create`, `members`, `notifications`, `settings`).
- `/tournaments/[tournamentId]/editions/[editionId]/dashboard` : `brackets`, `groups`, `matches`, `participants`, `payments`, `phases`, `settings`, `organize`.
- Sous-pages d'organisation : `brackets/[bracketId]/organize`, `groups/[groupId]/organize`, `phases/[phaseId]/organize`, `participants/organize`.

Admin : `/admin/tournaments`.

Hooks associés : `use-tournaments`, `use-tournament-editions`, `use-edition`, `use-editions`, `use-edition-manager`, `use-phase-manager`, `use-bracket-manager`, `use-bracket-data`, `use-match-manager`, `use-group-manager`, `use-member`, `use-bulk-validation`.

### 6.8 Limites, bugs et dette tournois

**Fonctionnel**

- Inscription payante non aboutie (voir §6.3) et `currentParticipants` jamais incrémenté.
- `SWISS` : seul le round 1 est généré.
- `CUSTOM` : aucun générateur.
- Double élimination : déclarative seulement.
- `BEST_OF_*`, `qualifiedCount`, `advanceFromGroup`, `tiebreaker` : configurés mais non appliqués.
- `HEAD_TO_HEAD` non implémenté dans les tiebreakers.
- Aucune fonction de **forfait (walkover)** ni de **résolution de litige** trouvée, malgré les colonnes `disputed`, `resolution`, `CANCELLED`.
- Byes non propagés automatiquement.

**Cohérence des données**

- Trois calculs de classement et deux écritures d'`edition_results` divergents (§6.6).
- `position: 0` utilisé comme sentinelle alors que `position` est `NOT NULL` et sert au tri.
- `isPlaceholder` incohérent : `lib/tournaments/generators.ts:18` ne reconnaît pas `"BYE"`, contrairement à `match-generation-engine.ts:24` ; un `BYE` peut être inséré comme clé étrangère.
- Compteurs non maintenus : `currentParticipants`, `matchCount`, `completedMatchCount`, `totalMatches/completedMatches`, `participantCount`.
- `submitMatchResult` écrit `proofUrl` dans `matches` alors que le schéma expose `proofLinks` et `screenshot` : objet `any`, donc TypeScript ne signale rien ; Drizzle peut ignorer ou échouer à l'exécution.

**Autorisations**

- `assertOrganizerOrAdminByEdition`/`ByPhase` protègent `organizeEditionStructure`, `resetEditionStructure` et `generateMatchesAction` (type PHASE), mais **pas** `generateMatchesAction` pour `type GROUP|NODE` (seul un contrôle « authentifié » est fait).
- Les mutations de `actions/tournaments/members.ts` et une partie de `results.ts` ne sont pas contrôlées.
- La lecture est large (pas de contrôle de visibilité sur les éditions privées).

**Transactions et révalidation**

- `progressTournamentAfterMatch` reçoit `db` et non un `tx` : la progression n'est **pas atomique** avec la mise à jour du score.
- `generateMatchesEngine` ouvre une transaction mais appelle des fonctions qui utilisent `db` global pour certaines lectures.
- Chemins de révalidation erronés/génériques : `/tournaments/dashboard` sans ID, `/tournaments/editions/${editionId}/dashboard` alors que la route réelle est `/tournaments/[tournamentId]/editions/[editionId]/dashboard`.
- `submitMatchResult` et `confirmMatchResult` ne revalident rien.

**Doublons d'API**

- `actions/participants.ts` réimplémente `getTournamentById`, `createTournament`, `updateTournament`, `deleteTournament`, `getTournamentMembers`, `addTournamentMember`, etc., en parallèle de `actions/tournaments/*`.
- `actions/editions.ts` duplique `updateEdition`/`deleteEdition` et une partie de la finalisation.
- Fichiers volumineux : `actions/tournaments/members.ts` (864 lignes), `editions.ts` (640), `actions/phases/progression.ts` (>1 500), `lib/tournaments/progression-engine.ts` (495).

**UI et notifications**

- `handleMatchProgression` remplit « le premier slot libre » plutôt qu'un slot déterminé par `childPosition` : correction manuelle possible, logique fragile.
- Les notifications de tournoi existent côté organisateur, mais aucune notification automatique aux participants à la progression.
- Pas de websocket : les dashboards se rafraîchissent par polling/refetch.
- Les pages et composants tournois sont très nombreux (~80 fichiers) et dupliquent parfois des cartes (`components/pages/tournaments/tournament-card.tsx` vs `components/cards/tournament-card.tsx`).

---

## 7. MARKETPLACE, BOUTIQUES, PRODUITS, COMMANDES

### 7.1 Boutiques (`actions/shops.ts`)

CRUD et requêtes : `getShopById`, `getShopByName`, `getShopsByOwner`, `getShops`, `getPopularShops`, `getVerifiedShops`, `getShopStats`, `getShopStatsById`, `getShopContext`, `getShopFinancialStats`, `getShopLedgerStats`, `createShop`, `updateShop`, `deleteShop`, `restoreShop`, `updateShopStats`, `incrementShopViews`, `updateShopTheme`, `addShopCategory`, `removeShopCategory`, `getShopClients`.

- Les statistiques financières passent par le ledger.
- `createShop` doit forcer `ownerId = session.id` ; **à confirmer**, car le schéma Zod de `POST /api/shops` accepte un `ownerId` optionnel.
- `PATCH/DELETE /api/shops/[shopId]` vérifient correctement propriétaire ou admin.

### 7.2 Produits (`actions/products.ts`)

CRUD, statuts, credentials :

- `getProductById`, `getProducts`, `getProductsByShopId`, `getProductsByCategoryId`, `getProductsByUserId`, `getProductStats`, `getProductContext`.
- `createProduct`, `updateProduct`, `deleteProduct`, `restoreProduct`, `updateProductStatus`, `markProductAsSold`, `incrementProductViewCount`.
- `setProductCredentials`, `getProductCredentialsForAdmin`.

Les identifiants de compte vendus sont stockés côté produit, chiffrés via `lib/encryption.ts` (AES-256-GCM) au moment de l'approbation de commande.

Statuts produit : `NON_VENDU`, `RESERVE`, `EN_ECHANGE`, `LIVRE`, `VENDU`, `ANNULER`.

### 7.3 Commandes (`actions/orders.ts`)

Cycle :

1. `createProductOrder` :
   - auth ;
   - transaction DB ;
   - produit `NON_VENDU` ;
   - anti-auto-achat ;
   - anti-doublon ;
   - solde lu via `getAccountBalance` **hors transaction** (runner `db` par défaut) ;
   - débit immédiat vers escrow `ORDER_PURCHASE` `PENDING` ;
   - création `orders` ;
   - produit `RESERVE`.
2. `approveOrderShop(orderId, { login, pass })` :
   - propriétaire boutique, statut `PENDING` ;
   - chiffre le mot de passe via `encryptData` ;
   - passe `ACCEPTED_BY_SHOP`.
3. `completeOrderAdmin(orderId)` :
   - exige `role === 'admin'` strict ;
   - crée au besoin le compte boutique ;
   - marque la transaction `COMPLETED` ;
   - mouvement escrow → boutique `TRANSFER` **avec frais de transfert appliqués une deuxième fois** ;
   - produit `VENDU`, `shopId = null`, `userId = buyerId`.
4. `rejectOrder(orderId, reason)` :
   - acheteur, boutique ou admin ;
   - rembourse le prix plein depuis l'escrow en `REFUND` ;
   - remet le produit `NON_VENDU`.

**Conséquences comptables** :

- À la création, l'escrow reçoit `price - purchaseFee`.
- À la finalisation, il paie `price` à la boutique moins un `transferFee`.
- L'escrow devient **structurellement négatif** et la plateforme conserve deux fois des frais.
- `rejectOrder` ne repasse pas la transaction d'origine en `REFUNDED` et ne récupère pas les frais.

Autres fonctions : `getOrdersByShopId`, `getOrders`, `getOrderStats`, `getShopOrderStats`, `getUserOrderStats`, `getOrderCredentialsForBuyer`, `getOrderCredentialsForAdmin`, `getOrdersByBuyerId`, `getOrderById`.

`getOrders` est `'use cache'` + `cacheTag('orders')`, mais **aucun `revalidateTag('orders')`** n'est appelé dans les mutations.

### 7.4 UI marketplace

- `/marketplace`, `/marketplace/[productId]`.
- `/marketplace/[productId]/dashboard` (+ `orders`, `settings`).
- `/shops`, `/shops/create`, `/shops/[shopId]`, `/shops/[shopId]/products`.
- `/shops/[shopId]/dashboard` : clients, notifications, orders, products, products/create, settings, wallet.
- Dashboard boutique **dupliqué** entre `/marketplace/[productId]/dashboard` et `/shops/[shopId]/dashboard`.

### 7.5 Problèmes marketplace

- Escrow négatif (frais doubles).
- `completeOrderAdmin` ignore `isAdmin` (incohérent avec d'autres contrôles admin).
- `rejectOrder` incomplet comptablement.
- `getOrders` cache non invalidé.
- `createProductOrder` lit le solde hors transaction.
- `POST /api/shops` : `ownerId` client possible (à confirmer).
- Pas de gestion de stock, de variantes, de TVA, de litige structuré.
- Credentials : à confirmer que `getOrderCredentialsForBuyer` contrôle bien l'acheteur.

---

## 8. SOCIAL : CHAT, MESSAGES, GROUPES, INTERACTIONS

### 8.1 Modèle

- `messages` : `senderId`, `recipientId`, `groupId`, `entityId`/`entityType`, colonnes FK dénormalisées (`productId`, `shopId`, `postId`, `tournamentId`, `editionId`, `userId`, `gameClipId`), `parentMessageId`, `readBy` (text[]), `images`, `audioUrl`, `isDeleted`, `isActive`, `isOpenToPublic`.
- `conversations` : `chatId` unique, `participantIds` (text[]), `entityType`, `entityId`, `lastMessageId`, `unreadCount`, `isPinned`, `isMuted`, `isArchived`, `metadata`, `updatedAt`.
- `groups` : `creatorId`, `name`, `isPrivate`, timestamps. Pas de `isDeleted`.
- `group_members` : `groupId` + `userId` uniques, rôle `OWNER|ADMIN|MEMBER`.
- `interactions` : `userId`, `entityId`, `entityType`, `type` (`LIKE|FOLLOW|BOOKMARK|VIEW|SHARE`), `isDeleted`, index unique partiel sur les lignes non supprimées.
- `viewers` : `entityId`, `entityType`, `userId`, `sessionId`, IP, user-agent, `viewedAt`.

Les requêtes utilisent `participantIds @> ARRAY[...]`, `ANY(...)`, `array_append`, `cardinality` : PostgreSQL strict, pas de portabilité.

### 8.2 Parcours

1. `/chats` → `useConversations` → `getConversationsForUser`.
2. Envoi → `useCreateMessage`/`useOptimisticSendMessage` → `createMessage`.
3. Commentaires → `getEntityComments(entityId, entityType, { page, limit })`.
4. Groupes → `/chats/groups/create`, `[groupId]`, `[groupId]/edit` → `actions/groups.ts`.
5. Réactions → `useInteractions` → `actions/interactions.ts`.

### 8.3 Comportements observés

- `createMessage` **force** `senderId = currentUser.id` et supprime tout `senderId` client (correctif SEC-08).
- Valide qu'il s'agit d'un DM, d'un message de groupe ou d'un commentaire ; refuse `groupId` + `recipientId` simultanés.
- Recopie `entityId` dans la colonne FK correspondante (`PRODUCT → productId`, etc.).
- Upsert conversation : `dm:<id1>-<id2>` (IDs triés), `group:<id>`, sinon `<TYPE>:<id>`.
- **`unreadCount` n'est jamais incrémenté** : les badges reposent sur `readBy`.
- `getConversationsForUser` fait un **N+1** (une requête par conversation) et retourne `[]` en cas d'erreur.
- `getEntityComments` : la requête de données accepte un `OR` (entityId/entityType ou colonne FK), mais le `count()` n'utilise que `entityId` + `entityType` → **total/totalPages faux** pour les commentaires legacy.
- `markConversationAsRead` : `split(":")` puis branche `group`/`user` ; pour les commentaires, marque tous les messages de l'entité.
- `recordEntityView` : insert `viewers` + `viewCount + 1` pour SHOP/PRODUCT/TOURNAMENT ; POST commenté ; pas d'anti-rejeu.

### 8.4 Temps réel et médias

- Le « temps réel » est du **polling** : 10 s conversations/groupes, 30 s non-lus.
- `useMessageSubscription` est un **placeholder**.
- `hooks/use-chat-media.ts` :
  - compression `browser-image-compression` (max 1920 px, `maxSizeMB` selon le plan) ;
  - validation type/taille/quota via `lib/chat-utils.ts` ;
  - **`uploadToServer` est un faux upload** : simule la progression et retourne `/uploads/<timestamp>-<nom>`. Aucun fichier n'est envoyé.
- `lib/upload.ts` et `utils/image-upload-utils.ts` sont des chemins alternatifs **non utilisés** par le chat.
- Aucun stockage objet (S3/R2) identifié.
- `togglePin`, `toggleMute`, `toggleArchive`, `deleteConversation` ne modifient **que le cache React Query** (`// TODO: Call API`).
- `chat-context.tsx` : `UPDATE_MESSAGE_STATUS` est un no-op ; astuce `SET_LOADING` pour forcer un re-render ; intervalle de frappe recréé à chaque changement.

### 8.5 Sécurité sociale

| Fonction | Problème |
|---|---|
| `restoreMessage` | Aucune auth ni propriété |
| `markMessageAsRead`, `markMessagesAsRead`, `markConversationAsRead` | `userId` client non comparé à la session |
| `getConversation`, `getUnreadMessages`, `countUnreadMessages` | Lecture arbitraire par identifiant |
| `createGroup`, `requestJoinGroup` | `creatorId`/`userId` client |
| `updateGroup`, `deleteGroup`, `addGroupMember`, `updateGroupMemberRole`, `removeGroupMember` | `checkGroupPermission` existe mais n'est pas appelé ; escalade de rôle possible |
| `deleteGroup` | **Hard delete** malgré le commentaire « soft delete » |
| `searchUsersForGroup` | `ilike` sur email/téléphone et retour du `User` complet → fuite de PII |
| `createInteraction`, `deleteInteraction`, `toggleInteraction` | `userId` client, suppression par `id` sans propriétaire, doublons après soft delete |
| `createInteraction` | Anti-doublon SELECT puis INSERT : course possible |

### 8.6 Dette sociale

- `unreadCount` jamais incrémenté.
- Total de commentaires incohérent.
- Clés React Query sans pagination → collisions de cache.
- `useOptimisticSendMessage` écrit dans `messageKeys.lists()` alors que la lecture utilise `messageKeys.list(filters)` : optimisation inopérante.
- `requestJoinGroup` ne persiste pas la demande (seule une notification est créée).
- Toasts en anglais dans une UI francophone.
- Pas de modération de message structurée côté groupe.

---

## 9. CONTENUS ÉDITORIAUX, JEUX ET SERVICES

### 9.1 Posts et stories (`actions/posts.ts`)

- CRUD + soft delete/restore + stats : `getPostById`, `getPosts`, `getPostsByUserId`, `getActiveStories`, `getPostStats`, `createPost`, `updatePost`, `deletePost`, `restorePost`, `togglePostStatus`, `cleanupExpiredStories`, `getPostCountByUserId`, `updateUserPostCount`.
- Fonctionnalité « stories » avec expiration et purge applicative.
- Pages : accueil, profil, admin (via interactions/modération).

### 9.2 Blogs (`actions/blogs.ts`)

- CRUD + soft delete/restore + vues + recherche : `getBlogById`, `getBlogs`, `getBlogsByAuthor`, `getBlogStats`, `createBlog`, `updateBlog`, `deleteBlog`, `restoreBlog`, `toggleBlogStatus`, `incrementBlogViews`, `getPopularBlogs`, `searchBlogs`.
- Pages `/blogs`, `/blogs/[id]`, admin `/admin/blogs/**`.

### 9.3 Guides et docs (`actions/guides.ts`)

- Guides + étapes : `getGuideStepById`, `createGuideStep`, `updateGuideStep`, `deleteGuideStep`, `checkGuideTitleExists`, `incrementGuideViewCount`, `getGuideStats`.
- Pages `/docs`, `/docs/guides`, `/docs/guides/[guideId]`, `/docs/legal/privacy`, `/docs/legal/terms`, `/docs/schema`, `/docs/[...slug]`.
- `lib/docs.ts` + `docs/content`.
- Admin `/admin/guides/[action]`.

### 9.4 Clips (`actions/game-clips.ts`)

- `createGameClip({ data, userId })`, `getGameClips`, `getGameClipById(id, userId)`, `shareGameClip({ id, userId })`.
- Types `CreateGameClipParams`, `UpdateGameClipParams`, `GetGameClipsParams`.
- Validation `validations/game-clips.ts`.
- API `/api/game-clips` : GET public avec `getCurrentUser()` optionnel, POST 401 si non authentifié.
- Pages `/game-clips`, `/game-clips/create`.
- Hooks : `use-game-clips`, `use-game-clips-player`, `use-game-clip-playback`, `use-clip-engine` ; store `stores/game-clips-store.ts`.

### 9.5 Jeux, items et demandes (`actions/games.ts`)

- Jeux, items, demandes : `getGameItemRequestById`, `getGameItemRequests`, `createGameItemRequest`, `processGameItemRequest(id, processedByUserId, status, adminNotes)`, `deleteGameItemRequest`, `fetchEntities`.
- **`processedByUserId` vient de l'appelant**, non de la session → usurpation d'identité admin possible si l'action est exposée telle quelle.
- Pages `/games`, `/games/[itemId]`, admin `/admin/games`, `/admin/games/items`, `/admin/games/[action]`.

### 9.6 Services (`actions/services.ts`)

- `getServiceById`, `getServices`, `getServiceStats`, `createService`, `updateService`, `deleteService`, `restoreService`, `toggleServiceActive`.
- Pages `/services`, `/services/[id]`, admin `/admin/services/**`.
- API `/api/services` : CRUD **sans auth** (voir §11.6).

### 9.7 Signaux (`actions/signals.ts`)

- `createSignal`, `getSignalById`, `getSignals`, `updateSignal`, `deleteSignal`, `markSignalAsProcessed`, `getSignalsCountByStatus`, `cleanOldProcessedSignals`, `assignSignal(id, adminId)`.
- Pages `/signals` (public) et `/admin/signals` (modération).

### 9.8 Annonces (`actions/announcements.ts`)

- CRUD + lecture : `hasUserReadAnnouncement`, `getAnnouncementReads`, `getUserReadAnnouncements`, `markAnnouncementAsRead`, `bulkMarkAnnouncementsAsRead`, `countUnreadAnnouncements`, `getAnnouncementStats`.
- Admin complet : `/admin/announcements`, `create`, `[id]/edit`, `[id]/view`.
- Types `ANNOUNCEMENT|NEWS|UPDATE`, `isPinned`, `isActive`.
- Intégrées au démarrage via `AppProvider` (double ouverture avec `AppShell`).

### 9.9 Médias (`actions/media.ts`)

- `getMediaById`, `getMedias`, `getUserMedias`, `getEntityMedias`, `countEntityMedias`, `getMediaStats`, `createMedia`, `deleteMedia`, `restoreMedia`, `updateMediaMetadata`, `updateMediaPrivacy`.
- Table polymorphe `medias` : type `image|video|document|audio|other`, statut `ACTIVE|PROCESSING|DELETED`, privacy `PUBLIC|PRIVATE|FRIENDS`.
- Distincte des URLs stockées dans `messages.images`.

### 9.10 Catégories (`actions/categories.ts`)

- Arbre : `getCategoryTree`, `getRootCategories`, `getCategoryChildren`, `getCategoryBySlug`.
- Rattachement polymorphe : `attachCategoryToEntity`, `detachCategoryFromEntity`, `getEntityCategories`, `getCategoryEntities`, `updateCategoryItemCount`, `getCategoriesByEntityType`.
- Admin `/admin/categories`.

### 9.11 Partenaires (`actions/partners.ts`)

- `createPartner`, `updatePartner`, `deletePartner`, `getPartners`, `getPartnerById`, `getFeaturedPartners`.
- Validation `validations/partners.ts`.
- Pages `/partners`, admin `/admin/partners/**`.

### 9.12 Thèmes (`actions/themes.ts`)

- CRUD + achat + vues/téléchargements : `purchaseTheme(userId, themeId, price)`, `hasUserPurchasedTheme`, `getThemePurchases`, `incrementThemeDownloads`, `incrementThemeViews`, `getPopularThemes`, `getThemesByCategory`, `getUserThemes`, `getUserPurchasedThemes`.
- **`price` est fourni par l'appelant** : risque de manipulation de prix si le corps ne relit pas le prix en base (à confirmer).
- Table `theme_purchases` avec unique `(userId, themeId)`.

### 9.13 VIP (`actions/vip.ts` + `/vip`)

- Abonnements, `checkUserVipStatus`, `getUserVipBenefits`, `processExpiredVipSubscriptions`.
- Problèmes de renouvellement et d'autorisation décrits en §5.6/§5.10.
- UI `/vip` avec `vip-page-content`, `vip-pricing`, `vip-assistant`.

---

## 10. NOTIFICATIONS, RECHERCHE, MÉDIAS, DOCS, EXPORTS

### 10.1 Notifications

- `actions/notifications.ts` : `getNotifications`, `getUserNotifications`, `getNotificationById`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `getUnreadCount`, `getUnreadNotificationsCount`, `updateNotification`, `deleteNotification`, `deleteNotifications`, `createNotification`, `sendPushNotification`, `createNotificationWithPush`, `subscribeToPush`, `deletePushSubscription`.
- **Deux compteurs de non-lus** : doublon à consolider.
- `createNotification` est utilisé par `requestJoinGroup` (`GROUP_JOIN_REQUEST`), mais la demande n'est pas persistée : le propriétaire ne peut pas l'accepter côté données.
- Push : table `push_subscriptions` (endpoint unique), `config/firebase`, `hooks/use-firebase-token.ts` (commenté), `components/pwa/notification-manager.tsx`.
- Le corps de `sendPushNotification` (FCM/WebPush, VAPID, nettoyage des abonnements morts) n'a pas été audité en détail.
- UI admin `/admin/notifications/**` ; UI utilisateur `/dashboard/notifications`.

### 10.2 Recherche

- `actions/search.ts` : `unifiedSearch(entityTypes[], term, { limit, userId })`, `recordSearchTrend`, `getSearchTrends`, `searchWithSuggestions`.
- Types par défaut dans `/api/search` : `shop`, `product`, `tournament`, `theme`, `service`, `guide`, `blog`, `news`.
- `actions/histories.ts` : historique et tendances, purge à 90 jours.
- Hooks : `use-search`, `use-search-session`, `use-search-history`, `use-local-search`.
- Limites : `ilike`/`%term%`, pas de trigram ni `tsvector` ; suggestions uniquement basées sur les tendances globales ; terme < 2 caractères ignoré.
- `lib/encryption.ts` est utilisé pour chiffrer certaines données de recherche (à confirmer lesquelles).

### 10.3 Médias et upload

- Trois chemins concurrents : `hooks/use-chat-media.ts` (factice), `lib/upload.ts`, `utils/image-upload-utils.ts`.
- `lib/media-compression.ts` existe mais n'est pas utilisé par le chat.
- Aucun stockage objet identifié ; URLs `/uploads/...` ou `public/`.
- `app/api/interactions/internal-images` scanne `public/` en lecture seule ; path traversal correctement bloqué (`validateFolder` + `resolveInside`, refus `..`, chemins absolus, symlinks ignorés).

### 10.4 Docs

- `lib/docs.ts` + `docs/content` + pages `/docs/**`.
- `actions/README.md` existe ; pas de `app/api/README` identifié.
- `docs.md`, `ARCHITECTURE.md`, `ANALYSIS.md` documentent partiellement l'architecture.

### 10.5 Exports, PDF, QR

- `utils/export-utils.ts` (≈27 Ko), `utils/pdf-generator.ts`, `utils/receipt-templates.ts`, `utils/qr-utils.ts`, `utils/confetti.ts`.
- Exports PDF/Excel/CSV/JSON revendiqués par l'ancien audit ; la présence des fichiers est confirmée, leur couverture exacte n'a pas été testée.
- QR : page `/wallet/transactions/qr` + composant `qr-transaction.tsx`.

---

## 11. API REST

### 11.1 Deux abstractions concurrentes

| Implémentation | Fichier | Pipeline | État |
|---|---|---|---|
| `ApiHandler.handleRequest` | `lib/api-handler.ts` | `requireAuth`, `checkPermissions` | **`checkPermissions` retourne toujours `{ allowed: true }`** : autorisation fictive |
| `APIHandler.create` | `lib/api/handler.ts` | rate limit → auth API key/session → permissions → Zod → audit | Pipeline réel, meilleur |

`lib/api/handler.ts` :

- `logAudit` via `setImmediate` → perte probable en serverless.
- `lastUsedAt` en fire-and-forget.
- `config.schema.parse(body || {})` appliqué aussi aux GET.
- Rate limit calculé **avant** l'authentification (identifiant IP).

### 11.2 Rate limiting (`lib/api/rate-limiter.ts`)

- Redis optionnel (`REDIS_URL`), sinon PostgreSQL `api_rate_limits`.
- Incohérence : Redis `limited = count > max`, DB `limited = count >= max`.
- Le fallback DB fait un `DELETE` global des entrées expirées à chaque requête.
- `windowStart` est utilisé comme `reset` (valeur passée, pas la fin de fenêtre).

### 11.3 Clés API (`actions/api-keys.ts` + `lib/api/handler.ts`)

- `listAllApiKeys`, `createApiKey(userId, options)`, `revokeApiKey(keyId, reason)`, `getApiLogs(limit)`.
- Clés hachées SHA-256, `allowedIps`, `allowedOrigins`, `permissions`, `expiresAt`, `status='ACTIVE'`, `lastUsedAt`, `lastUsedIp`.
- Admin `/admin/api/keys`, `/admin/api/logs`.

### 11.4 Catalogue des routes (33)

| Route | Auth observée | Remarque |
|---|---|---|
| `/api/auth/[...all]` | Better Auth | Handler principal |
| `/api/auth/profile` | Session (sauf `userId`) | `userId` non protégé, `wallet` filtré |
| `GET/POST /api/users` | **Aucune** | Liste email/téléphone, création d'utilisateur |
| `GET/PATCH/DELETE /api/users/[id]` | Session + owner/admin | GET renvoie une projection safe si non propriétaire |
| `POST /api/users/[id]/ban` | Admin | Refus d'auto-ban |
| `GET /api/users/[id]/stats` | À confirmer | — |
| `GET /api/games` | Aucune | — |
| `POST/PATCH/DELETE /api/games` | **Aucune** | CRUD jeux ouvert |
| `GET/POST /api/game-clips` | GET public, POST session | — |
| `GET /api/services` | Aucune | — |
| `POST/PUT/PATCH/DELETE /api/services` | **Aucune** | CRUD services ouvert |
| `GET/POST /api/stats` | **Aucune** | Statistiques globales/dashboard |
| `GET /api/stats/docs` | À confirmer | — |
| `GET /api/search` | Session optionnelle | `unifiedSearch`, `recordSearchTrend` non attendu |
| `GET /api/search/suggestions` | Session optionnelle | Tendances 7 jours, max 5 |
| `GET/POST/PATCH/PUT/DELETE /api/claims` | Session requise | **Aucun contrôle de rôle/propriété** ; POST `userId` non lié à la session |
| `GET /api/shops` | Publique | Filtres très permissifs (`includeDeleted`, `balanceMin/Max`) |
| `POST /api/shops` | Session | `ownerId` client possible |
| `PATCH/DELETE /api/shops/[shopId]` | Session + owner/admin | Correct |
| `GET /api/cookies` | **Aucune** | `getAllCookies()` → exfiltration, y compris session |
| `POST/DELETE/PATCH /api/cookies` | **Aucune** | Écriture/suppression arbitraire |
| `POST /api/traces/analyze` | **Aucune** | IDOR sur parcours utilisateur |
| `GET /api/explanations/state` | Aucune | Stub d'état par défaut |
| `GET /api/interactions/internal-images` | **Aucune** | Scan `public/`, path traversal bloqué |
| `GET /api/transactions` | À confirmer | Liste |
| `POST /api/transactions/create` | Session | Bloque les crédits admin, vérifie propriété du wallet, **mais ne transmet pas `pin`** → transfert/retrait échouent au contrôle PIN |
| `GET /api/transactions/calculate-fees` | À confirmer | — |
| `GET/POST /api/wallets` | À confirmer | — |
| `GET/PATCH/DELETE /api/wallets/[id]` | À confirmer | — |
| `POST /api/wallet/create` | À confirmer | — |
| `GET /api/wallet/stats` | À confirmer | — |
| `GET/POST /api/wallet/verification` | À confirmer | — |
| `POST /api/wallet/verify-pin` | À confirmer | — |
| `GET /api/tournaments/[tournamentId]/editions` | À confirmer | — |
| `GET /api/tournaments/[tournamentId]/members` | À confirmer | — |
| `GET /api/test`, `GET /api/test/db` | À confirmer | Routes de test présentes |

### 11.5 Format des réponses

Pas de standard unique :

- `{ success, data }` (handler) ;
- objet brut (`/api/shops`, `/api/games`) ;
- `{ error }` simple ;
- `{ error: { code, message } }` (`/api/users`) ;
- tableau brut (`/api/search`).

### 11.6 Failles API critiques

1. `/api/cookies` : lecture/écriture/suppression de tous les cookies sans auth.
2. `/api/users` GET/POST : énumération + création sans auth.
3. `/api/games`, `/api/services` : CRUD sans auth.
4. `/api/stats` : métriques globales sans auth.
5. `/api/claims` : IDOR vertical/horizontal.
6. `/api/traces/analyze` : IDOR.
7. `lib/api-handler.ts#checkPermissions` : autorisation toujours vraie.
8. `/api/transactions/create` : perte du PIN.
9. `/api/auth/profile?userId=` : pas de contrôle de session.

---

## 12. ADMINISTRATION ET PERMISSIONS A/B/C

### 12.1 Modèle

`users.level` : `A|B|C` (défaut `C`), `users.isAdmin` booléen, `users.role` texte (`user`/`admin`).

`config/admin-items.ts` définit trois listes :

- `commonAdminRoutes` : accessibles à tous les admins (C, B, A) ;
- `intermediateAdminRoutes` : B et A ;
- `superAdminRoutes` : A uniquement.

Fonctions :

- `getAdminRoutesForLevel(level)` : concatène selon le niveau puis filtre.
- `getAdminRouteById(id, level)`.
- `isRouteAccessible(route, level)` : poids A=3, B=2, C=1.
- `flatRoutes(routes)`.
- `getAdminRouteGroups(level)`.
- `checkRouteAccess(path, level)` : vérifie le path exact contre les routes A.

### 12.2 Pages admin (43)

Dashboard, annonces, API keys, API logs, blogs, catégories, claims, jeux (+ items, `[action]`), groupes, guides, interactions, médias, notifications, commandes, partenaires, produits, requêtes, services, réglages, boutiques, signaux, tournois, transactions, utilisateurs, VIP, wallets.

### 12.3 Application réelle des permissions

- `app/admin/layout.tsx` est **client** : `useAuthContext`, `useUserProfile`, `useAdminPermissions`, redirection si `!isAdmin` ou route non autorisée.
- `hooks/use-admin-permissions.ts` : `adminLevel = user.level || "C"`, routes filtrées, `canAccessCurrentRoute`.
- `hooks/use-admin-auth.ts` : garde `!isAuthenticated → /sign-in`, `!isAdmin → /unauthorized`.
- **La sécurité réelle est dans `proxy.ts`** (serveur), mais celui-ci ne vérifie que `isAdmin`, pas le niveau A/B/C pour les routes admin. Le filtrage par niveau est donc **côté client** et contournable.
- Aucun middleware admin serveur dédié n'a été identifié.

### 12.4 `level` A/B/C vs finance

Les fichiers financiers analysés ne lisent **jamais** `level`. Les contrôles sont binaires (`role === 'admin'` ou `isAdmin`). Un admin C peut donc, via les Server Actions financières, effectuer les mêmes opérations qu'un admin A.

### 12.5 Mutations admin sans auth

- `actions/app-settings.ts` : `updateAppSettings`, `setAppSettingValue`, `updateTransactionFees`, `updateVipPricing`, `resetAppSettings`. Un appelant peut modifier les frais, les prix VIP, le mode maintenance et supprimer les réglages.
- `actions/claims.ts` : `createClaim`, `updateClaim`, `updateClaimStatus`, `deleteClaim`.
- `actions/wallets.ts` : nombreuses mutations.
- `actions/vip.ts` : `renewVipSubscription`, `deleteVipSubscription`.

### 12.6 Outils admin sensibles

- `actions/database.ts` : introspection (`getAllTableStats`, `getDatabaseStats`, `getIndexStats`, `getForeignKeyStats`, `generateDatabaseReport`).
- `actions/api-keys.ts` : gestion des clés.
- `actions/stats.ts` (≈67 Ko) et `actions/user-stats.ts` (≈54 Ko) : **collision de `getUserStats`** et chevauchement fonctionnel.
- Aucun journal d'audit admin unifié (seuls les `api_logs` existent pour l'API à clé).

---

## 13. PWA, SERVICE WORKER ET OFFLINE

### 13.1 Manifest (`app/manifest.ts`)

- `name`/`short_name` : Games-Trafics.
- `start_url: "/"`, `scope: "/"`, `display: "standalone"`, orientation portrait.
- `background_color: "#ffffff"`, `theme_color: "#7C3AED"`.
- `categories: ["games", "entertainment", "shopping"]`, `lang: "fr"`.
- Icônes `gt-primary.png` déclinées, screenshots, raccourcis.
- **Défaut** : un raccourci pointe vers `/community`, route inexistante. Certaines icônes/screenshots peuvent référencer des assets absents (à vérifier dans `public/icons`).

### 13.2 Enregistrement (`providers/pwa-provider.tsx`)

- Monte `PWAManager` en `dynamic(..., { ssr: false })` après `mounted`.
- En **développement** : désenregistre tous les SW et supprime tous les caches à chaque montage. Logique dupliquée avec `components/pwa/disable-sw-in-dev.tsx` monté dans le RootLayout.
- En **production** : `register('/sw.js', { scope: '/', updateViaCache: 'none' })`, puis `registration.update()` toutes les heures ; cleanup de l'intervalle.
- **Aucune gestion `updatefound`/`waiting`/`controllerchange`** : pas de prompt de mise à jour ni de rechargement automatique.

### 13.3 Service Worker (`public/sw.js`, v6)

Caches :

- `gtc-cache-v6` (essentiels), `gtc-runtime-v6`, `gtc-images-v6`.
- `MAX_IMAGE_AGE = 14 jours`.

Ressources essentielles : `/`, `/offline`, icônes, manifest, police.

**Interdictions de cache** (`NEVER_CACHE_PATTERNS`) :

- toutes les `/api/` ;
- `auth/`, `sign-in`, `sign-up` ;
- contextes financiers : `/wallet`, transactions, paiement, checkout, admin ;
- Server Actions contournées via les en-têtes `Next-Action` / `x-action`.

Stratégies :

- Images : cache-first avec vérification d'âge, fallback réseau puis cache périmé.
- Navigation : network-first ; une page privée/financière n'est **jamais** servie depuis le cache.
- Requêtes génériques : réseau puis cache.
- Nettoyage des ressources 404 au démarrage.

### 13.4 Push, clic, sync

- `push` : parse `event.data.json()`, affiche une notification avec icône, badge, `data.url`.
- `notificationclick` : ferme la notification et ouvre/focus l'URL.
- `message` : gère `SKIP_WAITING`.
- `background sync` / `periodic sync` : enregistrés, mais `getPendingRequests`/`removePendingRequest` utilisent **`localStorage` dans le Service Worker**, API indisponible → code mort.

### 13.5 Dette PWA

- Pas de gestion de mise à jour (`waiting`, `controllerchange`).
- Double nettoyage SW en dev.
- `usePWAInstall` ne remet pas `isInstallable` à `false` sur `appinstalled`, état non persisté.
- `use-firebase-token.ts` entièrement commenté.
- `usePWAStatus` : `canReceiveNotifications = isAuthenticated && isInstalled`.
- Code `localStorage` mort dans le SW.
- Raccourci `/community` inexistant.
- Pas de fallback offline explicite pour les pages dynamiques hors navigation.

---

## 14. MODÈLE DE DONNÉES

### 14.1 Enums PostgreSQL (déclarés dans `database/schema.ts`)

- `account_type` : `SELLER`, `BUYER`, `TRADER`, `TOURNAMENT_ORGANIZER`, `VIP`.
- `user_level` : `A`, `B`, `C`.
- `verification_status` : `PENDING`, `VERIFIED`, `REJECTED`.
- `team_role` : `PLAYER`, `COACH`, `MANAGER`, `SUBSTITUTE`, `CAPTAIN`, `VICE_CAPTAIN`.
- `tournament_status` : `UPCOMING`, `LIVE`, `COMPLETED`, `CANCELLED`.
- `tournament_format` : `ELIMINATION`, `GROUP_STAGE`, `ROUND_ROBIN`, `SWISS`, `KNOCKOUT`, `CUSTOM`.
- `match_status` : `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `PENDING_REVIEW`, `AWAITING_ADMIN_CONFIRMATION`, `DISPUTED`.
- `transaction_status` : `PENDING`, `COMPLETED`, `PROCESSING`, `FAILED`, `REFUNDED`.
- `transaction_type` : `PURCHASE`, `VIP_SUBSCRIPTION`, `GAME_ITEM_PURCHASE`, `THEME_PURCHASE`, `DEPOSIT`, `WITHDRAWAL`, `REFUND`, `TRANSFER`, `ORDER_PURCHASE`, `TOURNAMENT_PARTICIPATION`, `BONUS`.
- `order_status` : valeurs de commande (PENDING, ACCEPTED_BY_SHOP, COMPLETED, REJECTED, etc.).
- `participation_status` : `REGISTERED`, `PARTICIPATED`, `DISQUALIFIED`, `WINNER`, `ELIMINATED`.
- `entity_type` : types polymorphes (PRODUCT, POST, SHOP, TOURNAMENT, USER, BLOG, MESSAGE, TEAM, THEME, NEWS, GROUP, GAME, GAME_ITEM, ANNOUNCEMENT, SERVICE, GUIDE, COMMENT, MATCH, etc.).
- `product_status` : `NON_VENDU`, `RESERVE`, `EN_ECHANGE`, `LIVRE`, `VENDU`, `ANNULER`.
- `interaction_type` : `LIKE`, `FOLLOW`, `BOOKMARK`, `VIEW`, `SHARE`.
- `platform` : `PC`, `PLAYSTATION`, `XBOX`, `NINTENDO_SWITCH`, `MOBILE`, `VR`, `OTHER`.
- `game_item_type` : `COIN`, `ITEM`, `SKIN`, `EQUIPMENT`, `CURRENCY`.
- `game_item_status` : `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`.
- `vip_plan_type` : `MONTHLY`, `YEARLY`, `LIFETIME`.
- `vip_status` : `ACTIVE`, `EXPIRED`, `CANCELLED`.
- `group_role` : `OWNER`, `ADMIN`, `MEMBER`.
- `announcement_type` : `ANNOUNCEMENT`, `NEWS`, `UPDATE`.
- `trace_type` : types de traces (page view, action, etc.).
- `media_type` : `image`, `video`, `document`, `audio`, `other`.
- `media_status` : `ACTIVE`, `PROCESSING`, `DELETED`.
- `media_privacy` : `PUBLIC`, `PRIVATE`, `FRIENDS`.
- `partner_type`, `partnership_status`, `partnership_tier`.
- `financial_account_type` : `USER_WALLET`, `SHOP_WALLET`, `PLATFORM_ESCROW`, `PLATFORM_FEES`, `TOURNAMENT_POOL`, `SYSTEM_ADJUSTMENT`.
- `request_type` : `DEPOSIT`, `WITHDRAWAL`, `GAME_ITEMS`, `OTHER`.

### 14.2 Les 61 tables par domaine

**Identité / auth** (5) : `users`, `session`, `account`, `verification`, `passkey`.

**Finance** (7) : `user_wallets`, `wallet_transactions`, `financial_accounts`, `ledger_entries`, `receipts`, `vip_subscriptions`, `app_settings` (transverse).

**Partenaires / thèmes** (4) : `partners`, `partnerships`, `themes`, `theme_purchases`.

**Marketplace** (8) : `shops`, `categories`, `entity_categories`, `products`, `orders`, `games`, `game_items`, `requests`.

**Tournois** (13) : `teams`, `team_members`, `tournaments`, `tournament_editions`, `tournament_members`, `edition_registrations`, `registration_payments`, `tournament_phases`, `phase_groups`, `phase_group_participants`, `bracket_nodes`, `matches`, `edition_results`.

**Social / contenu** (13) : `posts`, `messages`, `groups`, `conversations`, `group_members`, `interactions`, `game_clips`, `medias`, `notifications`, `push_subscriptions`, `announcements`, `announcement_reads`, `search_history`.

**Modération / support** (3) : `claims`, `signals`, `user_traces`.

**Éditorial / docs** (5) : `blogs`, `services`, `guides`, `guide_steps`, `viewers`.

**API / technique** (3) : `api_keys`, `api_logs`, `api_rate_limits`.

**Divers** : `receipts` (déjà compté), `app_settings`.

> Le total exact dépend du regroupement ; l'inventaire `pgTable` en compte **61**.

### 14.3 Contraintes et index notables

- `users.email` unique, `users.username` unique, `users.authUid` unique.
- `user_wallets.userId` unique (`wallet_user_unique`), `cardNumberHash` unique.
- `receipts.receiptNumber` unique.
- `vip_subscriptions.userId` unique (`vip_user_unique`) — **bloquant pour le renouvellement**.
- `shops.name` unique, `themes.name` unique, `categories.slug` unique.
- `tournament_editions` unique `(tournamentId, editionNumber)` ; `editionSlug` unique partiel.
- `tournament_members` unique `(tournamentId, userId)` et `(tournamentId, teamId)`.
- `edition_registrations` unique `(editionId, memberId)`.
- `phase_group_participants` unique `(groupId, registrationId)`.
- `edition_results` unique `(editionId, registrationId)`.
- `conversations.chatId` unique.
- `group_members` unique `(groupId, userId)`.
- `interactions` unique partiel `(userId, entityId, entityType, type)` où `isDeleted = false`.
- `push_subscriptions.endpoint` unique.
- `theme_purchases` unique `(userId, themeId)`.
- `announcement_reads` unique `(announcementId, userId)`.
- `api_keys.hash` unique.
- `entity_categories` unique `(entityId, entityType, categoryId)`.

### 14.4 Trous d'intégrité

- Pas de FK `ledger_entries.transactionId → wallet_transactions.id`.
- Pas de contrainte d'équilibre débit/crédit.
- Pas de `CHECK` sur les montants positifs.
- `app_settings` sans singleton.
- `requests.status` et `claims.status` en texte libre.
- `financial_accounts.type` non unique alors que le code fait `LIMIT 1`.
- `ownerShopId`/`ownerEditionId` sans FK (contournement de dépendance circulaire).
- Soft delete incohérent : certaines tables ont `isDeleted`, d'autres non (`groups`, `group_members`).
- Pas de `updatedAt` sur `wallet_transactions`.
- Pas de clé d'idempotence sur les paiements.

---

## 15. TESTS, QUALITÉ ET OUTILLAGE

### 15.1 Inventaire des tests (12 fichiers)

- `tests/unit/wallet/wallet-utils.test.ts`
- `tests/unit/finance/fee-engine.test.ts`
- `tests/unit/tournaments/standings-engine.test.ts`
- `tests/unit/tournaments/preview-engine.test.ts`
- `tests/unit/tournaments/match-generator.test.ts`
- `tests/unit/tournaments/bracket-engine.test.ts`
- `tests/unit/security/authorization.test.ts`
- `tests/unit/security/encryption.test.ts`
- `tests/unit/security/proxy.test.ts`
- `tests/unit/security/safe-redirect.test.ts`
- `tests/unit/security/transactions-rules.test.ts`
- `tests/unit/pwa/pwa-rules.test.ts`

### 15.2 Couverture réelle

Les tests couvrent vraisemblablement :

- les fonctions pures de `WalletUtils` (hash PIN, validation, formatage) ;
- le calcul pur des frais ;
- les algorithmes de tournoi (round-robin, bracket, preview, classement) ;
- les règles de redirection sûre ;
- les règles de proxy ;
- le chiffrement ;
- les règles de transaction.

Détail tournois confirmé : `standings-engine.test.ts` (11 tests : points, différence de buts, buts marqués, égalité stricte, matchs non confirmés), `match-generator.test.ts` (~20 tests : round-robin pair/impair, BYE, doublons, aller-retour, élimination), `bracket-engine.test.ts` (`getRequiredWins`, `FINAL_STATUSES`, `computeWinner`, `resolveSlotIndex`), `preview-engine.test.ts`.

**Absences notables** :

- aucun test d'intégration base de données ;
- aucun test de concurrence (`FOR UPDATE`) ;
- aucun test d'idempotence ;
- aucun test des flux commande/VIP/tournoi payant ;
- aucun test des permissions des Server Actions ;
- aucun test de `progression-engine.ts`, `structure-engine.ts`, `generators.ts`, `match-generation-engine.ts`, `propagation-service.ts` ;
- aucun test end-to-end (Playwright/Cypress) ;
- aucun test de composants UI.

### 15.3 Doublons et code mort

1. Deux handlers API : `lib/api-handler.ts` vs `lib/api/handler.ts`.
2. Deux `getUserStats` : `actions/stats.ts` et `actions/user-stats.ts`.
3. Deux compteurs de non-lus dans `actions/notifications.ts`.
4. Deux helpers de partage : `lib/share.ts` et `utils/share.ts`.
5. Trois chemins d'upload : `hooks/use-chat-media.ts`, `lib/upload.ts`, `utils/image-upload-utils.ts`.
6. `hooks/use-fab-actions.ts` et `.tsx`.
7. `types/user.ts` vide, fichiers Markdown vides.
8. Imports inutilisés (`like` dans messages/interactions/groups), casts `as any` nombreux.
9. Trois systèmes de permissions.
10. `actions/phases.ts` et `actions/tournaments.ts` sont des façades de réexport.

### 15.4 Écart entre l'ancien audit et la réalité

L'ancien `ANALYSIS.md` affirmait :

| Affirmation | Réalité constatée |
|---|---|
| AppShell non bloquant + déduplication des profils | Non bloquant sur routes publiques **oui**, mais **aucune déduplication** : 3 à 4 requêtes profil |
| PWA assainie | Exclusions de cache **oui**, mais pas de gestion de mise à jour, code mort, raccourci cassé |
| Finance unifiée et autoritaire | `ledger-engine` et `fee-engine` existent, mais **deux implémentations** de `createTransaction` et de nombreuses actions sans auth |
| Tournament Engine normalisé | Modèle et moteurs **oui**, mais inscription payante **non aboutie** et plusieurs actions non protégées |
| Server Actions décomposées | Décomposition partielle **oui** (`actions/phases/**`, `actions/tournaments/**`) avec façades, mais des modules restent monolithiques (`actions/stats.ts` 67 Ko) |
| UI sans calculs inline | Non vérifié ; de nombreux hooks font encore des transformations locales |
| Exports enrichis | Fichiers présents, couverture non testée |
| 111/111 tests, 0 erreur TS | **Non vérifié** ; seuls 12 fichiers de tests existent, aucun test d'intégration |

**Conclusion** : l'ancien document décrivait une cible et un bilan optimiste, pas l'état réel. Il est conservé en annexe pour traçabilité, pas comme source de vérité.

---

## 16. RISQUES PRIORITAIRES ET DETTE TECHNIQUE

### 16.1 P0 — À traiter immédiatement

| # | Risque | Fichier(s) | Impact |
|---|---|---|---|
| 1 | `/api/cookies` non authentifié | `app/api/cookies/route.ts` | Vol de session, prise de contrôle de compte |
| 2 | `/api/users` GET/POST non authentifié | `app/api/users/route.ts` | Fuite de PII, création d'utilisateurs |
| 3 | CRUD `/api/games`, `/api/services` non authentifié | `app/api/games/route.ts`, `app/api/services/route.ts` | Corruption de contenu |
| 4 | Server Actions financières sans auth | `actions/wallets.ts`, `actions/app-settings.ts`, `actions/vip.ts`, `actions/claims.ts` | Fraude, création de GTC, modification des frais |
| 5 | Double `createTransaction` non sécurisé | `actions/wallets.ts` | Contournement PIN/ledger, TOCTOU |
| 6 | `/api/claims` IDOR | `app/api/claims/route.ts` | Modification/suppression de réclamations d'autrui |
| 7 | `/api/auth/profile?userId=` | `app/api/auth/profile/route.ts` | Fuite de profils |
| 8 | Chat : IDs client et élévation de rôle | `actions/messages.ts`, `actions/groups.ts`, `actions/interactions.ts` | Usurpation, suppression de groupes |

### 16.2 P1 — Structurel

| # | Risque | Fichier(s) | Impact |
|---|---|---|---|
| 9 | Inscription payante non implémentée | `actions/editions.ts`, `actions/transactions.ts` | Fonctionnalité tournoi payant inutilisable |
| 10 | Escrow négatif sur commandes | `actions/orders.ts`, `lib/finance/ledger/ledger-engine.ts` | Comptabilité fausse |
| 11 | VIP non renouvelable | `database/schema.ts`, `actions/vip.ts` | Revenu récurrent bloqué |
| 12 | Frais fail-open | `lib/finance/fees/fee-engine.ts` | Perte de revenus silencieuse |
| 13 | Permissions A/B/C non appliquées côté serveur | `proxy.ts`, `app/admin/layout.tsx` | Admin C = admin A |
| 14 | Upload chat factice | `hooks/use-chat-media.ts` | Perte de données perçue |
| 15 | `unreadCount` jamais incrémenté | `actions/messages.ts` | Badges faux |
| 16 | PWA sans gestion de mise à jour | `providers/pwa-provider.tsx` | Utilisateurs bloqués sur une version |
| 17 | `hasWallet` cassé | `app-shell.tsx`, `app/api/auth/profile/route.ts` | FAB wallet désactivés |
| 18 | Triple calcul de classement divergent | `lib/tournaments/standings.engine.ts`, `actions/phases/progression.ts`, `lib/tournaments/progression-engine.ts` | Positions/qualifiés incohérents |
| 19 | Générateur d'élimination dupliqué | `lib/tournaments/generators.ts:249`, `actions/phases/structure.ts:628` | Structures divergentes selon l'appelant |
| 20 | Progression non atomique + `proofUrl` inexistant | `lib/tournaments/progression-engine.ts`, `actions/tournaments/results.ts` | Scores et brackets désynchronisés |

### 16.3 P2 — Qualité et cohérence

- Doublons d'implémentations (API, stats, partage, upload).
- Absence de machine à états pour les transactions et commandes.
- Pas d'idempotence ni de clé unique métier.
- Cache `orders` non invalidé.
- `findRouteConfig` fallback arbitraire.
- Trois systèmes de permissions.
- Tests d'intégration absents.
- Fichiers vides et code mort.
- `console.warn`/`console.log` en production.
- Absence de reporting d'erreur distant.

### 16.4 Quick wins (faible effort, fort impact)

1. Protéger `/api/cookies` (session + admin) ou supprimer la route.
2. Ajouter un guard admin sur `/api/users`, `/api/games`, `/api/services`, `/api/stats`.
3. Supprimer ou sécuriser `actions/wallets.ts#createTransaction`, `depositToWallet`, `transferMoney`.
4. Ajouter `getCurrentUser()` + contrôle de propriété dans `actions/claims.ts`, `actions/app-settings.ts`, `actions/vip.ts`.
5. Transmettre `pin` dans `/api/transactions/create`.
6. Restaurer la relation `wallet` dans `/api/auth/profile` ou calculer `hasWallet` côté serveur.
7. Corriger `/api/auth/profile?userId=` (session obligatoire + visibilité).
8. Ajouter `revalidateTag('orders')` dans les mutations de commande.
9. Corriger `updateEditionResultForParticipant`/`joinEdition` pour le paiement.
10. Remplacer `Math.random` par `crypto.randomInt` et hacher réellement le numéro de carte.
11. Ajouter les tests d'intégration ledger/commande/tournoi.
12. Nettoyer les doublons et les fichiers vides.

---

## 17. ANNEXES

### 17.A Catalogue des pages (150)

**Public / vitrine**

- `/`, `/about`, `/contact`, `/support`, `/maintenance`, `/offline`, `/unauthorized`, `/welcome`, `/test`, `/create-w`.
- `/marketplace`, `/marketplace/[productId]`, `/marketplace/[productId]/dashboard` (+ `orders`, `settings`).
- `/shops`, `/shops/create`, `/shops/[shopId]`, `/shops/[shopId]/products`, `/shops/[shopId]/dashboard` (+ clients, notifications, orders, products, products/create, settings, wallet).
- `/blogs`, `/blogs/[id]`, `/partners`, `/services`, `/services/[id]`, `/games`, `/games/[itemId]`, `/game-clips`, `/game-clips/create`, `/signals`, `/vip`.
- `/tournaments`, `/tournaments/create`, `/tournaments/[tournamentId]`.
- `/tournaments/[tournamentId]/members`, `/tournaments/[tournamentId]/members/[memberId]`.
- `/tournaments/[tournamentId]/editions`, `/tournaments/[tournamentId]/editions/[editionId]`, `/tournaments/[tournamentId]/editions/[editionId]/calendar`.
- `/tournaments/[tournamentId]/editions/[editionId]/matches`, `/tournaments/[tournamentId]/editions/[editionId]/matches/[matchId]`.
- `/docs`, `/docs/guides`, `/docs/guides/[guideId]`, `/docs/legal/privacy`, `/docs/legal/terms`, `/docs/schema`, `/docs/[...slug]`.

**Auth**

- `/callback`, `/error`, `/forgot-password`, `/reset-password`, `/sign-in`, `/sign-up`.

**Protégé**

- `/dashboard`, `/dashboard/my-purchases`, `/dashboard/notifications`, `/dashboard/products`, `/dashboard/shops`, `/dashboard/subscriptions`, `/dashboard/tournaments`.
- `/profile`, `/profile/settings`, `/profile/[id]`.
- `/wallet`, `/wallet/create`, `/wallet/claims`, `/wallet/settings`, `/wallet/transactions`, `/wallet/transactions/create`, `/wallet/transactions/history`, `/wallet/transactions/qr`, `/wallet/transactions/[id]`, `/wallet/verification`.
- `/chats`, `/chats/groups/create`, `/chats/groups/[groupId]`, `/chats/groups/[groupId]/edit`.

**Dashboards tournoi**

- `/tournaments/[tournamentId]/dashboard` (+ editions, editions/create, members, notifications, settings).
- `/tournaments/[tournamentId]/editions/[editionId]/dashboard` (+ brackets, brackets/[bracketId], brackets/[bracketId]/organize, groups, groups/[groupId], groups/[groupId]/organize, matches, organize, participants, participants/organize, payments, phases, phases/[phaseId], phases/[phaseId]/organize, settings).
- `/tournaments/[tournamentId]/editions/[editionId]/matches`, `/tournaments/[tournamentId]/editions/[editionId]/matches/[matchId]`.

**Admin (43)**

- `/admin`, `/admin/announcements` (+ create, [id]/edit, [id]/view), `/admin/api/keys`, `/admin/api/logs`, `/admin/blogs` (+ create, [id]), `/admin/categories`, `/admin/claims` (+ create), `/admin/games` (+ items, items/[action], [action]), `/admin/groups`, `/admin/guides` (+ [action]), `/admin/interactions`, `/admin/media`, `/admin/notifications` (+ create, [id]/edit, [id]/view), `/admin/orders`, `/admin/partners` (+ create, [id]/edit, [id]/view), `/admin/products`, `/admin/requests`, `/admin/services` (+ create), `/admin/settings`, `/admin/shops`, `/admin/signals`, `/admin/tournaments`, `/admin/transactions`, `/admin/users`, `/admin/vip`, `/admin/wallets`.

### 17.B Catalogue des modules de Server Actions (56)

`announcements`, `api-keys`, `app-settings`, `blogs`, `categories`, `claims`, `cookies`, `database`, `edition-registrations`, `editions`, `entities`, `game-clips`, `game-items`, `games`, `groups`, `guides`, `histories`, `interactions`, `media`, `members`, `messages`, `notifications`, `orders`, `participants`, `partners`, `phases`, `posts`, `products`, `receipt`, `requests`, `search`, `services`, `shops`, `signals`, `stats`, `themes`, `tournaments`, `transactions`, `user-stats`, `user-traces`, `users`, `validation`, `vip`, `wallets`.

Sous-modules :

- `actions/phases/` : `helpers`, `index`, `mutations`, `progression`, `queries`, `structure`.
- `actions/tournaments/` : `editions`, `helpers`, `index`, `members`, `results`, `tournaments`.

**Doublons fonctionnels tournois** : `actions/participants.ts` réimplémente une partie de `actions/tournaments/*` ; `actions/editions.ts` duplique `updateEdition`/`deleteEdition` et une partie de la finalisation ; `actions/edition-registrations.ts` est un simple re-export de compatibilité.

### 17.C Catalogue des routes API (33)

Voir le tableau détaillé §11.4.

### 17.D Catalogue des hooks (76)

`network-status`, `use-active-route`, `use-admin-auth`, `use-admin-permissions`, `use-ai-assistant`, `use-announcements`, `use-app-config`, `use-auth`, `use-blogs`, `use-bracket-data`, `use-bracket-manager`, `use-bulk-validation`, `use-categories`, `use-chat-media`, `use-chat-theme`, `use-claims`, `use-clip-engine`, `use-console`, `use-conversations`, `use-cookies`, `use-debounce`, `use-delete`, `use-double-tap`, `use-edition-manager`, `use-edition`, `use-editions`, `use-entity-list`, `use-fab-actions` (×2), `use-firebase-token` (commenté), `use-game-clip-playback`, `use-game-clips-player`, `use-game-clips`, `use-games-filters`, `use-games`, `use-group-manager`, `use-groupes`, `use-guides`, `use-interactions`, `use-intersection-observer`, `use-journey-recommendations`, `use-local-search`, `use-local-storage`, `use-long-press`, `use-match-manager`, `use-media`, `use-member`, `use-messages`, `use-mobile`, `use-notifications`, `use-orders`, `use-partners`, `use-phase-manager`, `use-posts`, `use-products`, `use-profile-actions`, `use-profile-completion`, `use-profile`, `use-requests`, `use-screen`, `use-search-history`, `use-search-session`, `use-search`, `use-services`, `use-shops`, `use-signals`, `use-stats`, `use-tournament-editions`, `use-tournaments`, `use-tracing`, `use-transaction-fees`, `use-transaction`, `use-users`, `use-vip`, `use-wallets`, `usePWAInstall`.

### 17.E Archive — ancien contenu de `ANALYSIS.md` (document historique)

> **Avertissement** : ce qui suit est la version précédente, conservée pour traçabilité. Elle décrit une **cible de refonte** et un bilan auto-déclaré. Plusieurs de ses affirmations sont contredites par le code actuel (voir §15.4). Ne pas l'utiliser comme documentation de référence.

```markdown
# CARTOGRAPHIE & AUDIT INITIAL D'ARCHITECTURE — GAMES-TRAFICS

> **Date** : 2026-11-02
> **Auteur** : Assistant IA d'Ingénierie
> **Statut** : Document de référence pour la refonte technique globale
> **Source d'exigences** : PROMPT.md

## 1. Vue d'Ensemble & État des Lieux

L'application Games-Trafics est une plateforme esport et marketplace gaming construite sur Next.js (App Router, Turbopack), PostgreSQL (Neon) avec Drizzle ORM, Better Auth, TanStack Query et Tailwind CSS.

Plusieurs audits et stabilisations ont déjà été menés (fermeture des failles critiques P0 financières et anti-takeover en Phase A-B, puis fiabilisation du Tournament Engine et du driver PostgreSQL avec support des transactions).

Cependant, comme identifié dans le cahier des charges de PROMPT.md, plusieurs chantiers structurels majeurs subsistent :

1. Cycle de démarrage & Application Shell (P0) : Des cascades de vérifications asynchrones (refreshUser, useUserProfile, getAppSettings, canSkipWelcome) bloquent l'affichage de l'UI avec des loaders intempestifs.
2. Système PWA & Service Worker (P1) : Initialisation dispersée, risque de cache non maîtrisé sur les contextes financiers, gestion des workers à simplifier.
3. Architecture Financière & Ledger (P0) : Bien que les failles critiques aient été fermées, le code financier est dispersé dans actions/transactions.ts, actions/wallets.ts, lib/ledger/ledger-utils.ts, avec des calculs de frais non centralisés et des modules transactionnels à modulariser.
4. Moteur de Tournois (Tournament Engine) (P1) : Des actions géantes (actions/phases.ts fait ~4800 lignes) mélangent accès DB, règles métier, formats de compétition et gestion des participants.
5. Composants d'export & UI des compétitions (P2) : Pages et modals de compétition contenant des logiques métier redondantes.

## 2. Analyse Détaillée par Domaine

### 2.1. Domaine 1 : Application Shell, Layouts & Démarrage (P0)

#### Problèmes confirmés dans components/layout/app-shell.tsx & contexts/ :
- Cascade d'effets bloquants :
  1. AppShell attend !isInitialized || !welcomeChecked en affichant un <PulseLoading size={150} message="Initialisation..." />.
  2. init() déclenche refreshUser() systématiquement sur useAuthContext.
  3. useAuth exécute déjà une vérification de session au montage (getSession()). L'appel à refreshUser() est donc redondant au démarrage.
  4. En parallèle, AppProvider (contexts/app-context.tsx) appelle useUserProfile({ relations: ["announcements"] }) et getAppSettings().
  5. useUserProfile dans AppShell appelle une seconde fois le profil avec relations: ["wallet"].
  6. Résultat : 4 requêtes asynchrones en cascade avant d'autoriser l'affichage de la page la plus simple (ex: page d'accueil ou marketplace publique).
- Affichage bloqué sur routes publiques :
  - Même pour /marketplace, /tournaments ou /services, l'utilisateur voit un écran de chargement plein écran alors qu'aucun privilège n'est requis.
- Règles de sécurité côté client vs serveur :
  - proxy.ts gère déjà la redirection des routes protégées côté serveur / Edge. AppShell refait une évaluation avec resolveRoute() qui peut être optimiste ou purement informative pour le layout.

### 2.2. Domaine 2 : Système PWA & Service Worker (P1)

#### État actuel :
- providers/pwa-provider.tsx : Enregistre le service worker /sw.js uniquement en production, nettoie en dev.
- components/pwa/disable-sw-in-dev.tsx : Désenregistre les SW en dev (doublon partiel avec pwa-provider).
- components/pwa/PWAManager.tsx : Gère le prompt d'installation.
- Points de vigilance :
  - Garantir l'interdiction absolue de mise en cache du cache storage sur /api/wallet/*, /api/transactions/*, et les Server Actions financières.
  - Découpler les prompts d'installation de la structure critique du shell.

### 2.3. Domaine 3 : Système Financier, Ledger & Transactions (P0)

#### État actuel :
- Le driver neon-serverless Pool avec WebSocket a été mis en place dans lib/db/index.ts, rendant enfin fonctionnel db.transaction(async (tx) => ...).
- Les Server Actions dans actions/transactions.ts (~800 lignes) contiennent :
  - Validation PIN
  - Calcul de frais
  - Débits / crédits
  - Création de transaction et écritures de ledger
- Faiblesses architecturales :
  - Manque d'isolation pure entre le moteur comptable (ledger-engine), le calcul de frais (fee-engine), et le service métier de paiement (payment-service).
  - Duplication des règles de calcul de commission (dans actions/transactions.ts et lib/ledger/ledger-utils.ts).
  - Les Server Actions exposent parfois des helpers qui devraient rester strictement internes au backend.

### 2.4. Domaine 4 : Moteur de Compétition & Tournois (P1)

#### État actuel :
- actions/phases.ts : ~4880 lignes ! Ce fichier est surchargé et concentre des dizaines de responsabilités (création de phase, gestion de poules, génération de bracket, tirage au sort, validation de score, calcul des classements, etc.).
- actions/tournaments.ts : ~1400 lignes.
- lib/tournaments/ :
  - generators.ts : Fonctions d'orchestration (setupLeaguePhase, setupGroupPhase, setupEliminationGroups, setupSwissPhase).
  - match.generator.ts : Fonctions de génération de matchs (Round Robin, élimination).
  - standings.engine.ts : Calcul des classements.
  - bracket-engine.ts : Calcul des vainqueurs et arbres.
- Besoins d'amélioration :
  - Découper actions/phases.ts et actions/tournaments.ts en sous-modules spécialisés sous actions/phases/ et actions/tournaments/ avec façades de réexportation rétrocompatibles.
  - Séparer strictement les algorithmes purs (sans DB) des services d'orchestration avec DB (tx).
  - Implémenter le simulateur / prévisualisateur de phase avant enregistrement en base.

## 3. Matrice de Risques & Dépendances

| Domaine | Risque Identifié | Impact | Stratégie d'Atténuation |
|---|---|---|---|
| AppShell | Régression sur la protection des routes | Élevé | Conserver la sécurité dans proxy.ts (serveur) et tester les routes protégées / publiques. |
| AppShell | Écran blanc si resolveRoute échoue | Moyen | Fallback immédiat sur rendu des children pour les routes publiques sans bloquer sur l'auth. |
| Finance | Régression sur le calcul de solde | Critique | S'appuyer sur la suite de tests Vitest existante (tests/unit/wallet/, tests/unit/security/) et enrichir. |
| Tournois | Rupture d'imports dans les pages de tournoi | Élevé | Façade de réexportation stricte (export * from "./phases/..."). Aucun import existant ne doit casser. |

## 4. Synthèse

Le plan de travail priorisé défini dans PROMPT.md est confirmé :
- Phase 1 (Immédiate) : Optimisation AppShell, déblocage du rendu initial sur routes publiques, élimination des cascades de requêtes au démarrage.
- Phase 2 : Clarification PWA & cycle de vie.
- Phase 3 : Structuration de la couche Finance (lib/finance/), centralisation des frais & transactions atomiques.
- Phase 4 & 5 : Décomposition modulaire de actions/phases.ts et actions/tournaments.ts, pureté des moteurs de compétition.
- Phase 6 & 7 : Consolidation UI, composants et exports.
- Phase 8 : Tests complets et validation globale.

## 5. Bilan d'Exécution & Validation Globale

Toutes les phases de la refonte ont été exécutées avec succès et validées :
1. AppShell & Performance : Rendu non-bloquant des routes publiques et déduplication des requêtes de profil.
2. PWA : Exclusion absolue du cache pour toutes les données financières et privées (public/sw.js), cycle de vie PWA assaini.
3. Finance & Ledger : Moteur de frais unifié et autoritaire (lib/finance/fees/fee-engine.ts), ledger à partie double atomique avec verrous pessimistes (lib/finance/ledger/ledger-engine.ts), délégation complète depuis les Server Actions.
4. Tournament Engine : Modèle de participant normalisé (NormalizedParticipant), moteur de prévisualisation pure (previewPhaseStructure), déduplication stricte des qualifiés inter-phases.
5. Server Actions : actions/phases.ts et actions/tournaments.ts décomposés en sous-modules thématiques propres avec façades rétrocompatibles garantissant 100% de compatibilité d'import.
6. UI, Composants & Hooks : Consommation directe des Server Actions et TanStack Query, élimination des calculs de classement inline dans les composants.
7. Exports & Identité de Marque : Exports enrichis (PDF, Excel, CSV, JSON) et harmonisation stricte de la marque "Games-Trafics".
8. Tests & Validation : 111/111 tests Vitest passés avec succès, 0 erreur TypeScript (tsc --noEmit).
```

---

## 18. CONCLUSION

Games-Trafics est une application **ambitieuse et déjà très riche** : le modèle de données couvre l'ensemble des besoins d'une plateforme esport/marketplace, les moteurs de tournoi et de comptabilité existent réellement, et l'infrastructure Next.js/Better Auth/Drizzle est moderne.

Le problème n'est pas l'absence de fonctionnalités, mais **la coexistence de plusieurs vérités** :

- deux moteurs de transaction, dont un non sécurisé ;
- trois systèmes de permissions ;
- deux handlers API ;
- deux dashboards boutique ;
- trois chemins d'upload ;
- deux compteurs de notifications ;
- un ancien audit qui décrit une application refondue qui n'existe qu'en partie.

La priorité n'est donc pas d'ajouter des écrans, mais de **réduire les chemins concurrents**, de **fermer les surfaces non authentifiées**, de **rendre la comptabilité cohérente de bout en bout**, et de **terminer les flux amorcés** (inscription payante, renouvellement VIP, upload réel, mise à jour PWA). C'est à ce prix que l'application passera d'un prototype avancé à une plateforme exploitable en production.
