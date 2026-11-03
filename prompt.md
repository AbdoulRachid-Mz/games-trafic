# MASTER PROMPT — REFACTORING COMPLET DU SYSTÈME DE TRANSACTIONS
## Games Trafic — Architecture financière, administration et portefeuille utilisateur

Tu interviens sur le projet **Games Trafic**, une plateforme gaming avec un système de portefeuille GTC, des transactions entre utilisateurs, des achats, des inscriptions aux tournois, des dépôts, des retraits et des opérations administratives.

Repository : https://github.com/AbdoulRachid-Mz/games-trafic

Ta mission est de réaliser une **refonte complète, cohérente, sécurisée et maintenable du système de transactions**, aussi bien côté administration que côté utilisateurs.

Il ne s'agit pas simplement de modifier quelques composants ou de refaire le design. Tu dois comprendre le fonctionnement financier actuel, identifier les incohérences, consolider les règles métier et reconstruire les parcours nécessaires sans casser les fonctionnalités existantes.

---

# PHASE 0 — RÈGLES DE TRAVAIL OBLIGATOIRES

Avant toute modification :

1. Explore le projet réel et son architecture.
2. Identifie les technologies, conventions et patterns déjà utilisés.
3. Lis les schémas de base de données, les types, les actions serveur, les services, les API, les hooks et les composants concernés.
4. Recherche toutes les références aux transactions et aux opérations financières.
5. Trace les flux depuis l'interface jusqu'à la base de données.
6. Identifie les dépendances entre les pages, les composants, les actions et les tables.
7. Ne suppose jamais qu'une fonctionnalité existe uniquement parce qu'un type ou un composant porte son nom.
8. Ne crée pas une deuxième implémentation d'une logique métier déjà présente sans avoir justifié cette décision.
9. Ne supprime aucune fonctionnalité sans analyser ses dépendances et proposer une migration.
10. Ne modifie pas le schéma de données avant d'avoir identifié les conséquences sur les données existantes.

**Interdiction de commencer par le code.** La première étape est obligatoirement l'audit.

Ne te limite pas aux fichiers mentionnés dans ce prompt. Utilise la recherche globale du dépôt pour découvrir tous les fichiers qui participent réellement au système.

Ne fais pas de refonte superficielle : chaque décision doit être fondée sur le code réellement trouvé.

---

# PHASE 1 — AUDIT COMPLET DU SYSTÈME EXISTANT

## 1.1 Cartographie des transactions

Explore notamment, sans te limiter à :

- `actions/transactions.ts`
- `actions/wallets.ts`
- `types/transaction-types.ts`
- `database/schema.ts`
- `database/db.sql`
- `app/admin/transactions/`
- `app/(protected)/wallet/transactions/`
- `components/pages/transactions/`
- `components/pages/admin/transactions/`
- `lib/finance/`
- `validations/`
- `hooks/`
- `config/`

Vérifie les véritables chemins dans le projet et adapte-toi à leur organisation actuelle.

Identifie :

- Toutes les catégories de transactions.
- Tous les statuts possibles.
- Les types de comptes financiers.
- Les comptes de portefeuille.
- Les écritures comptables.
- Les mécanismes de débit et de crédit.
- Les commissions et frais éventuels.
- Les remboursements.
- Les annulations.
- Les demandes de transaction.
- Les opérations administratives.
- Les notifications associées.
- Les historiques et reçus.
- Les limites et règles de validation.

## 1.2 Traçage de chaque opération

Pour chaque type de transaction, documente le parcours complet :

`Page → Composant → Hook → Action/API → Service métier → Base de données → Résultat → Notification`

Vérifie notamment :

- Où le montant est calculé.
- Où le solde est vérifié.
- Où le destinataire est récupéré.
- Où les autorisations sont vérifiées.
- Où les écritures comptables sont créées.
- Où le statut est modifié.
- Comment les erreurs sont retournées.
- Comment les doublons sont évités.
- Comment les transactions concurrentes sont gérées.

Signale toutes les divergences entre le frontend et le backend.

## 1.3 Audit des autorisations administratives

Le projet possède des administrateurs de niveaux A, B et C.

Recherche précisément :

