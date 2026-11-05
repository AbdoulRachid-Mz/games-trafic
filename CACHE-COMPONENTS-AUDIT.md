# CACHE-COMPONENTS-AUDIT.md — Audit Next.js 16 Cache Components

## Contexte

- Next.js 16.4.3, App Router, React 19, Turbopack
- `cacheComponents: true`, `partialPrefetching: true`
- Better Auth, Neon/Drizzle, Server Actions

## Phase 1 — Points identifiés

### 1. Configurations incompatibles avec Cache Components

| Fichier | Problème |
|---|---|
| `app/(protected)/layout.tsx` | `export const dynamic = "force-dynamic"` incompatible avec `cacheComponents`. |
| `app/partners/page.tsx` | `export const dynamic = "force-dynamic"` incompatible avec `cacheComponents`. |

### 2. Accès aux API de requête

- `lib/auth/session.ts` : `getServerSession()` appelle `await headers()` puis `auth.api.getSession(...)`. Pendant le prerendering, `headers()` rejette. Le `catch` transformait l'erreur en `null` (absence de session), ce qui masquait les erreurs et polluait les logs (`HANGING_PROMISE_REJECTION`).
- `app/(protected)/layout.tsx` : appelait `getCurrentUser()` au top level pendant le prerender, déclenchant la cascade d'erreurs sur toutes les routes protégées.

### 3. Données publiques sans cache

- `app/partners/page.tsx` : appelait `getPartners(...)` (requête SQL Drizzle) directement pendant le rendu, sans `use cache`. Avec Cache Components, cette requête s'exécuterait au build (prerender) sans isolation explicite.
- `actions/partners.ts` : mutations (`createPartner`, `updatePartner`, `deletePartner`) ne réinvalidaient aucun cache.

### 4. Autres pages / layouts

- `app/chats/layout.tsx`, `app/chats/page.tsx` : client components utilisant `useSearchParams` déjà isolés dans `<Suspense>`. OK.
- `app/unauthorized/page.tsx` : client component, `searchParams` reçu en props (style Pages Router). À surveiller mais pas bloquant.
- `app/game-clips/client-page.tsx`, `app/shops/client-page.tsx` : client components. OK.
- Layouts admin : client components, pas d'accès serveur direct. OK.
- Aucune utilisation existante de `use cache`, `cacheLife`, `cacheTag` dans le projet.

### 5. Erreur non déterministe

- `app/partners/page.tsx` : `Next.js encountered the unstable value require('node:crypto').randomBytes(size)` pendant le prerender. Origine probable : dépendance transitivement non déterministe au build. Contourné en forçant le rendu dynamique initialement, puis résolu par cache + rendu dynamique conditionnel.

## Phase 2 — Auth et routes protégées

Voir `CACHE-COMPONENTS-FIXES.md`.

## Phase 3 — Pages publiques

Voir `CACHE-COMPONENTS-FIXES.md`.

## Problèmes restant éventuellement à traiter

- `app/unauthorized/page.tsx` utilise `searchParams` synchrones (Next 15+ attend une Promise). À migrer si des erreurs de typage apparaissent.
- D'autres pages publiques effectuant des requêtes SQL au top level (hors `partners`) n'ont pas encore été migrées vers `use cache`. À auditer au fil de l'eau.
- `getPartnerById` incrémente `viewCount` pendant la lecture (side effect) ; à isoler si la page détail est mise en cache.
- Vérifier que le build complet passe (en cours).
