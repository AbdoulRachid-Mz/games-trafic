# REFONTE TECHNIQUE GLOBALE GAMES-TRAICIC
## Transactions financières · Tournament Engine · Application Shell · PWA · Architecture

**Projet :** Games-Trafic  
**Repository :** https://github.com/AbdoulRachid-Mz/games-trafic  
**Stack existante :** Next.js App Router, TypeScript, Better Auth, PostgreSQL Neon, Drizzle ORM, TanStack Query, shadcn/ui, Tailwind CSS v4 et PWA.

---

# 1. OBJECTIF GÉNÉRAL

Effectuer une refonte technique approfondie et progressive de l'application Games-Trafic.

Cette refonte concerne quatre grands domaines :

1. Le système de transactions financières et toutes ses dépendances.
2. Le système de gestion des tournois et son moteur de compétition.
3. L'architecture de l'Application Shell, des layouts et des mécanismes de vérification.
4. Le système PWA, ses contrôles, son initialisation et ses interactions avec le cycle de vie de l'application.

L'objectif n'est pas de simplement corriger les erreurs visibles ou de réorganiser quelques fichiers.

Il faut analyser les responsabilités, les dépendances, les flux métier, les performances, les problèmes de sécurité et les incohérences architecturales, puis proposer et réaliser une architecture plus propre, modulaire, maintenable, performante et évolutive.

**Règle fondamentale : préserver les fonctionnalités existantes et leur comportement métier lorsqu'ils sont corrects.**

Ne pas réécrire aveuglément les systèmes existants. Toute modification doit être justifiée par une analyse du code, de ses dépendances et de ses effets sur les autres parties de l'application.

# 2. RÈGLES DE TRAVAIL OBLIGATOIRES

Avant toute modification :

- Examiner le code réel du dépôt.
- Lire les fichiers concernés dans leur intégralité lorsque nécessaire.
- Rechercher toutes les utilisations des fonctions, composants, hooks, types et services concernés.
- Identifier les dépendances directes et indirectes.
- Examiner les relations entre les tables Drizzle.
- Comparer les actions, les API, les hooks et les composants qui exécutent des opérations similaires.
- Identifier les comportements réellement utilisés par l'application.
- Distinguer les fonctionnalités terminées, partielles, simulées et inutilisées.
- Vérifier les tests existants et les compléter avant les modifications risquées.

Ne jamais supposer qu'une fonction est inutilisée uniquement parce qu'elle n'est pas importée directement dans une page. Elle peut être appelée par un hook, une autre action, un composant partagé ou une autre couche du système.

Ne pas supprimer une fonction avant d'avoir identifié tous ses consommateurs.

Ne pas modifier le schéma de base de données sans avoir démontré la nécessité de cette modification et évalué ses conséquences sur les données existantes.

Ne pas remplacer une bibliothèque, un système d'authentification ou un mécanisme de stockage sans justification technique.

Ne pas introduire de dépendances inutiles.

Ne pas créer de nouveaux fichiers génériques qui deviennent simplement des fichiers surchargés sous un autre nom.

**Toutes les modifications doivent être progressives, vérifiables et accompagnées de tests.**

---

# 3. PHASE 0 — AUDIT INITIAL ET CARTOGRAPHIE COMPLÈTE

Commencer par une analyse du dépôt entier, avec un focus particulier sur :

- `actions/`
- `app/`
- `components/`
- `hooks/`
- `lib/`
- `database/`
- `types/`
- `config/`
- `public/`
- `tests/`
- `middleware.ts` ou `proxy.ts`, selon l'implémentation actuelle.
- Les configurations PWA, Next.js et les layouts.

Examiner les fichiers d'architecture et les rapports déjà présents, notamment :

- `README.md`
- `ARCHITECTURE.md`
- `ANALYSIS.md`
- `TASK.md`
- `IMPLEMENTATION-PLAN.md`
- `TOURNAMENT-AUDIT.md`
- `TOURNAMENT-IMPLEMENTATION-PLAN.md`
- Les autres documents relatifs aux transactions et à la gestion des erreurs.

Les anciens documents peuvent être obsolètes. Vérifier leurs affirmations à partir du code actuel.

## Livrables initiaux

Créer ou actualiser :

### `ANALYSIS.md`

Présenter :
- L'état réel de l'architecture.
- Les problèmes confirmés.
- Les risques de sécurité.
- Les problèmes de performance.
- Les duplications.
- Les incohérences entre les couches.
- Les fonctionnalités partielles.
- Les dépendances entre les différents domaines.

### `ARCHITECTURE.md`

Décrire :
- L'architecture actuelle.
- L'architecture cible.
- Les responsabilités de chaque couche.
- Les relations entre les services.
- Les flux financiers.
- Le moteur de compétition.
- Le système d'authentification et de vérification.
- L'Application Shell.
- Le PWA.
- Les relations avec la base de données.

### `TASK.md`

Décomposer toutes les tâches techniques, avec :
- Identifiant.
- Description.
- Fichiers concernés.
- Priorité.
- Dépendances.
- Critères de validation.
- Statut : TODO, IN_PROGRESS, DONE ou BLOCKED.

### `IMPLEMENTATION-PLAN.md`

Définir l'ordre précis des modifications et les dépendances entre les phases.

Ne pas commencer une refonte globale avant d'avoir terminé cette cartographie.

