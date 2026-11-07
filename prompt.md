# GAMES-TRAFICS — AUDIT ET REFONTE DU WALLET, DES TRANSACTIONS ET DE LA SÉCURITÉ

## 1. CONTEXTE DU PROJET

Projet : Games-Trafics

Dépôt : https://github.com/AbdoulRachid-Mz/games-trafic

Stack :
- Next.js 16.4.3 — App Router
- React 19
- TypeScript strict
- PostgreSQL / Neon
- Drizzle ORM
- Better Auth
- Better Auth Passkey
- Tailwind CSS 4
- Framer Motion
- Bun
- Vercel

Architecture financière :
- user_wallets
- wallet_transactions
- financial_accounts
- ledger_entries
- idempotency_keys
- Moteur financier centralisé dans lib/finance/

IMPORTANT : Le ledger en partie double est la source de vérité des soldes. Il ne faut jamais réintroduire un système de modification directe des soldes des wallets.

L'objectif est de corriger les problèmes actuels et d'améliorer considérablement l'expérience de transaction sans compromettre la sécurité financière.

## 2. RÈGLES DE TRAVAIL

Avant toute modification :

1. Examiner le dépôt et son architecture réelle.
2. Lire les fichiers concernés dans leur intégralité.
3. Examiner les migrations Drizzle existantes.
4. Examiner les services financiers et les contrats des Server Actions.
5. Identifier les relations entre le frontend, Better Auth, les wallets et le ledger.
6. Identifier les fonctionnalités existantes à préserver.

Ne pas remplacer des composants existants sans comprendre leurs dépendances.

Ne pas créer une deuxième implémentation d'une fonctionnalité déjà disponible.

Ne pas multiplier les Server Actions similaires.

Privilégier les services réutilisables et les contrats TypeScript cohérents.

---

# PHASE 1 — CORRECTION DU SCHÉMA ET DES REQUÊTES SQL

## 1.1. Erreur actuelle

Erreur PostgreSQL :

column "reference" does not exist

Localisation :
actions/wallets.ts
actions/transactions.ts

Le schéma Drizzle déclare notamment :

- reference
- idempotencyKey
- createdByUserId
- actorLevel
- reason
- reversalOf
- reversedBy
- completedAt

Mais la base Neon ne semble pas contenir toutes ces colonnes.

## 1.2. Audit obligatoire

Comparer automatiquement :

- database/schema.ts
- Toutes les migrations du dossier drizzle/
- La structure réelle de PostgreSQL via information_schema.columns.
- Les index, contraintes uniques et clés étrangères.

Examiner particulièrement wallet_transactions.

Identifier toutes les colonnes absentes, les types différents et les index manquants.

## 1.3. Migration

Créer une migration SQL versionnée et sécurisée.

Exigences :

- Ajouter les colonnes manquantes sans supprimer les données.
- Créer les index et contraintes nécessaires.
- Préserver les transactions historiques.
- Éviter les doublons de références.
- Ne pas recréer les tables existantes.
- Prévoir une migration compatible avec les données de production.

Ne pas utiliser db:push aveuglément sur la production.

Tester la migration sur une base de staging avant application.

Vérifier ensuite que les requêtes Drizzle utilisant select() fonctionnent correctement.

## 1.4. Requêtes de transactions

Auditer les deux implémentations :

- getWalletTransactions dans actions/wallets.ts
- getWalletTransactions dans actions/transactions.ts

Éviter les divergences de comportement.

Créer une implémentation canonique si cela est pertinent, en conservant les contrats utilisés par les pages existantes.

Vérifier :
- Pagination.
- Filtres.
- Statuts.
- Dates.
- Types de transactions.
- Tri.
- Transactions entrantes et sortantes.
- Exclusion des transactions supprimées.

Toutes les lectures doivent vérifier que le wallet appartient à l'utilisateur connecté, sauf autorisation administrative explicite.

---

# PHASE 2 — REFONTE DES STATISTIQUES DU WALLET

Fichiers principaux :

- app/(protected)/wallet/client-page.tsx
- components/pages/wallet/stats-overview.tsx
- components/pages/wallet/transaction-list.tsx
- actions/wallets.ts

## 2.1. Problème actuel

Dans client-page.tsx, le chargement des transactions précède celui des statistiques dans le même try.

Si la récupération des transactions échoue, les statistiques ne sont jamais chargées.

Séparer les chargements pour qu'une erreur indépendante ne bloque pas l'autre.

## 2.2. Source des statistiques

Utiliser financial_accounts et ledger_entries comme source de vérité des mouvements financiers.

