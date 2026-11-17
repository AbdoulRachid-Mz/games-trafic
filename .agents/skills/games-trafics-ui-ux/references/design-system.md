# Design system — Games Trafics

## Stack et conventions réelles

| Domaine | Choix du projet |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styles | Tailwind CSS v4 (`@import "tailwindcss"`), `@theme inline`, `@custom-variant dark (&:is(.dark *))` |
| Composants UI | shadcn-style (style `radix-nova` dans `components.json`), Radix UI + `@base-ui/react` |
| Icônes | `lucide-react` |
| Thème | `next-themes` (`components/layout/ThemeToggle.tsx`), une seule source de vérité |
| Estado/App Shell | Zustand 5 — `stores/app-shell-store.ts` (`useAppShell`, sélecteurs spécialisés) |
| Animations | `framer-motion`, `motion`, `gsap`/`@gsap/react`, `canvas-confetti`, `tw-animate-css` |
| Graphiques | `recharts` + `components/ui/advanced-chart.tsx`, `chart.tsx` |
| Formulaires | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Notifications | `sonner` |
| Tests | `vitest`, `jsdom`, React Testing Library via `@vitejs/plugin-react` |

## Arborescence des composants

```
components/
├── ui/          # primitives shadcn : button, card, badge, input, tabs, dialog,
│                # sheet, drawer, table, skeleton, empty, typography,
│                # responsive-tabs, stats-card, advanced-table, ...
├── cards/       # cartes métier : product-card, shop-card, game-card,
│                # tournament-card, match-card, group-card, phase-card,
│                # member-card, team-card, transaction-card, bracket-node-card
├── shared/      # composants transverses : interaction-button, card-action-menu,
│                # responsive-filters, bulk-actions, confirmation-dialog,
│                # image-viewer, user-avatar, gradient-text, page-skeleton, ...
├── layout/      # app-shell, main-layout, top-middle, left-bar, right-bar,
│                # navbar, mobile-nav, breadcrumbs, floating-dock,
│                # FloatingActionButton, ThemeToggle, logo, footer
└── pages/       # composants spécifiques aux routes (tournaments/edition-detail, ...)
```

**Règle de recherche** : avant de créer quoi que ce soit, chercher dans cet ordre :
1. `components/ui` — équivalent générique ;
2. `components/cards` — équivalent métier ;
3. `components/shared` — comportement transverse ;
4. `components/layout` — structure / navigation.

`@rashwright/ui-mobile` n'est **pas utilisé** dans ce dépôt (vérifié). Ne pas l'introduire sans décision explicite.

## App Shell — mécanisme à préserver

- `components/layout/app-shell.tsx` synchronise **route, scroll, viewport** dans le store.
- `components/layout/main-layout.tsx` synchronise **sidebars**.
- `components/layout/top-middle.tsx` mesure **top-middle et breadcrumbs** via `ResizeObserver` / `getBoundingClientRect()`.
- `resolveRoute()` (config de route) reste la **source de vérité unique** de la configuration ; le store expose l'état observable, il ne la remplace pas.
- Distinction à respecter : **configuration route** / **état réel mesuré** / **override temporaire** / **état effectif**.
- `stores/app-shell-store.ts` expose : route, layout, scroll, viewport, sidebars, topMiddle, breadcrumbs, floating dock/FAB.
- `useAppShell()` retourne tout le store ; pour un usage au scroll, préférer un sélecteur spécialisé afin d'éviter les re-renders.

**Conséquence UI directe** : un onglet sticky doit calculer son `top` depuis `topMiddle.height` et `topMiddle.visible`, jamais depuis une constante `top-16` / `top-20`. Vérifier aussi breadcrumbs, visibilité au scroll, `z-index` et compact header.

## Floating Dock / FAB

- `components/layout/floating-dock.tsx` et `FloatingActionButton.tsx` : champs exposés au store.
- Ne pas masquer du contenu derrière ces éléments : prévoir un padding-bottom sur mobile et vérifier le chevauchement à chaque largeur.
- Les actions principales restent lisibles (pas de tout-en-icônes).

## Surfaces et élévations

- Base : `bg-card text-card-foreground`, bordure `ring-1 ring-foreground/10`, rayon `rounded-xl` (voir `design-tokens.md`).
- Ombres : utiliser les ombres légères du thème (`shadow-lg`, `shadow-primary/20`) avec modération.
- Glass / glow : réservés aux hero, reveals et zones premium (`bg-gt-hero`, `bg-gt-market`, `glow-primary`) — jamais sur les tables denses.
- Imbrication : maximum deux niveaux de `Card` ; au-delà, utiliser `Separator`, `div` sémantique ou une liste.

## Langage par catégorie (résumé)

- **Tournois** : compétition, statut, progression, actions organisateur vs participant.
- **Éditions** : pilotage, indicateurs financiers, phases/groupes/matchs, états de qualification.
- **Dashboards** : KPI, graphiques, activité récente, actions rapides — éviter l'empilement de cartes identiques.
- **Marketplace** : découverte, visuel produit, prix/badges, filtres, achat, vendeur.
- **Games** : univers gaming, illustrations, catégories, navigation vers produits/boutiques.

Voir `page-categories.md` pour le détail.

## Documentation projet existante

- `ANALYSIS.md` (analyse globale très détaillée), `ARCHITECTURE.md` (architecture, App Shell, dock), `docs/content/**/overview.md` (contenu MDX de documentation fonctionnelle).
- Ces fichiers sont des sources à consulter, pas des règles UI à copier aveuglément.