---

# 4. PHASE 1 — APPLICATION SHELL, LAYOUT ET PERFORMANCE INITIALE

**Priorité : P0 — À traiter avant les grandes refontes métier.**

Un problème de performance est constaté au démarrage de l'application : le système de vérification lié à l'Application Shell et aux layouts prend parfois trop de temps avant d'afficher l'application.

L'utilisateur ne doit pas avoir l'impression que l'application est bloquée pendant l'exécution de vérifications secondaires.

Il faut analyser précisément :

- `components/layout/app-shell.tsx`
- Tous les composants de `components/layout/`.
- Les layouts de `app/`.
- Les providers globaux.
- Les hooks d'authentification.
- Les mécanismes de résolution des rôles.
- Les protections des routes.
- `config/routes-config.ts`.
- `middleware.ts` ou `proxy.ts`.
- Les contrôles liés au PWA.
- Les vérifications d'installation, de connectivité et de session.

## 4.1 Cartographier le cycle de démarrage

Identifier exactement les opérations effectuées avant l'affichage de l'application.

Pour chacune, déterminer :

- Est-elle indispensable avant le premier rendu ?
- Est-elle indispensable avant l'accès à une route protégée ?
- Peut-elle être exécutée côté serveur ?
- Peut-elle être exécutée en arrière-plan ?
- Peut-elle être mise en cache ?
- Est-elle répétée inutilement ?
- Déclenche-t-elle plusieurs requêtes ?
- Peut-elle bloquer toute l'interface ?
- Peut-elle être exécutée uniquement lorsque la fonctionnalité concernée est utilisée ?

Créer un schéma du cycle de démarrage actuel.

Mesurer les délais de chaque étape lorsque cela est possible.

Ne pas attribuer toutes les lenteurs au PWA ou à l'authentification sans preuve.

## 4.2 Réorganiser les vérifications

Séparer clairement les contrôles en trois catégories.

### A. Contrôles critiques

Ils doivent être effectués avant d'autoriser une opération protégée :

- Validation de la session côté serveur.
- Vérification des permissions nécessaires.
- Vérification des rôles pour les opérations administratives.
- Autorisation des opérations financières.
- Protection des données sensibles.

Ces contrôles ne doivent jamais être supprimés pour améliorer les performances.

### B. Contrôles nécessaires à certaines fonctionnalités

Ils ne doivent être exécutés que lorsque la fonctionnalité correspondante est utilisée.

Exemples :
- Vérification des permissions d'une boutique.
- Vérification des droits de gestion d'un tournoi.
- Vérification d'une fonctionnalité nécessitant une connexion.
- Vérification de certaines capacités du navigateur.

### C. Vérifications secondaires

Lorsqu'elles ne sont pas nécessaires à l'affichage ou à la sécurité, elles doivent être différées.

Exemples :
- Vérification de l'état d'installation PWA.
- Synchronisation secondaire.
- Vérification de certaines fonctionnalités du navigateur.
- Initialisation de services non essentiels.
- Vérification de mises à jour disponibles.
- Collecte d'informations de diagnostic.

## 4.3 Optimiser AppShell

Réexaminer complètement `components/layout/app-shell.tsx`.

Objectifs :

- Réduire les responsabilités de ce composant.
- Éviter qu'il devienne un orchestrateur de toutes les fonctionnalités.
- Supprimer les requêtes redondantes.
- Éviter les chaînes de vérifications asynchrones qui bloquent l'interface.
- Éviter les re-renders globaux inutiles.
- Ne pas monter plusieurs fois les mêmes providers.
- Différencier les composants globaux des composants propres à certaines routes.
- Éviter de charger toutes les fonctionnalités sur toutes les pages.

L'Application Shell doit essentiellement gérer la structure globale et les services réellement nécessaires à son fonctionnement.

Les responsabilités secondaires doivent être décentralisées.

Exemple d'organisation indicative :

```text
components/
  layout/
    app-shell.tsx
    app-providers.tsx
    app-content.tsx
    route-guard.tsx
    navigation/
    overlays/
    loading/

  pwa/
    pwa-provider.tsx
    pwa-install-prompt.tsx
    pwa-update-manager.tsx
    pwa-status.tsx
```

Cette organisation est indicative : l'adapter à l'architecture réellement présente.

## 4.4 Authentification et résolution des rôles

Examiner les mécanismes d'authentification et de résolution des permissions.

Objectifs :

- Ne pas répéter la récupération de la session dans plusieurs composants.
- Éviter les appels successifs inutiles entre client et serveur.
- Réutiliser les données déjà disponibles lorsque leur fraîcheur est suffisante.
- Ne pas confondre état d'authentification côté client et autorisation côté serveur.
- Vérifier les permissions au moment de chaque opération sensible.
- Éviter de charger les informations administratives pour les utilisateurs ordinaires.
- Empêcher les boucles de redirection.
- Gérer correctement les états de chargement, d'expiration et d'erreur.

Ne jamais considérer un rôle stocké dans le navigateur comme une preuve d'autorisation.

## 4.5 Routes et layouts

Examiner la structure des layouts Next.js.

Identifier les routes qui utilisent réellement les mêmes providers et composants.

Éviter de charger dans toutes les pages :
- Les providers administratifs.
- Les fonctionnalités de chat.
- Les services de notifications non nécessaires.
- Les gestionnaires de mises à jour PWA.
- Les fonctionnalités réservées aux boutiques ou aux tournois.