Calculer :

- Nombre total de transactions.
- Nombre de transactions terminées.
- Transactions en attente.
- Revenus totaux.
- Dépenses totales.
- Volume financier.
- Évolution mensuelle.
- Activité quotidienne ou hebdomadaire.

Les mouvements doivent être calculés pour le compte financier du wallet.

Ne pas assimiler systématiquement TRANSFER à un revenu ou à une dépense : déterminer le sens du mouvement.

## 2.3. Transactions entrantes et sortantes

Une transaction de transfert possède :
- fromUserId
- toUserId
- walletId
- financialAccountId

Le walletId est actuellement principalement associé au wallet expéditeur.

Ne pas compter uniquement walletTransactions.walletId pour déterminer toute l'activité du bénéficiaire.

Utiliser les relations entre ledger_entries et financial_accounts pour déterminer les mouvements réellement associés au compte.

Pour le nombre de transactions, utiliser un comptage distinct afin d'éviter les doublons.

Intégrer les transactions en attente lorsqu'elles ne possèdent pas encore d'écritures de ledger, sans les compter deux fois.

## 2.4. Sécurité

getWalletLedgerStats et getWalletLedgerDailyFlow doivent vérifier l'appartenance du wallet à l'utilisateur connecté.

Un utilisateur ne doit jamais pouvoir fournir arbitrairement le walletId d'un autre utilisateur pour consulter ses statistiques.

Les erreurs SQL ne doivent pas être silencieusement transformées en statistiques à zéro.

Retourner un résultat exploitable par le frontend avec gestion explicite des erreurs.

## 2.5. Interface

Conserver le design existant.

Améliorer :
- Les états de chargement.
- Les skeletons.
- Les états vides.
- L'actualisation.
- Les graphiques.
- Les montants entrants et sortants.
- Les indicateurs de variation.

Corriger également le useEffect de StatsOverview : sa dépendance doit tenir compte de walletId pour éviter de conserver des données associées à un ancien wallet.

---

# PHASE 3 — REFONTE DU PARCOURS DE CRÉATION DE TRANSACTIONS

Fichiers principaux :

- app/(protected)/wallet/transactions/create/page.tsx
- types/transaction-types.ts
- components/pages/transactions/create/
- actions/transactions.ts

Conserver l'architecture par étapes et les configurations TRANSACTION_CONFIGS.

Types à préserver :

- TRANSFER
- DEPOSIT
- WITHDRAWAL
- VIP_SUBSCRIPTION
- GAME_ITEM_PURCHASE
- ORDER_PURCHASE
- THEME_PURCHASE
- TOURNAMENT_PARTICIPATION
- PURCHASE
- REFUND
- BONUS

Chaque type conserve ses propres règles métier.

## 3.1. Fluidité

Améliorer le passage entre les étapes.

- Transitions visuelles rapides.
- Éviter les rechargements inutiles.
- Conserver les informations déjà saisies lors d'un retour en arrière.
- Éviter les doubles soumissions.
- Désactiver uniquement les contrôles concernés pendant les opérations.
- Afficher clairement les frais et le montant final.
- Éviter les redirections prématurées.

Après une authentification réussie, l'utilisateur doit rester dans son parcours de transaction.

Après confirmation, afficher TransactionSuccess et permettre à l'utilisateur de choisir entre le wallet et l'historique.

Conserver les reçus et les notifications existants.

Ne pas rediriger automatiquement vers les produits.

## 3.2. Contrôle des étapes

Auditer les appels à nextStep(), executeConfirm() et handleConfirm().

Garantir qu'une étape n'est pas sautée et qu'une opération n'est pas exécutée deux fois.

Préserver les cas particuliers :
- Dépôt : création d'une demande.
- Retrait : création d'une demande.
- Achat d'item : création de demande.
- Achat produit : création de commande.
- Transfert : exécution financière.
- Abonnement : exécution selon les règles existantes.

Ne pas transformer une demande en transaction terminée prématurément.

---

# PHASE 4 — CORRECTION ET REFONTE DU PASSKEY

Fichier actuel :

components/pages/transactions/create/pin-verification.tsx

Problème :

authClient.signIn.passkey() lance une authentification Better Auth avec un mécanisme de redirection.

Ce comportement ne convient pas à la validation d'une transaction déjà initiée par un utilisateur connecté.

## 4.1. Objectif

Créer une validation Passkey spécifique aux transactions.

Elle doit fonctionner sans déconnecter l'utilisateur, sans modifier sa session et sans déclencher la navigation vers la page de produits.