- La définition des rôles.
- Le champ `users.level` et son enum.
- Les permissions existantes.
- Les contrôles dans les actions serveur.
- Les contrôles dans les pages et composants.
- Les éventuelles différences entre `role`, `isAdmin` et `level`.

Ne considère jamais qu'un simple contrôle `isAdmin` suffit à autoriser une opération financière.

Documente les permissions réellement appliquées et les éventuelles failles.

## 1.4 Audit de la création des transactions utilisateur

Analyse intégralement le parcours de création dans le portefeuille.

Vérifie :

- Les paramètres URL.
- La récupération des entités.
- Les configurations par type.
- Les étapes du formulaire.
- Les composants conditionnels.
- Les validations.
- Les calculs de montant.
- La confirmation.
- L'exécution.
- Les retours d'erreur.
- La navigation après transaction.

Vérifie particulièrement les paramètres :

- `editionId`
- `tournamentId`
- `itemId`
- `productId`
- `userId`
- `targetId`
- `entityId`
- `id`

Chaque paramètre doit être interprété selon le type de transaction. Ne te contente pas de récupérer un identifiant générique si cela risque de charger la mauvaise entité.

---

# PHASE 2 — DOCUMENTATION ET PROPOSITION D'ARCHITECTURE

Avant d'implémenter, crée deux fichiers à la racine :

## `TRANSACTION-AUDIT.md`

Il doit contenir :

1. Architecture financière actuelle.
2. Cartographie des fichiers concernés.
3. Liste des types et statuts existants.
4. Fonctionnement du ledger.
5. Flux de chaque transaction.
6. Fonctionnement administratif actuel.
7. Fonctionnement utilisateur actuel.
8. Problèmes de sécurité.
9. Incohérences entre types, enums et schémas.
10. Problèmes UX/UI.
11. Doublons et logiques dispersées.
12. Risques de régression.
13. Éléments fonctionnels à préserver.

Chaque constat doit mentionner les fichiers concernés et, lorsque possible, les fonctions responsables.

Ne présente pas une hypothèse comme un problème confirmé.

## `TRANSACTION-IMPLEMENTATION-PLAN.md`

Il doit contenir :

1. Architecture cible.
2. Organisation des modules.
3. Modèle financier proposé.
4. Permissions A/B/C.
5. Fonctionnement des demandes administratives.
6. Parcours utilisateur par type.
7. Modifications du schéma.
8. Modifications des types.
9. Modifications des actions et services.
10. Modifications des interfaces.
11. Stratégie de migration.
12. Tests nécessaires.
13. Plan d'implémentation par phases.
14. Risques et mesures de protection.

**Arrête-toi après ces deux documents et présente le bilan de l'audit ainsi que les décisions architecturales proposées.** Ne commence l'implémentation qu'après validation du plan.

---

# PHASE 3 — NOUVELLE ARCHITECTURE FINANCIÈRE

Après validation du plan, refactorise le système autour d'un moteur financier centralisé.

## 3.1 Principe fondamental

Il doit exister une seule source de vérité pour les opérations financières.

Les opérations doivent passer par des services métier communs qui garantissent :

- La cohérence du ledger.
- L'atomicité.
- La validation des montants.
- Les autorisations.
- L'idempotence.
- La traçabilité.
- La gestion des erreurs.
- La cohérence des statuts.

Les Server Actions et API routes doivent rester des points d'entrée. Elles ne doivent pas contenir toute la logique comptable.

## 3.2 Architecture indicative

Propose une organisation adaptée au projet, par exemple :

```text
lib/
  finance/
    core/
      ledger.ts
      accounts.ts
      transaction-engine.ts
      transaction-context.ts
      idempotency.ts
    transactions/
      transfer.ts
      issuance.ts
      deposit.ts
      withdrawal.ts
      purchase.ts
      refund.ts
    requests/
      transaction-requests.ts
      approval.ts
    policies/
      admin-transaction-policy.ts
      transaction-limits.ts
    validations/
      transaction-validation.ts
    utils/
      transaction-reference.ts
      transaction-errors.ts

actions/
  transactions/
    transfer.ts
    purchase.ts
    deposit.ts
    withdrawal.ts
    requests.ts
  admin/
    transactions/
      issuance.ts
      requests.ts
      history.ts
      refund.ts

components/
  pages/
    transactions/
      create/
    admin/
      transactions/
```