Utiliser les layouts imbriqués lorsque cela améliore réellement la séparation des responsabilités.

Ne pas multiplier artificiellement les layouts.

## 4.6 Critères de validation

- L'application affiche rapidement son interface principale.
- Les contrôles de sécurité restent effectifs.
- Les opérations secondaires ne bloquent plus inutilement le premier rendu.
- Aucune route protégée ne devient accessible sans autorisation.
- Aucun comportement de navigation existant n'est cassé.
- Les providers ne sont pas initialisés plusieurs fois.
- Les requêtes répétitives sont réduites.
- Les erreurs et états de chargement sont correctement gérés.

---

# 5. PHASE 2 — RESTRUCTURATION DU SYSTÈME PWA

**Priorité : P1.**

Analyser les fonctionnalités PWA réellement implémentées et leurs interactions avec AppShell, les layouts, les services workers et les composants.

Examiner :
- La configuration PWA.
- Le service worker.
- Les stratégies de cache.
- Le manifeste.
- L'installation.
- Les notifications.
- Les mises à jour.
- Le mode hors ligne.
- La synchronisation.
- Les événements de cycle de vie.
- Les composants de statut PWA.
- Les hooks et providers associés.

## 5.1 Responsabilités distinctes

Séparer les responsabilités suivantes :

1. Détection des capacités PWA.
2. Installation.
3. Gestion du service worker.
4. Détection des mises à jour.
5. Activation des mises à jour.
6. Stratégies de cache.
7. Détection du mode hors ligne.
8. Synchronisation éventuelle.
9. Notifications.

Chaque fonctionnalité doit être initialisée au moment opportun.

## 5.2 Optimisation du cycle de vie

Éviter :

- L'enregistrement répétitif du service worker.
- Les vérifications répétées à chaque rendu.
- Les listeners dupliqués.
- Les initialisations inutiles à chaque navigation.
- Les appels réseau non indispensables au démarrage.
- Les stratégies de cache qui peuvent afficher des données obsolètes dans des contextes financiers.

Définir une stratégie de cache adaptée à chaque catégorie de données.

**Règle importante :** ne jamais mettre en cache de manière non maîtrisée les données privées, les soldes, les transactions ou les informations sensibles.

Ne pas utiliser une réponse cache obsolète pour autoriser une opération financière.

## 5.3 Interface PWA

Les invitations d'installation et les notifications de mise à jour doivent être discrètes.

Elles ne doivent pas bloquer l'application.

Les composants PWA doivent avoir des responsabilités propres et ne pas encombrer AppShell.

## 5.4 Validation

Tester :
- Première installation.
- Application déjà installée.
- Mise à jour du service worker.
- Mode hors ligne.
- Retour en ligne.
- Navigation normale.
- Session expirée.
- Accès aux pages financières.
- Absence de doublons d'écouteurs.
- Comportement sur mobile et desktop.

---

# 6. PHASE 3 — REFONTE DU SYSTÈME DE TRANSACTIONS

**Priorité : P0 — Sécurité et intégrité financière.**

Réaliser une refonte complète du système financier sans perdre les fonctionnalités existantes.

Examiner toutes les couches :

- Pages.
- Composants.
- Hooks.
- Server Actions.
- API Routes.
- Services.
- Ledger.
- Comptes financiers.
- Wallets.
- Commandes.
- Paiements.
- Demandes de dépôt et retrait.
- Escrow.
- Remboursements.
- Frais.
- Récompenses.
- Schéma de base de données.
- Types.
- Exports et historiques.

Fichiers particulièrement importants :

```text
actions/transactions.ts
actions/wallets.ts
actions/orders.ts
actions/requests.ts

lib/ledger/
lib/db/

types/transaction-types.ts

app/api/transactions/
app/api/wallet/

app/(protected)/wallet/
app/admin/transactions/
```

Rechercher également toutes les autres utilisations de ces fonctions dans l'application.

## 6.1 Sécurité

Corriger impérativement :

- Les actions financières sans contrôle d'autorisation suffisant.
- Les remboursements accessibles sans vérification adéquate.
- Les modifications de statut non autorisées.
- Les opérations système accessibles par un argument contrôlé par le client.
- Les accès aux transactions d'autres utilisateurs.
- Les possibilités de falsification des montants.
- Les possibilités de rejouer une opération.
- Les problèmes de concurrence.
- Les transitions de statut invalides.

Les permissions doivent être vérifiées côté serveur.

Les fonctions internes du système financier ne doivent pas être exposées directement comme Server Actions accessibles au navigateur.

## 6.2 Architecture financière cible

Organiser le système en domaines spécialisés :

```text
lib/
  finance/
    core/
      money.ts
      finance-errors.ts
      transaction-types.ts
      transaction-state.ts

    accounts/
      account-service.ts
      account-validation.ts

    wallets/
      wallet-service.ts
      wallet-balance.ts

    ledger/
      ledger-engine.ts
      ledger-validation.ts
      ledger-utils.ts

    transactions/
      transaction-service.ts
      transaction-policy.ts
      transaction-validation.ts
      idempotency-service.ts

    fees/
      fee-engine.ts
      fee-rules.ts

    payments/
      payment-service.ts
      provider-registry.ts
      deposit-service.ts
      withdrawal-service.ts

    escrow/
      escrow-service.ts

    refunds/
      refund-service.ts

    orders/
      order-payment-service.ts

    tournament/
      tournament-payment-service.ts

    rewards/
      reward-service.ts
```