## 4.2. Audit technique

Examiner :

- lib/auth.ts
- lib/auth-client.ts
- @better-auth/passkey
- Les credentials enregistrés dans la table passkey.
- Les API WebAuthn compatibles avec les credentials existants.

Ne pas confondre connexion à l'application et autorisation d'une transaction.

Ne pas considérer le simple retour success de signIn.passkey() comme une autorisation financière.

## 4.3. Architecture attendue

Mettre en place un challenge WebAuthn spécifique :

1. Le client demande une autorisation pour la transaction en cours.
2. Le serveur vérifie l'utilisateur et le wallet.
3. Le serveur génère un challenge cryptographiquement sécurisé.
4. Le challenge est lié à l'utilisateur, au wallet, au type, au montant, au destinataire et aux frais applicables.
5. Le navigateur déclenche navigator.credentials.get() via une implémentation compatible.
6. Le serveur vérifie la signature et le credential enregistré.
7. Le serveur vérifie l'expiration et l'absence de réutilisation.
8. Le serveur autorise une seule exécution de la transaction.

L'autorisation doit être à usage unique et être consommée de manière atomique avec l'opération financière, autant que possible.

Une preuve valable pour un montant ou un destinataire ne doit pas pouvoir être réutilisée pour un autre.

Ne jamais faire confiance à une simple variable React ou à un booléen envoyé par le navigateur.

## 4.4. Compatibilité PIN

Conserver le PIN comme méthode alternative.

Les deux méthodes doivent aboutir à une autorisation vérifiée côté serveur :

- PIN validé.
- Passkey validé.

Adapter createTransaction dans actions/transactions.ts pour accepter les deux mécanismes de façon sécurisée.

Conserver les règles d'autorisation propres aux types de transactions.

Ne pas supprimer la vérification PIN obligatoire pour les transferts et les retraits sans mécanisme de remplacement équivalent.

---

# PHASE 5 — REFONTE DE LA SAISIE DU PIN

Composant :

components/pages/transactions/create/pin-verification.tsx

Le pavé numérique actuel présente des problèmes d'affichage.

## Objectif

Privilégier un champ PIN natif et contrôlé.

Caractéristiques :

- inputMode="numeric".
- Saisie numérique uniquement.
- Type password avec possibilité d'afficher/masquer.
- Longueur conforme à WalletUtils.validatePinStrength().
- Retour visuel instantané.
- Clavier mobile natif.
- Clavier physique.
- Gestion correcte du focus.
- Désactivation pendant la validation.
- Messages d'erreur explicites.

Si un pavé numérique personnalisé est conservé, corriger les variables CSS incompatibles et afficher correctement toutes les positions du PIN.

Le composant ne doit jamais afficher le PIN dans les logs.

Ajouter un lien « PIN oublié ? » redirigeant vers :

/wallet/settings?tab=security&action=recover-pin

---

# PHASE 6 — SÉLECTION DES CONTACTS POUR LES TRANSFERTS

Fichiers :

- components/pages/transactions/create/recipient-selector.tsx
- actions/users.ts
- actions/transactions.ts

Une fonction getRecentRecipients existe déjà.

Elle doit être améliorée.

## 6.1. Contacts récents

Récupérer les utilisateurs avec lesquels l'utilisateur connecté a déjà effectué ou reçu un transfert.

Utiliser :
- fromUserId
- toUserId
- type TRANSFER
- createdAt

Prendre en compte les deux directions.

Dédupliquer les contacts.

Ne pas inclure l'utilisateur connecté.

Exclure les wallets supprimés, inactifs et verrouillés.

Limiter la liste à 10 ou 20 résultats.

## 6.2. Interface

Ajouter un bouton :

« Mes contacts récents »

Au clic, afficher les contacts précédemment associés aux transferts.

Pour chaque contact afficher :
- Avatar.
- Nom ou pseudonyme.
- Numéro de wallet masqué.
- Éventuellement la date du dernier transfert.

Permettre la sélection immédiate.

Conserver les recherches existantes :
- Par nom.
- Par numéro de téléphone.
- Par numéro de wallet.
- Par QR Code.

## 6.3. Sécurité

Ne jamais permettre un transfert vers soi-même.

Vérifier côté serveur :
- L'identité du destinataire.
- L'existence du wallet.
- Son état actif.
- Son verrouillage.
- La disponibilité de son compte financier.

Ne jamais considérer la liste des contacts du frontend comme une autorisation.

---

# PHASE 7 — AMÉLIORATION DE LA SAISIE DU MONTANT

