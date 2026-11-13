# MISSION — REFONTE DU CONTEXTE APP-SHELL, CORRECTIONS DES DASHBOARDS ET DU SYSTÈME D’ORGANISATION DES TOURNOIS

Tu interviens directement dans le projet **Games-Trafics**.

Tu dois commencer par analyser intégralement le code actuel du projet (tu as deja une grande partie de contexte du projet. donc on reaanalyse bien les parties concernees), puis réaliser les corrections et améliorations demandées ci-dessous. Il ne s’agit pas de proposer une architecture théorique ou de produire uniquement un rapport : tu dois réellement implémenter les changements, les tester et corriger les éventuelles régressions.

Le système actuel d’AppShell et de gestion des layouts fonctionne déjà comme souhaité dans son ensemble. Ne le remplace pas et ne le reconstruis pas arbitrairement. L’objectif est de le rendre observable et exploitable par les pages, puis de corriger les écrans et les fonctionnalités qui en dépendent.

---

# 1. AUDIT PRÉALABLE OBLIGATOIRE

Avant toute modification :

1. Lis les fichiers concernes lorsqu’ils sont pertinents.
2. Examine l’architecture actuelle de l’App Router, des providers, des contexts, des stores, des hooks et des layouts.
3. Analyse les composants du shell et leur relation avec la configuration des routes.
4. Analyse les pages concernées, leurs composants enfants, leurs hooks, leurs actions serveur, les requêtes Drizzle et les moteurs métier.
5. Analyse les types et les relations de la base de données avant de modifier les structures de tournoi.
6. Recherche les usages existants des composants concernés dans toute l’application afin de ne pas casser les autres écrans.

Fichiers de départ à examiner, sans limiter l’audit à cette liste :

- `components/layout/app-shell.tsx`
- `components/layout/main-layout.tsx`
- `components/layout/top-middle.tsx`
- `components/layout/FloatingActionButton.tsx`
- `components/layout/floating-dock.tsx`
- `components/layout/breadcrumbs.tsx`
- `config/routes-config.ts`
- `lib/routes/resolver.ts`
- `types/routes.ts`
- `app/layout.tsx`
- `contexts/`
- `stores/`
- `hooks/`

Pour les tournois :

- `components/pages/tournaments/edition-detail/`
- `components/pages/tournaments/matches/`
- `components/cards/match-card.tsx`
- `components/cards/group-card.tsx`
- `components/pages/tournaments/edition-detail/organize-wizard-client.tsx`
- `components/pages/tournaments/edition-detail/phase-organize-client.tsx`
- `components/pages/tournaments/edition-detail/group-nodes-organize-client.tsx`
- `components/pages/tournaments/edition-detail/bracket-node-matches-organize-client.tsx`
- `components/pages/tournaments/edition-detail/draw-reveal-dialog.tsx`
- `components/pages/tournaments/edition-detail/edition-detail-header.tsx`
- `components/pages/tournaments/edition-detail/edition-page-content.tsx`
- `components/pages/tournaments/edition-detail/edition-matches-tab.tsx`
- `components/pages/tournaments/edition-detail/edition-standings-tab.tsx`
- `components/pages/tournaments/edition-detail/standings-table.tsx`
- `components/pages/tournaments/edition-detail/matches-dashboard-filters.tsx`
- `components/pages/tournaments/edition-detail/participants-management-client.tsx`

Pages :

- `app/tournaments/[tournamentId]/editions/[editionId]/dashboard/`
- `app/tournaments/[tournamentId]/editions/[editionId]/matches/`
- `app/tournaments/[tournamentId]/matches/` si cette route existe dans la structure réelle
- `app/tournaments/[tournamentId]/members/`

Actions et moteurs :

- `actions/phases/`
- `actions/tournaments/`
- `actions/editions.ts`
- `actions/groups.ts`
- `actions/tournaments/results.ts`
- `lib/tournaments/standings.engine.ts`
- `lib/tournaments/edition-standings.ts`
- `lib/tournaments/bracket-standings.ts`
- `lib/tournaments/bracket-engine.ts`
- `lib/tournaments/bracket.generator.ts`
- `lib/tournaments/match-generation-engine.ts`
- `lib/tournaments/group.generator.ts`

Ne suppose jamais qu’une fonction fonctionne comme son nom le suggère. Vérifie son implémentation, ses données de sortie et ses consommateurs.

Après l’audit, établis une liste des problèmes confirmés et des fichiers à modifier, puis passe directement à l’implémentation.

# 2. CRÉER UN CONTEXTE GLOBAL POUR APP-SHELL ET ROUTE CONFIG

## 2.1. Objectif

Je veux disposer d’un contexte global permettant à n’importe quelle page ou composant de connaître précisément l’état actuel de l’AppShell et de la configuration de la route active.

Aujourd’hui, `resolveRoute()` fournit déjà une configuration résolue, mais cette configuration est essentiellement consommée par `AppShell` et `MainLayout`.

Je veux rendre cet état accessible à l’ensemble des pages.

Tu peux utiliser React Context ou Zustand. Le projet utilise déjà Zustand 5 : privilégie une solution légère et cohérente avec l’architecture existante, sans multiplier inutilement les providers.

Le store doit être initialisé et synchronisé depuis `AppShell`, avec une API publique typée et documentée.

Proposition de nom : `useAppShellStore` ou `useAppShell`.

Ne crée pas un deuxième système de résolution des routes. `resolveRoute()` reste la source de vérité de la configuration.

## 2.2. Informations à exposer

Le contexte doit exposer au minimum :

### A. Informations de la route active

- `pathname`
- `name` : nom de la page active
- `layout` : none, public, dashboard ou admin
- `routeConfig` : configuration résolue complète
- `isAuthenticated`
- `isAdmin`
- `isVip`
- `userId`
- `hasAccess`
- `requireAuth`
- `requireAdmin`
- `styleGroup`

Il faut conserver toutes les informations utiles déjà disponibles dans `ResolvedRoute`.

### B. État du layout

Exposer :