Adapter cette structure aux fonctionnalités existantes.

Ne pas multiplier les services artificiellement : chaque fichier doit correspondre à une responsabilité identifiable.

## 6.3 Ledger et atomicité

Le ledger doit être la source comptable de vérité.

Garantir :

- Équilibre débit/crédit.
- Validation des comptes.
- Impossibilité de créer des écritures non équilibrées.
- Gestion des devises et précisions monétaires.
- Traçabilité.
- Historique immuable.
- Remboursements par écritures inverses ou compensatoires.
- Idempotence.
- Protection contre les doubles débits.
- Protection contre les soldes négatifs lorsque cela est interdit.

L'ensemble des modifications nécessaires à une opération doit être atomique.

Utiliser le contexte transactionnel Drizzle (`tx`) et transmettre ce contexte aux services qui participent à l'opération.

Ne pas effectuer un débit dans une transaction SQL puis enregistrer ses effets métier dans une deuxième transaction indépendante.

## 6.4 Machine à états

Centraliser les transitions autorisées.

Définir précisément les statuts existants et leur signification.

Exemple indicatif :

```text
PENDING
  -> PROCESSING
  -> COMPLETED
  -> FAILED

COMPLETED
  -> REFUNDED
```

Ne pas imposer ces transitions si le métier existant nécessite d'autres cas.

Chaque transition doit :
- Être autorisée.
- Être validée.
- Être traçable.
- Être idempotente.
- Être exécutée côté serveur.

## 6.5 Calcul des frais

Un seul moteur doit calculer les frais.

Éliminer les implémentations concurrentes dans :
- `actions/transactions.ts`
- `lib/ledger/ledger-utils.ts`
- Les API de calcul des frais.

Le client peut demander une estimation, mais le montant définitif doit toujours être recalculé et validé côté serveur.

Définir une représentation monétaire fiable.

Éviter les erreurs de précision liées aux calculs flottants.

## 6.6 Commandes et escrow

Revoir le parcours complet :

1. Création de commande.
2. Vérification du produit.
3. Vérification du prix.
4. Réservation du produit.
5. Débit de l'acheteur.
6. Immobilisation des fonds.
7. Confirmation de livraison.
8. Validation de la commande.
9. Paiement du vendeur.
10. Déduction des frais.
11. Gestion des litiges.
12. Annulation.
13. Remboursement.

Vérifier particulièrement la cohérence entre le montant brut, les frais, le montant net et le solde réellement disponible dans l'escrow.

## 6.7 Paiements de tournoi

Revoir complètement le parcours d'inscription payante.

Il doit garantir la cohérence entre :
- L'édition.
- L'inscription.
- Le participant.
- Le montant.
- Les frais.
- La transaction.
- Le paiement.
- Le statut de l'inscription.

Éviter les inscriptions payantes incomplètes.

Définir le comportement en cas de :
- Solde insuffisant.
- Double clic.
- Timeout.
- Erreur SQL.
- Paiement réussi mais réponse perdue.
- Inscription annulée.
- Tournoi supprimé ou fermé.
- Remboursement.

## 6.8 API et Server Actions

Les Server Actions doivent être de fines couches d'entrée.

Elles doivent :
1. Valider les données.
2. Récupérer l'identité de l'utilisateur.
3. Vérifier les permissions.
4. Appeler le service métier.
5. Retourner une réponse typée et cohérente.

Les API Routes et Server Actions qui exécutent la même opération doivent utiliser les mêmes services.

Éviter les implémentations métier indépendantes.

## 6.9 Interface et hooks

Ne pas casser les pages et composants existants.

Préserver les fonctionnalités de :
- Dépôt.
- Retrait.
- Transfert.
- Achat.
- Paiement.
- Historique.
- Détail d'une transaction.
- Administration.
- Demandes.
- Remboursement.

Corriger les formulaires, états de chargement, erreurs et validations.

Les montants affichés doivent être cohérents avec les données du serveur.

---

# 7. PHASE 4 — RECONSTRUCTION DU TOURNAMENT ENGINE

**Priorité : P1 — Domaine métier majeur.**

Le système de tournoi doit devenir un véritable moteur de compétition, indépendant de l'interface utilisateur.

Les pages et composants ne doivent plus contenir les algorithmes de génération, de classement, de qualification ou de progression.

Le moteur doit fonctionner indépendamment de React, Next.js et des composants UI.

## 7.1 Audit complet des consommateurs

Analyser notamment :

```text
actions/editions.ts
actions/phases.ts
actions/participants.ts
actions/tournaments.ts
actions/edition-registrations.ts

lib/tournaments/

hooks/

components/pages/tournaments/

app/
  .../tournaments/
  .../editions/

types/
database/schema.ts

tests/unit/tournaments/
```

Ne pas se limiter à ces fichiers : rechercher tous les consommateurs réels.

Documenter les relations entre :
- Tournois.
- Éditions.
- Inscriptions.
- Participants.
- Joueurs.
- Équipes.
- Phases.
- Groupes.
- Brackets.
- Nœuds.
- Matchs.
- Résultats.
- Classements.
- Qualifications.

