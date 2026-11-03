# PLAN D'IMPLÉMENTATION — REFONTE DU SYSTÈME DE TRANSACTIONS

> **Statut :** proposition architecturale — Phase 2.
> **Prérequis :** `TRANSACTION-AUDIT.md` et `PROMPT.md`.
> **Règle :** aucune migration, suppression, modification de schéma ou refonte UI ne doit être exécutée avant validation explicite de ce document.

---

## 1. ARCHITECTURE CIBLE

### 1.1 Principe directeur

**Un seul moteur financier, plusieurs cas d'usage, des points d'entrée minces.**

```text
Server Action / API Route
  → authentification + validation d'entrée (Zod)
  → service métier (lib/finance/transactions/*)
      → politique de permission (A/B/C)
      → politique de limites
      → moteur d'exécution (lib/finance/core/transaction-engine.ts)
          → idempotence
          → verrouillage des comptes
          → écritures partie double (lib/finance/core/ledger.ts)
          → journal wallet_transactions
          → effets métier dans la MÊME transaction SQL
          → journal d'audit
      → notifications après commit
```

### 1.2 Règles non négociables

1. Toute opération financière passe par `executeFinancialOperation`.
2. Aucune écriture ledger hors de `postLedgerEntries`.
3. Aucun débit/crédit sans ligne opposée de même montant.
4. Aucun effet métier (inscription, abonnement, commande) hors de la transaction SQL du débit.
5. Aucune permission déduite du client.
6. Aucune suppression d'une transaction validée ; seul un remboursement avec écriture inverse est autorisé.
7. Aucune émission sans compte de contrepartie et sans journal d'audit.
8. Toute opération sensible accepte une clé d'idempotence.

### 1.3 Séparation des responsabilités

| Couche | Responsabilité | Interdit |
|---|---|---|
| Pages / composants | Affichage, saisie, récapitulatif | Calcul du prix final, choix du compte comptable |
| Server Actions / API | Auth, parsing, validation, appel du service | Logique comptable |
| Services métier | Règles du cas d'usage, sélection des comptes | Accès direct au rendu |
| Moteur | Atomicité, verrouillage, idempotence, écritures | Règles métier spécifiques |
| Ledger | Équilibre, validation des lignes, insertion | Connaissance des types de transaction |

---

## 2. ORGANISATION DES MODULES

```text
lib/finance/
  core/
    accounts.ts               # résolution et création idempotente des comptes
    ledger.ts                 # postLedgerEntries, soldes, vérification
    transaction-engine.ts     # executeFinancialOperation
    idempotency.ts            # clés, hash de requête, rejeu
    transaction-context.ts    # acteur, niveau, source, IP, user-agent
    transaction-errors.ts     # erreurs typées et codes
  transactions/
    transfer.ts               # transfert entre utilisateurs
    issuance.ts               # émission GTC contrôlée
    deposit.ts                # dépôt (demande + approbation)
    withdrawal.ts             # retrait (réservation + paiement)
    purchase.ts               # produit, item, thème, abonnement
    tournament.ts             # inscription payante
    refund.ts                 # remboursement total/partiel
  requests/
    credit-requests.ts        # création et lecture des demandes de crédit
    approval.ts               # approbation/rejet atomiques
  policies/
    admin-policy.ts           # A/B/C, propriété de la demande
    limits.ts                 # min/max/journalier, deuxième approbation
    fee-policy.ts             # convention de frais par type
  validations/
    transaction-schemas.ts    # schémas Zod par commande
  utils/
    references.ts             # références lisibles uniques
    money.ts                  # arrondis et conversions Decimal

actions/
  transactions/
    create.ts                 # façade de création
    requests.ts               # demandes utilisateur
  admin/
    transactions/
      issuance.ts             # émission directe A/B
      credit-requests.ts      # demandes et décisions
      refunds.ts              # remboursements
      history.ts              # lecture et filtres

components/pages/
  transactions/create/        # parcours utilisateur par type
  admin/transactions/         # composants admin spécialisés
```

### 2.1 Compatibilité

- `actions/transactions.ts` reste un **fichier de façade** exportant les mêmes noms, mais délègue aux services. Les imports existants continuent de fonctionner pendant la migration.
- `actions/wallets.ts` conserve les fonctions de lecture et de gestion du wallet. Les fonctions financières `createTransaction`, `updateTransactionStatus`, `transferMoney`, `depositToWallet` deviennent des wrappers dépréciés qui délèguent au moteur sûr ou lèvent une erreur explicite.
- `lib/ledger/ledger-utils.ts` reste une façade de compatibilité.
- Aucun nouveau cycle d'import : `core` ne dépend pas de `actions` ; `actions` dépend de `lib/finance`.

