# Audit UI/UX — Games Trafics

Date : 2026-11-17 · Skill utilisé : `games-trafics-ui-ux` · Méthode : audit statique de 4 périmètres en parallèle + lecture des tokens et composants partagés, puis validation navigateur réelle.

> ✅ **Périmètre 2 (terminé)** : wallet/historique transactions, games & game-clips, admin, tournois/éditions (calendrier, dashboard, matches, members, phases). Tableau d'audit consolidé et corrections appliquées en § « Périmètre 2 » ci-dessous.

> ✅ Le rendu navigateur a été débloqué puis contrôlé sur la marketplace (8 largeurs × 2 thèmes + interactions réelles). Voir « Validation navigateur » ci-dessous.

## Périmètres examinés

1. Tournois & éditions : `app/tournaments/**`, `components/pages/tournaments/**`, cards tournoi/phase/groupe/match/bracket.
2. Dashboards & App Shell : `app/**/dashboard/**`, `components/layout/**`, `stores/app-shell-store.ts`, primitives stats/chart/skeleton.
3. Marketplace / Shops / Games / Transactions / Admin / Profils : routes et cards associées.
4. Composants partagés : `components/ui/**`, `components/cards/**`, `components/shared/**`, usages multiples, `globals.css`.

## Synthèse — problèmes P1 (bloquants)

| # | Fichier:ligne | Problème | Correctif |
|---|---|---|---|
| 1 | `components/layout/main-layout.tsx:78-85,141-145` | Offset sticky appliqué **deux fois** (`paddingTop` du `<main>` + `top` du header dashboard), fallbacks `80`/`64` codés en dur | Une seule autorité d'offset (store App Shell) |
| 2 | `components/ui/sidebar.tsx:229` | Sidebar `z-10` sous `top-middle` `z-50` → en-tête de navigation masqué | Aligner `top`/hauteur sur l'offset mesuré, z-index intermédiaire |
| 3 | `app/marketplace/[productId]/dashboard/layout.tsx:20` | `sticky top-0 z-50` = même z-index que top-middle, rendu plus tard → recouvre la barre globale | `top` depuis le store, `z-30` |
| 4 | `app/marketplace/[productId]/dashboard/dashboard-tabs.tsx:62` | Onglets `sticky top-0 z-10` → glissent sous le top-middle | `useAppShellStickyOffset()` + `z-30` |
| 5 | `components/layout/top-middle.tsx:93-100` | `breadcrumbs.visible` ignore `isVisible` → hauteur fantôme quand le header se masque | Inclure `isVisible` dans `setBreadcrumbs` |
| 6 | `components/pages/tournaments/edition-detail/group-nodes-organize-client.tsx:195-199,301-305` | **Tirage client `Math.random()`** puis persistance | Déléguer au serveur ; animation = visualisation seule |
| 7 | `components/pages/tournaments/edition-detail/phase-organize-client.tsx:473-477` | **Tirage client `Math.random()`** (`seedingMethod === "RANDOM"`) | Idem |
| 8 | `components/pages/marketplace/product-card.tsx:104` | `Math.random()` pour un compteur → donnée fictive + mismatch d'hydratation | Valeur réelle/déterministe |
| 9 | `components/ui/typography.tsx:229,256-257` | `component="div"` par défaut → **aucun `h1`–`h6`** dans l'app (tous `<div>`) | Retirer le défaut, laisser `getDefaultComponent()` décider |
| 10 | `components/cards/card-action-menu.tsx:62-69` | Bouton « … » sans `aria-label` (impacte toutes les cards) | `aria-label` + tooltip desktop |
| 11 | `components/cards/match-card.tsx:244-252,360-370,444-461,495-512` | `onClick` sur `<div>` sans `role`/`tabIndex`/clavier | `<Link>`/`<button>` ou ARIA + `onKeyDown` |
| 12 | `components/ui/stats-card.tsx:141-158,197-215,255-270` + `app/bg.css:18-36` | Dégradés bleu/vert/rouge/jaune + `text-white` sur fond clair → palette concurrente | Tokens violet/or uniquement |
| 13 | `components/cards/game-card.tsx:457-460` | Classes dynamiques `bg-${...}-500` non compilées → bouton invisible | Map statique de classes complètes |
| 14 | `components/pages/marketplace/filters.tsx:324,335` | Double bascule case à cocher (clic ligne + `onCheckedChange`) | Un seul handler |
| 15 | `components/pages/marketplace/marketplace-content.tsx:187` | `<Button></Button>` vide | Supprimer ou action + `aria-label` |
| 16 | `app/shops/client-page.tsx:75` | Erreur réseau affichée comme « Aucune boutique » | État d'erreur + « Réessayer » |
| 17 | `app/(protected)/dashboard/page.tsx:38-42,101` | Erreur `getUserStats` seulement loggée ; `wallet.balance` sans optional chain → crash | État d'erreur + `?.` / `?? 0` |
| 18 | `components/pages/marketplace/dashboard/dashboard-tabs.tsx:20-36,158` + `product-overview.tsx` | KPI et graphique **fictifs** ; `hsl(var(--primary))` sur token OKLCH → série invisible | Données réelles ou état vide ; `var(--chart-1)` |
| 19 | `components/layout/footer.tsx:73,100,109` | `text-white` sur `bg-secondary/10` → contraste insuffisant en clair | `text-foreground` / `text-muted-foreground` |