- état d’activation de `topMiddle`
- état d’activation des breadcrumbs
- liste réelle des breadcrumbs
- état de la left bar
- état d’ouverture de la left bar
- état de la right bar
- état d’ouverture de la right bar
- état du footer
- état de `navigationLinks`
- état de `floatingDock`
- état de `fabActions`
- état de l’assistant IA
- état de `showOnTap`
- état du mode maintenance
- présence ou absence du container principal
- toute autre propriété structurelle déjà présente dans `ResolvedRoute`.

Il faut faire une distinction claire entre :

1. un composant autorisé/configuré par la route ;
2. un composant effectivement monté ;
3. un composant actuellement visible ;
4. un composant ouvert ou fermé lorsqu’il s’agit d’un panneau ou d’un dialogue.

Par exemple, `rightBar.enabled === true` ne signifie pas que la right bar est ouverte.

### C. État du scroll

Exposer au minimum :

- `scrollY`
- `isScrolled`
- `scrollDirection` : up/down/none
- `topMiddle.isEnabled`
- `topMiddle.isVisible`
- `topMiddle.isHiddenOnScroll`
- `topMiddle.height`
- `topMiddle.top`
- `topMiddle.bottom`
- `topMiddle.zIndex`
- `breadcrumbs.isEnabled`
- `breadcrumbs.isVisible`
- `breadcrumbs.height`
- `breadcrumbs.top`
- `breadcrumbs.bottom`
- `breadcrumbs.zIndex`

Les valeurs de hauteur et de position doivent correspondre à la réalité du DOM, pas à des valeurs codées en dur.

Lorsque le top-middle disparaît au scroll, les pages doivent immédiatement le savoir.

Lorsque les breadcrumbs sont présents, leur hauteur doit être prise en compte dans les calculs.

### D. État des éléments flottants

Je veux également exposer les informations des éléments flottants :

- FAB activé ou non ;
- FAB visible ou non ;
- dock activé ou non ;
- dock visible ou non ;
- présence d’actions flottantes ;
- nombre d’actions ;
- dimensions réelles ;
- position réelle ;
- position fixe ou non ;
- `zIndex` ;
- zones de l’écran occupées ;
- emprise verticale et horizontale ;
- marges de sécurité ;
- éventuel chevauchement avec le contenu.

Il faut notamment pouvoir déterminer si un élément fixe occupe actuellement une zone en bas à droite, en bas au centre ou ailleurs.

Le contexte ne doit pas seulement fournir un booléen `floatingVisible`. Il doit fournir des informations suffisamment précises pour permettre à une page de positionner correctement ses propres composants.

Si le FAB et le dock sont intégrés dans le même composant, distingue leur état logique et leur emprise réelle lorsqu’ils peuvent être affichés séparément.

## 2.3. Mesure réelle des éléments

Utilise une approche fiable : verifie les hooks existants

- `ResizeObserver` pour les dimensions ;
- `getBoundingClientRect()` pour les positions ;
- événements de scroll ou Motion Values déjà utilisés dans le projet ;
- callbacks explicites entre les composants et le store ;
- nettoyage des observers et listeners.

Évite de multiplier les événements globaux inutiles.

Les mesures doivent être mises à jour lorsque :

- la route change ;
- le top-middle change de visibilité ;
- les breadcrumbs changent ;
- le viewport change de dimensions ;
- le contenu des éléments fixes change ;
- le dock ou les actions flottantes changent ;
- un panneau s’ouvre ou se ferme.

Ne provoque pas de boucle de rendu avec des mises à jour de dimensions à chaque frame.

## 2.4. API du contexte

Je veux une API simple pour les pages.

Exemple indicatif :

```tsx
const {
  route,
  layout,
  topMiddle,
  breadcrumbs,
  floating,
  sidebars,
  viewport,
} = useAppShell();
```

Une page doit pouvoir facilement faire :

```tsx
const { topMiddle, breadcrumbs, floating } = useAppShell();

const stickyOffset =
  topMiddle.visibleHeight + breadcrumbs.visibleHeight;
```

L’exemple n’impose pas les noms exacts. Construis une API propre, cohérente, documentée et strictement typée.

Prévois aussi des sélecteurs Zustand ou des hooks spécialisés pour éviter qu’un composant ne se rerende à chaque changement de scroll lorsqu’il n’a besoin que du nom de la route.

## 2.5. Possibilité d’adaptation locale

Les pages peuvent avoir besoin de masquer temporairement certains éléments du shell ou de demander une adaptation de leur affichage.

Prévois une API contrôlée pour les besoins locaux, sans permettre à une page de modifier définitivement la configuration globale des routes.

Il faut distinguer :

- configuration par défaut de la route ;
- état réel du shell ;
- override temporaire demandé par la page ;
- état effectif final.

Les overrides doivent être nettoyés automatiquement au démontage du composant ou lors du changement de route.

Ne permets pas à une page de modifier directement `routes-config.ts` ou de corrompre la configuration partagée.

## 2.6. Intégration

Intègre le store dans :

- `AppShell`
- `MainLayout`
- `TopMiddle`
- `FloatingActionButton`
- les composants du dock
- les composants de sidebars.

Synchronise les informations de route depuis `AppShell`.

Synchronise l’état d’ouverture des sidebars depuis `MainLayout`.

Synchronise la visibilité du top-middle depuis `TopMiddle`.

Synchronise les dimensions et positions des éléments flottants depuis leurs composants.

Le contexte doit être disponible pour toutes les pages enveloppées par le layout global.

Attention aux routes `layout: "none"` : elles ne doivent pas recevoir un état incohérent ou conserver des valeurs de la route précédente.

Gère correctement le premier rendu, l’hydratation Next.js et les changements rapides de route.

# 3. CORRIGER LES TABS STICKY DE L’ÉDITION

Page concernée :

`components/pages/tournaments/edition-detail/edition-detail-header.tsx`

Le header d’édition contient déjà une détection de scroll avec `IntersectionObserver` pour passer en mode compact.

Je veux améliorer le comportement des tabs de l’édition.