---

## 3. MODÈLE FINANCIER PROPOSÉ

### 3.1 Comptes

| Compte | Type | Solde négatif autorisé | Usage |
|---|---|---|---|
| Wallet utilisateur | `USER_WALLET` | Non | Fonds de l'utilisateur. |
| Wallet boutique | `SHOP_WALLET` | Non | Fonds du vendeur. |
| Escrow | `PLATFORM_ESCROW` | Non | Fonds retenus pendant une commande/retrait. |
| Frais plateforme | `PLATFORM_FEES` | Non | Commissions, frais, revenus VIP. |
| Pool tournoi | `TOURNAMENT_POOL` | Non | Dotation d'une édition. |
| Émission GTC | `SYSTEM_GTC_ISSUANCE` | **Oui, par conception** | Contrepartie de toute création de GTC. Son solde négatif représente la masse émise. |
| Clearing externe | `SYSTEM_EXTERNAL_CLEARING` | **Oui, par conception** | Contrepartie des dépôts/retraits réels. |
| Ajustement legacy | `SYSTEM_ADJUSTMENT` | Oui | **Historique uniquement** ; plus aucune nouvelle écriture après migration. |

Chaque compte système possède une `system_key` unique (`GTC_ISSUANCE`, `EXTERNAL_CLEARING`, `ESCROW`, `FEES`) et un flag `allow_negative_balance`. La création est idempotente via `INSERT ... ON CONFLICT (system_key) DO NOTHING` puis `SELECT`.

### 3.2 Convention de montants

Pour toutes les opérations :

```text
grossAmount : montant de base de l'opération
fees        : frais ajoutés au payeur (ou commission retenue, selon le type)
netAmount   : montant reçu par le bénéficiaire
totalDebit  : ce que le payeur est réellement débité
```

| Type | Débit payeur | Crédit bénéficiaire | Crédit frais |
|---|---|---|---|
| `TRANSFER` | `gross + fees` | `gross` | `fees` |
| `WITHDRAWAL` | `gross + fees` | `gross` (payout externe) | `fees` |
| `ORDER_PURCHASE` | `gross` | `gross` vers escrow | `0` à la capture |
| Finalisation commande | escrow `gross` | vendeur `gross − commission` | `commission` |
| `GAME_ITEM_PURCHASE` | `gross` | vendeur `gross − commission` | `commission` |
| `THEME_PURCHASE` | `gross` | créateur `gross − commission` | `commission` |
| `TOURNAMENT_PARTICIPATION` | `gross + fees` | pool `gross` | `fees` |
| `VIP_SUBSCRIPTION` | `gross` | `PLATFORM_FEES` `gross` | `0` |
| `DEPOSIT` | clearing externe `gross` | utilisateur `gross − frais` | frais |
| `REFUND` | inverse exact des écritures d'origine | inverse exact | inverse exact |

L'ancienne sémantique « frais déduits du montant reçu » est abandonnée pour les transferts : elle rendait le total ambigu. Le récapitulatif affiche désormais `montant + frais = total débité`.

### 3.3 Émission GTC

```text
Émission de 500 GTC par un admin A vers un utilisateur :
  DEBIT  SYSTEM_GTC_ISSUANCE  500
  CREDIT USER_WALLET          500

Contrôles :
  - acteur admin A ou B ;
  - montant dans [min, max] du niveau ;
  - plafond journalier du niveau ;
  - motif obligatoire (3–500 caractères) ;
  - destinataire existant, wallet actif et non verrouillé ;
  - clé d'idempotence ;
  - journal d'audit avec niveau de l'acteur au moment de l'opération.
```

Le compte d'émission n'est **jamais** un wallet utilisateur. Il n'est pas affiché comme un solde disponible. Il est consultable uniquement dans l'audit financier.

### 3.4 Remboursements

- Un remboursement **inverse les écritures d'origine** : chaque ligne débit devient crédit et inversement, sur les mêmes comptes.
- Si la contrepartie d'origine n'a plus assez de fonds, le remboursement échoue avec `REFUND_COUNTERPARTY_INSUFFICIENT` et nécessite une décision A.
- Un remboursement partiel est autorisé dans la limite du montant non encore remboursé.
- Une transaction ne peut être remboursée qu'une fois par montant cumulé ; `reversed_by` et `reversal_of` empêchent les doubles remboursements.
- Le statut `REFUNDED` n'est jamais posé sans écriture inverse.

---

## 4. PERMISSIONS A/B/C

### 4.1 Modèle

L'autorité est `users.isAdmin` **et** `users.level` relus en base dans la transaction. Le niveau envoyé par le client est ignoré.