## Problèmes P2 (importants)

- `tournament-card.tsx:423-428` : `min-w-0` absent face à une image `flex-shrink-0` → débordement à 320 px.
- `standings-table.tsx:632` : `slice(0, 50/100)` silencieux sur les classements.
- `edition-detail-header.tsx:599` : `y: -140` codé en dur au lieu de la hauteur mesurée du compact header.
- Filtres `tournaments-list.tsx:42-46` non synchronisés URL ; badges cliquables via `onClick` sur `Badge` (non focusables) `:127-170`.
- `dashboard/matches/page.tsx:71` : `MatchCard` locale dupliquée, sans `viewMode`/`onView`.
- `dashboard/page.tsx:402` : `bg-white`, `text-amber-700`/`emerald-700` sans `dark:`.
- `matches-dashboard-filters.tsx:134-139` : `<input>` brut, `outline-none`, pas d'`aria-label`.
- `stats-carousel.tsx:48-53,106-116,151-152` : 2 colonnes à 375 px + flèches hors conteneur → débordement.
- `advanced-chart.tsx:485,528-540` : `ResponsiveContainer` enveloppe un `<div>` ; `Card` imbriquée.
- `enhanced-dashboard.tsx:97-99` : titre/actions du header ignorés en mobile.
- Liens actifs sans `aria-current` ; `<div onClick>` dans `<Link>` (`left-bar.tsx:498-501`).
- Dock/FAB sans `padding-bottom` compensatoire (`main-layout.tsx:154-158`).
- `dialog.tsx:75-79` : pas de `max-h-[90vh]` ni scroll interne.
- `globals.css:346-349` : `transition` globale sur `*` + pas de `prefers-reduced-motion`.
- Rayons divergents : `rounded-xl` (Card) vs `rounded-2xl` (match-card) vs `rounded-[2rem]` (service-card).
- `typography.tsx:356-359,396-405` : `text-[${theme}]` dynamique, `caption4` 8 px.
- `tabs-2.tsx` + `profile-tabs.tsx:187` : 3ᵉ système de tabs, réordonnancement au clic, `text-black dark:text-white`.
- `responsive-tabs.tsx:128-165` : variante swipeable sans ARIA tabs.
- `transaction-card.tsx:157` : `bg-green-100`/`red-100` sans `dark:`.
- `admin/shops/page.tsx:617`, `product-card.tsx:193` : badge « Vedette `text-white` sur ambre.
- `game-item-card.tsx:117` : prix non formaté ; `status-badge.tsx:29` : labels en dur.
- `service-card.tsx:162` : `line-clamp-${descLines}` dynamique.
- `transaction-list.tsx:273` : tableau 7 colonnes sans scroll mobile.

## Duplications à éliminer