## 7.2 Participant normalisé

Le moteur doit prendre en charge deux catégories de participants :

### Participant individuel

Un utilisateur inscrit à une compétition.

### Participant équipe

Une équipe inscrite à une compétition.

Le moteur doit utiliser une représentation métier normalisée.

Il ne doit pas supposer que tous les participants sont des utilisateurs.

Il ne doit pas non plus confondre une équipe avec ses membres.

Le roster de l'équipe doit rester une responsabilité distincte.

Préserver la compatibilité avec le schéma existant autant que possible.

## 7.3 Formats de compétition

Auditer chaque format existant et établir son niveau réel de fonctionnement.

Formats à prendre en compte :

### A. Single Elimination

- Génération du tableau.
- Nombre de participants.
- Puissance de deux.
- BYE.
- Répartition initiale.
- Têtes de série.
- Matchs.
- Progression.
- Demi-finales.
- Finale.
- Détermination du vainqueur.

### B. Double Elimination

- Upper bracket.
- Lower bracket.
- Passage des perdants.
- Répartition des perdants dans le lower bracket.
- Matchs de qualification.
- Grande finale.
- Finale de reset si nécessaire.
- Gestion des BYE dans les deux branches.

Ne pas déclarer ce format fonctionnel tant que les deux branches et leurs interactions ne sont pas correctement implémentées.

### C. Round Robin

- Tous contre tous.
- Nombre de journées.
- Gestion du nombre impair de participants.
- BYE.
- Aller simple.
- Aller-retour si pris en charge.
- Classement final.

### D. Group Stage

- Nombre de groupes.
- Nombre de participants par groupe.
- Répartition équilibrée.
- Tirage.
- Têtes de série.
- Journées.
- Classement.
- Qualification.
- Passage à la phase suivante.

### E. Swiss System

- Génération de la première ronde.
- Appariements successifs.
- Points.
- Adversaires déjà rencontrés.
- Éviter les rematches lorsque possible.
- BYE.
- Tiebreakers.
- Classement.
- Détermination des qualifiés.

Ne pas créer uniquement des nœuds pour toutes les rondes : il faut un véritable moteur d'appariement successif.

### F. Formats combinés

Prévoir la possibilité de construire une compétition comprenant plusieurs phases.

Exemple :

```text
Édition
  |
  |-- Phase 1 : Group Stage
  |       |
  |       |-- Groupe A
  |       |-- Groupe B
  |       |-- Groupe C
  |
  |-- Qualification
  |
  |-- Phase 2 : Single Elimination
          |
          |-- Quarts
          |-- Demi-finales
          |-- Finale
```

Les transitions doivent être configurables et vérifiables.

## 7.4 Architecture cible du moteur

Réorganiser `lib/tournaments/` en domaines cohérents.

Structure indicative :

```text
lib/
  tournaments/
    core/
      types.ts
      errors.ts
      constants.ts
      rules.ts
      participant.ts
      registry.ts

    registration/
      registration-service.ts
      participant-service.ts
      team-service.ts
      roster-service.ts
      check-in-service.ts

    draws/
      draw-engine.ts
      seeding-engine.ts
      random-draw.ts
      seeded-draw.ts

    generation/
      group-allocation.ts
      match-generator.ts
      phase-generator.ts
      bracket-generator.ts

    formats/
      single-elimination/
        generator.ts
        progression.ts
        rules.ts

      double-elimination/
        generator.ts
        progression.ts
        rules.ts

      round-robin/
        generator.ts
        standings.ts
        rules.ts

      group-stage/
        generator.ts
        qualification.ts
        rules.ts

      swiss/
        pairing-engine.ts
        standings.ts
        rules.ts

    standings/
      standings-engine.ts
      tiebreaker-engine.ts
      qualification-engine.ts

    progression/
      progression-engine.ts
      propagation-engine.ts
      result-engine.ts

    services/
      tournament-service.ts
      edition-service.ts
      phase-service.ts
      match-service.ts
      result-service.ts

    repositories/
      tournament.repository.ts
      edition.repository.ts
      phase.repository.ts
      participant.repository.ts
      match.repository.ts

    validation/
      tournament-validation.ts
      phase-validation.ts
      registration-validation.ts
      result-validation.ts

    tests/
```

Adapter cette organisation à l'existant.

Ne pas déplacer arbitrairement les fichiers si cela ne simplifie pas réellement les responsabilités.

## 7.5 Responsabilité des moteurs

Les moteurs doivent être constitués de fonctions aussi pures que possible.

Exemples :

```ts
generateBracket(input)
allocateParticipantsToGroups(input)
generateRoundRobinSchedule(input)
generateSwissPairings(input)
calculateStandings(input)
resolveTieBreakers(input)
selectQualifiedParticipants(input)
resolveMatchWinner(input)
calculateNextPhaseParticipants(input)
```

Ces fonctions ne doivent pas directement effectuer de requêtes SQL.

Les services métier orchestrent les moteurs, les validations et les opérations en base.

Les repositories gèrent l'accès aux données.

Les Server Actions servent uniquement de points d'entrée.

## 7.6 Prévisualisation avant génération

Créer un mécanisme de simulation permettant de prévisualiser une configuration avant de l'enregistrer.

La prévisualisation doit présenter :