## Comportement attendu

Lorsque l’utilisateur descend dans la page et dépasse le contenu du header, les tabs doivent devenir sticky.

Ils doivent se positionner juste sous les éléments du shell qui sont réellement visibles.

Leur position doit tenir compte :

- du top-middle ;
- des breadcrumbs ;
- de la visibilité réelle du top-middle au scroll ;
- de la hauteur réelle de ces éléments ;
- du niveau de `z-index` du shell ;
- de l’éventuel header compact de l’édition.

Ne code plus arbitrairement `top-16`, `top-20` ou une hauteur fixe supposée.

Utilise les données du nouveau contexte.

Le système doit fonctionner dans les cas suivants :

1. top-middle visible avec breadcrumbs ;
2. top-middle visible sans breadcrumbs ;
3. top-middle masqué au scroll ;
4. breadcrumbs absents ;
5. petit écran ;
6. changement de viewport ;
7. changement de route.

Les tabs ne doivent jamais passer derrière le top-middle, les breadcrumbs ou le header compact.

Leur `z-index` doit être cohérent avec la hiérarchie globale.

Le comportement doit rester fluide et ne pas provoquer de saut de page.

# 4. CORRIGER LES CARDS MATCHES ET LEURS ACTIONS

Composant principal :

`components/cards/match-card.tsx`

Cette carte possède déjà `onView`, mais plusieurs endroits ne l’utilisent pas correctement.

Il faut examiner tous ses usages.

## 4.1. Détail d’une édition

Dans le tab Matches de l’édition :

- toutes les cartes doivent avoir une action de consultation ;
- le clic sur Voir doit ouvrir la page détaillée du match ;
- les actions de consultation des participants doivent rester fonctionnelles ;
- aucune action ne doit provoquer une navigation avec un identifiant manquant.

## 4.2. Détail des groupes

Dans :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/groups/[groupId]/group-detail-client.tsx`

Plusieurs usages de `MatchCard` ne transmettent pas `onView`: harmonisation du style des autres card: @/components/cards/*

Corrige tous les cas :

- affichage liste ;
- affichage compact ;
- affichage par rounds ;
- affichage hors arbre.

La consultation doit conduire à la page de détail du match correspondant.

## 4.3. Dashboard des matchs

Dans :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/matches/page.tsx`

La page utilise une carte locale `MatchCard` différente de la carte partagée.

Audite les raisons de cette duplication.

Si cela est pertinent, réutilise le composant partagé ou extrais une variante clairement définie.

Je veux une action Voir/Gérer clairement accessible et cohérente.

Les cartes doivent rester adaptées aux écrans mobiles.

## 4.4. Vérification globale

Recherche tous les usages de `MatchCard` dans l’application.

Vérifie que :

- `onView` est réellement exploité ;
- les liens sont corrects ;
- les actions ne sont pas inaccessibles sur mobile ;
- les clics sur les menus ne déclenchent pas aussi le clic principal de la carte ;
- les callbacks ne sont pas déclarés mais inutilisés.

Ne casse pas les usages qui ont une logique particulière.

# 5. RESPONSIVE DU DASHBOARD PARTICIPANTS

Page :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/participants/page.tsx`

Composant :

`components/pages/tournaments/edition-detail/participants-management-client.tsx`

Actuellement, certains éléments ne s’adaptent pas correctement aux écrans petits et moyens.

Je veux une vraie refonte responsive, pas seulement une réduction des marges.

Examine :

- les tableaux ;
- les colonnes ;
- les actions ;
- les menus ;
- les filtres ;
- les statistiques ;
- les badges ;
- les avatars ;
- les formulaires ;
- les dialogues ;
- les barres de recherche ;
- les boutons ;
- les zones de sélection.

Sur les petits écrans, évite les tableaux qui débordent horizontalement sans nécessité.

Si une vue en cartes mobiles est plus pertinente, implémente-la.

Sur les tailles intermédiaires, notamment `sm`, `md` et `lg`, vérifie que les colonnes ne deviennent pas trop étroites et que les actions restent accessibles.

Teste au minimum :

- 320 px ;
- 375 px ;
- 390 px ;
- 640 px ;
- 768 px ;
- 1024 px ;
- 1280 px.

Les composants doivent utiliser les breakpoints Tailwind de manière cohérente.

Ne supprime aucune fonctionnalité métier pour gagner de la place.

# 6. CRÉER ET RÉUTILISER DES CARDS GROUPES

Le projet possède déjà :

`components/cards/group-card.tsx`

Il faut l'auditer avant de le modifier.

Je veux disposer d'un composant de groupe réutilisable et suffisamment complet pour les différents écrans de gestion.

## 6.1. Dashboard groupes

Page :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/groups/page.tsx`

Vérifie que le composant affiche correctement :

- nom du groupe ;
- nom de la phase ;
- type du groupe ;
- nombre de participants ;
- état de verrouillage ;
- état de complétion ;
- nombre de matchs ;
- progression ;
- informations utiles disponibles ;
- actions de consultation et de gestion.

Le composant doit gérer les modes grid, list et compact sans incohérence.

## 6.2. Détail d'une phase

Page :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/phases/[phaseId]/phase-detail-client.tsx`

Je veux également utiliser les cards groupes dans cette page.

Les groupes de la phase doivent être affichés de façon cohérente avec le dashboard groupes.

Il faut fournir les données nécessaires au composant et éviter de reconstruire les mêmes informations dans plusieurs endroits.

Les cards doivent pouvoir naviguer vers le détail du groupe.

## 6.3. Réutilisabilité

Améliore les props si nécessaire :

- `onView`
- `onEdit`
- `onDelete`
- `onUpdate`
- `viewMode`
- `isAdmin`
- `extraActions`
- informations de phase.

Les callbacks doivent être correctement typés.

Le composant ne doit pas dépendre d'un contexte de page spécifique.

# 7. RÉPARER LE DASHBOARD MATCHES QUI N'AFFICHE PAS LES DONNÉES

Page :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/matches/page.tsx`

C'est une correction prioritaire.

