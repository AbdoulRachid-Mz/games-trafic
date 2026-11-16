# Refonte du système App Shell, des layouts et de la page Tournament Edition Detail

## Objectif général

Nous allons maintenant procéder à une refonte ciblée du système de layout de Games Trafics, notamment pour les pages Dashboard, Profile, Tournament et Edition.

L'objectif n'est pas de créer un nouveau système parallèle, mais de faire évoluer intelligemment l'architecture existante afin que les layouts et les composants puissent communiquer entre eux, se piloter mutuellement et adapter leur comportement selon la page active, les besoins des composants enfants et la position de défilement.

**IMPORTANT : avant toute modification, relis et analyse le dépôt Git dans son état actuel.** Ne te base pas uniquement sur les descriptions de ce prompt ou sur tes connaissances des anciennes versions du projet. Le code présent dans le dépôt constitue la référence.

---

# PHASE 1 — AUDIT OBLIGATOIRE DU DÉPÔT

Commence par examiner les éléments suivants et leurs dépendances :

- `@components/dashboard/`
- `@components/layout/`
- `@components/layout/top-middle.tsx`
- `@components/layout/FloatingActionButton.tsx`
- `@components/layout/floating-dock.tsx`
- `@stores/app-shell-store.ts`
- `route-config` et tous les fichiers qui participent à sa configuration.
- `@docks.md`
- Le layout principal de l'application et ses éventuels layouts secondaires.
- Les pages Dashboard, Profile, Tournament et Edition.
- La page `@app/tournaments/[tournamentId]/editions/[editionId]`.

Il faut également identifier :

1. Comment `AppShell` assemble actuellement ses différents composants.
2. Comment `route-config` détermine les composants visibles selon la route.
3. Comment `app-shell-store` gère actuellement les états et les interactions.
4. Comment les composants communiquent avec le layout parent.
5. Comment le scroll est actuellement détecté et géré par `top-middle.tsx`.
6. Comment les composants fixes, flottants et sticky sont positionnés.
7. Comment les breakpoints responsive sont définis et utilisés.
8. Si plusieurs systèmes de gestion du scroll, de visibilité ou de positionnement coexistent déjà.

Ne crée pas de doublons si une logique équivalente existe déjà.

À la fin de cet audit, définis une stratégie de modification compatible avec l'architecture actuelle.

# PHASE 2 — UN SYSTÈME DE PILOTAGE CENTRALISÉ DU APP SHELL

Nous voulons faire évoluer `@stores/app-shell-store.ts` pour en faire un véritable système de communication entre le layout principal et les composants des pages.

Actuellement, le layout définit une partie du comportement de l'application. Nous voulons aller plus loin : les composants enfants doivent également pouvoir transmettre des informations au layout et piloter certains de ses éléments.

## 2.1. Contrôle des composants du App Shell

Il faut pouvoir piloter dynamiquement les éléments suivants :

- Top Middle.
- Header Dashboard.
- Left Bar.
- Right Bar.
- Footer.
- Floating Dock.
- Éventuels autres éléments du App Shell identifiés pendant l'audit.

Exemples de comportements attendus :

- Une page peut demander de masquer le Top Middle.
- Un composant peut demander de masquer temporairement le Footer.
- Une page peut désactiver la Left Bar ou la Right Bar.
- Un composant enfant peut modifier la visibilité du Floating Dock.
- Une page peut demander un comportement particulier du Header Dashboard.
- Lorsqu'un utilisateur quitte une page, les modifications spécifiques à cette page ne doivent pas contaminer les autres routes.

Ces changements doivent pouvoir être déclenchés depuis les composants enfants sans avoir à modifier directement le layout principal.

## 2.2. Communication entre les composants et le layout

Définis une API propre, typée et cohérente dans `app-shell-store.ts`.

Elle doit permettre aux composants enfants :

- D'envoyer des informations au App Shell.
- De demander l'affichage ou le masquage d'un composant.
- De modifier certains paramètres de comportement.
- De signaler des besoins spécifiques à la page.
- De réinitialiser leurs modifications lorsqu'ils sont démontés.
- De gérer des comportements temporaires sans écraser la configuration initiale de la route.

Attention à la gestion des priorités : une demande temporaire d'un composant ne doit pas écraser définitivement la configuration définie dans `route-config`.

Prévois un système de configuration de base par route et de surcharges temporaires pilotées par les composants.

Évite les états globaux difficiles à réinitialiser, les effets de bord et les conflits entre plusieurs composants enfants.

