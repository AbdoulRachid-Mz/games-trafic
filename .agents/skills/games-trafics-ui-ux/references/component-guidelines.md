# Guidelines des composants

## Cards et surfaces

### Base

`components/ui/card.tsx` fournit `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`.

- Rayon `rounded-xl`, ring `ring-foreground/10`, fond `bg-card`, `gap-4`, `py-2` (`gap-3`, `py-1` en `size="sm"`).
- `CardHeader` : `px-4` (ou `px-3` en small), grid avec `1fr auto` si `CardAction` présent.
- `CardFooter` : `bg-muted/50`, `border-t`, `p-4`, `rounded-b-xl`.
- Image première ou dernière → `rounded-t-xl` / `rounded-b-xl` automatique.

### Familles métier (`components/cards`)

| Famille | Composant | Variantes / comportements |
|---|---|---|
| Standard | `Card` (`ui`) | base, `size="default"|"sm"` |
| Statistique | `ui/stats-card.tsx` | KPI, trend, icône |
| Produit | `cards/product-card.tsx` | `grid`, `list`, `compact`/`mini`, `onView`, `onBuy`, likes/bookmarks, `CardActionMenu` |
| Boutique | `cards/shop-card.tsx` | visuel boutique, vendeur, statut |
| Jeu | `cards/game-card.tsx` | illustration, catégories, liens associés |
| Tournoi | `cards/tournament-card.tsx` | statut, jeu, participants, progression |
| Participant | `cards/member-card.tsx` | avatar, équipe, statut, actions |
| Match | `cards/match-card.tsx` | `viewMode`, `onView`, actions cohérentes desktop/mobile |
| Groupe | `cards/group-card.tsx` | `viewMode`, `onView`, ordre, actions |
| Phase | `cards/phase-card.tsx` | état de progression, liens |
| Transaction | `cards/transaction-card.tsx` | étapes, statut |
| Bracket | `cards/bracket-node-card.tsx` | nœud de tableau, état |

**Règles :**
- Une carte cliquable expose `onView` et `viewMode` cohérents ; le clic principal et le menu d'actions ne font pas la même chose.
- `CardActionMenu` (`components/shared`) regroupe les actions secondaires ; `e.stopPropagation()` obligatoire pour ne pas déclencher la navigation de la carte.
- Hover : `hover:shadow-lg` (liste) ou `hover:shadow-xl` + léger `y: -4` (grid). `active:scale-[0.99]` si cliquable.
- Mobile : une seule colonne, pas de grille écrasée ; en liste, empiler les métadonnées sous le titre.
- Éviter plus de deux cartes imbriquées.

## Headers de page

Structure recommandée (à adapter, pas à imposer aveuglément) :

```
[breadcrumbs]                 ← facultatif, mesuré via App Shell
[Titre + badge de statut]     ← Typography h2/h3 selon contexte
[Description courte]          ← facultative, theme="muted"
[ Actions principales | secondaires ]  ← flex-wrap, dropdown sur mobile
```

- Desktop : titre à gauche, actions à droite, alignement sur la baseline.
- Mobile : empiler titre puis actions ; `flex-wrap` et `gap-2` ; actions secondaires dans un `DropdownMenu` **sauf action critique**.
- Pas de titre tronqué (`truncate` uniquement si `title` accessible), pas de bouton qui déborde.
- Le header ne doit pas être inutilement haut ; pas de `h-*` fixe.
- Les tabs sticky qui suivent un header calculent leur offset depuis le store App Shell (`topMiddle.height`), pas depuis une constante.

## Boutons

Source : `components/ui/button.tsx` (`cva`).

| Taille | Hauteur | Usage |
|---|---|---|
| `xs` | `h-6` | dense, uniquement si contexte très contraint |
| `sm` | `h-7` | cards, tableaux |
| `default` | `h-8` | défaut |
| `lg` | `h-9` | actions principales de page |
| `icon*` | `size-6/7/8/9` | icône seule |