Les matchs existent dans la base de données, mais cette page n'affiche actuellement pas correctement les données attendues.

## 7.1. Auditer la chaîne complète

Suivre précisément :

1. import de `getMatches` ;
2. fonction réellement appelée ;
3. paramètres transmis ;
4. construction des conditions SQL ;
5. pagination ;
6. requête Drizzle ;
7. relations chargées ;
8. structure retournée ;
9. mapping des données ;
10. consommation par les cartes.

Un problème confirmé dans le code actuel est que `getMatches()` dans `actions/phases/queries.ts` effectue une sélection directe dans `matches`, tandis que les cartes attendent notamment :

- `participant1.member`
- `participant2.member`
- `participant1.member.user`
- `participant2.member.user`
- les relations de phase ;
- les relations de groupe.

Il existe aussi `getMatchesWithParticipants()`, qui charge des relations.

Vérifie précisément les deux fonctions et leurs contrats.

Ne remplace pas aveuglément une fonction par l'autre : assure-toi que les données de la page, de la vue arbre et de l'export utilisent le format attendu.

## 7.2. Corriger la récupération des données

La page doit afficher les matchs existants de l'édition.

Vérifie notamment :

- `editionId` ;
- `phaseId` ;
- `groupId` ;
- `bracketNodeId` ;
- `status` ;
- `search` ;
- `page` ;
- `limit` ;
- `sortBy` ;
- `sortOrder`.

Les résultats doivent être cohérents entre la vue liste, grille et arbre.

Les données de la vue arbre ne doivent pas être confondues avec les données paginées de la vue liste.

Ne fais pas dépendre l'existence des matchs de la présence de `editionTree`.

## 7.3. Gestion des erreurs

Ne transforme pas silencieusement une erreur de récupération en tableau vide.

Distingue :

- chargement ;
- erreur réseau ;
- erreur serveur ;
- aucun match réellement disponible ;
- filtres sans résultat.

Ajoute un état d'erreur exploitable avec une possibilité de réessayer.

Vérifie aussi que les requêtes ne sont pas relancées inutilement à chaque changement de rendu.

# 8. UNIFIER ET CORRIGER LES FILTRES DES MATCHS

Les filtres doivent fonctionner de manière cohérente dans trois emplacements :

1. dashboard des matchs ;
2. tab Matches du détail d'une édition ;
3. navigation publique des matchs.

Composant existant :

`components/pages/tournaments/edition-detail/matches-dashboard-filters.tsx`

Action principale :

`actions/phases/helpers.ts`

Fonction :

`buildMatchWhereConditions()`

## 8.1. Audit des filtres

Vérifie les filtres disponibles et leur transmission réelle :

- recherche texte ;
- statut ;
- phase ;
- groupe ;
- bracket/node ;
- date ou période si déjà prise en charge ;
- participant ;
- mes matchs ;
- matchs des autres participants.

Il faut vérifier que chaque contrôle agit réellement sur la requête.

Ne conserve pas un filtre purement visuel.

## 8.2. Source de vérité

La logique de filtrage doit être centralisée et cohérente entre les différentes pages.

Évite de recalculer les mêmes filtres côté client si la requête serveur peut les appliquer.

Les filtres doivent respecter les relations métier.

La recherche doit pouvoir trouver un match par son code et les informations pertinentes des participants.

Attention aux recherches SQL sur des relations optionnelles.

## 8.3. Synchronisation URL

Dans les pages qui utilisent des paramètres URL :

- conserver les filtres actifs lors d'un changement de vue ;
- réinitialiser la pagination lorsque les filtres changent ;
- éviter les paramètres invalides ;
- synchroniser les valeurs affichées et les valeurs réellement envoyées ;
- permettre le partage d'une URL filtrée.

Ne pas créer de boucle entre `useSearchParams`, `router.replace` et les états locaux.

## 8.4. Cas de test

Tester au minimum :

- tous les matchs ;
- un statut donné ;
- une phase ;
- un groupe ;
- une recherche par joueur ;
- une recherche par équipe ;
- plusieurs filtres combinés ;
- une recherche sans résultat ;
- pagination avec filtres ;
- changement de vue avec filtres actifs.

# 9. CORRIGER LE DÉVERROUILLAGE ET LA MODIFICATION DES RÉSULTATS

Page :

`app/tournaments/[tournamentId]/editions/[editionId]/matches/[matchId]/match-control-client.tsx`

Actuellement, le composant dispose déjà d'un mécanisme de déverrouillage :

- `adminForceEdit`
- bouton « Déverrouiller le résultat »
- `canEditScore`
- `canSubmitResult`
- `isMatchCompleted`

Mais le bouton de validation reste désactivé ou inaccessible dans certains cas lorsqu'il s'agit de modifier un résultat existant.

## 9.1. Auditer les conditions

Analyse intégralement :

- `isMatchCompleted`
- `isAdmin`
- `adminForceEdit`
- `canEditScore`
- `canSubmitResult`
- `canConfirmMatch`
- `isPending`
- les conditions du formulaire ;
- les conditions des boutons de soumission ;
- les actions serveur associées.

Le problème ne doit pas être corrigé en supprimant toutes les restrictions.

## 9.2. Comportement attendu

Pour un match terminé :

- un participant ne doit pas pouvoir modifier librement un résultat validé ;
- un organisateur autorisé peut déverrouiller le résultat ;
- après déverrouillage, les champs doivent être modifiables ;
- le bouton de validation doit devenir accessible ;
- l'enregistrement doit réellement mettre à jour le résultat ;
- le match doit retrouver un état cohérent ;
- les classements et la progression doivent être recalculés si nécessaire.

Le bouton doit être désactivé uniquement lorsque les conditions métier l'exigent réellement.

## 9.3. Sécurité serveur

Ne te limite pas au contrôle client.

Les actions serveur doivent vérifier :

- l'authentification ;
- le rôle organisateur/admin ;
- l'accès à l'édition ;
- le statut actuel du match ;
- le droit de modification ;
- les transitions de statut autorisées.