## 2.3. Route Config et App Shell Store

`route-config` doit rester la source de configuration initiale du comportement de chaque route.

`app-shell-store` doit permettre d'appliquer les ajustements dynamiques nécessaires pendant l'utilisation de la page.

Il faut donc distinguer clairement :

- La configuration par défaut de la route.
- Les modifications temporaires demandées par les composants.
- L'état réellement appliqué au App Shell.

La navigation vers une autre route doit correctement nettoyer ou remplacer les surcharges qui ne sont plus pertinentes.

Ne duplique pas inutilement les informations entre `route-config` et `app-shell-store`.

# PHASE 3 — HEADER DASHBOARD ET COMPORTEMENT DE TOP MIDDLE

Nous voulons harmoniser le comportement du Header Dashboard situé dans `@components/dashboard/` avec celui de :

`@components/layout/top-middle.tsx`

Le Header Dashboard doit adopter le même principe de comportement au scroll.

## Comportement attendu

- Lorsque l'utilisateur descend dans la page, le header suit son comportement normal et peut quitter la zone visible.
- Lorsque l'utilisateur dépasse sa position initiale puis commence à remonter, le header doit réapparaître en position fixe.
- Il doit rester visible pendant la remontée.
- Son positionnement doit être calculé correctement pour éviter les chevauchements avec le contenu.
- Il doit retrouver un comportement normal lorsque l'utilisateur revient à sa position initiale.

Il faut réutiliser autant que possible la logique déjà implémentée dans `top-middle.tsx`.

Évite d'implémenter deux systèmes de détection du scroll différents pour obtenir le même résultat.

Le comportement doit rester fluide, responsive et compatible avec les autres éléments du App Shell.

# PHASE 4 — REFONTE DU FLOATING ACTION BUTTON EN DOCK

Nous voulons transformer le comportement de :

`@components/layout/FloatingActionButton.tsx`

en nous inspirant de :

- `@components/layout/floating-dock.tsx`
- `@docks.md`

L'objectif est d'obtenir un véritable dock d'actions, avec une gestion intelligente du nombre d'éléments visibles et du défilement horizontal.

## 4.1. Comportement responsive

Le dock doit afficher un nombre maximal d'éléments selon la taille de l'écran :

| Écran | Nombre maximal d'éléments visibles |
|---|---:|
| Mobile et écrans inférieurs à `md` | 4 |
| À partir de `md` et avant `lg` | 4 |
| À partir de `lg` | 6 |

Si le nombre d'éléments dépasse cette limite :

- Les éléments supplémentaires doivent être accessibles par défilement horizontal.
- Le scroll doit être fluide.
- Il faut éviter les barres de défilement visuellement gênantes.
- Les éléments doivent conserver leur taille et leur espacement.
- Le dock doit rester utilisable au tactile et à la souris.
- Les éléments ne doivent pas être coupés ou partiellement masqués de manière involontaire.

Attention : les limites de 4 et 6 (si ca depasse on peut scroll horizontal (defilement horizontal)) concernent les éléments d'action du dock, pas le bouton Floating Action Button.

## 4.2. Le Floating Action Button doit appartenir au dock

C'est un point essentiel.

Le bouton Floating Action Button ne doit plus être un élément indépendant et détaché du dock.

Il doit être intégré visuellement et structurellement au dock, comme un élément d'action supplémentaire.

Cependant, son comportement doit être particulier :

- Il doit être positionné en absolu à droite du conteneur parent du dock.
- Il doit rester visible et ne doit pas défiler horizontalement avec les autres éléments.
- Il doit être visuellement cohérent avec les autres éléments du dock.
- Il doit conserver son icône `+` et son comportement d'action.
- Il doit être considéré comme un élément du dock dans la composition visuelle, sans être comptabilisé dans les 4 ou 6 éléments scrollables.

En pratique, le dock doit comporter :

1. Une zone d'éléments scrollables horizontalement.
2. Une zone réservée au bouton Floating Action Button, positionnée à droite.

Le bouton doit rester dans le même conteneur visuel que le dock, avec un positionnement absolu ou une solution équivalente adaptée à l'architecture existante.

Il ne doit pas être positionné indépendamment dans le viewport.

La zone scrollable doit réserver suffisamment d'espace à droite pour que ses derniers éléments ne passent jamais sous le bouton `+`.

## 4.3. Réutilisation des éléments existants

Avant de modifier les composants, analyse la structure actuelle de `floating-dock.tsx`, `FloatingActionButton.tsx` et les règles de `docks.md`.