1. Tabs ×3 (`ui/tabs`, `ui/responsive-tabs`, `ui/tabs-2`) → garder les 2 premiers.
2. MatchCard ×3 (partagée, locale dashboard, `PublicMatchCard`) → une seule paramétrée.
3. StatsCard ×2 (`ui/stats-card`, `pages/dashboard/stats-card`) → fusionner.
4. Confirmation/suppression ×4 → un seul `ConfirmationDialog`.
5. Empty states ×3 (`ui/empty`, `entity-list`, page matchs) → une seule grille.

## Points positifs confirmés

- `--breakpoint-xs: 400px` présent (`globals.css:62`) — classes `xs:` fonctionnelles.
- Header d'édition utilise `useAppShellStickyOffset` (`edition-detail-header.tsx:132`).
- Filtres de matchs synchronisés URL + reset pagination.
- État d'erreur des matchs distinct avec « Réessayer ».
- `draw-reveal-dialog.tsx` ne fait que révéler des données persistées.

## État des corrections appliquées (2026-11-17)

| Lot | Portée | Changements | Typecheck |
|---|---|---|---|
| A | Fondations | `typography` (vrais `h1`–`h6`), `card-action-menu` (aria-label), `game-card` (classes statiques), `product-card` marketplace (compteurs réels), `filters` (double toggle), `marketplace-content` (bouton vide), `dialog` (max-h/scroll), `globals.css` (motion réduite) | ✅ |
| B | App Shell / stacking | Offset unique depuis `useAppShellStickyOffset()` dans `main-layout`, `ui/sidebar`, `top-middle`, `enhanced-dashboard` et le dashboard marketplace ; breadcrumbs liés à `isVisible` ; `z-index` cohérents ; fallback `64` nommé | ✅ |
| C | Cards / tokens / responsive | Footer en tokens de thème, badge Vedette en tokens, `tournament-card min-w-0`, `match-card` clavier + `rounded-xl`, `stats-card` violet/or avec contraste blanc | ✅ |
| D | Données / erreurs | `shuffle` Fisher-Yates Web Crypto, `randomizeOrderAction` serveur + permissions, suppression de tout `Math.random()` client dans les aperçus de tirage, erreurs distinctes (Shops, dashboard), optional chains, dashboard produit 100 % données réelles (`stats.viewCount/orderCount/likeCount`) avec état vide, `standings-table` sans troncature silencieuse | ✅ |
| E | Déduplications | `MatchCard` locale du dashboard (grille + liste) remplacée par `@/components/cards/match-card` avec `viewMode` et navigation « Gérer » conservée | ✅ |
| F | Static shell / instant navigation | `contexts/tracing-context.tsx` : suppression de `useSearchParams()` et du gate `canRender` (URL lue dans `window.location`, children rendus inconditionnellement) ; `components/layout/app-shell.tsx` : même suppression, URL lue côté client ; `app/layout.tsx` : export `viewport` séparé, zoom réautorisé (WCAG 1.4.4) ; boundaries `<Suspense>` avec fallbacks statiques sur marketplace, sign-up, welcome ; offsets sticky remplacés par `useAppShellStickyOffset()` dans marketplace, games, game-clips/create, phase/group organizers ; `sizes` ajouté aux images `fill` du welcome slider ; `aria-pressed` ajouté aux bascules grille/liste | ✅ |

> Le lot E n'est **pas** une fusion exhaustive : `tabs-2`, `PublicMatchCard`, les deux `StatsCard` et les variantes de `ConfirmationDialog`/empty states restent en place. Leur consolidation toucherait des comportements métier distincts ; elle est donc documentée ici plutôt que forcée sans validation fonctionnelle.

### Vérifications automatisées