Un simple `adminForceEdit` côté navigateur ne doit jamais être considéré comme une autorisation.

Préserve les transactions SQL, les verrous et les mécanismes anti-concurrence existants.

## 9.4. Cohérence métier

Après une modification :

- mettre à jour les scores ;
- recalculer le vainqueur ;
- synchroniser les standings ;
- corriger les qualifications si elles sont affectées ;
- gérer la progression vers les phases suivantes ;
- invalider les caches concernés.

Ne crée pas de doubles progressions lorsqu'un match déjà validé est modifié.

# 10. AJOUTER LE CLASSEMENT GLOBAL D'UNE PHASE

Page :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/phases/[phaseId]/`

Composant :

`phase-detail-client.tsx`

Actuellement, le détail d'une phase expose des classements de groupes ou des données de bracket, mais il manque une vue globale cohérente du classement de la phase.

Je veux un véritable classement global de la phase.

## Comportement attendu

Selon le type de phase :

### Phase de groupes

Présenter le classement global de la phase en respectant les règles de qualification.

Si plusieurs groupes existent, le système doit distinguer :

- classement de chaque groupe ;
- classement global de phase lorsqu'il est métierement pertinent ;
- règles de comparaison entre groupes ;
- qualifiés ;
- non qualifiés.

Ne mélange pas les points de groupes différents si cela n'a pas de sens selon le format.

### Round Robin

Pour le Round Robin refondu où les groupes représentent des journées, utiliser le classement agrégé officiel de la phase.

Ne traite pas chaque journée comme un groupe qualificatif indépendant.

### Phase éliminatoire

Afficher un classement ou tableau de progression adapté à la phase, en utilisant les résultats réels et les règles du moteur.

Ne fabrique pas un classement de championnat à partir de simples nœuds de bracket.

### Swiss

Respecter le moteur et les critères de classement propres au format suisse.

## Architecture

Utilise les fonctions métier existantes :

- `getPhaseStandings()`
- `getPhaseLeagueStandings()`
- `computeBracketStandings()`
- `standings.engine.ts`

Si une fonction manque, crée-la dans le module métier approprié.

Ne recalcule pas les classements séparément dans le composant client.

Les données doivent venir du serveur.

# 11. AJOUTER LE CLASSEMENT GLOBAL DE TOUTE L'ÉDITION

Pages :

- `components/pages/tournaments/edition-detail/edition-standings-tab.tsx`
- `components/pages/tournaments/edition-detail/edition-page-content.tsx`

Il existe déjà une fonction `getEditionStandings()` dans `actions/phases/queries.ts` et un moteur `computeEditionStandings()`.

Je veux intégrer correctement le classement global dans le détail de l'édition.

Le classement doit tenir compte de tous les matchs comptabilisables de l'édition, avec les règles de scoring et de départage officielles.

Il faut notamment :

- afficher tous les participants concernés ;
- afficher les statistiques ;
- gérer les participants sans match ;
- respecter les résultats validés ;
- exclure les matchs non comptabilisables ;
- prendre en compte les règles de scoring configurées ;
- gérer les égalités ;
- afficher les équipes et avatars ;
- afficher les positions ;
- gérer les cas sans données.

Attention : le classement global d'une édition ne doit pas être confondu avec le classement d'une phase ou d'un groupe.

Utilise les moteurs existants et améliore-les si l'audit démontre une lacune.

Ne crée pas une deuxième formule de classement dans le frontend.

# 12. AMÉLIORER LES ACTIONS DU HEADER DE L'ÉDITION

Composant :

`components/pages/tournaments/edition-detail/edition-detail-header.tsx`

Dans les actions du header, ajoute deux actions clairement accessibles :

1. **Voir tous les matchs**
2. **Voir le calendrier complet**

### Voir tous les matchs

Redirige vers :

`/tournaments/[tournamentId]/editions/[editionId]/dashboard/matches`

### Voir le calendrier complet

Redirige vers la page calendrier réelle de l'édition si elle existe.

Avant de créer une nouvelle route, recherche le système de calendrier existant.

Si le calendrier est actuellement un onglet interne du détail d'édition, utilise le mécanisme de navigation existant pour ouvrir directement cet onglet.

Ne crée pas une route redondante si une solution existante est déjà disponible.

Les boutons doivent être intégrés proprement aux actions desktop et mobile.

# 13. AFFICHER « MES MATCHS » EN PRIORITÉ

Je veux améliorer l'ordre d'affichage des matchs.

Cela concerne :

- `edition-matches-tab.tsx` ;
- dashboard des matchs si pertinent ;
- page publique des matchs.

## Comportement attendu

Lorsqu'un utilisateur connecté fait partie de l'édition ou du tournoi :

1. afficher en premier une section « Mes matchs » ;
2. afficher ensuite les autres matchs ;
3. conserver les filtres et les modes de vue ;
4. ne jamais dupliquer un même match dans les deux sections.

Les matchs personnels doivent être identifiés à partir des inscriptions et de l'utilisateur authentifié.

Pour un utilisateur non connecté :

- afficher les matchs disponibles normalement ;
- ne pas provoquer d'erreur d'authentification ;
- ne pas afficher une section personnelle vide inutilement.

## Règles supplémentaires

Dans la page publique des matchs, appliquer le même principe.

La section personnelle doit être prioritaire, mais les autres matchs doivent rester accessibles.

Si l'utilisateur fait partie d'une équipe, vérifie les relations entre membre, équipe et inscription.

Ne te limite pas à comparer un seul `userId` si les règles métier permettent aussi une participation via une équipe.

Ne fais pas une requête individuelle par match.

Optimise la récupération des matchs personnels.

# 14. REFAIRE LE SYSTÈME DE RÉVÉLATION DU TIRAGE GLOBAL DE L'ÉDITION

C'est une fonctionnalité importante.

Le projet possède déjà :

- `DrawRevealDialog`
- `drawPhaseGroupsAction()`
- `drawGroupMatchesAction()`
- `phase-organize-client.tsx`
- `group-nodes-organize-client.tsx`

Mais le wizard global d'organisation ne déclenche pas la révélation complète de la structure créée.

Page concernée :

`app/tournaments/[tournamentId]/editions/[editionId]/dashboard/organize/page.tsx`

Composant :

`organize-wizard-client.tsx`

## 14.1. Objectif

Lorsque l'utilisateur confirme et valide la configuration de l'organisation de l'édition, je veux déclencher une animation cohérente de révélation de toute la structure.

L'animation doit refléter exactement la structure créée et persistée côté serveur.

Elle ne doit jamais décider elle-même de la distribution des participants ou des matchs.

Le serveur reste la source de vérité.

## 14.2. Séquence de révélation

Après confirmation réussie de `organizeEditionStructure()` :

### Étape 1 — Révéler les phases

Afficher les phases dans leur ordre réel.

Chaque phase doit apparaître avec :

- son nom ;
- son type ;
- son ordre ;
- ses principales caractéristiques ;
- son nombre de groupes ;
- son nombre de participants ;
- son nombre de rencontres si disponible.

L'animation doit présenter les phases successivement.

### Étape 2 — Révéler les groupes de chaque phase

Pour chaque phase :

- afficher ses groupes ;
- révéler les groupes progressivement ;
- conserver la relation phase → groupes ;
- afficher les informations de chaque groupe.

Ne mélange jamais les groupes appartenant à des phases différentes.

### Étape 3 — Révéler les participants

Pour chaque groupe :

- révéler les participants progressivement ;
- afficher leur nom ;
- avatar ou logo d'équipe ;
- position ou seed si disponible ;
- éventuelle information de qualification.

La révélation doit suivre l'ordre réellement persisté.

### Étape 4 — Révéler les confrontations et les brackets

Pour les phases éliminatoires :

- afficher l'arbre ;
- afficher les rounds ;
- révéler les nœuds ;
- afficher les confrontations ;
- afficher les participants de chaque confrontation ;
- afficher les BYE lorsqu'ils existent.

Le rendu doit respecter le niveau d'arbre choisi dans la configuration.

Ne transforme pas un arbre à plusieurs rounds en une simple liste de matchs.

### Étape 5 — Révéler les matchs

Lorsque le mode est automatique et que les matchs sont générés immédiatement :

- afficher les matchs de la première phase ;
- révéler les matchs selon l'ordre réel ;
- conserver les associations aux groupes ou nœuds ;
- afficher les numéros et les participants.

Lorsque les matchs ne sont pas encore générés :

- ne pas inventer des rencontres ;
- afficher clairement la structure en attente de génération.

## 14.3. Mode AUTO

En mode automatique :

- respecter la configuration automatique de l'édition ;
- afficher les phases dans l'ordre ;
- afficher les groupes de chacune ;
- afficher les participants ;
- afficher les arbres générés ;
- révéler les matchs effectivement générés pour la première phase.

Si plusieurs phases sont créées mais que seules les rencontres de la première sont générées, ne pas afficher de matchs fictifs pour les suivantes.

## 14.4. Mode MANUAL

En mode manuel, les animations doivent s'adapter à l'arbre et à la configuration réellement sélectionnés.

Pour une phase à groupes :

- révéler les groupes ;
- puis les participants.

Pour un bracket :

- révéler les rounds ;
- puis les nœuds ;
- puis les confrontations.

Pour une structure personnalisée :

- respecter la hiérarchie réellement définie.

Ne force pas une animation de groupes pour une phase qui ne contient pas de groupes.

Ne force pas une animation de bracket pour une phase qui ne génère pas de nodes.

## 14.5. Architecture du composant

Ne transforme pas `DrawRevealDialog` en un énorme composant conditionnel difficile à maintenir.

Tu peux créer un composant dédié, par exemple :

`EditionStructureRevealDialog`

avec des sous-composants :

- `PhaseRevealStep`
- `GroupRevealStep`
- `ParticipantRevealStep`
- `BracketRevealStep`
- `MatchRevealStep`

Les noms sont libres.

Le composant doit recevoir une structure complète et typée.

L'animation doit être fluide, responsive, accessible et adaptée à l'identité visuelle gaming de Games-Trafics.

Prévoir :

- progression ;
- étape actuelle ;
- possibilité de passer à la révélation suivante ;
- possibilité de tout révéler ;
- état terminé ;
- gestion de fermeture ;
- gestion des erreurs ;
- absence de données ;
- animations sans blocage de l'application.

## 14.6. Persistance et fiabilité

Après `organizeEditionStructure()` :

1. récupérer ou construire côté serveur la structure réellement persistée ;
2. fournir au composant les données nécessaires ;
3. afficher l'animation ;
4. une fois terminée, rafraîchir ou invalider les données nécessaires ;
5. naviguer vers l'écran d'organisation ou de gestion approprié.

Ne redirige pas immédiatement vers les phases avant que l'animation ait pu être présentée.

Attention au rechargement de page ou à une fermeture accidentelle de la modale.

Ne relance jamais le tirage uniquement parce que l'animation est relancée.

Les animations sont une représentation visuelle de résultats déjà persistés.

## 14.7. Préserver les tirages existants

Les fonctions de tirage serveur doivent rester les seules responsables du tirage réel.

Préserve notamment :

- Fisher-Yates côté serveur ;
- la persistance des affectations ;
- l'ordre réel de révélation ;
- la confirmation explicite avant remplacement d'un tirage existant ;
- les protections contre un nouveau tirage accidentel.

Ne réintroduis pas `sort(() => Math.random() - 0.5)`.

# 15. APPLIQUER LE SYSTÈME DE RÉVÉLATION AUX ORGANISATIONS PHASE, GROUPE ET BRACKET

Le système d'animation ne doit pas être limité à l'organisation globale.

Il faut harmoniser les pages :

- organisation de l'édition ;
- organisation d'une phase ;
- organisation d'un groupe ;
- organisation d'un bracket/node.

Fichiers concernés notamment :

- `phase-organize-client.tsx`
- `group-nodes-organize-client.tsx`
- `bracket-node-matches-organize-client.tsx`
- les pages `organize` correspondantes.

## Comportement

### Organisation d'une phase

Après confirmation :

- révéler les groupes ;
- révéler les participants ;
- révéler les éventuels nodes ;
- révéler les matchs lorsque ceux-ci ont été générés.

### Organisation d'un groupe

Après confirmation :

- révéler les participants affectés ;
- révéler les confrontations ;
- révéler les matchs réellement créés.

### Organisation d'un bracket

Après confirmation :

- révéler les rounds ;
- révéler les nodes ;
- révéler les participants ;
- révéler les confrontations ;
- montrer les BYE.

Le rendu doit être adapté au type de bracket.

Il faut mutualiser les composants et les mécanismes d'animation autant que possible.

Évite de maintenir plusieurs animations ayant chacune des comportements différents.

# 16. AJOUTER LA GESTION DE LA TROISIÈME PLACE AUX PHASES ÉLIMINATOIRES

Actuellement, le projet possède un type d'option `thirdPlaceMatch?: boolean` dans les types API, mais cette option ne semble pas être intégrée de bout en bout dans le système d'organisation.

Je veux que la troisième place soit prise en charge dès la configuration de la compétition.

Cela concerne :

- wizard d'organisation de l'édition ;
- organisation d'une phase ;
- configuration des brackets ;
- génération des nodes ;
- génération des matchs ;
- affichage de l'arbre ;
- animation de tirage ;
- détails des matchs ;
- classements et résultats.

## 16.1. Configuration

Dans les phases de type élimination directe, ajouter une option explicite :
ajout d'un checkbox pour activer la troisième place dans la page d'organisation de la phase et de l'edition (organize)

**Générer le match pour la troisième place**

Cette option doit être disponible dans :

- le wizard global d'organisation de l'édition ;
- l'organisation d'une phase existante.

Elle doit être enregistrée dans la configuration persistée de la phase.

Ne l'applique pas automatiquement à toutes les phases.

L'option doit être désactivée ou masquée lorsque le type de compétition ne permet pas de définir une troisième place pertinente.

## 16.2. Règle métier

Le match pour la troisième place doit opposer les deux perdants des demi-finales.

Il ne doit jamais être créé à partir des finalistes.

Il doit être rattaché à la phase et au bracket correspondants.

Il doit être identifié clairement comme match de troisième place ou petite finale.

## 16.3. Génération

Lors de la génération de l'arbre :

- identifier les demi-finales ;
- préparer un node ou une structure dédiée à la troisième place selon le modèle de données existant ;
- associer les perdants des demi-finales à cette confrontation ;
- générer le match correspondant lorsque les participants sont déterminés ;
- conserver la relation avec les matchs sources.

Attention : selon le moteur actuel, les participants peuvent être déterminés uniquement après validation des demi-finales.

Il faut donc gérer les références aux perdants sans inventer prématurément des participants.

Si le modèle utilise des références de progression, exploite ce mécanisme.

Ne crée pas deux matchs de troisième place.

## 16.4. Modes automatique et manuel

En mode automatique :

- l'arbre doit inclure la petite finale ;
- le match doit être généré automatiquement au moment approprié ;
- la progression doit affecter les perdants des demi-finales.

En mode manuel :

- l'organisateur doit pouvoir activer l'option ;
- le système doit prévoir la confrontation ;
- l'affectation des perdants doit être possible sans manipulation incohérente.

## 16.5. Interface

L'arbre doit distinguer :

- finale ;
- petite finale ;
- demi-finales ;
- autres rounds.

La petite finale doit être affichée de manière claire, sans être confondue avec le tableau principal.

L'animation de révélation doit également l'intégrer.

## 16.6. Résultats et classement

Après validation du match de troisième place :

- déterminer le troisième ;
- déterminer le quatrième ;
- enregistrer les positions si le système le prévoit ;
- mettre à jour les standings ou résultats d'édition concernés ;
- ne pas modifier le vainqueur de la finale.

Vérifie les règles de clôture de phase et d'édition.

La phase ne doit pas être considérée comme terminée si un match obligatoire de troisième place reste à jouer.

Si l'organisateur désactive cette option, la phase doit pouvoir se terminer sans match de troisième place.

## 16.7. Compatibilité

Les anciennes phases sans cette option doivent continuer de fonctionner.

La valeur par défaut doit préserver le comportement historique.

Ne rends pas obligatoire une migration destructive.

Vérifie les formats de brackets existants et leurs règles de progression.

# 17. QUALITÉ DES DONNÉES ET COHÉRENCE DES MOTEURS

Pendant l'ensemble des corrections, respecte les principes suivants :

1. Le serveur est la source de vérité des structures et des résultats.
2. Les composants clients ne doivent pas reconstruire indépendamment les règles métier.
3. Les classements doivent provenir des moteurs officiels.
4. Les qualifications doivent respecter les configurations de phase et d'édition.
5. Les matchs doivent rester rattachés aux bonnes phases, groupes et nodes.
6. Les résultats ne doivent pas provoquer de doubles progressions.
7. Les tirages ne doivent pas être recalculés côté client.
8. Les données supprimées ou archivées doivent respecter les règles existantes.
9. Les autorisations doivent être vérifiées côté serveur.
10. Les caches TanStack Query doivent être invalidés de manière ciblée.

Ne modifie pas une règle métier existante simplement pour simplifier l'interface.

# 18. PERFORMANCE ET QUALITÉ DE L'ARCHITECTURE

Les corrections ne doivent pas créer :

- de requêtes SQL N+1 ;
- de rerenders globaux à chaque scroll ;
- de recalculs de classements dans le client ;
- de duplication des composants ;
- de stores redondants ;
- de dépendances inutiles ;
- de navigation avec `window.location.reload()` lorsqu'une invalidation ciblée est possible ;
- de composants géants contenant toute la logique métier ;
- de conditions CSS impossibles à maintenir.

Utilise les outils déjà présents dans le projet :

- Zustand ;
- TanStack Query ;
- Drizzle ;
- Framer Motion ;
- composants UI existants ;
- hooks et utilitaires partagés.

Conserve les conventions de nommage, les alias et l'organisation des modules.

# 19. TESTS ET VALIDATION OBLIGATOIRES

Après l'implémentation, exécute les vérifications disponibles dans le projet.

Au minimum :

- TypeScript ;
- ESLint ;
- tests unitaires existants ;
- tests métier des moteurs de compétition ;
- build Next.js.

Ajoute des tests ciblés pour les nouvelles règles.

## Tests AppShell

- changement de route ;
- route `layout: none` ;
- top-middle visible ;
- top-middle masqué au scroll ;
- breadcrumbs visibles et absents ;
- ouverture/fermeture left bar ;
- ouverture/fermeture right bar ;
- floating dock visible ;
- FAB visible ;
- changement de viewport ;
- nettoyage des états lors du changement de route.

## Tests sticky tabs

- avec breadcrumbs ;
- sans breadcrumbs ;
- top-middle masqué ;
- mobile ;
- desktop ;
- changement de hauteur du header.

## Tests matchs

- liste des matchs ;
- données participantes ;
- filtres ;
- pagination ;
- recherche ;
- navigation Voir ;
- mes matchs ;
- autres matchs.

## Tests résultats

- résultat en attente ;
- résultat terminé ;
- déverrouillage par organisateur ;
- modification du score ;
- validation ;
- recalcul des classements ;
- absence de double progression.

## Tests organisation

- organisation automatique ;
- organisation manuelle ;
- phases multiples ;
- groupes multiples ;
- participants ;
- nodes ;
- BYE ;
- matchs générés ;
- animation complète ;
- fermeture de l'animation ;
- rechargement après persistance.

## Tests troisième place

- activation de l'option ;
- désactivation de l'option ;
- deux perdants des demi-finales ;
- génération de la petite finale ;
- résultat de la petite finale ;
- classement troisième/quatrième ;
- clôture de phase ;
- absence de doublon ;
- compatibilité des anciennes phases.

Vérifie les résolutions responsive demandées pour les pages participants et matchs.

Ne déclare pas les tests réussis si tu ne les as pas réellement exécutés.

# 20. LIVRABLES ET DOCUMENTATION

Mets à jour les documents techniques pertinents :

- `ANALYSIS.md`
- `TASK.md`
- `IMPLEMENTATION-PLAN.md`
- `ARCHITECTURE.md`

Respecte leur organisation actuelle.

Documente notamment :

1. architecture du nouveau contexte AppShell ;
2. API publique du store ;
3. structure des états de visibilité et des mesures ;
4. fonctionnement des overrides locaux ;
5. comportement des tabs sticky ;
6. architecture des composants de révélation ;
7. règles du match de troisième place ;
8. nouvelles règles de récupération et de filtrage des matchs ;
9. tests exécutés et résultats.

Ne réécris pas les documents entièrement sans nécessité.

# 21. ORDRE D'EXÉCUTION

Travaille dans cet ordre :

**Phase A — Audit**
- comprendre le shell ;
- comprendre les routes ;
- comprendre les providers ;
- identifier les pages et composants concernés ;
- identifier les contrats de données.

**Phase B — AppShell**
- créer le store/contexte ;
- intégrer les composants ;
- exposer les mesures réelles ;
- gérer le scroll ;
- gérer les overrides.

**Phase C — Sticky et composants**
- corriger les tabs de l'édition ;
- corriger les cards matchs ;
- corriger les cards groupes ;
- corriger le responsive participants.

**Phase D — Données et matchs**
- réparer le dashboard matchs ;
- unifier les filtres ;
- ajouter les actions Voir ;
- ajouter Mes matchs ;
- corriger la validation des résultats.

**Phase E — Classements et navigation**
- classement global de phase ;
- classement global d'édition ;
- actions du header.

**Phase F — Organisation et animations**
- révélation globale de l'édition ;
- révélation des phases ;
- révélation des groupes ;
- révélation des brackets ;
- harmonisation des animations dans les pages d'organisation.

**Phase G — Troisième place**
- configuration ;
- persistance ;
- génération ;
- progression ;
- affichage ;
- résultats ;
- classement.

**Phase H — Validation**
- tests ;
- TypeScript ;
- lint ;
- build ;
- documentation ;
- rapport final.

---

# CONSIGNES FINALES IMPORTANTES

- Tu dois intervenir directement dans le code.
- Ne te contente pas de créer des composants sans les intégrer aux pages.
- Ne laisse pas de TODO pour les fonctionnalités demandées.
- Ne crée pas de données fictives pour faire croire que les fonctionnalités fonctionnent.
- Ne remplace pas les moteurs métier existants par des calculs simplifiés.
- Ne casse pas les comportements existants qui fonctionnent déjà.
- Ne supprime aucune fonctionnalité sans justification.
- Ne contourne pas les permissions serveur.
- Ne multiplie pas les implémentations d'un même composant.
- Ne code pas des hauteurs fixes pour remplacer les mesures du shell.
- Ne lance pas un tirage côté client.
- Ne génère pas de matchs de troisième place sans respecter la progression des perdants des demi-finales.
- Ne déclare pas une phase terminée si un match obligatoire reste à jouer.
- Préserve la compatibilité des anciennes éditions.

Si tu découvres un problème supplémentaire directement lié à ces fonctionnalités, corrige-le également lorsqu'il est nécessaire à la cohérence de l'ensemble.

À la fin, fournis un rapport précis contenant :

1. les problèmes réellement identifiés ;
2. les fichiers créés ;
3. les fichiers modifiés ;
4. les changements d'architecture ;
5. les changements de logique métier ;
6. les tests réellement exécutés ;
7. les résultats du build et du lint ;
8. les éventuels problèmes non résolus et leur raison.

**L'objectif final est d'avoir un AppShell intelligent et observable, des dashboards réellement fonctionnels et responsives, et un système d'organisation des tournois complet, cohérent et professionnel, sans régression sur les fonctionnalités déjà opérationnelles de Games-Trafics.**