Conserve les comportements utiles déjà existants :

- Les animations.
- Les interactions.
- Les états actifs.
- Les tooltips.
- Les variantes responsive.
- Les comportements spécifiques aux différents docks.

Ne supprime pas des fonctionnalités existantes sans justification.

Le résultat doit être un composant propre, réutilisable et cohérent avec le design system de Games Trafics.

# PHASE 5 — REFONTE DE LA PAGE EDITION DETAIL

Une fois les phases précédentes correctement terminées, passe à la page :

`@app/tournaments/[tournamentId]/editions/[editionId]`

Cette page doit être réajustée pour profiter du nouveau système de pilotage du App Shell.

## 5.1. Refonte du comportement des Tabs

Actuellement, les tabs de la page utilisent un comportement sticky.

Nous voulons remplacer ce comportement par un système similaire à celui de :

- `@components/layout/top-middle.tsx`
- Header Dashboard après sa refonte.

### Comportement attendu

Lorsque l'utilisateur descend dans la page :

- Les tabs suivent leur position naturelle.
- Lorsqu'ils dépassent leur position initiale, ils ne doivent pas rester immédiatement sticky.

Lorsque l'utilisateur commence à remonter après avoir dépassé leur position initiale :

- Les tabs doivent réapparaître en position fixe.
- Ils doivent rester visibles pendant la remontée.
- Leur position doit être calculée dynamiquement.
- Ils doivent disparaître ou retrouver leur position normale lorsque l'utilisateur revient au-dessus de leur seuil initial.

Le comportement doit être identique dans son principe à celui de `top-middle.tsx`, et non une simple utilisation de `position: sticky`.

## 5.2. Priorité et coordination avec Top Middle

C'est un point particulièrement important.

Les tabs doivent être positionnés immédiatement sous le Top Middle lorsque celui-ci est visible et fixé.

Le Top Middle conserve toujours la priorité de positionnement et de superposition.

Les tabs ne doivent jamais :

- Passer au-dessus du Top Middle.
- Recouvrir le Top Middle.
- Se retrouver avec un espace excessif entre les deux.
- Provoquer un décalage brutal du contenu.
- Entrer en conflit avec le Header Dashboard.

Il faut donc mettre en place une coordination entre les hauteurs et les positions des éléments fixes.

Si le Top Middle est masqué par la configuration de la page ou par une action d'un composant, les tabs doivent automatiquement adapter leur position.

N'utilise pas des valeurs fixes arbitraires en pixels si la hauteur réelle des éléments peut être mesurée ou communiquée par le App Shell.

Privilégie une gestion centralisée des offsets, des hauteurs et des priorités de positionnement.

## 5.3. Intégration au App Shell Store

Les tabs doivent pouvoir communiquer avec le App Shell via `app-shell-store.ts` si cela est nécessaire pour leur comportement.

La page Edition Detail doit pouvoir :

- Signaler la présence de ses tabs.
- Déclarer leurs besoins de positionnement.
- Communiquer les informations nécessaires à la coordination avec le Top Middle.
- Adapter leur comportement si le Top Middle est masqué.
- Nettoyer les informations transmises lorsqu'elle est démontée.

Évite cependant de transformer le store en système de gestion de chaque détail visuel.

Les composants doivent rester autonomes pour leur logique locale, tandis que le store centralise uniquement les informations nécessaires à la coordination globale.

# PHASE 6 — SECTION AUTRES ÉDITIONS EN CAROUSEL

Sur la page Edition Detail, la section « Autres éditions » doit être transformée en carousel.

Il faut revoir sa présentation pour obtenir une section plus moderne et mieux intégrée à l'environnement gaming de Games Trafics.

Attentes :

- Présentation sous forme de cartes.
- Défilement horizontal fluide.
- Navigation tactile sur mobile.
- Navigation à la souris sur desktop.
- Espacement cohérent entre les cartes.
- Gestion responsive des dimensions.
- États hover et focus soignés.
- Indication visuelle discrète de la possibilité de défiler lorsqu'il y a plusieurs éditions.
- Gestion correcte lorsqu'il n'y a aucune autre édition.

Le carousel doit conserver toutes les informations pertinentes actuellement affichées sur les autres éditions.

Ne supprime aucune donnée métier utile.

Réutilise un composant carousel déjà présent dans le projet s'il est adapté. Sinon, crée une implémentation cohérente avec le design system existant.

# PHASE 7 — RESPONSIVE, DESIGN ET QUALITÉ