Composant :

components/pages/transactions/create/amount-input.tsx

Ajouter quatre boutons d'incrémentation :

- -1000 GTC
- -100 GTC
- +100 GTC
- +1000 GTC

Les boutons doivent modifier directement le montant contrôlé.

Règles :
- Montant minimal : zéro pendant la saisie.
- Ne jamais produire de montant négatif.
- Respecter le montant minimum configuré pour la transaction.
- Recalculer les frais après chaque modification.
- Actualiser le montant total à débiter.
- Respecter le solde disponible.
- Préserver la validation serveur.

Ne pas afficher ces boutons pour les éléments à prix fixe ou les sélections de quantité lorsqu'ils sont inappropriés.

Conserver les boutons de montants rapides existants.

---

# PHASE 8 — RÉINITIALISATION DU PIN OUBLIÉ

Emplacement principal :

app/(protected)/wallet/settings/page.tsx

Ne pas créer une nouvelle page de paramètres.

La récupération du PIN doit être intégrée à la page existante.

## 8.1. Interface

Ajouter une section « Sécurité du wallet ».

Proposer :
- Modifier mon PIN.
- PIN oublié ?
- Récupérer mon accès.

Le lien présent dans l'étape de validation d'une transaction doit conduire directement à cette section.

## 8.2. Canaux disponibles

Proposer :
- Email vérifié.
- WhatsApp sur numéro vérifié.

Les moyens disponibles doivent dépendre des coordonnées réellement vérifiées.

Le schéma actuel possède :
- users.email
- users.emailVerified
- users.phoneNumber

Il ne possède pas de champ explicite phoneVerifiedAt dans la définition consultée.

Étudier le mécanisme de vérification existant avant d'introduire un nouveau champ.

Ne jamais considérer automatiquement un numéro simplement renseigné comme un numéro vérifié.

## 8.3. Génération OTP

Créer un code à six chiffres.

Utiliser un générateur cryptographique tel que :

crypto.randomInt(100000, 1000000)

Durée de validité : 5 minutes.

Limiter :
- Tentatives de validation : 5 maximum.
- Renvoi du code : délai minimum de 60 secondes.
- Nombre de demandes par compte et par période.
- Tentatives par IP et par compte.

Ne jamais stocker le code en clair.

Stocker un hash/HMAC sécurisé, lié à un challenge spécifique.

Ne jamais exposer le code dans la réponse de l'action serveur, les logs ou les messages d'erreur.

## 8.4. Modèle de données

Examiner la table verification de Better Auth.

Si elle ne convient pas à ce besoin, créer une table dédiée, par exemple :

wallet_pin_reset_challenges

Champs indicatifs :

- id
- userId
- walletId
- codeHash
- deliveryChannel
- destination
- expiresAt
- attempts
- consumedAt
- createdAt

Ajouter les index nécessaires.

Les champs et relations définitifs doivent être adaptés au schéma existant.

## 8.5. Services d'envoi

Examiner d'abord les services email existants.

Pour WhatsApp, prévoir un adaptateur compatible avec WhatsApp Business Cloud API ou un fournisseur autorisé.

Ne pas simuler un envoi réussi si aucun fournisseur n'est configuré.

Prévoir des variables d'environnement documentées et une gestion des erreurs du fournisseur.

## 8.6. Parcours de récupération

Étape 1 : sélection du canal.

Étape 2 : demande et envoi du code.

Étape 3 : saisie et validation du code.

Étape 4 : définition du nouveau PIN.

Étape 5 : confirmation du nouveau PIN.

Étape 6 : validation et enregistrement.

Le serveur doit vérifier :
- Le propriétaire du wallet.
- L'identité du challenge.
- Son expiration.
- Son nombre de tentatives.
- Son caractère non consommé.
- La validité du nouveau PIN.

La consommation du challenge et la modification du PIN doivent être atomiques.

Hasher le nouveau PIN avec WalletUtils.hashPin().

Réinitialiser les tentatives échouées.

Ne pas déverrouiller automatiquement un wallet verrouillé volontairement. Distinguer si nécessaire le verrouillage manuel du verrouillage consécutif aux tentatives PIN échouées.

Conserver la procédure de réclamation/support existante pour les cas qui nécessitent une intervention administrative.

---

# PHASE 9 — SÉCURISATION DU MOTEUR FINANCIER

Fichiers :

- actions/transactions.ts
- actions/wallets.ts
- lib/finance/core/transaction-engine.ts
- lib/finance/transactions/transfer.ts
- lib/finance/core/idempotency.ts
- lib/ledger/ledger-utils.ts