- Variantes : `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`.
- Une seule action principale `default` par zone ; les autres en `outline`/`ghost`.
- Icônes `size-4` par défaut (le composant normalise via `[&_svg:not([class*='size-'])]:size-4`).
- **Mobile** : viser au minimum 40–44 px de zone tactile pour les actions principales ; compenser le `h-8` par du padding ou `size="lg"` quand c'est une action critique. Voir `accessibility.md`.
- Libellé explicite ; si icône seule, `aria-label` obligatoire + tooltip sur desktop.

## Badges, avatars, icônes

- `Badge` (`ui/badge.tsx`) : `variant="outline"` pour les métadonnées, couleurs primary/secondary pour les statuts importants.
- Statuts : utiliser les helpers `utils/types-label.ts` (`productStatusLabel`, etc.) plutôt que des chaînes codées en dur.
- `Avatar` / `components/shared/user-avatar.tsx` : `AvatarFallback` systématique.
- Icônes : `lucide-react`, taille cohérente (`size-3` dans les badges, `size-4` dans les boutons, `size-5` dans les titres de card).
- Éviter les emoji comme icônes d'interface sauf tradition métier existante (plates-formes de jeux dans `product-card`).

## Inputs, selects, filtres

- `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup` de `@/components/ui`.
- Labels via `Label` ou `Typography variant="label" component="label" htmlFor=...`.
- États : `disabled` visible, erreur avec `aria-invalid` et message associé, focus ring `--ring`.
- Filtres : `components/shared/responsive-filters.tsx` et `components/pages/tournaments/edition-detail/matches-dashboard-filters.tsx` synchronisent l'URL. Respecter ce comportement : un changement de filtre réinitialise la pagination.
- Différencier **erreur de chargement** et **liste vide** ; ne pas afficher « Aucun résultat » si la requête a échoué.

## Tabs, navigation, tables

- `Tabs` / `tabs-2` / `ResponsiveTabs` (`ui/responsive-tabs.tsx`) : dropdown des onglets overflow au-delà du seuil, `swipeable` sur mobile.
- Tabs sticky : offset dynamique depuis le store App Shell ; tenir compte breadcrumbs, visibilité au scroll, `z-index`, header compact.
- `Table` : conteneur `overflow-x-auto`, `min-w-[720px]` pour les tableaux denses ; masquer les colonnes secondaires sous `sm` ; **vue cartes `md:hidden`** pour les données essentielles (ex. participants).
- `pagination.tsx` : contrôles cohérents, page courante lisible, disable aux bornes.

## Dialogs, sheets, drawers

- `Dialog` (desktop), `Sheet` / `Drawer` (mobile) ; `vaul` est installé.
- Largeur max adaptée ; `max-h-[90vh]` + scroll interne ; pas de dialog plus large que le viewport à 320 px.
- Fermeture par Échap, focus piégé, bouton de fermeture accessible.
- Actions de destruction passent par `confirmation-dialog.tsx` / `alert-dialog.tsx`.

## États d'interface — grille unique

| État | Règle |
|---|---|
| Loading | `Skeleton` / `page-skeleton.tsx` respectant la forme finale, jamais un spinner géant seul |
| Empty | `ui/empty.tsx` ou `shared/page-explanation.tsx` : icône + phrase + action si possible |
| Error | message distinct de l'empty state, avec action « Réessayer » |
| Success | `sonner` toast, discret, non bloquant |
| Disabled | opacité + `disabled`, explication si l'action est conditionnée par une règle métier |
| Hover | ombre/couleur légère, pas de déplacement brutal |
| Focus | ring visible (`focus-visible:ring-[3px]`), jamais `outline-none` sans替代 |
| Active / Selected | `data-[state=active]:bg-primary` ou fond `accent`, contraste suffisant |

## Feedback et micro-interactions

- Transitions 150–300 ms ; `ease-out` pour l'entrée.
- Micro-interactions utiles uniquement : hover card, bouton pressed, toast, skeleton→contenu.
- Ne pas animer les tableaux denses ni les listes longues au scroll.
- Respecter `prefers-reduced-motion` (voir `animation-guidelines.md`).