Cette structure est indicative. Ne la reproduis pas aveuglément si l'organisation actuelle du projet justifie une meilleure solution.

Évite les fichiers géants et les dépendances circulaires.

---

# PHASE 4 — SYSTÈME DE CRÉDIT GTC ADMINISTRATEUR

C'est une fonctionnalité prioritaire.

Nous devons créer un véritable système d'émission contrôlée de GTC, distinct d'un transfert classique.

## 4.1 Règles métier

### Administrateurs A et B

Les administrateurs de niveau A et B peuvent :

- Créer une opération de crédit GTC.
- Choisir un destinataire.
- Créditer un utilisateur ordinaire.
- Créditer un administrateur C.
- Indiquer un montant.
- Ajouter un motif obligatoire.
- Consulter leurs opérations.
- Consulter les détails et le statut des opérations.

Ils ne doivent pas avoir besoin de posséder eux-mêmes les GTC envoyés.

**Important :** le système ne doit pas débiter leur portefeuille personnel.

### Administrateurs C

Les administrateurs C ne peuvent pas émettre directement des GTC.

Ils peuvent :

- Créer une demande de crédit.
- Sélectionner le destinataire.
- Indiquer le montant.
- Fournir un motif obligatoire.
- Consulter leurs demandes.
- Consulter le statut de chaque demande.
- Voir les informations de validation ou de rejet.

Aucun GTC ne doit être crédité lors de la soumission.

### Approbateurs

Les administrateurs autorisés, selon la politique définie, peuvent :

- Consulter les demandes en attente.
- Examiner le demandeur.
- Examiner le destinataire.
- Vérifier le montant.
- Consulter le motif.
- Approuver.
- Rejeter avec une justification obligatoire.

Une approbation déclenche le mouvement comptable réel.

Un rejet ne doit jamais modifier le solde.

Le demandeur ne peut pas approuver sa propre demande.

## 4.2 Modèle comptable recommandé

Étudie le ledger existant avant de créer de nouvelles tables.

Le modèle recommandé est un compte de contrepartie système dédié à l'émission, par exemple :

`SYSTEM_GTC_ISSUANCE`

Lors d'une émission de 500 GTC :

- Débit du compte système d'émission : 500 GTC.
- Crédit du compte portefeuille destinataire : 500 GTC.

Le mouvement doit être équilibré et enregistré atomiquement.

Le compte système doit être clairement identifié comme un compte technique de contrepartie, pas comme le portefeuille d'un utilisateur.

Ne crée pas de solde système fictif ou de mécanisme qui permettrait d'émettre sans aucune trace comptable.

Si le modèle de ledger actuel n'est pas compatible, propose et documente la migration nécessaire.

## 4.3 Limites et contrôle

Prévoir une architecture permettant de configurer :

- Le montant minimal.
- Le montant maximal par opération.
- Le plafond journalier.
- Les limites par niveau.
- Les opérations nécessitant une deuxième approbation.

Ces limites doivent être validées côté serveur.

Ne fixe pas arbitrairement des montants métier sans justification. Utilise une configuration documentée et des valeurs adaptées à la politique actuelle du projet.

## 4.4 Traçabilité

Chaque émission doit conserver :

- Identifiant de transaction.
- Administrateur émetteur.
- Niveau administratif au moment de l'opération.
- Destinataire.
- Montant.
- Motif.
- Date.
- Type d'émission.
- Compte de contrepartie.
- Statut.
- Référence comptable.

Pour les demandes :

- Demandeur.
- Destinataire.
- Montant.
- Motif.
- Date de soumission.
- Statut.
- Approbateur.
- Date de décision.
- Justification de rejet éventuelle.
- Transaction réellement générée après approbation.

L'historique ne doit pas être modifiable par les utilisateurs ordinaires.

---

# PHASE 5 — REFONTE COMPLÈTE DE L'INTERFACE ADMINISTRATEUR

La page `/admin/transactions` doit disposer de son propre système d'interface.