| Action | A | B | C | Utilisateur |
|---|---|---|---|---|
| Émission directe GTC | Oui | Oui, plafond réduit | Non | Non |
| Créer une demande de crédit | Oui, au-delà de son plafond | Oui, au-delà de son plafond | Oui | Non |
| Approuver une demande | Oui | Oui sous seuil, jamais sa propre demande | Non | Non |
| Rejeter une demande | Oui | Oui | Non | Non |
| Rembourser | Oui | Oui sous seuil | Non | Non |
| Approuver dépôt/retrait | Oui | Oui | Non | Non |
| Consulter tout l'historique | Oui | Oui | Son périmètre | Ses transactions |
| Créer un transfert | Oui | Oui | Oui | Oui |
| Créer un dépôt/retrait | Oui | Oui | Oui | Oui |

### 4.2 Règles

1. Le demandeur ne peut jamais approuver sa propre demande.
2. Un admin C ne peut jamais approuver.
3. Un admin B ne peut approuver que les demandes d'un admin C sous son seuil.
4. Au-dessus du seuil de deuxième approbation, deux approbateurs distincts sont requis (A + A, ou A + B).
5. Toute décision est journalisée avec le niveau au moment de l'action.
6. Les plafonds sont lus en base, jamais dans le client.
7. Un compte non admin ne peut jamais atteindre les actions `admin/*`.

### 4.3 Configuration proposée (à valider)

Ces valeurs sont des **propositions**, pas des règles métier existantes :

```text
issuance.min                          = 1 GTC
issuance.max.A                        = 100 000 GTC / opération
issuance.max.B                        = 25 000 GTC / opération
issuance.daily.A                      = 500 000 GTC
issuance.daily.B                      = 100 000 GTC
creditRequest.max.C                   = 10 000 GTC / opération
creditRequest.daily.C                 = 25 000 GTC
creditRequest.secondApprovalThreshold = 50 000 GTC
refund.max.B                          = 25 000 GTC
```

Elles seront stockées dans `app_settings.finance_policy` (JSONB validé par Zod) pour éviter une prolifération de colonnes.

---

## 5. FONCTIONNEMENT DES DEMANDES ADMINISTRATIVES

### 5.1 Table dédiée

Ne pas surcharger `requests` (dépôts, retraits, items). Créer `transaction_credit_requests` :

| Colonne | Type | Rôle |
|---|---|---|
| `id` | text PK | Identifiant |
| `requester_id` | FK users | Admin C (ou A/B au-delà du plafond) |
| `requester_level` | enum A/B/C | Niveau au moment de la demande |
| `recipient_user_id` | FK users | Bénéficiaire |
| `recipient_wallet_id` | FK user_wallets | Wallet crédité |
| `amount` | numeric(15,2) | Montant demandé |
| `reason` | text NOT NULL | Motif obligatoire |
| `status` | enum | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `decided_by` | FK users | Approbateur |
| `decided_at` | timestamp | Date de décision |
| `rejection_reason` | text | Obligatoire si rejet |
| `transaction_id` | FK wallet_transactions | Transaction générée après approbation |
| `idempotency_key` | text | Anti-doublon |
| `second_approver_id` | FK users | Si double approbation |
| `created_at`, `updated_at` | timestamp | Horodatage |

Index : `(status, created_at)`, `(requester_id, status)`, unique partiel `(requester_id, idempotency_key)`.

### 5.2 Cycle

```text
Création (C) :
  validation Zod → contrôle limites → insertion PENDING
  → AUCUN mouvement ledger
  → notification aux approbateurs

Approbation (A/B) :
  BEGIN
    SELECT ... FOR UPDATE sur la demande
    vérifier status = PENDING
    vérifier que l'approbateur ≠ demandeur
    vérifier la politique A/B et les limites
    exécuter l'émission (ledger + transaction)
    UPDATE demande status = APPROVED, decided_by, transaction_id
    INSERT audit log
  COMMIT
  → notification au demandeur et au destinataire

Rejet (A/B) :
  UPDATE status = REJECTED + justification obligatoire
  → AUCUN mouvement ledger
```

### 5.3 Idempotence de l'approbation

Le verrou `SELECT ... FOR UPDATE` sur la demande et la condition `WHERE status = 'PENDING'` garantissent qu'une demande ne peut être approuvée deux fois, même en concurrence. Aucun `adminUserId` fourni par le client n'est accepté : l'acteur vient de la session.

---

## 6. PARCOURS UTILISATEUR PAR TYPE

### 6.1 Résolution centralisée des paramètres

Créer `resolveTransactionIntent(searchParams)` :