- Nombre de participants.
- Nombre de groupes.
- Répartition des participants.
- Nombre de matchs.
- Nombre de journées.
- BYE.
- Nombre de tours.
- Structure des brackets.
- Nombre de qualifiés.
- Structure des phases suivantes.
- Incohérences détectées.
- Règles qui ne peuvent pas être satisfaites.

La simulation ne doit modifier aucune donnée persistante.

La génération réelle doit utiliser les mêmes algorithmes et validations que la prévisualisation.

## 7.7 Tirages et têtes de série

Distinguer :

- Tirage aléatoire.
- Tirage avec têtes de série.
- Répartition équilibrée.
- Tirage manuel.
- Tirage reproductible.

Pour les tirages aléatoires, prévoir une graine (`seed`) permettant de reproduire un tirage.

Enregistrer les informations nécessaires pour auditer le résultat.

Ne pas permettre de modifier silencieusement un tirage après la génération des matchs.

## 7.8 Classements et départages

Centraliser les règles de classement.

Les règles doivent être configurables en fonction du format.

Examiner notamment :

- Points.
- Confrontation directe.
- Différence de buts.
- Buts marqués.
- Victoires.
- Départages supplémentaires.
- Égalités multiples.

Ne pas annoncer la prise en charge d'une règle qui n'est pas réellement exécutée.

Les résultats non confirmés ne doivent pas influencer les classements.

## 7.9 Qualifications et progression

Définir un mécanisme générique de qualification entre phases.

Une règle doit préciser :
- La phase source.
- La méthode de sélection.
- Le nombre de qualifiés.
- Les éventuels critères de départage.
- La phase destination.
- Le groupe ou emplacement destination.
- L'ordre d'insertion.

Éviter les références symboliques non contrôlées.

Chaque qualification doit être résolue et traçable.

Gérer les modifications de résultats après progression.

Si un résultat est corrigé après la génération de la phase suivante, définir une stratégie sûre :
- Recalcul.
- Invalidation des résultats dépendants.
- Blocage si des matchs dépendants ont déjà commencé.
- Validation administrative si nécessaire.

Ne jamais laisser des participants incohérents dans les phases suivantes.

## 7.10 Transactions SQL et concurrence

Toutes les opérations qui modifient plusieurs éléments d'une compétition doivent être atomiques lorsque nécessaire.

Exemples :
- Génération d'une phase.
- Création des matchs.
- Confirmation d'un résultat.
- Mise à jour du classement.
- Qualification.
- Progression.
- Propagation.
- Clôture d'une édition.

Utiliser un contexte transactionnel Drizzle cohérent.

Prévenir :
- Les doubles générations.
- Les doubles qualifications.
- Les doubles matchs.
- Les résultats concurrents.
- Les doubles progressions.
- Les participants dupliqués.
- Les transitions invalides.

Prévoir une stratégie d'idempotence.

---

# 8. PHASE 5 — ALLÈGEMENT DES ACTIONS SURCHARGÉES

**Priorité : P1.**

Les fichiers suivants sont actuellement trop volumineux et regroupent trop de responsabilités :

```text
actions/phases.ts
actions/tournaments.ts
```

Leur refactorisation est obligatoire.

Cependant, il faut impérativement préserver les imports utilisés dans les pages, composants et hooks existants.

## 8.1 Principe : compatibilité des points d'entrée

Ne pas commencer par renommer tous les imports de l'application.

Déplacer d'abord les fonctions vers des modules spécialisés.

Puis conserver les anciens fichiers comme façades de compatibilité.

Exemple :

```text
actions/
  tournaments/
    index.ts
    queries.ts
    mutations.ts
    participants.ts
    registrations.ts
    administration.ts
    settings.ts

  phases/
    index.ts
    queries.ts
    mutations.ts
    generation.ts
    groups.ts
    progression.ts
    standings.ts
    qualifications.ts
    administration.ts
```

Les anciens fichiers peuvent devenir :

```ts
// actions/tournaments.ts

export * from "./tournaments/index";
```

Et :

```ts
// actions/phases.ts

export * from "./phases/index";
```

Les chemins existants doivent continuer à fonctionner.

**Ne pas imposer une modification de tous les imports existants simplement parce que les fichiers ont été réorganisés.**

## 8.2 Répartition des responsabilités

Déplacer les fonctions en fonction de leur véritable responsabilité.

Exemples :

| Domaine | Responsabilités |
|---|---|
| Queries | Lecture des tournois, éditions, phases, matchs |
| Mutations | Création, modification, suppression |
| Participants | Ajout, retrait, gestion des participants |
| Registrations | Inscriptions, validation, annulation |
| Generation | Génération des structures et des matchs |
| Groups | Gestion des groupes et affectations |
| Standings | Classements et statistiques |
| Qualifications | Sélection et transfert des qualifiés |
| Progression | Passage aux tours et phases suivantes |
| Administration | Actions administratives et validations |

Ne pas copier une fonction dans deux modules.

Chaque responsabilité doit avoir une implémentation unique.

## 8.3 Préserver les signatures

Conserver autant que possible :

- Les noms des fonctions.
- Les paramètres.
- Les valeurs de retour.
- Les types.
- Les comportements métier.
- Les contrats utilisés par les hooks.

Si une signature doit changer, effectuer une migration complète et documentée.

Ne pas introduire des changements de contrat silencieux.

## 8.4 Réduire la duplication

