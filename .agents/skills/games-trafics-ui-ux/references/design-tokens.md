# Design tokens — valeurs réelles

Source : `app/globals.css`. Ne pas créer de palette concurrente. Les valeurs ci-dessous sont celles du dépôt au moment de la rédaction ; en cas de divergence, **le CSS fait foi**.

## Identité chromatique

Le thème est **violet + or**. Le vert n'est qu'un utilitaire de statut.

| Rôle | Light | Dark | Usage |
|---|---|---|---|
| `--primary` | `oklch(0.55 0.25 280)` | `oklch(0.62 0.26 280)` | Action principale, liens, accent violet |
| `--primary-foreground` | `oklch(0.98 0.01 270)` | `oklch(0.98 0.01 260)` | Texte sur primary |
| `--secondary` | `oklch(0.85 0.16 90)` | `oklch(0.78 0.18 90)` | Accent or, badges secondaires |
| `--accent` | `oklch(0.85 0.16 90)` | `oklch(0.78 0.18 90)` | Survol/sélection (identique à secondary) |
| `--secondary-foreground` | `oklch(0.22 0.04 90)` | `oklch(0.18 0.03 90)` | Texte sur or |
| `--background` | `oklch(0.99 0.005 280)` | `oklch(0.16 0.03 270)` | Fond page |
| `--foreground` | `oklch(0.18 0.03 265)` | `oklch(0.96 0.01 260)` | Texte principal |
| `--card` | `oklch(0.99 0.005 280)` | `oklch(0.20 0.04 270)` | Fond surfaces |
| `--muted` | `oklch(0.96 0.01 280)` | `oklch(0.26 0.03 270)` | Fonds secondaires |
| `--muted-foreground` | `oklch(0.55 0.03 265)` | `oklch(0.7 0.02 270)` | Texte secondaire |
| `--border` / `--input` | `oklch(0.9 0.01 270)` | `oklch(1 0 0 / 10%)` | Bordures, champs |
| `--ring` | `oklch(0.55 0.25 280)` | `oklch(0.62 0.26 280)` | Focus |
| `--destructive` | `oklch(0.6 0.25 30)` | `oklch(0.70 0.20 25)` | Erreur, suppression |
| `--sidebar*` | voir `:root` / `.dark` | voir `:root` / `.dark` | Navigation latérale |

Charts : `--chart-1` … `--chart-5` sont des déclinaisons violettes (hues 275→295). Les respecter pour les graphiques.

### À propos du « vert »

Aucun token vert n'existe. Les usages observés sont utilitaires et doivent rester cohérents, centralisés si possible :
- `Typography` theme `success` → `text-green-600 dark:text-green-500` ;
- badges de statut produit `NON_VENDU` → `text-emerald-600`, `VENDU` → `text-gray-600` ;
- icône de copie réussie `text-green-500`.

Ne pas généraliser ces verts en couleur de marque, ne pas ajouter `--green` au thème sans décision design validée.

## Rayons (`--radius: 0.45rem`)

Dérivés dans `@theme inline` :

| Token | Valeur | Utilisation recommandée |
|---|---|---|
| `--radius-sm` | `calc(--radius - 4px)` | petits éléments, chips denses |
| `--radius-md` | `calc(--radius - 2px)` | inputs, petits boutons |
| `--radius-lg` | `--radius` (0.45rem) | boutons, badges |
| `--radius-xl` | `+4px` | **Card, image de card, header de card** |
| `--radius-2xl` | `+8px` | panels, dialogs |
| `--radius-3xl` / `4xl` | `+12px / +16px` | hero, blocs décoratifs uniquement |

Règle : une famille de cartes garde le même rayon. `Card` = `rounded-xl` ; images en premier/dernier enfant = `rounded-t-xl`/`rounded-b-xl`. Les exceptions doivent être justifiées (ex. pastille circulaire `rounded-full`).

## Typographie

Implémentée par `components/ui/typography.tsx` (variantes responsives intégrées) :

| Variante | Mobile → Desktop |
|---|---|
| `display` | `text-5xl` → `text-7xl` |
| `h1` | `text-4xl` → `text-6xl` |
| `h2` | `text-3xl` → `text-5xl` |
| `h3` | `text-2xl` → `text-4xl` |
| `h4` | `text-xl` → `text-3xl` |
| `h5` | `text-lg` → `text-2xl` |
| `h6` | `text-base` → `text-xl` |
| `lead` | `text-lg` → `text-2xl` |
| `body-lg` | `text-base` → `text-lg` |
| `body-base` | `text-sm` → `text-base` |
| `body-sm` | `text-xs` → `text-sm` |
| `label` / `small` / `muted` | `text-xs` → `text-sm` |
| `caption1` … `caption4` | 14 → 8 px (usages très denses) |

- Utiliser `Typography` plutôt que des classes `text-*` dispersées quand la hiérarchie est concernée.
- `theme="muted"` / `"primary"` / `"danger"` / `"success"` / `"warning"` ; éviter les couleurs hex arbitraires.
- `gradient`, `animated`, `threeD`, `withLoupe` : effets premium, à réserver aux titres hero / pages de célébration.

## Breakpoints

Tailwind v4 : `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.
Breakpoint personnalisé déclaré : **`xs` = 400px** (`--breakpoint-xs: 400px`) — indispensable : sans lui, les classes `xs:` ne s'appliquent jamais.

Largeurs de validation imposées : **320, 375, 425, 768, 1024, 1280, 1440, 1920**.

## Espacement (convention déduite des composants)

- Padding interne de card : `p-4` (desktop), `p-3` en compact/`data-[size=sm]`.
- Gaps de section : `gap-3` (mobile) → `gap-4` / `gap-6` (desktop).
- Headers de page : éviter les hauteurs fixes ; laisser le contenu respirer mais rester compact.
- Tableau dense : conteneur `overflow-x-auto` + `min-w-[720px]`, jamais de réduction de police jusqu'à l'illisibilité.

## Classes globales utiles

`no-scrollbar` / `hide-scrollbar`, `bg-gt-hero`, `bg-gt-market`, `glow-primary`, `gold-highlight`, `preserve-3d`, `backface-hidden`, `rotate-y-180`, `animate-float`, `animate-gradient`, `modal-content`, `skeleton-pulse`, `page-transition-*`, `transaction-*`.

Attention : un global `transition: background-color 0.3s, border-color 0.3s` est appliqué à `*` dans `globals.css` ; ne pas doubler ces transitions sur chaque composant.