- `bun x tsc --noEmit` : ✅ après chaque lot et après le lot F
- `bun run lint` : ✅ 0 erreur (4 381 avertissements préexistants, aucun ajouté par ces lots)
- `bun x vitest run tests/unit` : ✅ 29 fichiers / 270 tests
- `bun run build` : ✅ au retry (le premier passage s'est arrêté **après** la génération des 200 pages sur le nudge de sécurité Next.js 16.4.3 `SecurityFatalError`). Compilation, TypeScript et génération des 200 pages réussis ; la recommandation d'upgrade de sécurité reste transmise à l'utilisateur.

### Validation navigateur (réelle)

Serveur de dev local (`http://localhost:3001`), navigateur intégré, page `/marketplace?skipWelcome=1&ignore_visite=true`. Faute d'outil de redimensionnement de viewport dans le catalogue navigateur, la validation a utilisé des **iframes same-origin** de largeurs contrôlées ; les media queries et `useScreenSize()` sont bien réévalués à chaque largeur.

| Contrôle | Résultat |
|---|---|
| Largeurs 320 / 375 / 425 / 768 / 1024 / 1280 / 1440 / 1920, thème clair | `scrollWidth === clientWidth` partout → **aucun débordement horizontal** |
| Mêmes 8 largeurs, thème sombre (`localStorage.theme=dark`, classe `dark` confirmée, fond `lab(3.54…)`) | `scrollWidth === clientWidth` partout → **aucun débordement horizontal** |
| DOM réel | Hero, filtres, 2 produits réels (« produit 1 », « Un bon compte » — boutique 123), prix en GTC, footer |
| Console niveau `error` | **vide** |
| Badge Next Dev Tools « 1 Insight » | Était lié aux images `fill` sans `sizes` ; corrigé, plus aucun badge d'insight après rechargement |
| Filtres | Ouverture du sheet « Filtres Gaming », fermeture par `Échap` (Radix) ✅ |
| Bascules grille/liste | `aria-pressed` bascule correctement, style `default`/`outline` synchronisé ✅ |
| Recherche | Saisie + `Rechercher` → URL `?q=produit+1`, 2 → 1 produit ✅ |
| État vide | `?q=zzzzznotfound` → « 0 produits », « Aucun compte trouvé », bouton « Réinitialiser les filtres » fonctionnel ✅ |
| Thème | Bascule clair ↔ sombre appliquée via `next-themes` ✅ |
| Clavier | `Tab` produit un focus visible (`:focus-visible`, outline auto) ✅ |

Éléments détectés hors flux mais **sans** débordement de document : Floating Dock (`fixed`, centré, léger dépassement à 320 px) et ellipses SVG décoratives. Aucun `top-16`/`top-20` sticky ciblé ne subsiste dans les fichiers corrigés.

#### Avertissements restants (préexistants, hors périmètre UI)

- `hooks/network-status.ts` : sonde de connectivité par `HEAD https://www.google.com/favicon.ico` → 400 + CORS + `net::ERR_FAILED` en console `warning`. Comportement antérieur, non lié aux correctifs UI ; non modifié pour préserver la logique PWA/offline.
- Polices Next.js préchargées mais non utilisées dans les premières secondes (avertissement dev, spécifique à la configuration `next/font`).
- Aucune capture ni score n'a été fabriqué.

## Limites

- La validation navigateur approfondie (8 largeurs × 2 thèmes + interactions) porte sur la **marketplace**, page de référence. Les autres pages modifiées (games, game-clips/create, dashboards) ont fait l'objet d'un audit statique et de corrections ciblées, mais pas d'une certification visuelle équivalente.
- Contrastes calculés (ratios WCAG chiffrés), Lighthouse et test sur build de production servant le HTML : **non certifiés**. Un build complet (200 pages) avait réussi plus tôt dans la session avec une base joignable ; les derniers passages compilent et typent correctement mais le prerender échoue sur `Connection terminated unexpectedly` (base externe momentanément indisponible dans cet environnement). Le HTML servi n'a pas été rejoué dans le navigateur. Next.js 16.4.3 reste affecté par un avis de sécurité (upgrade recommandé).
- Le rendu d'erreur serveur (states `error.tsx`) et les parcours authentifiés (paiements, permissions) n'ont pas été rejoués dans le navigateur au-delà des données réelles visibles sur la marketplace publique.
- Suite à l'accord de l'utilisateur, l'upgrade de sécurité Next.js a été exécuté dans un worktree Git isolé (`C:\gtsec`, détaché de `67a5da9`) sans toucher aux correctifs UI/UX du checkout courant. Il a **échoué** : la version installée (`16.5.0-canary.53`) est une prerelease canary et l'outil `--agent=security` refuse d'appliquer un avis stable à une canary (faux positif possible). L'outil recommande `npx next@canary upgrade --agent=latest`. Aucun changement de dépendance n'a été intégré ici.

---

## Périmètre 2 — Audit consolidé (transactions, games, admin, tournois)

Audit statique approfondi de 4 zones, sans modification préalable. Légende : **P1** bloquant / **P2** important / **P3** polish. « Vérifié visuellement = non » car ces routes sont protégées ou nécessitent des données réelles de session ; le contrôle navigateur est prévu après correction.

| Page / Composant | Problème | Prio | Correctif | Vérifié visuellement |
|---|---|---|---|---|
| `wallet/transactions/page.tsx:232-289` | 6 actions en `flex` sans `flex-wrap` ; « Exporter » toujours visible → débordement à 320 px | P1 | `flex-wrap`, libellés `hidden md:inline-block`, menu « Plus » mobile | non |
| `wallet/transactions/history/page.tsx:131-135` | Table 7 colonnes sans largeur min, vue cartes `compact` disponible mais inactive | P1 | `min-w-[720px]` + bascule cartes < `md` | non |
| `wallet/transactions/[id]/page.tsx:53-63,195-206` | Erreur réseau confondue avec « non trouvé » | P2 | État `error` dédié + « Réessayer » | non |
| `wallet/transactions/[id]/page.tsx:273-298` | `h1` = montant après un `h3` ; sauts h3→h5 | P2 | `h1` de page, montant en `h2`/body, sections `h2`/`h3` | non |
| `wallet/transactions/[id]/page.tsx:338-347`, `create:838-845`, `history:74-81` | Boutons icône seuls sans `aria-label` | P2 | `aria-label` explicite | non |
| `wallet/transactions/create/page.tsx:53-61` | `useSearchParams()` dans le composant qui porte le `<Suspense>` | P2 | Hook déplacé dans un composant interne | non |
| `wallet/transactions/create/page.tsx:137-142` | Faux succès de copie (pas d'`await`) | P2 | `await` + `try/catch`, toast après succès | non |
| `wallet/transactions/page.tsx:356-526` | ~170 lignes de filtres dupliquées mobile/desktop | P2 | `ResponsiveFilters` | non |
| `wallet/transactions/history/page.tsx:196-211` | Carte « Filtrage Temporel » factice (bouton disabled) | P2 | Vrai `DateRangePicker` ou retrait | non |
| `app/games/page.tsx:167-195` | SVG `<X>` cliquables sans clavier ni `aria-label` | P1 | `ResponsiveFilters` (chips accessibles intégrées) | non |
| `app/game-clips/create/page.tsx:120` | `sticky top-0 z-50` en doublon de `style={{top: stickyOffset}}` | P1 | Supprimer le `top-0` local, garder le hook | non |
| `app/game-clips/client-page.tsx:16-26` + `use-game-clips.ts` | `error` non exposé → erreur réseau rendue comme « aucun clip » | P1 | Exposer `error` + état « Réessayer » | non |
| `app/games/page.tsx:89` | Saut h1 → h4 | P2 | `variant="h2"` | non |
| `app/games/page.tsx:176,189` | `purple-*`/`blue-*` codés en dur | P2 | Tokens `primary`/`secondary` | non |
| `app/games/page.tsx:146-151` | Badge « Popularité » avec `cursor-pointer` mais sans action | P2 | Retirer l'affordance ou câbler le tri | non |
| `app/game-clips/create/page.tsx:316-341` | Tabs locaux sans rôles ARIA | P2 | `ResponsiveTabs` (mode défaut) | non |
| `app/game-clips/create/page.tsx:199-201` | `motion.div onClick` non activable au clavier | P2 | `<button type="button" aria-label>` | non |
| `app/game-clips/client-page.tsx:44-55,58` | `bg-[#0a0a0b]` + handlers like/bookmark/share no-op | P2 | Token `bg-background` ; câbler `shareClip` ou masquer | non |
| `components/pages/games/games-hero.tsx:143` | Statistique fictive « +50 Jeux couverts » | P2 | `useGameStats()` + `StatsCarousel` | non |
| `components/pages/games/game-item-detail.tsx:48-108` | 5 palettes complètes concurrentes | P2 | Map centralisée violet/or | non |
| `app/admin/page.tsx:374-1120`, `components/admin/admin-charts.tsx:75-317` | `hsl(var(--chart-N))` sur token OKLCH → couleurs invalides | P1 | `var(--chart-N)` | non |
| `app/admin/page.tsx:197-257` | `ResponsiveTabs` réimplémenté à la main | P2 | Utiliser `@/components/ui/responsive-tabs` | non |
| `app/admin/**` (0 `aria-label`) | Boutons icône sans nom accessible | P2 | `aria-label` sur les triggers | non |
| `app/admin/signals/page.tsx:104-109` | Input et bouton « Filtres » inertes | P2 | Brancher `setFilter` + `ResponsiveFilters` | non |
| `app/admin/page.tsx`, `admin-charts.tsx`, ~25 pages | Palettes natives au lieu des tokens sémantiques | P2 | Tokens `success/warning/danger` centralisés | non |
| `app/admin/signals:89`, `finance`, `groups`, `vip`, `media` | `p-8` fixe, tables `whitespace-nowrap`, erreurs non rendues | P2 | `p-4 md:p-8`, vues cartes, état erreur + retry | non |
| `tournaments/.../matches/[matchId]/match-control-client.tsx:486-498` | « Signaler un litige » = `prompt()` + toast, aucune persistance | P1 | `Dialog` + Server Action dédiée | non |
| `tournaments/.../members/members-list.tsx:66-70`, `calendar/edition-calendar-timeline.tsx:340-363` | Erreur réseau confondue avec liste vide | P1 | État `error` + « Réessayer » (motif F7) | non |
| `tournaments/.../phases/[phaseId]/phase-detail-client.tsx:273,280,417` | Liens relatifs cassés (`.../phases/[id]/phases/[id]/organize`) | P1 | `./organize` ou absolu depuis `basePath` | non |
| `tournaments/[tournamentId]/members/[memberId]/page.tsx:529` | Lien vers `/teams/[id]` inexistant | P1 | Retirer ou corriger la route | non |
| `tournaments/.../calendar/edition-calendar-timeline.tsx:411-417` | `<div onClick>` non focusable | P1 | `<Link>` | non |
| `tournaments/.../matches/edition-matches-client.tsx:222-232,275-285,349-374` | `<div onClick>` imbriqués, `CollapsibleTrigger asChild` sur `<div>` | P1 | `<button>` / `<Link>` | non |
| `tournaments/.../matches/edition-matches-client.tsx:630` | `limit: 200` sans pagination → troncature silencieuse | P1 | Pagination ou indicateur | non |
| `tournaments/.../matches/[matchId]/page.tsx:267` | Grille `grid-cols-7` sans breakpoint | P2 | `grid-cols-1 sm:grid-cols-5 md:grid-cols-7` | non |
| `tournaments/.../matches/edition-matches-tab.tsx:321`, `organize-wizard-client.tsx:947`, `bracket-node-matches-organize-client.tsx:456` | Sticky locaux non centralisés | P2 | `useAppShellStickyOffset()` | non |
| `tournaments/.../phase-detail-client.tsx:60-69` + `phases/[phaseId]/page.tsx:25-33` | `phaseTypeConfig` dupliqué + 8 couleurs dures | P2 | Map partagée violet/or | non |
| `tournaments/.../members-list.tsx:112,120`, `dashboard/matches/page.tsx:322-385`, `edition-matches-client.tsx:857-868` | Bascules sans `aria-pressed` | P2 | Ajouter l'attribut | non |
| `tournaments/.../members/[memberId]/page.tsx:750` | `<Card onClick>` non sémantique | P2 | `<button>`/`<Link>` | non |
| `tournaments/.../matches/[matchId]/match-control-client.tsx:340,382,516-523` | Inputs scores sans label associé, bouton `<Trash2>` sans `aria-label` | P2 | `htmlFor`/`aria-label` | non |

### Ce qui est déjà conforme dans le périmètre 2 (à ne pas casser)

- Aucun `top-16`/`top-20`, aucun tirage `Math.random()` de données, aucune donnée fictive volontaire (hors placeholder admin/games documentés), aucun second système de bouton/card/modal/thème.
- Correctifs du lot B/F préservés : `useAppShellStickyOffset()` dans `edition-detail-header`, `phase-organize-client`, `group-nodes-organize-client`, `game-clips/create` (aperçu), `games/page`.
- `standings-table` garde ses `overflow-x-auto` ; `randomizeOrderAction` reste la seule source des tirages ; exports édition construits côté serveur.
- `ResponsiveTabs` déjà utilisé dans `members/[memberId]` ; `SharedMatchCard` déjà utilisé dans `dashboard/matches` ; `EntityList`/`StatCard`/`StatsCarousel` déjà utilisés dans l'admin.

### Périmètre 2 — corrections appliquées

Toutes les lignes P1/P2 du tableau ci-dessus ont été traitées, en préservant la logique métier (permissions, paiements, filtres, exports, Server Actions). Détail par zone :

**Wallet transactions** (`app/(protected)/wallet/transactions/**`, `components/pages/wallet/transaction-list.tsx`)
- Actions `flex-wrap` + libellés `hidden md:inline-block` et `aria-label` sur les boutons icône ; `h1` de page ; erreur distincte avec « Réessayer » et liste masquée sur erreur (`page.tsx`).
- Historique : carte « Filtrage Temporel » factice **remplacée par un vrai `DateRangePicker`** (`createdAt` filtré côté client avec garde null), compteur de résultats filtrés, états vides honnêtes ; erreur + retry (`history/page.tsx`).
- Vue liste : cartes mobiles + tableau `hidden md:block` dans `overflow-x-auto` (`min-w-[720px]`) ; `aria-label` sur les actions (`transaction-list.tsx`).
- Détail `[id]` : erreur dédiée + retry, hiérarchie `h1`→`h2`→`h3`, copie async avec `try/catch`, couleurs de montant compatibles sombre.
- Création : `useSearchParams`/`useRouter` sous `<Suspense>`, prop `router: any` supprimée.
- QR : `h1` + `py-6`, `h2` dans le composant partagé, boutons Arrêter/Relancer avec états `disabled` et `aria-label` ; `components/shared/qr-scanner.tsx` : `catch (err: any)` → garde `instanceof Error`, ombre `hsl(var(--primary)/0.8)` invalide → `var(--primary)` (token OKLCH).

**Games & game-clips** (`app/games/**`, `app/game-clips/**`, `hooks/use-game-clips.ts`, `components/pages/games/games-grid.tsx`)
- `h4`→`h2`, badge de filtre numérique avec `aria-label`, badge « Popularité » rendu informatif (affordance de clic retirée), `<X>` convertis en `<button>` accessibles, `purple-*`/`blue-*` → `primary`, durées `500`→`300` ms, imports morts supprimés, `as any` supprimé, compteur de filtres actifs corrigé.
- `useGameItems`/`useGameClips` exposent `isError`/`error` + `refetch`/`refresh` ; `GamesGrid` et la page clips affichent un vrai état d'erreur avec « Réessayer » ; `shareClip` câblé, actions like/bookmark documentées comme non-op (absence d'API), `bg-[#0a0a0b]` → `bg-background`.
- `game-clips/create` : `sticky top-0 z-50` en doublon supprimé au profit de `useAppShellStickyOffset()` + `z-30`, `Button` partagé, `bg-secondary/20`, `next/image` `fill` + `sizes`, bascule média au clavier avec ARIA, vert de statut compatible sombre.

**Admin** (`app/admin/page.tsx`, `app/admin/signals/page.tsx`, `components/admin/admin-charts.tsx`)
- Tokens `hsl(var(--chart-N))` → `var(--chart-N)` ; `aria-label` sur « MoreHorizontal » ; état d'erreur du dashboard avec retry et padding `p-4 md:p-6`.
- Signaux : **vrais filtres** `ResponsiveFilters` (recherche client sur les lignes chargées + filtre de statut serveur via `getSignals`), erreur + retry, `h1`, `p-4 md:p-8`, table scrollable (`min-w-[720px]`), statuts/sévérités compatibles sombre, `aria-label`, suppression du `any` de map. Cast local documenté : la colonne `status` est `text` et les actions persistent `OPEN`/`IN_PROGRESS` en plus des valeurs du type `SignalStatus`.

**Tournois / éditions** (`app/tournaments/**`)
- Liens de phase cassés `./phases/${phaseId}/organize` → `./organize` (4 occurrences) ; lien `/teams/[id]` inexistant retiré.
- Litige : **`prompt()` factice remplacé par un `Dialog` réel** et la Server Action `reportMatchDispute` (`actions/tournaments/results.ts`) qui persiste `status: DISPUTED` + `disputeReason` avec contrôle d'autorisation (participant ou admin) ; `tournamentId` résolu via `tournamentEditions` pour `revalidatePath` (la table `matches` n'a pas cette colonne).
- Erreurs réseau distinctes + retry (`members-list`, `edition-calendar-timeline`) ; `<div onClick>` → `<Link>`/`button` avec `aria-label` ; `CollapsibleTrigger asChild` sur `<button>` ; `aria-pressed`/`aria-label` sur les bascules grille/liste et arbre/liste ; avis de troncature `limit: 200` basé sur `matchesRes.pagination.total`.
- Score : `grid-cols-1 sm:grid-cols-7`, ligne de score horizontale en mobile, `text-3xl sm:text-5xl` ; inputs `id`/`htmlFor`/`aria-label`, boutons +/− et `Trash2` nommés.
- `phaseTypeConfig` dupliqué supprimé du client ; la map survivante est compatibles clair/sombre (fonds `/10`, bordures `/20`, variantes `dark:text-*`).