Identifier les fonctions similaires dans :

- `actions/tournaments.ts`
- `actions/phases.ts`
- `actions/editions.ts`
- `actions/participants.ts`
- `actions/edition-registrations.ts`
- `lib/tournaments/`

Les actions ne doivent pas réimplémenter les mêmes règles métier.

Les opérations communes doivent être déplacées vers les services correspondants.

## 8.5 Compatibilité Next.js Server Actions

Vérifier les contraintes de Next.js concernant les modules contenant `"use server"`.

Ne pas transformer aveuglément un module d'actions en simple fichier de réexportation si cela provoque des problèmes de compilation ou d'export.

Conserver une organisation compatible avec la version Next.js du projet.

Vérifier les builds réels après chaque lot.

---

# 9. PHASE 6 — PAGES, COMPOSANTS ET HOOKS DES TOURNOIS

Après stabilisation du moteur et des services, auditer toutes les interfaces de gestion des tournois.

Objectifs :

- Réduire les composants trop volumineux.
- Supprimer les calculs métier présents dans l'interface.
- Centraliser les types de réponses.
- Éviter les requêtes répétées.
- Unifier les états de chargement et les erreurs.
- Réutiliser les composants lorsque cela a du sens.
- Améliorer l'expérience mobile et desktop.

Les composants doivent afficher et déclencher des opérations, pas contenir le moteur de compétition.

## 9.1 Hooks

Examiner les hooks existants.

Les hooks doivent :
- Appeler les points d'entrée existants.
- Utiliser TanStack Query de manière cohérente.
- Définir des clés de requête stables.
- Invalider uniquement les données concernées.
- Gérer correctement les erreurs.
- Éviter les appels en double.
- Ne pas reproduire les calculs métier du serveur.

Préserver les signatures publiques des hooks autant que possible.

## 9.2 Pages et composants

Analyser :
- Liste des tournois.
- Détail d'un tournoi.
- Liste des éditions.
- Détail d'une édition.
- Inscriptions.
- Participants.
- Équipes.
- Groupes.
- Matchs.
- Brackets.
- Classements.
- Résultats.
- Administration.
- Exports.

Conserver l'identité visuelle de H³ Infinity Gaming.

Ne pas effectuer une refonte graphique arbitraire.

Améliorer l'organisation et l'expérience utilisateur en cohérence avec le thème actuel.

---

# 10. PHASE 7 — EXPORTS ET RAPPORTS

Examiner les systèmes d'export :

```text
lib/utils/member-export-utils.ts
utils/export-utils.ts

components/pages/tournaments/edition-detail/
  bracket-export-button.tsx
```

Vérifier les formats réellement implémentés.

Objectifs :
- Unifier la préparation des données.
- Éviter les calculs de classement différents entre écran et export.
- Garantir l'exactitude des participants.
- Garantir l'exactitude des résultats.
- Respecter les permissions.
- Éviter l'exposition des données privées.
- Préserver les formats fonctionnels.

Ne pas annoncer un format d'export qui n'est pas réellement pris en charge.

---

# 11. PHASE 8 — TESTS ET VALIDATION GLOBALE

Les tests existants doivent être conservés et complétés.

## 11.1 Tests financiers

Tester notamment :

- Débit.
- Crédit.
- Transfert.
- Dépôt.
- Retrait.
- Frais.
- Solde insuffisant.
- Ledger équilibré.
- Remboursement.
- Escrow.
- Commande.
- Paiement de tournoi.
- Double soumission.
- Concurrence.
- Autorisations.
- Statuts invalides.
- Échec au milieu d'une opération.

Vérifier qu'une erreur ne laisse jamais une opération partiellement enregistrée.

## 11.2 Tests tournoi

Tester notamment :

- Participants individuels.
- Équipes.
- Inscriptions.
- Tirages.
- Têtes de série.
- Répartition des groupes.
- Round Robin.
- Single Elimination.
- Double Elimination.
- Swiss.
- BYE.
- Classements.
- Départages.
- Qualifications.
- Progression.
- Correction de résultats.
- Concurrence.
- Annulation.
- Réinitialisation lorsque permise.

Inclure des tests avec des nombres de participants très variés : 1, 2, 3, 5, 7, 8, 11, 16, 32 et d'autres cas limites.

## 11.3 Tests AppShell et PWA

Vérifier :
- Premier rendu.
- Session valide.
- Session expirée.
- Utilisateur non connecté.
- Utilisateur administrateur.
- Utilisateur standard.
- Navigation entre layouts.
- Redirections.
- Installation PWA.
- Mise à jour.
- Mode hors ligne.
- Retour en ligne.
- Absence de vérifications répétitives.

## 11.4 Validation de compilation

Après chaque phase :

- Exécuter le typecheck.
- Exécuter les tests pertinents.
- Exécuter ESLint selon les scripts du projet.
- Vérifier les imports.
- Vérifier les exports.
- Effectuer un build de production lorsque le lot le permet.

Ne pas désactiver les vérifications TypeScript ou ESLint pour faire passer le build.

Ne pas masquer les erreurs avec des `any`, des casts abusifs ou des `@ts-ignore` non justifiés.

---

# 12. ORDRE D'EXÉCUTION OBLIGATOIRE

Ne pas exécuter toutes les modifications simultanément.

Respecter cet ordre :