**Ne réutilise pas directement les formulaires de création utilisateur.**

Les composants peuvent partager des éléments UI génériques, mais les parcours et les règles métier doivent être distincts.

## 5.1 Tableau de bord

Organise l'interface autour de :

- Vue générale des transactions.
- Historique.
- Émissions GTC.
- Demandes de crédit.
- Dépôts.
- Retraits.
- Remboursements.
- Filtres et recherches.

N'affiche que les catégories réellement supportées par le backend.

## 5.2 Formulaire d'émission

Créer un formulaire spécifique avec :

1. Sélection du destinataire.
2. Recherche par pseudo, nom ou identifiant.
3. Identification claire du destinataire.
4. Affichage de son portefeuille.
5. Saisie du montant GTC.
6. Motif obligatoire.
7. Récapitulatif.
8. Confirmation.
9. Résultat de l'opération.

Le formulaire doit afficher explicitement que l'émission ne débite pas le portefeuille personnel de l'administrateur.

Prévoir un état de chargement, les erreurs, les validations et la confirmation de réussite.

## 5.3 Formulaire de demande

Pour un administrateur C :

1. Sélection du destinataire.
2. Saisie du montant.
3. Motif.
4. Récapitulatif.
5. Soumission de la demande.

Afficher clairement que la demande n'est pas encore un crédit et que le portefeuille ne sera modifié qu'après approbation.

## 5.4 Gestion des demandes

Créer une interface adaptée aux approbateurs :

- Liste des demandes.
- Filtres par statut.
- Détails complets.
- Bouton approuver.
- Bouton rejeter.
- Champ de justification du rejet.
- Confirmation avant décision.
- Historique des décisions.

Les boutons doivent être conditionnés par les permissions réelles.

## 5.5 Composants

Créer des composants spécialisés et réutilisables :

- `AdminTransactionTable`
- `AdminTransactionFilters`
- `AdminGtcIssuanceForm`
- `AdminGtcRequestForm`
- `TransactionRequestTable`
- `TransactionRequestDetails`
- `TransactionApprovalDialog`
- `TransactionRejectionDialog`
- `TransactionAuditDetails`

Adapte les noms et l'organisation aux conventions du projet.

---

# PHASE 6 — REFONTE DU PARCOURS UTILISATEUR / WALLET

Le parcours de création de transaction côté utilisateur doit être repensé pour être entièrement piloté par le type de transaction.

Objectif : ne plus afficher un formulaire générique avec des champs qui ne correspondent pas à l'opération.

Chaque type doit disposer de ses propres données, composants, validations et étapes.

## 6.1 Architecture du parcours

Le parcours doit suivre une logique commune, mais avec des étapes conditionnelles :

```text
Identification du type
       ↓
Chargement des données nécessaires
       ↓
Formulaire spécifique au type
       ↓
Validation
       ↓
Récapitulatif
       ↓
Confirmation
       ↓
Exécution serveur
       ↓
Résultat
```

Ne force pas tous les types à utiliser exactement le même nombre d'étapes.

Les composants génériques doivent se limiter aux éléments réellement communs : progression, navigation, récapitulatif, erreurs et confirmation.

## 6.2 TRANSFER — Transfert entre utilisateurs

Le formulaire doit proposer :

- Recherche du destinataire.
- Sélection du destinataire.
- Vérification du destinataire.
- Affichage de son identité.
- Montant à envoyer.
- Frais éventuels.
- Total à débiter.
- Motif facultatif si le modèle le permet.
- PIN ou confirmation de sécurité si déjà implémenté.

Vérifier :

- Solde suffisant.
- Destinataire existant et autorisé.
- Absence d'auto-transfert.
- Limites applicables.
- Frais.
- Idempotence.

## 6.3 TOURNAMENT_PARTICIPATION — Inscription à un tournoi

Le formulaire doit récupérer les informations du tournoi et surtout de son édition.

Si l'URL contient `editionId`, ce paramètre doit être prioritaire pour charger l'édition.

Afficher :

- Image et nom du tournoi.
- Nom de l'édition.
- Dates.
- Jeu concerné.
- Format.
- Frais d'inscription.
- Informations du participant.
- Conditions de participation.
- Montant final.