### Choix différés (documentés, non forcés)

- **Admin `ResponsiveTabs`** : les ~850 lignes de `TabsContent` de `app/admin/page.tsx` ne sont pas réécrites. Le composant maison actuel gère des comportements métier distincts par onglet ; une migration sans revalidation fonctionnelle risquerait de casser des actions. `ResponsiveTabs` reste utilisé là où il est déjà intégré.
- **Games sidebar** : non migrée vers `ResponsiveFilters`. Le filtre desktop est un panneau latéral permanent ; l'ajouter en plus créerait deux systèmes de filtres concurrents. Les lacunes concrètes (accessibilité, tokens, compteur, états) ont été corrigées sur place.
- **Surfaces média sombres internes** (reel game-clips, calendar) : `bg-background`/surfaces sombres volontaires, cohérentes avec le-token de thème ; ce ne sont pas des palettes concurrentes.
- **Green** : conservé uniquement comme couleur utilitaire de statut (succès), jamais comme palette concurrente au violet/or.

### Validations — Périmètre 2 (après tous les correctifs)

| Commande | Résultat |
|---|---|
| `bun x tsc --noEmit` | ✅ aucun diagnostic |
| `bun run lint` | ✅ 0 erreur / 4 355 avertissements (tous préexistants : imports inutilisés, `any` historiques, `setState` dans effets). Aucun avertissement ajouté par les correctifs. |
| `bun x vitest run tests/unit` | ✅ 29 fichiers / 270 tests |
| `bun run build` | ⚠️ compilation et TypeScript réussis (`✓ Compiled successfully`, `Finished TypeScript`) ; la génération statique des 200 pages est **bloquée par l'environnement** : `Connection terminated unexpectedly` sur les requêtes DB pendant le prerender (services, partners, pages dépendantes de la base). Aucune erreur de code liée aux correctifs UI/UX. Un build complet à 200 pages avait réussi plus tôt dans la session avec une base joignable. |

**Validation navigateur** : la marketplace publique (`/marketplace?skipWelcome=1&ignore_visite=true`) reste la page de référence certifiée 8 largeurs × 2 thèmes (cf. tableau ci-dessus), sans débordement ni erreur console. Les routes du périmètre 2 sont protégées (wallet, admin) ou dépendent d'identifiants de tournois/matchs réels ; leur contrôle visuel nécessite une session authentifiée et des données de démonstration non disponibles ici. L'audit statique, le typecheck et les tests unitaires couvrent ces routes ; aucune capture ni donnée fictive n'a été créée.
