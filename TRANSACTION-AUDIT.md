# AUDIT DU SYSTÈME DE TRANSACTIONS — H³ INFINITY GAMING

> **Statut :** Phase 1 terminée — audit documentaire, aucun code modifié.
> **Périmètre :** transactions, ledger, portefeuilles, frais, demandes, émissions administratives, remboursements, permissions financières.
> **Méthode :** lecture du schéma Drizzle et de `database/db.sql`, des actions serveur, des routes API, des hooks et des pages ; traçage des flux du composant jusqu'à `ledger_entries`.
> **Références :** les constats ci-dessous renvoient à des fichiers et fonctions réellement présents dans le dépôt. Les hypothèses non vérifiées sont signalées en annexe.

---

## 0. SYNTHÈSE EXÉCUTIVE

Le socle comptable existe et est de bonne qualité : le ledger en partie double, les comptes financiers typés et le verrouillage `FOR UPDATE` de `executeAtomicTransfer` constituent une base saine. **Le problème n'est pas l'absence de ledger, c'est la coexistence de plusieurs moteurs, de plusieurs points d'entrée et de règles métier incomplètes.**

| Risque | Niveau | Constat |
|---|---|---|
| Création monétaire par `actions/wallets.ts` | **Critique** | `createTransaction` traite plusieurs débits comme des crédits (`THEME_PURCHASE`, `TOURNAMENT_PARTICIPATION`, `PRODUCT_PURCHASE`, `ORDER_PURCHASE` absents de `spendTypes`) et crédite le wallet depuis `SYSTEM_ADJUSTMENT`. |
| `transferMoney` déséquilibre le ledger | **Critique** | Deux transactions distinctes : débit vers `PLATFORM_ESCROW`, puis crédit depuis `SYSTEM_ADJUSTMENT`. L'escrow reste crédité et la plateforme crée la contrepartie. |
| Remboursement administratif sans mouvement | **Critique** | `app/admin/transactions/page.tsx::handleRefund` appelle uniquement `updateTransactionStatus(id, "REFUNDED")`. Aucune écriture inverse. |
| Transfert admin depuis le mauvais wallet | **Critique** | `handleActionConfirm` utilise `completeData.wallet.id`, donc le portefeuille personnel de l'administrateur. |
| Absence d'émission GTC contrôlée | **Critique** | Aucun compte `SYSTEM_GTC_ISSUANCE`, aucune demande de crédit, aucun circuit d'approbation A/B/C. Les crédits admin passent par `BONUS`/`REFUND`/`DEPOSIT` sans plafond ni motif obligatoire. |
| Prix partiellement contrôlés côté serveur | **Critique** | `GAME_ITEM_PURCHASE`, `TOURNAMENT_PARTICIPATION`, `THEME_PURCHASE`, `VIP_SUBSCRIPTION` utilisent le montant envoyé par le client. Seul `createProductOrder` relit le prix en base. |
| Doublons de moteurs et d'actions | **Élevé** | Deux `createTransaction`, deux `updateTransactionStatus`, deux `getTransactionById`, deux `getWalletTransactions`, calcul de frais dans trois endroits. |
| Idempotence absente | **Élevé** | Le cooldown de 60 s/120 s n'est pas une clé d'idempotence ; aucune contrainte unique ne protège les rejeux. |
| Types frontend ≠ enum PostgreSQL | **Élevé** | `PRODUCT_PURCHASE` existe côté front mais pas en base ; `PURCHASE`, `ORDER_PURCHASE`, `BONUS`, `REFUND` existent en base mais pas côté front. |
| Permissions A/B/C ignorées par la finance | **Élevé** | Les actions financières ne testent que `role === "admin"` ou `isAdmin`. `users.level` n'est jamais consulté pour autoriser une opération. |
| Atomicité métier incomplète | **Élevé** | `handleTransactionTypeSafe` s'exécute dans une **seconde** transaction après le débit. Un échec laisse un débit sans contrepartie métier (inscription, abonnement, demande d'item). |

**Verdict :** la refonte doit conserver le ledger et l'escrow, mais imposer **un seul moteur d'exécution**, **un seul point d'entrée par cas d'usage**, **des écritures indissociables de leurs effets métier** et **une politique d'émission séparée des transferts**.

---

## 1. ARCHITECTURE FINANCIÈRE ACTUELLE

### 1.1 Vue d'ensemble

```text
Pages / Composants
  app/(protected)/wallet/transactions/create/page.tsx   (parcours utilisateur)
  app/admin/transactions/page.tsx                        (parcours admin)
  app/admin/requests/page.tsx                            (validation demandes)
        │
        ├── Server Actions ──────────────────────────────────────────────┐
        │   actions/transactions.ts   createTransaction, refund…         │
        │   actions/wallets.ts        createTransaction, transferMoney…  │
        │   actions/requests.ts       createRequest, approveRequest…     │
        │   actions/orders.ts         createProductOrder, rejectOrder…   │
        │                                                               │
        ├── API Routes ──────────────────────────────────────────────────┤
        │   POST /api/transactions/create                                │
        │   POST /api/transactions/calculate-fees                        │
        │                                                               │
        └── Moteurs ─────────────────────────────────────────────────────┘
            lib/finance/ledger/ledger-engine.ts   executeAtomicTransfer
            lib/ledger/ledger-utils.ts            façade rétro-compatible
            actions/wallets.ts::createTransaction  moteur parallèle non sûr
                │
                ▼
        financial_accounts ── ledger_entries ── wallet_transactions
                │                                   │
                └── user_wallets ───────────────────┴── requests / receipts
```