Ne jamais se contenter de récupérer le tournoi parent si l'opération concerne une édition.

Vérifier côté serveur :

- Édition existante.
- Édition ouverte aux inscriptions.
- Date limite.
- Places disponibles.
- Éligibilité du participant.
- Inscription déjà existante.
- Frais réels définis en base.
- Cohérence entre édition et tournoi.

La transaction et l'inscription doivent être cohérentes : aucune inscription payée ne doit exister sans mouvement comptable valide, et aucun débit ne doit rester sans inscription correspondante en cas d'échec.

## 6.4 GAME_ITEM_PURCHASE — Achat d'items de jeu

Récupérer l'item exact depuis son identifiant.

Afficher :

- Nom de l'item.
- Image.
- Jeu associé.
- Description.
- Prix GTC.
- Quantité si autorisée.
- Total.
- Informations nécessaires à la livraison.

Valider :

- Item disponible.
- Prix actuel.
- Stock éventuel.
- Quantité.
- Propriétaire/vendeur.
- Conditions de vente.

Ne jamais faire confiance au prix envoyé depuis le client.

## 6.5 PRODUCT_PURCHASE — Achat de produits

Afficher :

- Produit.
- Boutique.
- Vendeur.
- Prix.
- Quantité.
- Livraison ou retrait selon les fonctionnalités existantes.
- Total.
- Informations complémentaires nécessaires.

Vérifier la disponibilité et le prix réel côté serveur.

## 6.6 THEME_PURCHASE — Achat de thème

Afficher :

- Aperçu du thème.
- Nom.
- Créateur.
- Prix.
- Conditions d'utilisation.

Vérifier que le thème est disponible et que l'utilisateur ne le possède pas déjà si cette règle s'applique.

## 6.7 VIP_SUBSCRIPTION — Abonnement VIP

Afficher :

- Offre.
- Durée.
- Prix.
- Avantages.
- Date de début et de fin estimée.

Valider l'offre et les règles de renouvellement côté serveur.

## 6.8 DEPOSIT — Dépôt

Afficher uniquement les moyens de dépôt réellement disponibles.

Adapter les champs au fournisseur :

- Montant.
- Fournisseur.
- Référence.
- Numéro ou compte de paiement.
- Justificatif si nécessaire.

Ne pas mélanger les champs de retrait et de dépôt.

## 6.9 WITHDRAWAL — Retrait

Afficher :

- Montant.
- Frais.
- Total débité.
- Moyen de retrait.
- Coordonnées du bénéficiaire.
- Récapitulatif.
- Confirmation.

Valider les limites et les coordonnées côté serveur.

## 6.10 Cohérence des paramètres URL

Créer une stratégie centralisée de résolution des entités.

Exemples :

- `TOURNAMENT_PARTICIPATION` → `editionId` prioritaire.
- `GAME_ITEM_PURCHASE` → `itemId`.
- `PRODUCT_PURCHASE` → `productId`.
- `TRANSFER` → `userId` ou `targetId`, selon la convention réellement retenue.
- `THEME_PURCHASE` → identifiant du thème.
- `VIP_SUBSCRIPTION` → identifiant de l'offre.

Ne pas interpréter arbitrairement un paramètre `id` sans connaître le type.

Gérer les cas :

- Identifiant manquant.
- Entité inexistante.
- Entité indisponible.
- Type incompatible.
- Paramètres contradictoires.
- Données de chargement.
- Erreur réseau.
- Retour arrière.

Les entités doivent être récupérées depuis la base de données avec les autorisations nécessaires.

---

# PHASE 7 — SÉCURITÉ ET INTÉGRITÉ COMPTABLE

Cette phase est non négociable.

## 7.1 Ledger

Chaque opération financière doit respecter le principe de partie double.

Pour chaque transaction :

- Somme des débits = somme des crédits.
- Aucune écriture isolée.
- Aucun solde négatif non autorisé.
- Aucune modification manuelle du solde sans écriture correspondante.
- Aucune suppression d'une transaction financière validée.

## 7.2 Atomicité

Utilise les transactions SQL adaptées au driver réellement utilisé.

Les opérations doivent regrouper dans une même transaction :