Toutes les modifications doivent respecter l'identité visuelle actuelle de Games Trafics.

Nous voulons une interface :

- Moderne et premium.
- Orientée gaming.
- Fluide et cohérente.
- Adaptée au mobile et au desktop.
- Sans chevauchements.
- Sans espaces inutiles.
- Sans animations excessives.
- Sans comportements imprévisibles au scroll.

Vérifie particulièrement :

- Les petits écrans mobiles.
- Les écrans intermédiaires.
- Les écrans desktop.
- Les transitions entre les breakpoints.
- Les changements de route.
- Les pages avec ou sans Top Middle.
- Les pages avec ou sans Header Dashboard.
- Les pages avec ou sans Floating Dock.
- Les pages comportant plusieurs éléments fixes simultanément.

Les éléments fixes doivent tenir compte de leurs hauteurs réelles et de leurs priorités respectives.

Il faut également vérifier que les comportements tactiles ne sont pas perturbés par les zones scrollables horizontales du dock et du carousel.

# PHASE 8 — TESTS ET VALIDATION

Après les modifications, effectue une vérification complète.

### Architecture

- Vérifier que `route-config` reste fonctionnel.
- Vérifier que `app-shell-store` ne provoque pas de conflits d'état.
- Vérifier que les composants enfants peuvent piloter le App Shell.
- Vérifier le nettoyage des états lors des changements de route.
- Vérifier qu'aucune configuration temporaire ne persiste accidentellement.

### Scroll et positionnement

- Tester le Header Dashboard.
- Tester le Top Middle.
- Tester les tabs de Edition Detail.
- Vérifier les priorités de superposition.
- Vérifier les offsets dynamiques.
- Vérifier les changements de visibilité du Top Middle.

### Dock

- Tester les limites de 4 et 6 éléments.
- Tester le scroll horizontal.
- Vérifier que le bouton `+` reste fixe à droite du dock.
- Vérifier que le dernier élément scrollable reste accessible.
- Tester les interactions tactiles et desktop.

### Edition Detail

- Vérifier le comportement complet des tabs.
- Vérifier la section Autres éditions.
- Vérifier les autres sections de la page pour éviter les régressions.
- Vérifier la navigation entre éditions.

### Qualité du code

Exécute les vérifications disponibles dans le projet :

- ESLint.
- TypeScript.
- Tests automatisés pertinents.
- Build de production.

Corrige les erreurs introduites par les modifications.

Ne masque pas les erreurs avec des `any`, des `@ts-ignore`, des désactivations ESLint injustifiées ou des contournements temporaires.

# CONSIGNES IMPORTANTES

1. Travaille à partir du code réellement présent dans le dépôt Git.
2. Ne suppose pas que les fichiers, composants ou API décrits dans ce prompt sont identiques à leur ancienne version.
3. Analyse les dépendances avant de modifier une architecture existante.
4. Réutilise les composants et utilitaires déjà disponibles.
5. Ne crée pas plusieurs systèmes concurrents de détection du scroll.
6. Ne transforme pas `app-shell-store` en un store géant contenant toute la logique de présentation.
7. Préserve les comportements existants qui ne sont pas concernés par cette refonte.
8. Évite les modifications inutiles des pages ou fonctionnalités non concernées.
9. Ne supprime aucun composant ou fichier sans avoir vérifié toutes ses références.
10. N'ajoute pas de dépendance externe si une solution propre existe déjà dans le projet.
11. Ne te limite pas à corriger visuellement les composants : le comportement et l'architecture doivent être réellement fonctionnels.
12. Ne considère pas une phase comme terminée simplement parce que le code compile.

# LIVRABLE FINAL

À la fin, fournis un compte rendu clair comprenant :

1. L'état initial de l'architecture après audit.
2. Les problèmes identifiés.
3. Les modifications réalisées.
4. Les fichiers créés, modifiés ou supprimés.
5. Le fonctionnement final du système de pilotage App Shell.
6. Le fonctionnement du Header Dashboard et des tabs au scroll.
7. Le fonctionnement final du Floating Dock et du bouton `+`.
8. Les améliorations apportées à la section Autres éditions.
9. Les tests exécutés et leurs résultats.
10. Les éventuels problèmes restants ou points nécessitant une décision.

**Résultat attendu :** un système de layout cohérent, centralisé, pilotable par les pages et les composants enfants, avec des comportements de scroll harmonisés, un Floating Dock responsive et une page Edition Detail parfaitement intégrée à cette nouvelle architecture.