| Type | Paramètre prioritaire | Fallback | Entité chargée |
|---|---|---|---|
| `TRANSFER` | `userId` ou `targetId` (wallet) | — | Wallet destinataire |
| `TOURNAMENT_PARTICIPATION` | `editionId` | `targetId` si édition | Édition + tournoi |
| `GAME_ITEM_PURCHASE` | `itemId` | — | Item + jeu |
| `ORDER_PURCHASE` | `productId` | — | Produit + boutique |
| `THEME_PURCHASE` | `themeId` | — | Thème + créateur |
| `VIP_SUBSCRIPTION` | `planId` | — | Offre VIP |
| `DEPOSIT` | — | — | Formulaire fournisseur |
| `WITHDRAWAL` | — | — | Formulaire bénéficiaire |

Règles :

- Ne jamais interpréter `id` sans type.
- Si plusieurs paramètres contradictoires sont présents : erreur `CONTRADICTORY_PARAMS`.
- Si l'entité n'existe pas : `ENTITY_NOT_FOUND`.
- Si l'entité est indisponible : `ENTITY_UNAVAILABLE`.
- Si le type ne correspond pas à l'entité : `ENTITY_TYPE_MISMATCH`.
- Chaque résolution vérifie les autorisations de lecture.

### 6.2 `TRANSFER`

Étapes : destinataire → vérification → montant → frais → PIN → récapitulatif → confirmation.

Contrôles serveur :

- destinataire existant, wallet actif, non verrouillé ;
- pas d'auto-transfert ;
- solde ≥ montant + frais ;
- limites par niveau ;
- PIN ;
- idempotence.

### 6.3 `TOURNAMENT_PARTICIPATION`

Étapes : édition → informations → participant → conditions → montant → confirmation.

Affichage : image et nom du tournoi, nom de l'édition, dates, jeu, format, frais d'inscription, participant, conditions, total.

Contrôles serveur, dans la même transaction SQL que le débit :