- Vérification des conditions.
- Verrouillage si nécessaire.
- Écritures comptables.
- Mise à jour des soldes matérialisés si le projet en utilise.
- Enregistrement de la transaction.
- Mise à jour du statut.
- Création des références nécessaires.

Vérifie les possibilités réelles du driver et de Neon/PostgreSQL. Ne suppose pas qu'une méthode ou un verrouillage existe sans vérifier sa compatibilité.

## 7.3 Idempotence

Chaque opération financière sensible doit être protégée contre les répétitions.

Une même clé d'idempotence ne doit pas générer plusieurs débits ou crédits.

## 7.4 Concurrence

Empêche notamment :

- Deux débits simultanés qui dépassent le solde.
- Deux approbations de la même demande.
- Deux inscriptions payantes pour une même place restante.
- Deux achats du même stock disponible.

Utilise les contraintes et mécanismes PostgreSQL adaptés.

## 7.5 Permissions

Toutes les permissions doivent être vérifiées côté serveur.

Ne fais jamais confiance :

- Au rôle fourni par le client.
- Au niveau A/B/C envoyé par le client.
- Au montant calculé dans le frontend.
- Au statut envoyé par le frontend.
- À l'identifiant d'un compte financier fourni par le client.

## 7.6 Remboursements

Un remboursement doit créer un véritable mouvement comptable inverse.

Ne transforme pas une transaction en `REFUNDED` sans mouvement financier réel.

Vérifie les remboursements partiels, les remboursements multiples et les opérations déjà compensées.

## 7.7 Journal d'audit

Prévoir une traçabilité fiable des opérations sensibles.

Les journaux doivent permettre de reconstituer qui a fait quoi, sur quel compte, à quel moment, pour quel motif et avec quel résultat.

---

# PHASE 8 — TYPES, SCHÉMA ET MIGRATIONS

Analyse toutes les définitions TypeScript et PostgreSQL.

Harmonise :

- Enums.
- Types de transaction.
- Statuts.
- Références.
- Comptes.
- Demandes.
- Écritures comptables.
- Résultats d'actions.
- DTO.
- Schémas de validation.

Ne laisse pas une valeur définie dans TypeScript mais absente de PostgreSQL.

Ne conserve pas des catégories obsolètes uniquement pour faire compiler le projet.

Toute modification de schéma doit inclure :

1. Migration Drizzle adaptée.
2. Gestion des données existantes.
3. Valeurs par défaut pertinentes.
4. Index.
5. Contraintes.
6. Relations et clés étrangères.
7. Vérification des requêtes existantes.
8. Compatibilité avec le déploiement.

Ne réinitialise jamais la base de données pour simplifier la migration.

---

# PHASE 9 — TESTS ET VALIDATION

Ajoute ou adapte des tests couvrant au minimum les scénarios suivants.

## 9.1 Administrateurs

- A émet des GTC vers un utilisateur.
- A émet des GTC vers un administrateur C.
- B émet des GTC vers un utilisateur.
- B émet des GTC vers un administrateur C.
- C ne peut pas émettre directement.
- C peut soumettre une demande.
- Une demande ne crédite aucun portefeuille avant approbation.
- A/B peuvent approuver selon la politique.
- Le demandeur ne peut pas approuver sa propre demande.
- Un rejet ne modifie aucun solde.
- Une demande ne peut pas être approuvée deux fois.
- Un utilisateur non autorisé ne peut pas appeler les actions administratives.

## 9.2 Comptabilité

- Chaque émission équilibre les écritures.
- Le compte système est correctement débité.
- Le destinataire est correctement crédité.
- Aucun portefeuille personnel d'administrateur n'est débité pour une émission.
- Les opérations répétées sont idempotentes.
- Les échecs SQL ne laissent aucune écriture partielle.
- Les opérations concurrentes restent cohérentes.
- Les remboursements génèrent des écritures inverses.

## 9.3 Utilisateurs

- Transfert valide.
- Transfert vers soi-même refusé.
- Solde insuffisant.
- Destinataire inexistant.
- Édition de tournoi récupérée avec `editionId`.
- Édition fermée aux inscriptions.
- Inscription déjà existante.
- Item de jeu indisponible.
- Prix modifié entre affichage et confirmation.
- Produit indisponible.
- Thème déjà possédé.
- Offre VIP invalide.
- Dépôt avec paramètres manquants.
- Retrait avec coordonnées invalides.

