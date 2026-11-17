# Responsive — règles opérationnelles

## Largeurs à valider (obligatoire)

`320` · `375` · `425` · `768` · `1024` · `1280` · `1440` · `1920`

Breakpoints Tailwind v4 : `xs` 400 (custom), `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

## Grilles

- Cartes : `grid-cols-1` sur mobile, `sm:grid-cols-2`, `lg:grid-cols-3` ; ajouter `xl:grid-cols-4` seulement si la carte est compacte.
- Éviter les grilles fixes `grid-cols-3` dès 375 px.
- KPI dashboards : `grid-cols-2` acceptable à 375 px **si** le contenu est court ; sinon 1 colonne.
- `min-w-0` sur les enfants flex qui contiennent du texte, sinon `truncate` ne fonctionne pas et la grille déborde.
- Tester avec un titre long et un libellé long : c'est là que les débordements apparaissent.

## Tables

- Conteneur `overflow-x-auto` + `min-w-[720px]` pour les tableaux denses.
- Colonnes secondaires masquées sous `sm` (ex. téléphone dans `participants-management-client.tsx`).
- **Vue cartes mobile** (`md:hidden`) pour les informations essentielles : même données, pas de données fictives.
- Ne jamais réduire la police sous 12 px pour « faire tenir ».
- En-tête de colonne triable avec indicateur visuel et `aria-sort`.

## Headers

- `flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`.
- Actions : `flex flex-wrap gap-2` ; overflow dans un `DropdownMenu` sur mobile.
- Une seule action principale `default` ; les secondaires en `outline`/`ghost`.
- Titre : `Typography` avec variante responsive intégrée ; pas de `h-*` fixe sur le header.

## Tabs et filtres

- Utiliser `ui/responsive-tabs.tsx` (dropdown overflow, mode `swipeable` mobile) ou le système de tabs sticky de la page quand il dépend de l'App Shell.
- Tabs sticky : offset calculé depuis `topMiddle.height` / `topMiddle.visible` du store, **pas** `top-16`/`top-20`.
- Vérifier : breadcrumbs, visibilité au scroll, `z-index`, compact header.
- Filtres : `shared/responsive-filters.tsx` ; synchronisation URL ; reset pagination au changement de filtre.
- Sur mobile, les filtres se replient dans un `Sheet`/`Drawer` avec un bouton « Filtres (n) » indiquant le nombre actif.

## Dialogs, sheets, drawers

- `max-w-[calc(100vw-2rem)]`, `max-h-[90vh]`, `overflow-y-auto` interne.
- Sur mobile : préférer `Drawer`/`Sheet` (vaul) à un dialog centré.
- Les boutons d'action restent atteignables sans scroll impossible (pied de drawer fixe si nécessaire).
- Tester à 320 px avec clavier virtuel : le contenu ne doit pas disparaître sous le clavier.

## Floating Dock / FAB

- Le dock est responsive (`floating-dock.tsx`, `FloatingActionButton.tsx`) et exposé au store App Shell.
- Prévoir `pb-24` (ouéquivalent selon la hauteur mesurée) sur les longues listes mobile pour éviter le chevauchement.
- Ne pas fixer une hauteur arbitraire : se baser sur les mesures du store quand disponibles.
- Sur desktop, vérifier que le dock ne recouvre pas les actions de card en bas de page.

## Contenu masqué / débordements

Checklist rapide à chaque largeur :
- [ ] `document.documentElement.scrollWidth <= window.innerWidth`
- [ ] aucun texte coupé sans `title`
- [ ] aucune carte avec hauteur plus petite que son contenu
- [ ] images avec `object-cover` et `sizes` corrects
- [ ] dock/FAB ne recouvrent pas la dernière ligne de contenu
- [ ] sticky tabs visibles et non superposés
