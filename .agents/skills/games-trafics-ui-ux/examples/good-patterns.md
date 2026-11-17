# Patterns à suivre (tirés du code réel)

Chaque exemple ci-dessous existe dans le dépôt. Le réutiliser ou s'en inspirer plutôt que d'inventer.

## 1. Card de domaine avec `viewMode` + `onView`

`components/cards/product-card.tsx` :

```tsx
export function ProductCard({ item, viewMode = "grid", onView, onEdit, onDelete, ... }) {
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(product);
    else if (activeAction === "edit" && onEdit) onEdit(product);
    else handleView();
  };
  ...
  <Card onClick={handleMainAction} className="group cursor-pointer ...">
```

À retenir : un seul point d'entrée lisible, `viewMode` explicite, menu d'actions séparé avec `stopPropagation`.

## 2. Menu d'actions isolé du clic de card

`components/cards/product-card.tsx` :

```tsx
<div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
  <CardActionMenu ... />
</div>
```

À retenir : la navigation de la carte ne se déclenche pas quand on ouvre le menu.

## 3. Table dense + vue cartes mobile

`components/pages/tournaments/edition-detail/participants-management-client.tsx` :

```tsx
<Table className="hidden md:table min-w-[720px]"> ... </Table>

{/* Vue cartes pour petits écrans */}
<div className="md:hidden space-y-3 p-3">
  {filteredParticipants.map((reg) => (
    <Card key={reg.id} className="p-3 space-y-2"> ... </Card>
  ))}
</div>
```

À retenir : mêmes données, deux présentations ; colonne téléphone masquée sous `sm`.

## 4. Filtres synchronisés URL

`components/pages/tournaments/edition-detail/matches-dashboard-filters.tsx` :

```tsx
const router = useRouter();
const searchParams = useSearchParams();
const pathname = usePathname();

const update = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString());
  if (value) params.set(key, value); else params.delete(key);
  params.delete("page"); // reset pagination
  router.push(`${pathname}?${params.toString()}`);
};
```

À retenir : l'URL est la source de vérité des filtres ; la pagination est réinitialisée.

## 5. Tabs sticky pilotés par le store App Shell

`components/pages/tournaments/edition-detail/edition-detail-header.tsx` :

```tsx
const { topMiddle } = useAppShell();
const stickyTop = topMiddle.visible ? topMiddle.height : 0;

<div className="sticky z-30" style={{ top: stickyTop }}>
```

À retenir : aucune constante `top-16` / `top-20` ; le `z-index` et la visibilité sont pris en compte.

## 6. Dashboard avec vraies relations

`app/.../dashboard/matches/page.tsx` utilise `getMatchesWithParticipants` (pas un simple `getMatches`) car `MatchCard` attend `participant1.member`, `participant2.member`, phase et groupe.

À retenir : la carte définit le contrat de données ; la page fournit la requête adaptée. Erreur ≠ liste vide.

## 7. Tokens sémantiques et radius dérivés

`components/ui/card.tsx` / `button.tsx` / `app/globals.css` :

```tsx
// Card
"ring-foreground/10 bg-card text-card-foreground rounded-xl ..."

// Button
"focus-visible:ring-ring/50 rounded-lg border border-transparent ..."

// @theme inline
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

À retenir : une famille = un rayon ; couleurs issues des tokens, pas de `#hex` local.

## 8. Animation au service d'une structure persistée

`components/pages/tournaments/edition-detail/draw-reveal-dialog.tsx` + `actions/phases/structure.ts` + `lib/tournaments/structure-engine.ts` :

- la structure est générée et persistée serveur ;
- l'animation ne fait que révéler visuellement cet état ;
- pas de tirage client.

## 9. État responsive intégré à Typography

`components/ui/typography.tsx` : `h1` = `text-4xl sm:text-5xl md:text-6xl`.

À retenir : la hiérarchie est responsive par construction ; ne pas la surcharger avec un `text-5xl` fixe.

## 10. Export documentaire centralisé

`actions/documents.ts` + `downloadDocument` ; `ShopExportButton` là où déjà utilisé.

À retenir : ne pas réimplémenter la génération de document dans une page.
