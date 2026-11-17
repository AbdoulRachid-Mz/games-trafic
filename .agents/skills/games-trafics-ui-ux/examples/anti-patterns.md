# Anti-patterns observés — à corriger, pas à reproduire

## 1. Couleurs codées en dur dans une card métier

`product-card.tsx` contient entre autres :

```tsx
statusConfig = { NON_VENDU: "bg-emerald-500/10 text-emerald-600 ..." }
gameCategoryStyles = { rpg: "bg-purple-500/10 text-purple-600 ..." }
<Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white ...">
```

Problème : `text-white` sur un dégradé clair, palette parallèle aux tokens `primary`/`secondary`, et risque de divergence entre cards.
Correction : centraliser les statuts via des variantes sémantiques ou au minimum garantir le contraste et réutiliser les mêmes classes partout. Ne pas introduire de palette verte « officielle ».

## 2. Breakpoint `xs` absent

Un commentaire dans `globals.css` documente le bug : les classes `hidden xs:inline` ne s'appliquaient jamais car Tailwind v4 n'a pas de `xs` par défaut.
Correction retenue : `--breakpoint-xs: 400px`. **Ne pas supprimer cette déclaration.**

## 3. `top-16` / `top-20` sur un sticky

Problème : le header compact, les breadcrumbs et la visibilité au scroll changent la hauteur réelle → superposition ou trou.
Correction : `topMiddle.height` depuis le store App Shell.

## 4. Remplacer une table par une mini-table illisible

Problème : réduire la police jusqu'à 8 px sur mobile.
Correction : `overflow-x-auto` + vue cartes `md:hidden` avec les mêmes données.

## 5. Deux boutons principaux dans la même zone

Problème : l'œil ne sait pas où agir ; sur mobile les deux se chevauchent.
Correction : un seul `variant="default"`, le reste en `outline`/`ghost` ou dropdown.

## 6. Card imbriquée dans card

Problème : bordures multiples, ombres qui se multiplient, hiérarchie floue.
Correction : `div` + `Separator`, ou restructurer en une seule card avec sections.

## 7. Icône seule sans `aria-label`

Problème : bouton incompréhensible au lecteur d'écran et sur mobile.
Correction : `aria-label` + tooltip desktop ; garder un libellé pour les actions principales.

## 8. Tirage client / `sort(() => Math.random() - 0.5)`

Problème : la structure affichée n'est pas celle persistée ; risque de divergence métier.
Correction : génération serveur (`structure-engine.ts`), persistance (`actions/phases/structure.ts`), animation = visualisation seule.

## 9. Erreur affichée comme liste vide

Problème : l'utilisateur croit qu'il n'y a pas de données alors que la requête a échoué.
Correction : deux composants/états distincts avec action « Réessayer ».

## 10. Filtres locaux non synchronisés

Problème : rechargement perd le filtre, back button ne fonctionne pas, pagination incohérente.
Correction : `URLSearchParams` + `router.push`, `params.delete("page")` au changement.

## 11. Supprimer une action « difficile à intégrer »

Problème : régression fonctionnelle maquillée par un joli design.
Correction : conserver l'action, la déplacer dans un menu ou un drawer mobile.

## 12. Données fictives pour une capture

Problème : le contrôle visuel ne porte pas sur le vrai cas (textes longs, relations, états réels).
Correction : utiliser les données de dev/seed ; si indisponible, documenter la limitation.

## 13. `any` pour faire taire TypeScript

Problème : perte du contrat `MatchCard` / `onView` / `viewMode`.
Correction : typer les props, même minimalement ; corriger la source des données.

## 14. Deux systèmes de thème

Problème : `next-themes` + un état local `dark` → divergence.
Correction : uniquement `ThemeToggle` / `next-themes`.