| Ordre | Phase | Priorité |
|---|---|---|
| 0 | Audit et cartographie | Obligatoire |
| 1 | AppShell, layout et cycle de démarrage | P0 |
| 2 | PWA et initialisation différée | P1 |
| 3 | Sécurité et intégrité financière | P0 |
| 4 | Refactorisation du Tournament Engine | P1 |
| 5 | Décomposition des actions surchargées | P1 |
| 6 | Adaptation des pages, hooks et composants | P1 |
| 7 | Exports et rapports | P2 |
| 8 | Tests globaux et stabilisation | Obligatoire |

Les problèmes critiques de sécurité financière doivent être traités immédiatement après leur identification, sans attendre la fin des optimisations visuelles.

Si une dépendance impose de modifier l'ordre, documenter la raison dans `IMPLEMENTATION-PLAN.md`.

---

# 13. STRATÉGIE DE MODIFICATION

Travailler par lots indépendants et vérifiables.

Pour chaque lot :

1. Identifier les fichiers concernés.
2. Identifier les consommateurs.
3. Définir le comportement attendu.
4. Ajouter ou adapter les tests.
5. Effectuer les modifications.
6. Vérifier les types.
7. Vérifier les imports.
8. Exécuter les tests.
9. Comparer le comportement avant/après.
10. Mettre à jour les documents.

Ne pas mélanger plusieurs refontes majeures dans un même lot.

Ne pas supprimer les anciennes implémentations avant que les nouvelles aient été validées.

Préserver les points d'entrée publics lorsque possible.

Si une migration de base de données est nécessaire :
- Documenter le changement.
- Prévoir la compatibilité avec les données existantes.
- Éviter les pertes de données.
- Prévoir une stratégie de migration et de rollback.

Ne jamais effectuer une opération destructive sur la base de production.

---

# 14. CRITÈRES DE RÉUSSITE

La refonte sera considérée comme réussie lorsque les conditions suivantes seront satisfaites.

## Application Shell et PWA

- Le premier affichage n'attend plus des vérifications secondaires.
- Les contrôles critiques restent sécurisés.
- Les providers sont organisés.
- Les initialisations sont maîtrisées.
- Les fonctionnalités PWA ne bloquent plus l'application.
- Les navigations et redirections fonctionnent correctement.

## Transactions

- Les opérations sont sécurisées côté serveur.
- Le ledger reste équilibré.
- Les opérations sont atomiques.
- Les doublons sont empêchés.
- Les remboursements sont traçables.
- Les frais sont centralisés.
- Les commandes et l'escrow sont cohérents.
- Les paiements de tournoi fonctionnent correctement.
- Les pages et composants existants conservent leurs fonctionnalités.

## Tournois

- Les responsabilités sont séparées.
- Les actions surchargées sont allégées.
- Les imports existants restent compatibles.
- Les participants individuels et les équipes sont correctement gérés.
- Les générateurs produisent des structures valides.
- Les BYE sont correctement gérés.
- Les classements sont exacts.
- Les qualifications sont déterministes.
- La progression est atomique.
- Les formats annoncés sont réellement fonctionnels.
- Les pages, hooks et composants restent opérationnels.

## Qualité générale

- Pas de régression fonctionnelle.
- Pas de duplication métier inutile.
- Pas de contournement de sécurité.
- Pas de désactivation des vérifications de qualité.
- Pas de dépendances inutiles.
- Documentation à jour.
- Tests pertinents et reproductibles.

---

# 15. RAPPORT FINAL OBLIGATOIRE

À la fin, produire un rapport détaillé indiquant :

1. Les problèmes identifiés.
2. Les problèmes corrigés.
3. Les problèmes non corrigés et pourquoi.
4. Les fichiers créés.
5. Les fichiers déplacés.
6. Les fichiers supprimés.
7. Les fonctions conservées.
8. Les fonctions refactorisées.
9. Les compatibilités préservées.
10. Les changements de schéma.
11. Les migrations.
12. Les améliorations de performances mesurées.
13. Les résultats des tests.
14. Les résultats du build.
15. Les éventuelles limitations restantes.

Mettre à jour :

- `ANALYSIS.md`
- `ARCHITECTURE.md`
- `TASK.md`
- `IMPLEMENTATION-PLAN.md`
- `README.md` si les instructions ou l'architecture publique changent.

Ne pas déclarer une phase terminée tant que ses critères de validation ne sont pas satisfaits.

---

# INSTRUCTION FINALE

Je veux une véritable amélioration architecturale de H³ Infinity Gaming, pas un simple nettoyage esthétique.

Il faut privilégier :

- La séparation claire des responsabilités.
- La cohérence des règles métier.
- La sécurité des opérations.
- La fiabilité des transactions.
- La précision des algorithmes de compétition.
- La performance du démarrage de l'application.
- La stabilité des interfaces existantes.
- La compatibilité des imports.
- La testabilité.
- La maintenabilité à long terme.

**Commence par la PHASE 0 : audit, cartographie et documentation.**

Ne commence pas à modifier massivement le code avant d'avoir établi l'état réel du système et les dépendances.

Ensuite, exécute les phases dans l'ordre défini, en validant chaque lot avant de passer au suivant.

En cas de doute sur une fonctionnalité existante, recherche son comportement réel avant de la modifier.

**La priorité est de construire une architecture fiable sans casser ce qui fonctionne déjà.**