## 9.4 Interface

Vérifie :

- Desktop.
- Mobile.
- États de chargement.
- États vides.
- Erreurs.
- Confirmations.
- Navigation.
- Rafraîchissement.
- Filtres.
- Recherche.
- Accessibilité.
- Cohérence du thème H³ Infinity Gaming.

---

# PHASE 10 — DESIGN ET UX/UI

La refonte doit respecter l'identité visuelle actuelle de H³ Infinity Gaming.

Ne crée pas un design étranger à l'application.

## Principes

- Interface moderne et cohérente.
- Hiérarchie visuelle claire.
- Composants spécialisés.
- Formulaires lisibles.
- Récapitulatifs financiers explicites.
- Montants GTC clairement affichés.
- Statuts immédiatement identifiables.
- Dialogues de confirmation adaptés au risque.
- Responsive design.
- États vides et erreurs soignés.

Évite les interfaces surchargées.

Ne réutilise pas le même formulaire pour toutes les transactions simplement pour réduire le nombre de composants.

Privilégie une composition de composants spécialisés à partir de composants UI génériques.

---

# PHASE 11 — QUALITÉ ET NON-RÉGRESSION

Après chaque phase :

1. Vérifie les types TypeScript.
2. Lance les tests concernés.
3. Lance le lint si disponible.
4. Vérifie les imports.
5. Vérifie les actions serveur.
6. Vérifie les pages concernées.
7. Vérifie les migrations.
8. Contrôle les régressions.

N'ajoute pas de `any` pour contourner les erreurs.

N'utilise pas de `@ts-ignore` ou de désactivation de lint sans justification documentée.

Ne masque pas les erreurs avec des valeurs par défaut artificielles.

Ne duplique pas les validations métier entre frontend et backend : le frontend améliore l'expérience, le backend reste l'autorité.

Ne modifie pas les fonctionnalités hors périmètre sans justification.

---

# PHASE 12 — RAPPORT FINAL

À la fin, mets à jour ou crée :

- `TRANSACTION-AUDIT.md`
- `TRANSACTION-IMPLEMENTATION-PLAN.md`
- `TRANSACTION-IMPLEMENTATION-REPORT.md`

Le rapport final doit présenter :

1. Les problèmes identifiés.
2. Les problèmes corrigés.
3. L'architecture finale.
4. Les fichiers créés.
5. Les fichiers modifiés.
6. Les migrations.
7. Les règles A/B/C effectivement appliquées.
8. Le fonctionnement du compte d'émission.
9. Le fonctionnement des demandes.
10. Les parcours utilisateur par type.
11. Les tests exécutés.
12. Les résultats des tests.
13. Les erreurs restantes.
14. Les points non implémentés.
15. Les éventuelles opérations manuelles nécessaires avant déploiement.

Ne prétends jamais qu'un test a réussi s'il n'a pas été exécuté.

---

# DIRECTIVE FINALE

Le résultat attendu n'est pas une simple amélioration visuelle.

Nous voulons un système financier cohérent, centralisé, traçable, sécurisé et évolutif.

Les deux espaces doivent être distincts dans leur expérience :

- **Administration :** gestion des transactions, émission de GTC, demandes et approbations, supervision et historique.
- **Utilisateur :** création guidée de transactions adaptées au type d'opération, avec récupération précise des entités et affichage des informations pertinentes.

Cependant, ils doivent utiliser le même moteur financier et les mêmes garanties comptables.

**Commence exclusivement par la PHASE 0 et la PHASE 1.** Explore le dépôt, trace les flux réels, puis rédige `TRANSACTION-AUDIT.md` et `TRANSACTION-IMPLEMENTATION-PLAN.md`.

Présente-moi ensuite le bilan et attends ma validation avant toute modification du code.

Ne fais aucune migration, suppression, modification de schéma ou refonte UI pendant cette première étape.

La priorité absolue est la justesse des opérations financières, la sécurité des permissions et l'intégrité du ledger.