### 1.2 Tables financières

| Table | Rôle | Points notables |
|---|---|---|
| `financial_accounts` | Compte comptable typé | Types : `USER_WALLET`, `SHOP_WALLET`, `PLATFORM_ESCROW`, `PLATFORM_FEES`, `TOURNAMENT_POOL`, `SYSTEM_ADJUSTMENT`. Aucune contrainte d'unicité sur les comptes système. |
| `ledger_entries` | Écritures débit/crédit | `transaction_id` est un `text` **sans clé étrangère** vers `wallet_transactions`. |
| `wallet_transactions` | Journal fonctionnel | `balance_after` est stocké mais le solde réel est recalculé depuis le ledger. |
| `user_wallets` | Portefeuille utilisateur | Un seul wallet par utilisateur (`wallet_user_unique`), lien vers `financial_account_id`, PIN, verrouillage. |
| `requests` | Demandes dépôt/retrait/items | `status` est un `text` libre, pas un enum. |
| `receipts` | Reçus | Générés par `actions/receipt.ts`, pas par le moteur de transaction. |
| `registration_payments` | Paiement d'inscription | `registration_id` et `transaction_id` obligatoires. |
| `orders` | Commandes marketplace | `wallet_transaction_id` relie la commande au débit escrow. |
| `vip_subscriptions` | Abonnements | `user_id` est unique : renouvellement impossible. |
| `app_settings` | Frais et configuration | Singleton applicatif sans contrainte d'unicité. |

### 1.3 Les trois chemins d'écriture

1. **Chemin sûr** — `actions/transactions.ts::createTransaction` → `lib/ledger/ledger-utils.ts::executeTransaction` → `lib/finance/ledger/ledger-engine.ts::executeAtomicTransfer`.
   - Vérifie la session, la propriété du wallet, le PIN, un cooldown, choisit les comptes, puis exécute une transaction SQL verrouillée.
2. **Chemin non sûr** — `actions/wallets.ts::createTransaction`.
   - Aucune authentification, aucune transaction SQL englobante, aucune vérification PIN, insertions séquentielles.
3. **Chemin direct** — `actions/orders.ts` et `actions/requests.ts` appellent directement `executeTransaction` avec leur propre logique de comptes et de statuts.

---

## 2. CARTOGRAPHIE DES FICHIERS CONCERNÉS

| Zone | Fichier | Rôle réel | État |
|---|---|---|---|
| Schéma | `database/schema.ts` | Enums, tables, relations | Référence |
| SQL | `database/db.sql` | Schéma déployé | À vérifier contre Drizzle |
| Moteur ledger | `lib/finance/ledger/ledger-engine.ts` | `executeAtomicTransfer`, soldes, comptes système | Solide mais incomplet |
| Façade | `lib/ledger/ledger-utils.ts` | Réexporte le moteur finance | OK |
| Frais | `lib/finance/fees/fee-engine.ts` | Calcul des frais, réduction VIP | Fail-open |
| Types finance | `lib/finance/types.ts` | Types du moteur | OK |
| Action centrale | `actions/transactions.ts` | `createTransaction`, `refundTransaction`, statuts | Point d'entrée principal |
| Action parallèle | `actions/wallets.ts` | `createTransaction`, `transferMoney`, `depositToWallet`, wallets | **À neutraliser** |
| Demandes | `actions/requests.ts` | `createRequest`, `approveRequest`, `rejectRequest` | Approbation sans contrôle de session |
| Commandes | `actions/orders.ts` | `createProductOrder`, `completeOrder`, `rejectOrder` | Escrow négatif |
| Tournois | `actions/editions.ts`, `actions/participants.ts` | Inscriptions, paiements | Paiement incomplet |
| Receipts | `actions/receipt.ts` | Génération de reçus | Séparé du moteur |
| Admin transactions | `app/admin/transactions/page.tsx` | Liste, transfert, dépôt, retrait, remboursement | Réutilise l'UI utilisateur |
| Admin demandes | `app/admin/requests/page.tsx` | Approbation/rejet | `adminUserId` fourni par le client |
| Admin wallets | `app/admin/wallets/page.tsx` | Gestion des portefeuilles | Hors périmètre direct |
| Utilisateur | `app/(protected)/wallet/transactions/create/page.tsx` | Parcours générique | 1 042 lignes |
| Composants | `components/pages/transactions/create/*` | Sélecteur de type, entité, montant, destinataire, PIN, confirmation | Réutilisables mais trop génériques |
| Hooks | `hooks/use-transaction-fees.ts`, `hooks/use-transaction.ts` | Frais et PIN | Le hook frais appelle une Server Action |
| API | `app/api/transactions/create/route.ts` | Création via HTTP | Ne transmet pas le PIN |
| API | `app/api/transactions/calculate-fees/route.ts` | Calcul public des frais | Non authentifiée, total faux |
| Config | `config/`, `constants/`, `app_settings` | Frais et réglages | Sources multiples |

