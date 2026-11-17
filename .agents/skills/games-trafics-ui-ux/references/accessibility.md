# Accessibilité

Objectif : WCAG 2.1 AA sur les parcours prioritaires (tournois, éditions, dashboards, marketplace).

## Contrastes

- Texte principal `foreground` sur `background` : conforme en clair comme en sombre (tokens OKLCH du projet).
- Texte secondaire : `muted-foreground` — vérifier les petits textes (`caption3`/`caption4` 10/8 px) qui peuvent devenir invalides ; les réserver aux décorations.
- Ne pas poser de texte clair sur un fond clair (ex. `text-white` sur badge `bg-amber-500`, fréquent dans les cards produit). Corriger avec les variantes `*-foreground` du thème ou un fond plus sombre.
- Badges colorés : vérifier le contraste du texte, pas seulement la couleur de fond.
- Outil : `browser.lighthouse` (catégorie accessibility) + inspection manuelle en thème sombre.

## Clavier

- Ordre de tabulation logique ; pas de `tabindex` positif.
- Éléments interactifs natifs (`button`, `a`, `input`) ; si `div` cliquable → `role="button"`, `tabIndex={0}`, gestion `Enter`/`Space`.
- Dialogs / Sheets : focus piégé, retour au déclencheur à la fermeture, `Escape` fonctionnel (Radix le gère).
- Menus `CardActionMenu` : navigation flèches, `aria-haspopup`, fermeture par Échap.
- Tabs : `role="tablist"` / `tab` / `tabpanel` (Radix le gère), flèches gauche/droite.
- **Ne jamais retirer le focus visible** : `focus-visible:ring-[3px]` est fourni par `button.tsx`.

## ARIA et sémantique

- Un seul `h1` par page ; hiérarchie `h1 → h2 → h3` sans saut.
- Icône seule → `aria-label` ; image décorative → `alt=""` ; image porteuse d'info → `alt` descriptif.
- États : `aria-pressed`, `aria-selected`, `aria-expanded`, `aria-current="page"`, `aria-invalid`, `aria-disabled`.
- Erreurs de formulaire : message associé via `aria-describedby`, pas seulement une couleur rouge.
- Filtres : `aria-label` sur les selects, annoncer le nombre de résultats.
- Loading : `aria-busy="true"` sur la zone, `role="status"` pour le message.
- Toast `sonner` : vérifier qu'ils sont annoncés sans interrompre.

## Zones tactiles

- Cible minimale **24×24 px** (WCAG 2.2 AA) ; viser **44×44 px** pour les actions principales mobiles.
- Les `Button size="xs"` (`h-6`) et `icon-xs` (`size-6`) sont réservés aux contextes très denses ; compenser sinon.
- Espacement entre cibles adjacentes : au moins 8 px.
- Les actions secondaires peuvent être en icône **si** tooltip desktop + `aria-label` + libellé accessible mobile.

## Motion et sensibilité

- Respecter `prefers-reduced-motion: reduce` : désactiver `animate-*`, transitions longues, reveals 3D, confettis.
- Pas de contenu qui clignote plus de 3 fois par seconde.
- Les animations de tirage/révélation ne doivent pas empêcher l'accès au contenu (bouton « Passer »).

## Formulaire et erreurs métier

- Champs requis : `required` visuel **et** `aria-required`.
- Messages d'erreur en français, action corrective explicite.
- Différencier : erreur réseau, erreur de validation, règle métier (ex. « résultat déjà validé »).
- Un bouton désactivé doit expliquer pourquoi (tooltip ou texte adjacent) quand la raison est métier.

## Vérification

1. `browser.snapshot` → arbre d'accessibilité : noms, rôles, états.
2. Navigation clavier complète (Tab, Shift+Tab, Entrée, Échap, flèches).
3. `browser.lighthouse` → score accessibility, corriger les échecs concrets.
4. Test manuel thème sombre : contraste des badges, placeholders, graphiques.