Effectuer un audit de sécurité complet.

Vérifier :

1. Authentification obligatoire.
2. Propriété du wallet source.
3. Propriété des comptes financiers.
4. Validation du destinataire.
5. Vérification du solde réel.
6. Frais calculés côté serveur.
7. Prix des produits et articles recalculés côté serveur.
8. Idempotence.
9. Atomicité.
10. Prévention des doubles soumissions.
11. Verrouillage et concurrence.
12. Journalisation.
13. Transactions inversées et remboursements.

Les paramètres transmis par le client ne sont jamais une source de vérité financière.

Pour les transferts :
- Débit de l'expéditeur.
- Crédit du destinataire.
- Comptabilisation des frais.
- Écritures équilibrées.
- Référence de transaction unique.

Ne pas créer de crédit ou de débit directement sur user_wallets.

Ne pas modifier manuellement les soldes dérivés du ledger.

Auditer également la règle actuelle d'attente de 60 secondes entre transactions dans actions/transactions.ts. Vérifier sa pertinence métier et son impact sur l'expérience utilisateur. Ne pas supprimer les protections contre les abus sans les remplacer par une protection adaptée.

---

# PHASE 10 — QUALITÉ ET TESTS

Créer ou compléter les tests unitaires et d'intégration.

## Tests financiers

- Transfert entre deux utilisateurs.
- Transfert vers soi-même.
- Solde insuffisant.
- Destinataire inexistant.
- Wallet destinataire verrouillé.
- Frais incorrects.
- Double soumission.
- Idempotence.
- Transactions concurrentes.
- Écritures ledger équilibrées.

## Tests Passkey

- Challenge valide.
- Challenge expiré.
- Signature incorrecte.
- Mauvais utilisateur.
- Mauvais wallet.
- Mauvais montant.
- Challenge réutilisé.
- Session conservée après validation.

## Tests PIN et récupération

- PIN valide.
- PIN incorrect.
- Limite de tentatives.
- OTP valide.
- OTP expiré.
- OTP incorrect.
- OTP réutilisé.
- Renvoi trop fréquent.
- Réinitialisation d'un wallet appartenant à un autre utilisateur.

## Tests UI

- Sélection d'un contact récent.
- Modification du montant.
- Incréments et décréments.
- Passage entre les étapes.
- Validation Passkey sans redirection.
- Validation PIN.
- Réinitialisation depuis les paramètres.
- Actualisation des statistiques.

## Vérifications finales

Exécuter :

bunx tsc --noEmit

bunx eslint

bun run test

bun run build

Ne pas déclarer le travail terminé si les vérifications échouent.

---

# PHASE 11 — LIVRABLES

Produire les documents :

1. WALLET-AUDIT.md
   - Problèmes identifiés.
   - Architecture actuelle.
   - Risques de sécurité.
   - Incohérences du schéma.

2. WALLET-IMPLEMENTATION.md
   - Modifications réalisées.
   - Nouvelles fonctionnalités.
   - Architecture Passkey.
   - Architecture OTP.
   - Migrations.

3. WALLET-TESTS.md
   - Tests exécutés.
   - Résultats.
   - Cas restant à tester.

4. Liste exhaustive des fichiers modifiés.

5. Liste des nouvelles variables d'environnement nécessaires.

6. Instructions pour les fournisseurs email et WhatsApp.

7. Résultat final du build.

## CONTRAINTES ABSOLUES

- Préserver toutes les fonctionnalités financières existantes.
- Préserver le ledger en partie double.
- Préserver Better Auth.
- Réutiliser les Passkeys déjà enregistrés lorsque techniquement possible.
- Ne pas utiliser signIn.passkey() comme autorisation financière.
- Ne pas stocker les OTP en clair.
- Ne pas envoyer les nouveaux PIN par message.
- Ne pas mettre en cache les données financières privées.
- Ne pas affaiblir les permissions.
- Ne pas créer de fausses transactions pour alimenter les statistiques.
- Ne pas modifier les soldes directement.
- Ne pas effectuer de migration destructive.
- Ne pas supprimer les fonctionnalités QR Code.
- Ne pas casser les demandes de dépôt/retrait, les achats et les paiements de tournois.
- Conserver le design premium actuel et améliorer la cohérence responsive.

Travailler progressivement, vérifier chaque phase et éviter les réécritures inutiles.

L'objectif final est un wallet fiable, sécurisé, performant et agréable à utiliser, avec une expérience de transaction cohérente sur ordinateur et mobile.