---

## 3. TYPES ET STATUTS EXISTANTS

### 3.1 Enum PostgreSQL `transaction_type`

```text
PURCHASE, VIP_SUBSCRIPTION, GAME_ITEM_PURCHASE, THEME_PURCHASE,
DEPOSIT, WITHDRAWAL, REFUND, TRANSFER, ORDER_PURCHASE,
TOURNAMENT_PARTICIPATION, BONUS
```

### 3.2 Types frontend (`types/transaction-types.ts`)

```text
THEME_PURCHASE, VIP_SUBSCRIPTION, PRODUCT_PURCHASE,
TOURNAMENT_PARTICIPATION, GAME_ITEM_PURCHASE,
DEPOSIT, WITHDRAWAL, TRANSFER
```

### 3.3 Divergences confirmées

| Problème | Détail | Conséquence |
|---|---|---|
| `PRODUCT_PURCHASE` | Présent dans `types/transaction-types.ts`, absent de `transaction_type`. | Toute tentative d'insertion échoue ; le parcours produit passe en réalité par `createProductOrder` / `ORDER_PURCHASE`. |
| `PURCHASE` | En base, jamais proposé dans l'UI. | Type orphelin. |
| `ORDER_PURCHASE` | En base, absent du type frontend. | Utilisé par `actions/orders.ts` sans être représenté dans les configurations UI. |
| `BONUS`, `REFUND` | En base, absents du type frontend. | Filtres admin et parcours ne peuvent pas les créer proprement. |
| `TOURNAMENT_PARTICIPATION` | `entityType: "tournament"` dans la configuration, alors que la page charge une **édition** via `getTournamentEditionWithRelations`. | Risque de charger le tournoi parent au lieu de l'édition. |
| `TRANSFER` | `needsTargetId: false`, mais le parcours attend un `recipientWalletId`. | Convention implicite non typée. |

### 3.4 Statuts

| Enum | Valeurs | Usage |
|---|---|---|
| `transaction_status` | `PENDING`, `COMPLETED`, `PROCESSING`, `FAILED`, `REFUNDED` | Aucune machine à états ; `updateTransactionStatus` accepte n'importe quelle transition. |
| `request.type` | `DEPOSIT`, `WITHDRAWAL`, `GAME_ITEMS`, `OTHER` | `status` en `text` : `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`. |
| `order_status` | `PENDING`, `ACCEPTED_BY_SHOP`, `PROCESSING_BY_ADMIN`, `COMPLETED`, `REJECTED_BY_SHOP`, `REJECTED_BY_ADMIN`, `CANCELLED`. | Cycle de commande distinct du statut de transaction. |

### 3.5 Types de comptes financiers

`USER_WALLET`, `SHOP_WALLET`, `PLATFORM_ESCROW`, `PLATFORM_FEES`, `TOURNAMENT_POOL`, `SYSTEM_ADJUSTMENT`.