- édition existante et liée au tournoi ;
- inscriptions ouvertes ;
- date limite non dépassée ;
- places disponibles (verrou sur l'édition) ;
- éligibilité du participant ;
- inscription non déjà existante ;
- frais relus depuis l'édition ;
- création de `edition_registrations` + `registration_payments` + débit.

Aucune inscription payée sans débit, aucun débit sans inscription.

### 6.4 `GAME_ITEM_PURCHASE`

Étapes : item → détails → quantité → compte de jeu → récapitulatif.

Contrôles serveur :

- item existant et disponible ;
- prix relu en base ;
- stock suffisant ;
- quantité dans les limites ;
- vendeur identifié ;
- création de la demande d'achat et, à l'approbation, débit + livraison dans la même transaction.

### 6.5 `ORDER_PURCHASE` (produit)

Étapes : produit → boutique/vendeur → quantité → livraison/retrait → total.

Contrôles serveur :

- produit disponible et non vendu ;
- prix relu en base ;
- quantité ;
- acheteur ≠ vendeur ;
- débit vers escrow ;
- création de la commande dans la même transaction.

### 6.6 `THEME_PURCHASE`

Étapes : aperçu → créateur → prix → conditions.

Contrôles : thème disponible, non déjà possédé, prix en base, créateur ≠ acheteur.

### 6.7 `VIP_SUBSCRIPTION`

Étapes : offre → durée → avantages → dates estimées → prix.

Contrôles : offre valide, prix en base, règle de renouvellement, un seul abonnement actif.

### 6.8 `DEPOSIT`

Étapes : fournisseur → montant → référence → justificatif → récapitulatif.

Aucun crédit avant approbation. Champs adaptés au fournisseur. Aucun champ de retrait.

### 6.9 `WITHDRAWAL`

Étapes : montant → frais → total débité → moyen → coordonnées → récapitulatif.

À la création : **réservation** du montant + frais (wallet → escrow) pour empêcher le double spend. En cas de rejet : écriture inverse escrow → wallet. En cas d'approbation : escrow → clearing externe.

### 6.10 `REFUND`

Parcours admin uniquement. Affiche le montant remboursable, les écritures d'origine, le motif obligatoire et le récapitulatif. Aucun remboursement partiel au-delà du restant.

---

## 7. MODIFICATIONS DU SCHÉMA

### 7.1 Additif (phase 1)

1. `financial_account_type` : ajouter `SYSTEM_GTC_ISSUANCE`, `SYSTEM_EXTERNAL_CLEARING`.
2. `financial_accounts` :
   - `system_key` text unique nullable ;
   - `allow_negative_balance` boolean default false.
3. `wallet_transactions` :
   - `reference` text unique ;
   - `idempotency_key` text ;
   - `created_by_user_id` FK users ;
   - `actor_level` user_level ;
   - `reason` text ;
   - `reversal_of` FK wallet_transactions ;
   - `reversed_by` FK wallet_transactions ;
   - `completed_at` timestamp ;
   - index unique partiel `(wallet_id, idempotency_key) WHERE idempotency_key IS NOT NULL`.
4. `ledger_entries` : FK `transaction_id → wallet_transactions.id` (ajoutée après nettoyage).
5. `requests` :
   - `approved_by` FK users ;
   - `approved_at` timestamp ;
   - migration `status` text → enum `request_status`.
6. `transaction_credit_requests` : nouvelle table (§5.1).
7. `financial_audit_logs` : nouvelle table (§7.3).
8. `app_settings` :
   - `finance_policy` JSONB ;
   - contrainte d'unicité du singleton.
9. `vip_subscriptions` : supprimer l'unicité globale `user_id`, ajouter un index unique partiel sur `(user_id) WHERE status = 'ACTIVE'`.
10. `registration_payments.status` : default `PENDING`.

### 7.2 Nettoyage avant contraintes

- Identifier les `ledger_entries.transaction_id` orphelines.
- Identifier les comptes système en double.
- Identifier les transactions `REFUNDED` sans écriture inverse.

Aucune contrainte n'est ajoutée avant un rapport de nettoyage validé. Aucune donnée financière n'est supprimée : les anomalies sont archivées ou marquées, jamais effacées.

### 7.3 Journal d'audit

`financial_audit_logs` :

| Colonne | Rôle |
|---|---|
| `id` | PK |
| `actor_id` | Acteur |
| `actor_level` | Niveau au moment de l'action |
| `action` | `ISSUE`, `TRANSFER`, `REFUND`, `APPROVE`, `REJECT`, `DEPOSIT_APPROVE`, `WITHDRAWAL_APPROVE` |
| `transaction_id` | Transaction liée |
| `request_id` | Demande liée |
| `account_id` | Compte concerné |
| `amount` | Montant |
| `reason` | Motif |
| `ip`, `user_agent` | Contexte |
| `metadata` | Détails |
| `created_at` | Horodatage |

Table append-only : aucune Server Action de mise à jour ou de suppression. Un trigger PostgreSQL optionnel peut rejeter `UPDATE`/`DELETE`.

### 7.4 Contraintes d'intégrité

- `CHECK (debit >= 0 AND credit >= 0)`.
- `CHECK (NOT (debit > 0 AND credit > 0))`.
- Contrainte applicative : somme débits = somme crédits par transaction.
- Index `(transaction_id)` sur `ledger_entries`.
- Index `(status, created_at)` sur les demandes.
- Aucune suppression en cascade sur les tables financières.

---

## 8. MODIFICATIONS DES TYPES

1. **Source unique** : `TransactionType = NewWalletTransaction["type"]` (Drizzle). Supprimer l'union manuelle de `types/transaction-types.ts`.
2. **Produit** : abandonner `PRODUCT_PURCHASE` côté front ; utiliser `ORDER_PURCHASE`, déjà présent en base. Aucune valeur TypeScript ne doit exister sans équivalent PostgreSQL.
3. **Commandes discriminées** :

```ts
type TransactionCommand =
  | { kind: "TRANSFER"; recipientWalletId: string; amount: number; reason?: string }
  | { kind: "ISSUANCE"; recipientUserId: string; amount: number; reason: string }
  | { kind: "DEPOSIT"; amount: number; provider: DepositProvider; reference?: string }
  | { kind: "WITHDRAWAL"; amount: number; method: WithdrawalMethod; account: string }
  | { kind: "ORDER_PURCHASE"; productId: string; quantity: number }
  | { kind: "GAME_ITEM_PURCHASE"; itemId: string; quantity: number; gameAccount: GameAccount }
  | { kind: "THEME_PURCHASE"; themeId: string }
  | { kind: "VIP_SUBSCRIPTION"; planId: string }
  | { kind: "TOURNAMENT_PARTICIPATION"; editionId: string; memberId: string };
```

4. **Résultats** :

```ts
type TransactionResult =
  | { ok: true; transactionId: string; reference: string; status: TransactionStatus }
  | { ok: false; code: TransactionErrorCode; message: string; field?: string };
```

5. **Erreurs typées** : `INSUFFICIENT_BALANCE`, `UNAUTHORIZED`, `FORBIDDEN_LEVEL`, `LIMIT_EXCEEDED`, `IDEMPOTENCY_CONFLICT`, `ENTITY_NOT_FOUND`, `ENTITY_UNAVAILABLE`, `ENTITY_TYPE_MISMATCH`, `CONTRADICTORY_PARAMS`, `PRICE_CHANGED`, `ALREADY_REGISTERED`, `ALREADY_OWNED`, `REQUEST_NOT_PENDING`, `SELF_APPROVAL_FORBIDDEN`, `REFUND_COUNTERPARTY_INSUFFICIENT`.
6. **Schémas Zod** par commande, partagés front/back pour les champs, mais la validation serveur reste l'autorité.
7. **DTO** : montants en `number` côté service, conversion en chaîne decimal uniquement à l'insertion.

---

## 9. MODIFICATIONS DES ACTIONS ET SERVICES

| Fichier | Action |
|---|---|
| `lib/finance/core/ledger.ts` | Nouveau : `postLedgerEntries`, `getAccountBalance`, `verifyTransactionBalance`. |
| `lib/finance/core/transaction-engine.ts` | Nouveau : `executeFinancialOperation`. |
| `lib/finance/core/idempotency.ts` | Nouveau : `checkIdempotency`, `saveIdempotency`. |
| `lib/finance/transactions/*` | Nouveaux cas d'usage. |
| `actions/transactions.ts` | Devient une façade : `createTransaction` → service selon le type ; `refundTransaction` → `refund.ts`. |
| `actions/wallets.ts` | `createTransaction`, `updateTransactionStatus`, `transferMoney`, `depositToWallet` : suppression progressive ou wrapper déprécié. |
| `actions/requests.ts` | `createRequest` conservé pour dépôt/retrait/items ; `approveRequest`/`rejectRequest` délèguent au service et lisent la session. |
| `actions/orders.ts` | `createProductOrder` → `purchase.ts` ; `completeOrder` → paiement escrow exact ; `rejectOrder` → `refund.ts`. |
| `actions/editions.ts` | `joinEdition` → `tournament.ts` ; paiement et inscription atomiques. |
| `app/api/transactions/create/route.ts` | Auth, validation, PIN, idempotence, appel du service. |
| `app/api/transactions/calculate-fees/route.ts` | Auth, validation du type, appel de `fee-engine`, retour `{fees, totalDebit}`. |
| `actions/app-settings.ts` | Validation du niveau A pour les frais et la politique financière. |
| `actions/claims.ts` | Auth obligatoire. |

### 9.1 Moteur `executeFinancialOperation`

```ts
executeFinancialOperation({
  command,
  context,          // acteur, niveau, IP
  idempotencyKey,
  buildLines,       // (tx, resolved) => LedgerLine[]
  businessEffect,   // (tx, result) => Promise<void>
})
```

- Ouvre `db.transaction` avec `isolationLevel: "serializable"` si le driver le permet, sinon `read committed` + verrous explicites.
- Vérifie l'idempotence avant tout mouvement.
- Verrouille les comptes dans un ordre trié.
- Valide l'équilibre avant insertion.
- Insère la transaction, les écritures, exécute l'effet métier, écrit l'audit.
- Commit unique. En cas d'erreur : rollback complet, aucune écriture partielle.
- Les notifications sont émises après commit, jamais dans la transaction.

### 9.2 Machine à états

```text
PENDING ──► PROCESSING ──► COMPLETED ──► REFUNDED
   │            │
   └────────────┴──► FAILED
```

Toute autre transition est refusée par `assertTransition`. `REFUNDED` exige une transaction de remboursement liée.

---

## 10. MODIFICATIONS DES INTERFACES

### 10.1 Administration

`/admin/transactions` devient un espace à onglets :

1. Vue d'ensemble.
2. Historique.
3. Émissions GTC.
4. Demandes de crédit.
5. Dépôts.
6. Retraits.
7. Remboursements.

Composants :

- `AdminTransactionTable`
- `AdminTransactionFilters`
- `AdminGtcIssuanceForm`
- `AdminGtcRequestForm`
- `TransactionRequestTable`
- `TransactionRequestDetails`
- `TransactionApprovalDialog`
- `TransactionRejectionDialog`
- `TransactionAuditDetails`

Règles :

- Ne jamais réutiliser `TransactionRecipientSelector`, `DepositForm` ou `WithdrawalForm` utilisateur sans adaptation.
- Afficher explicitement : « Cette émission ne débite pas votre portefeuille personnel. »
- Afficher le solde du destinataire, pas celui de l'admin.
- Les boutons sont conditionnés par la politique serveur, pas seulement par l'UI.
- Aucune catégorie non supportée par le backend.

### 10.2 Utilisateur

- Remplacer la page générique par un routeur de parcours.
- Conserver les URLs et les paramètres existants.
- Composants communs : progression, navigation, récapitulatif, erreurs, confirmation.
- Composants spécifiques par type.
- Récapitulatif financier explicite : montant, frais, total débité, destinataire, référence.
- États : chargement, vide, erreur, indisponible, incompatible, contradiction.
- Responsive et accessibilité.

### 10.3 Design

- Conserver l'identité H³ Infinity Gaming.
- Statuts avec libellés et couleurs cohérents.
- Dialogues de confirmation proportionnés au risque (émission et remboursement plus stricts).
- Aucune surcharge : une information financière clé par bloc.

---

## 11. STRATÉGIE DE MIGRATION

### 11.1 Principes

- Aucun reset de base.
- Aucune suppression de données financières.
- Migrations additives d'abord, contraintes ensuite.
- Double écriture temporaire si nécessaire.
- Feature flag pour basculer les parcours.
- Réconciliation avant et après cutover.

### 11.2 Étapes

| Étape | Contenu | Critère de sortie |
|---|---|---|
| M0 | Sauvegarde, inventaire des anomalies, rapport de comptage | Rapport validé |
| M1 | Migration additive : enums, colonnes nullables, nouvelles tables, index | `drizzle-kit generate` + migration appliquée en préprod |
| M2 | Backfill : comptes système canoniques, références, `reference` des transactions existantes | Aucun doublon de compte système |
| M3 | Déploiement du moteur et des services, sans bascule UI | Tests unitaires et d'intégration verts |
| M4 | Bascule des parcours utilisateur derrière feature flag | Parcours existants fonctionnels |
| M5 | Bascule admin : émission, demandes, remboursements | Tests A/B/C verts |
| M6 | Nettoyage : FK ledger, contraintes, suppression des wrappers dépréciés | Typecheck, lint, build, tests verts |
| M7 | Réconciliation finale et rapport | `TRANSACTION-IMPLEMENTATION-REPORT.md` |

### 11.3 Données historiques

- Les transactions existantes conservent leur type et leur statut.
- Les écritures `SYSTEM_ADJUSTMENT` historiques ne sont pas reclassées.
- Les transactions `REFUNDED` sans écriture inverse sont listées dans un rapport ; aucune correction silencieuse.
- Les comptes système en double sont fusionnés uniquement après validation manuelle.

### 11.4 Rollback

- Chaque migration est accompagnée d'un script de rollback documenté.
- Les feature flags permettent de revenir aux parcours précédents sans rollback SQL.
- Aucun `DROP COLUMN` avant la phase M6 et validation.

---

## 12. TESTS NÉCESSAIRES

### 12.1 Unitaires

- `calculatePureFee` : frais, VIP, arrondis, montant nul.
- `postLedgerEntries` : équilibre, lignes invalides, compte inactif, solde négatif interdit.
- `assertTransition` : toutes les transitions autorisées/interdites.
- Politique A/B/C : chaque action × chaque niveau.
- Limites : min, max, journalier, deuxième approbation.
- Idempotence : même clé + même hash, même clé + hash différent.
- Résolution des paramètres URL par type.

### 12.2 Intégration (base de test)

- Transfert valide, auto-transfert, solde insuffisant, destinataire inexistant.
- Émission A → utilisateur, A → admin C, B → utilisateur, B → admin C.
- C ne peut pas émettre ; C peut demander ; aucune écriture à la soumission.
- Approbation A/B ; auto-approbation refusée ; double approbation refusée.
- Rejet sans mouvement ; justification obligatoire.
- Remboursement total/partiel ; écritures inverses ; double remboursement refusé.
- Commande : capture escrow, finalisation, commission unique, rejet.
- Tournoi : édition ouverte/fermée, date limite, places, doublon, frais réels.
- Item : prix modifié, stock, quantité.
- Produit : indisponible, prix modifié.
- Thème : déjà possédé.
- VIP : offre invalide, renouvellement.
- Dépôt/retrait : champs manquants, coordonnées invalides, réservation, rejet.
- Concurrence : deux débits simultanés, deux approbations, deux inscriptions sur la dernière place, deux achats du dernier stock.
- Échec SQL au milieu d'une opération : aucune écriture partielle.

### 12.3 E2E / UI

- Émission admin desktop et mobile.
- Demande C puis approbation/rejet.
- Transfert utilisateur avec PIN.
- Inscription tournoi avec `editionId`.
- Achat item/produit/thème/VIP.
- Dépôt/retrait.
- États de chargement, vides, erreurs, confirmations.
- Filtres, recherche, pagination, navigation, rafraîchissement.
- Accessibilité de base et cohérence du thème.

### 12.4 Non-régression

- `npm run typecheck` (ou script équivalent).
- `npm run lint`.
- `npm run build`.
- Les 12 tests existants doivent rester verts.
- Vérification des imports et des Server Actions après chaque phase.

---

## 13. PLAN D'IMPLÉMENTATION PAR PHASES

| Phase | Objectif | Livrables | Sortie |
|---|---|---|---|
| **P0** | Audit | `TRANSACTION-AUDIT.md`, ce plan | Validation utilisateur |
| **P1** | Socle ledger | `core/ledger.ts`, `core/accounts.ts`, `core/idempotency.ts`, migration additive | Tests unitaires ledger verts |
| **P2** | Moteur et types | `transaction-engine.ts`, types canoniques, Zod, erreurs | Tests moteur verts |
| **P3** | Transfert + remboursement | `transactions/transfer.ts`, `transactions/refund.ts`, façades | Transfert et refund testés |
| **P4** | Achats et inscriptions | `purchase.ts`, `tournament.ts`, `orders.ts`, `editions.ts` | Escrow exact, inscription atomique |
| **P5** | Dépôts / retraits | `deposit.ts`, `withdrawal.ts`, réservation, approbation | Demandes testées |
| **P6** | Émission et demandes A/B/C | `issuance.ts`, `credit-requests.ts`, `approval.ts`, politiques | Tests A/B/C verts |
| **P7** | UI admin | Onglets, formulaires, tableaux, dialogues | Parcours admin validé |
| **P8** | UI utilisateur | Parcours par type, résolution d'URL | Parcours utilisateur validé |
| **P9** | Nettoyage et rapport | Suppression des doublons, FK, contraintes, rapport | Build + tests + rapport |

Chaque phase se termine par : typecheck, lint, tests concernés, vérification des imports, revue des régressions.

---

## 14. RISQUES ET MESURES DE PROTECTION

| Risque | Probabilité | Impact | Mesure |
|---|---|---|---|
| Double migration / schéma divergent | Moyenne | Élevé | Une seule source Drizzle, `drizzle-kit generate`, revue du SQL avant application. |
| Écritures orphelines historiques | Moyenne | Élevé | Rapport de nettoyage avant FK ; aucune suppression. |
| Comptes système en double | Moyenne | Élevé | `system_key` unique, fusion manuelle validée. |
| Régression des parcours | Élevée | Moyen | Feature flags, URLs conservées, tests E2E. |
| Escrow négatif historique | Certaine | Élevé | Ne pas corriger silencieusement ; rapport et décision A. |
| Contournement de permission | Moyenne | Critique | Contrôles serveur, tests d'accès, aucun niveau client. |
| Double débit concurrent | Moyenne | Critique | `FOR UPDATE`, ordre de verrouillage, idempotence, tests de concurrence. |
| Frais incohérents | Moyenne | Élevé | Convention unique documentée, tests de réconciliation. |
| `vip_subscriptions` unique | Certaine | Moyen | Index partiel sur les abonnements actifs. |
| Perte de revenus (frais fail-open) | Moyenne | Élevé | Erreur bloquante ou fallback explicite audité, jamais 0 silencieux. |
| Budget temps/tokens | Moyenne | Moyen | Phases livrables indépendamment, priorité P1–P6 avant UI. |
| Données de production modifiées | Faible | Critique | Sauvegarde, préprod, aucun script destructif. |

---

## 15. DÉCISIONS À VALIDER AVANT IMPLÉMENTATION

1. **Type produit canonique** : utiliser `ORDER_PURCHASE` et retirer `PRODUCT_PURCHASE` du frontend.
2. **Convention de frais** : le payeur paie `montant + frais` pour les transferts/retraits ; les achats incluent la commission dans le prix.
3. **Compte d'émission** : `SYSTEM_GTC_ISSUANCE` avec solde négatif autorisé par conception.
4. **Clearing externe** : `SYSTEM_EXTERNAL_CLEARING` pour les dépôts/retraits ; `SYSTEM_ADJUSTMENT` réservé à l'historique.
5. **Réservation des retraits** : débit à la création de la demande, restitution si rejet.
6. **Remboursements** : inversion exacte des écritures d'origine, partiels autorisés dans la limite du restant.
7. **Plafonds A/B/C** : valeurs proposées au §4.3 à confirmer ou ajuster.
8. **Deuxième approbation** : seuil configurable, deux approbateurs distincts au-delà.
9. **Demandes de crédit** : table dédiée, pas de réutilisation de `requests`.
10. **Suppression des anciens moteurs** : après migration de tous les appelants, pas avant.

---

## 16. CE QUI N'EST PAS FAIT DANS CETTE ÉTAPE

- Aucune migration exécutée.
- Aucun schéma modifié.
- Aucune action serveur modifiée.
- Aucun composant UI modifié.
- Aucune donnée supprimée.

**Attente : validation de ce plan et des décisions du §15 avant toute implémentation.**