**Absent :** `SYSTEM_GTC_ISSUANCE` (compte de contrepartie d'émission) et un compte de clearing externe pour les dépôts/retraits.

---

## 4. FONCTIONNEMENT DU LEDGER

### 4.1 `executeAtomicTransfer` — déroulé réel

Fichier : `lib/finance/ledger/ledger-engine.ts`.

1. Valide `amount > 0` et `fromAccountId !== toAccountId`.
2. Ouvre `db.transaction(...)` sauf si un `tx` existant est fourni.
3. Verrouille les deux comptes avec `SELECT ... FOR UPDATE`.
4. Vérifie `isActive` / `isLocked`.
5. Calcule le solde source depuis `SUM(credit) - SUM(debit)`.
6. Autorise un solde négatif uniquement si la source est `SYSTEM_ADJUSTMENT`, ou si le type est `DEPOSIT`/`BONUS`.
7. Calcule les frais via `calculateTransactionFees(type, amount)`.
8. Insère `wallet_transactions`.
9. Insère les écritures : débit source = `amount`, crédit destination = `netAmount`, crédit `PLATFORM_FEES` = `fees`.
10. Retourne la transaction, les écritures et les soldes.

### 4.2 Invariants réellement garantis

- À l'intérieur d'un appel, la somme des débits égale la somme des crédits (`amount = netAmount + fees`).
- Les comptes sont verrouillés avant lecture du solde.
- Un solde négatif est refusé pour les comptes utilisateurs.
- Les écritures sont immuables par convention applicative (aucune API de mise à jour).

### 4.3 Failles du moteur

| Faille | Preuve | Impact |
|---|---|---|
| Pas de FK sur `ledger_entries.transaction_id` | `database/schema.ts` ligne 341 | Écritures orphelines possibles. |
| Pas de contrainte « au moins 2 écritures » | Le moteur peut être contourné par des insertions directes | Ledger non garanti globalement. |
| Comptes système non uniques | `getOrCreatePlatformAccount` fait `SELECT ... LIMIT 1` puis `INSERT` | Deux comptes `PLATFORM_FEES` possibles en concurrence. |
| Pas de clé d'idempotence | Aucune colonne ni table dédiée | Un rejeu crée un second débit. |
| Pas de machine à états | `updateTransactionStatus` accepte tout | `REFUNDED → COMPLETED` possible. |
| `getAccountBalance` masque les erreurs | Retourne `0` en cas d'exception | Un solde lu à 0 peut provoquer un refus ou masquer une panne. |
| `verifyLedgerBalance` retourne `isValid: true` sans vérifier l'équilibre | Lignes 93–99 | Faux sentiment de sécurité. |
| Ordre de verrouillage non déterministe | Verrouille `from` puis `to` | Risque de deadlock entre transferts croisés. |
| Frais fail-open | `fee-engine.ts` retourne `fees: 0` en erreur | Perte de revenus silencieuse. |

### 4.4 Sémantique des frais

`calculatePureFee` définit :

```text
fees       = amount × taux
netAmount  = amount − fees
totalAmount = amount
```

Cette sémantique est ambiguë :

- Pour un `TRANSFER`, le destinataire reçoit `netAmount` et les frais sont prélevés **sur le montant**, pas ajoutés.
- Pour un achat, le vendeur reçoit `netAmount` et la plateforme encaisse `fees`.
- `totalAmount` ne représente jamais « montant + frais ».
- L'API `/api/transactions/calculate-fees` retourne `totalAmount = amount`, ce qui contredit l'attente d'un total à débiter.

Aucune convention unique n'est documentée. C'est une source directe de divergence front/back.

---

## 5. FLUX DE CHAQUE TRANSACTION

### 5.1 TRANSFER (utilisateur)

```text
wallet/transactions/create?type=TRANSFER&targetId=<walletId>
  → page::loadTransactionFromParams → recipientWalletId
  → AmountInput → PIN
  → actions/transactions.ts::createTransaction
  → executeAtomicTransfer
  → wallet_transactions + ledger_entries
```

- Le destinataire est résolu par `getUserWalletById`.
- Le contrôle « pas de transfert vers soi » est assuré indirectement par `fromAccountId !== toAccountId`.
- Les frais sont déduits du montant reçu, pas ajoutés au débit.
- Aucune vérification de limite, de plafond ou de niveau.
- Aucune notification.
- Aucune idempotence réelle : le cooldown de 60 s bloque aussi les opérations légitimes et ne protège pas contre deux requêtes simultanées.

### 5.2 DEPOSIT (utilisateur → demande)

```text
create?type=DEPOSIT
  → page::executeConfirm
  → actions/requests.ts::createRequest (statut PENDING)
  → aucune écriture ledger
  → app/admin/requests → approveRequest
  → executeAtomicTransfer(SYSTEM_ADJUSTMENT → wallet)
```

- Le dépôt est une **demande**, pas un crédit immédiat. C'est correct.
- `approveRequest` accepte `adminUserId` en paramètre et ne vérifie pas la session.
- Aucune vérification de preuve de paiement avant approbation.
- Le compte source est `SYSTEM_ADJUSTMENT`, ce qui mélange dépôts externes, bonus et corrections.

### 5.3 WITHDRAWAL (utilisateur → demande)

```text
create?type=WITHDRAWAL
  → createRequest(PENDING)
  → approveRequest
  → executeAtomicTransfer(wallet → PLATFORM_ESCROW)
```

- Le solde n'est **pas réservé** à la création de la demande. Deux demandes peuvent dépasser le solde.
- Le débit n'a lieu qu'à l'approbation ; si le solde a diminué entre-temps, l'approbation échoue.
- Aucun contrôle des coordonnées de retrait côté serveur.
- Un rejet ne restitue rien puisqu'il n'y a pas eu de débit — cohérent, mais le solde reste disponible pour d'autres demandes.

### 5.4 VIP_SUBSCRIPTION

```text
create?type=VIP_SUBSCRIPTION
  → createTransaction
  → executeAtomicTransfer(wallet → PLATFORM_ESCROW)
  → handleTransactionTypeSafe (seconde transaction)
      → insert vip_subscriptions (plan MONTHLY, prix = metadata.amount)
      → update users.isVip
```

- Le prix et la durée ne sont pas relus depuis une offre en base.
- `metadata.amount` peut être absent : `pricePaid` devient `undefined`.
- `vip_subscriptions.user_id` est unique : un renouvellement échoue après le débit.
- L'insertion VIP se fait **après** le débit, dans une autre transaction.

### 5.5 THEME_PURCHASE

```text
create?type=THEME_PURCHASE&targetId=<themeId>
  → fetchEntityByType → getThemeById
  → createTransaction (montant client)
  → executeAtomicTransfer(wallet → PLATFORM_ESCROW)
```

- Aucun contrôle « thème déjà possédé » côté serveur.
- Aucune écriture dans `theme_purchases`.
- Le prix affiché vient de la base, mais le montant envoyé peut être modifié.
- `handleTransactionTypeSafe` ne traite pas ce type : aucun effet métier.

### 5.6 GAME_ITEM_PURCHASE

```text
create?type=GAME_ITEM_PURCHASE&itemId=<id>
  → fetchEntityByType → getGameItemById
  → page::executeConfirm calcule quantity = amount / entity.price
  → createRequest(GAME_ITEMS, PENDING)
  → app/admin/requests → approveRequest
      → executeAtomicTransfer(wallet → PLATFORM_FEES)
```

- Le montant et la quantité sont calculés côté client à partir du prix affiché.
- `createRequest` ne recalcule `totalGtc` que si `quantity` est fourni ; ce n'est pas le cas ici (la quantité est dans `metadata`).
- Le prix réel de l'item n'est pas vérifié au moment de l'approbation.
- Le stock n'est pas vérifié.
- Le compte destination est `PLATFORM_FEES`, pas le vendeur : la répartition vendeur/plateforme n'existe pas.

### 5.7 PRODUCT_PURCHASE / ORDER_PURCHASE

```text
create?type=PRODUCT_PURCHASE&productId=<id>
  → page::executeConfirm → actions/orders.ts::createProductOrder
      → prix relu en base (correct)
      → executeTransaction(buyer → PLATFORM_ESCROW, type ORDER_PURCHASE, statut PENDING)
      → insert orders
      → produit RESERVE
  → admin/shop validation → completeOrder
      → executeTransaction(PLATFORM_ESCROW → SHOP_WALLET, type TRANSFER)
```

- **Double frais** : le premier débit applique les frais `ORDER_PURCHASE`, le second applique les frais `TRANSFER`. L'escrow est débité du prix plein alors qu'il n'a reçu que le net.
- L'escrow devient structurellement négatif du montant des frais.
- `rejectOrder` rembourse depuis l'escrow, qui est déjà insuffisant.
- Le statut de la transaction d'origine est passé à `COMPLETED` sans écriture supplémentaire, puis un second débit escrow → boutique est créé.
- Le type `PRODUCT_PURCHASE` n'est jamais utilisé en base : le parcours réel est `ORDER_PURCHASE`.

### 5.8 TOURNAMENT_PARTICIPATION

```text
create?type=TOURNAMENT_PARTICIPATION&editionId=<id>
  → fetchEntityByType → getTournamentEditionWithRelations
  → createTransaction (montant client)
  → executeAtomicTransfer(wallet → PLATFORM_ESCROW)
  → handleTransactionTypeSafe (seconde transaction)
      → insert registration_payments(registrationId = metadata.registrationId)
```

- `entityType` est `"tournament"` alors que l'entité chargée est une édition.
- `searchParams` ne lit pas explicitement `editionId` : `actualEntityId` prend `entityId || targetId || itemId || id`.
- Le montant d'inscription (`entryFee`) n'est pas revérifié côté serveur.
- Les contrôles d'ouverture, de date limite, de places et d'éligibilité ne sont pas faits dans `createTransaction`.
- `registrationId` peut être absent : `registration_payments.registration_id` est `NOT NULL`, donc l'insertion échoue **après** le débit.
- Aucune inscription n'est créée par ce flux ; il suppose qu'elle existe déjà.
- `joinEdition` ne déclenche aucun paiement (constat §6.3 de `ANALYSIS.md`).

### 5.9 BONUS

- Type présent en base, aucun parcours UI dédié.
- `createTransaction` autorise un admin à créditer n'importe quel wallet depuis `SYSTEM_ADJUSTMENT`.
- Aucun plafond, aucune justification obligatoire, aucune demande d'approbation.

### 5.10 REFUND

Deux comportements distincts :

1. `actions/transactions.ts::refundTransaction`
   - Vérifie que la transaction d'origine est `COMPLETED`.
   - Crée une transaction `REFUND` via `createTransaction(..., { isSystem: true })`.
   - Comme `REFUND` est dans `creditTypes`, la source est `SYSTEM_ADJUSTMENT` et la destination est `originalTransaction.walletId`.
   - Le montant remboursé est `netAmount`, pas `amount` : les frais ne sont pas remboursés.
   - **Ce n'est pas l'inverse des écritures d'origine** : le compte contrepartie d'origine n'est pas débité.
2. `app/admin/transactions/page.tsx::handleRefund`
   - Appelle seulement `updateTransactionStatus(transactionId, "REFUNDED")`.
   - **Aucune écriture comptable.**

### 5.11 Émission administrative de GTC (état réel)

Il n'existe pas de système d'émission. Les admin peuvent :

- créditer un wallet via `createTransaction` avec `DEPOSIT`, `BONUS` ou `REFUND` ;
- transférer depuis **leur propre wallet** via le bouton « Transfert » de `/admin/transactions` ;
- créer une demande de dépôt/retrait **pour eux-mêmes** (`userId: user.id`).

Aucun compte d'émission, aucune limite, aucun motif obligatoire, aucune traçabilité du niveau administratif, aucune approbation.

---

## 6. FONCTIONNEMENT ADMINISTRATIF ACTUEL

### 6.1 `/admin/transactions`

- Liste, filtres par type/statut, statistiques, pagination.
- Boutons : `TRANSFER`, `WITHDRAWAL`, `DEPOSIT`.
- Dialogue de détail avec bouton « Rembourser ».
- Réutilise `TransactionRecipientSelector`, `TransactionDepositForm`, `TransactionWithdrawalForm`, `AmountInput`.
- `handleActionConfirm` :
  - `TRANSFER` → `createTransaction({ walletId: completeData.wallet.id, ... })` : **wallet de l'admin**.
  - `DEPOSIT`/`WITHDRAWAL` → `createRequest({ userId: user.id, ... })` : **demande pour l'admin**.
- Aucun onglet « Émissions », « Demandes de crédit » ou « Approbations ».
- Aucun affichage du niveau administratif ni des limites.

### 6.2 `/admin/requests`

- `approveRequest(selectedRequest.id, auth?.id)` : l'identifiant de l'approbateur vient du client.
- `refundTransaction(...)` pour les demandes liées à une transaction.
- Les boutons sont affichés selon l'état, pas selon une politique A/B/C.

### 6.3 Permissions

Trois systèmes coexistent :

| Système | Source | Utilisation finance |
|---|---|---|
| `role` (texte) | `users.role` | `role === "admin"` dans plusieurs actions. |
| `isAdmin` (booléen) | `users.isAdmin` | Test principal dans `createTransaction`. |
| `level` A/B/C | `users.level` | Uniquement dans `app/admin/layout.tsx` et `RouteProtection.tsx`. |

Conséquences :

- Un admin C a exactement les mêmes pouvoirs financiers qu'un admin A.
- Les gardes de niveau sont côté client (`RouteProtection`), pas côté serveur.
- `createTransaction` accepte `isAdmin` sans vérifier `level`.
- `actions/wallets.ts::createTransaction` n'a **aucun** contrôle.
- `access-control.ts` attribue des permissions génériques mais ne connaît pas les opérations financières.

---

## 7. FONCTIONNEMENT UTILISATEUR ACTUEL

### 7.1 Parcours

`app/(protected)/wallet/transactions/create/page.tsx` (1 042 lignes) :

1. Lecture de `type`, `amount`, `entityId`, `targetId`, `itemId`, `id`, `image`, paramètres de paiement.
2. `actualEntityId = entityId || targetId || itemId || id`.
3. Résolution par `fetchEntityByType` selon le type.
4. Étapes : type → entité → montant → destinataire → détails → PIN → confirmation → succès.
5. `executeConfirm` :
   - `DEPOSIT`/`WITHDRAWAL` → `createRequest` ;
   - `GAME_ITEM_PURCHASE` → `createRequest` ;
   - `PRODUCT_PURCHASE` → `createProductOrder` ;
   - tout le reste → `createTransaction`.

### 7.2 Problèmes du parcours

| Problème | Détail |
|---|---|
| Paramètre générique | `entityId || targetId || itemId || id` sans validation par type. |
| `editionId` ignoré | Le prompt l'exige comme prioritaire pour les tournois ; il n'est pas lu. |
| `tournamentId` ambigu | Peut désigner le tournoi parent ou l'édition. |
| Type incompatible | Aucun contrôle si l'ID appartient à une autre entité. |
| Entité indisponible | Certains `fetchEntityByType` ne vérifient pas le statut (thème, item). |
| Prix client | Le montant est modifiable après chargement pour la plupart des types. |
| `completeData.wallet` | La route `/api/auth/profile` filtre la relation `wallet` (ligne 18) ; le parcours dépend pourtant de `completeData.wallet.id`. |
| Erreurs | Les erreurs serveur remontent en `toast` générique, sans code ni champ. |
| Doublons | Le cooldown est présenté comme une protection anti-doublon. |

---

## 8. PROBLÈMES DE SÉCURITÉ

| # | Sévérité | Problème | Preuve |
|---|---|---|---|
| S1 | Critique | `actions/wallets.ts::createTransaction` sans auth, sans PIN, sans transaction SQL | `actions/wallets.ts:710` |
| S2 | Critique | Création monétaire : types de dépense incomplets | `actions/wallets.ts:738` (`spendTypes`) |
| S3 | Critique | `transferMoney` crée deux transactions et laisse l'escrow crédité | `actions/wallets.ts:889` et `:916` |
| S4 | Critique | `depositToWallet` crédite n'importe quel wallet sans auth | `actions/wallets.ts:1044` |
| S5 | Critique | `approveRequest`/`rejectRequest` font confiance à `adminUserId` fourni par l'appelant | `actions/requests.ts:425`, `:522` |
| S6 | Critique | Remboursement admin sans écriture | `app/admin/transactions/page.tsx:201` |
| S7 | Critique | Transfert admin débité du wallet admin | `app/admin/transactions/page.tsx:163` |
| S8 | Critique | Prix client pour items, tournois, thèmes, VIP | `create/page.tsx:625`, `:679` ; `actions/transactions.ts:304` |
| S9 | Élevé | API `/api/transactions/calculate-fees` non authentifiée | `route.ts` (aucun `getCurrentUser`) |
| S10 | Élevé | API `/api/transactions/create` n'envoie pas le PIN | `app/api/transactions/create/route.ts:51` |
| S11 | Élevé | Aucune limite de montant, plafond ou motif obligatoire | `actions/transactions.ts::createTransaction` |
| S12 | Élevé | Niveau A/B/C non vérifié côté serveur | `createTransaction` ne lit que `isAdmin` |
| S13 | Élevé | `updateTransactionStatus` sans contrôle d'accès ni machine à états | `actions/transactions.ts:560` |
| S14 | Élevé | `updateWalletBalance` est un no-op trompeur | `actions/wallets.ts:525` |
| S15 | Moyen | `deleteTransaction` soft-delete une transaction financière | `actions/transactions.ts:662` |
| S16 | Moyen | Cooldown global de 60 s : déni de service applicatif et fausse protection | `actions/transactions.ts:318` |
| S17 | Moyen | `getOrCreatePlatformAccount` non idempotent | `ledger-engine.ts:45` |
| S18 | Moyen | Frais fail-open à 0 | `fee-engine.ts:97` |

---

## 9. INCOHÉRENCES TYPES / ENUMS / SCHÉMA

1. `PRODUCT_PURCHASE` (front) absent de `transaction_type` (base).
2. `PURCHASE`, `ORDER_PURCHASE`, `BONUS`, `REFUND` (base) absents du type frontend.
3. `TOURNAMENT_PARTICIPATION.entityType = "tournament"` alors que l'entité métier est l'édition.
4. `requests.status` est un `text` au lieu d'un enum.
5. `ledger_entries.transaction_id` n'a pas de clé étrangère.
6. `financial_accounts` n'a pas de contrainte d'unicité sur les comptes système.
7. `app_settings` est un singleton sans contrainte d'unicité.
8. `vip_subscriptions.user_id` est unique : un abonnement expiré bloque le renouvellement.
9. `receipts.user_id` est obligatoire même pour un crédit système.
10. `wallet_transactions.balance_after` est stocké alors que la source de vérité est le ledger.
11. `registration_payments.status` par défaut `COMPLETED` alors que le code insère `PENDING`.
12. `PRODUCT_PURCHASE` est proposé dans l'UI mais le backend crée `ORDER_PURCHASE`.
13. `totalAmount` des frais ne signifie pas « montant + frais ».
14. `TRANSFER` n'a pas de champ de motif obligatoire alors que l'émission en exige un.
15. Aucune référence lisible unique par transaction (seulement un UUID).

---

## 10. PROBLÈMES UX/UI

| Problème | Impact |
|---|---|
| Formulaire unique pour tous les types | Champs inadaptés, étapes inutiles, confusion. |
| Admin réutilise les formulaires utilisateur | L'admin ne comprend pas qu'il agit sur son propre wallet. |
| Aucun écran d'émission GTC | Fonctionnalité prioritaire absente. |
| Aucun écran de demandes de crédit | Les admins C ne peuvent pas travailler. |
| Bouton « Rembourser » trompeur | L'utilisateur voit `REFUNDED` sans mouvement financier. |
| Total des frais ambigu | Le récapitulatif n'indique pas clairement qui paie quoi. |
| Statuts peu expliqués | `PENDING`, `PROCESSING`, `REFUNDED` sans contexte métier. |
| Erreurs génériques | Pas de distinction solde, permission, entité, prix. |
| Pas d'état vide/chargement spécialisé | Le parcours générique affiche des squelettes identiques. |
| Pas de référence de transaction lisible | Difficile pour le support. |

---

## 11. DOUBLONS ET LOGIQUES DISPERSÉES

| Logique | Implémentations | Recommandation |
|---|---|---|
| Création de transaction | `actions/transactions.ts`, `actions/wallets.ts`, `app/api/transactions/create/route.ts` | Une seule fonction de service + entrées fines. |
| Mise à jour de statut | `actions/transactions.ts`, `actions/wallets.ts` | Une machine à états unique. |
| Lecture d'une transaction | `actions/transactions.ts`, `actions/wallets.ts` | Un seul repository. |
| Lecture des transactions d'un wallet | Deux fonctions homonymes | Un seul repository. |
| Calcul des frais | `fee-engine.ts`, `fee-engine.ts`, `resolveBaseFeePercentage` dans `transactions.ts`, route API | Un seul moteur, appelé partout. |
| Création de compte système | `getOrCreatePlatformAccount`, insertion inline dans `actions/wallets.ts` | Une seule fonction idempotente. |
| Transfert | `createTransaction`, `transferMoney`, `transferBetweenIdentities` | Un seul cas d'usage `transfer`. |
| Remboursement | `refundTransaction`, `handleRefund`, `rejectOrder` | Un seul cas d'usage `refund`. |
| Dépôt | `depositToWallet`, `createRequest` + `approveRequest` | Un seul circuit demande → approbation. |
| Formulaire admin/utilisateur | Composants partagés | Composants UI communs, parcours métier distincts. |

---

## 12. RISQUES DE RÉGRESSION

| Risque | Zone | Mesure |
|---|---|---|
| Suppression de `actions/wallets.ts::createTransaction` | Appelée par `transferMoney`, `depositToWallet`, `actions/requests.ts`, `app/api/transactions/create` | Migrer les appelants avant suppression ; garder un wrapper déprécié qui délègue au moteur sûr. |
| Changement de l'enum `transaction_type` | Toutes les requêtes filtrant par type | Migration additive, pas de renommage brutal. |
| FK sur `ledger_entries.transaction_id` | Données historiques orphelines | Nettoyage/backfill avant contrainte. |
| Contrainte d'unicité des comptes système | Comptes existants en double | Fusionner ou conserver un compte canonique, archiver les autres. |
| Nouveau champ `idempotency_key` | Appels existants | Nullable au départ, backfill, puis contrainte. |
| Changement du calcul des frais | Historique et récapitulatifs | Conserver l'ancien calcul en lecture pour les transactions passées. |
| Refonte UI | Parcours actuels | Livrer derrière un feature flag, conserver les URL. |
| Suppression du soft-delete | Écrans admin | Filtrer `is_deleted` partout avant de retirer la fonction. |
| `vip_subscriptions.user_id` unique | Renouvellement | Migration vers un index partiel sur les abonnements actifs. |

---

## 13. ÉLÉMENTS FONCTIONNELS À PRÉSERVER

1. **Ledger en partie double** et comptes financiers typés.
2. **Verrouillage `FOR UPDATE`** et transactions SQL.
3. **Wallet utilisateur** : création, PIN, verrouillage, carte.
4. **Escrow** pour les achats et les retraits.
5. **Compte `PLATFORM_FEES`** et réduction VIP.
6. **Réglages de frais** dans `app_settings`.
7. **Demandes** dépôt/retrait/items et leurs statuts.
8. **Commandes marketplace** et cycle de vie.
9. **Inscriptions aux tournois** et paiements liés.
10. **Abonnements VIP** et avantages.
11. **Reçus** et modèles de reçu.
12. **Traces** (`userTraces`) et notifications.
13. **Permissions d'accès admin** (layout, routes, `RouteProtection`).
14. **Identité visuelle** H³ Infinity Gaming et composants UI existants.
15. **URLs** des parcours actuels (`/wallet/transactions/create`, `/admin/transactions`).

---

## ANNEXE A — INDEX DES PREUVES

| Sujet | Fichier | Symbole |
|---|---|---|
| Moteur ledger | `lib/finance/ledger/ledger-engine.ts` | `executeAtomicTransfer`, `getOrCreatePlatformAccount` |
| Façade | `lib/ledger/ledger-utils.ts` | `executeTransaction` |
| Frais | `lib/finance/fees/fee-engine.ts` | `calculatePureFee`, `calculateTransactionFees` |
| Action centrale | `actions/transactions.ts` | `createTransaction`, `handleTransactionTypeSafe`, `updateTransactionStatus`, `refundTransaction` |
| Action parallèle | `actions/wallets.ts` | `createTransaction`, `transferMoney`, `depositToWallet` |
| Demandes | `actions/requests.ts` | `createRequest`, `approveRequest`, `rejectRequest` |
| Commandes | `actions/orders.ts` | `createProductOrder`, `completeOrder`, `rejectOrder` |
| Page admin | `app/admin/transactions/page.tsx` | `handleActionConfirm`, `handleRefund` |
| Page utilisateur | `app/(protected)/wallet/transactions/create/page.tsx` | `fetchEntityByType`, `executeConfirm` |
| API frais | `app/api/transactions/calculate-fees/route.ts` | `POST` |
| API création | `app/api/transactions/create/route.ts` | `POST` |
| Schéma | `database/schema.ts` | `transactionTypeEnum`, `ledgerEntries`, `requests` |
| Types front | `types/transaction-types.ts` | `TransactionType`, `TRANSACTION_CONFIGS` |

## ANNEXE B — HYPOTHÈSES NON CONFIRMÉES

- Le comportement exact de `getMyProfile` concernant la relation `wallet` n'a pas été tracé au-delà du filtre de la route `/api/auth/profile`. Le constat retenu est limité au filtre explicite de la route.
- Les données historiques peuvent contenir des `ledger_entries` orphelines ; aucun comptage n'a été exécuté sur la base réelle.
- Les montants métier par défaut (plafonds A/B/C) ne sont pas définis dans le code ; ils devront être fixés en configuration, pas inventés.
- L'usage réel de `PURCHASE` en production n'a pas été vérifié ; le type est présent dans l'enum mais aucun flux UI ne le produit.
