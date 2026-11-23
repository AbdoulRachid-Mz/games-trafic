# Architecture financière — Games Trafics (réel + cible)

## 1. Noyau canonique (`lib/finance/`)

| Module | Rôle réel | Notes d'usage |
|---|---|---|
| `core/errors.ts` | `FinanceError`, codes stables (`VALIDATION_ERROR`, `INSUFFICIENT_BALANCE`, `UNBALANCED_LEDGER`, `IDEMPOTENCY_CONFLICT`, `IDEMPOTENCY_IN_PROGRESS`, `PRICE_CHANGED`, etc.) | À propager/mapper proprement vers actions/API/UI ; pas d'échec silencieux. |
| `core/postings.ts` | Normalisation/validation pure des écritures (`toCents/fromCents`, équilibre, un seul côté débit/crédit) | Base de toute écriture ledger. |
| `core/ledger.ts` | `postLedgerEntries`, `getAccountBalanceCents`, verrous comptes, contrôle solde/négatif autorisé | Écriture/soldes ledger canoniques. |
| `core/accounts.ts` | Comptes système idempotents par `systemKey` (`GTC_ISSUANCE`, `EXTERNAL_CLEARING`, `ESCROW`, `FEES`, `ADJUSTMENT`, `TOURNAMENT_POOL`), résolution compte wallet/utilisable | Utiliser ces helpers plutôt que rechercher par type ambigu. |
| `core/hash.ts`, `core/idempotency.ts` | Hash stable payload, `beginIdempotency/checkIdempotency/completeIdempotency/failIdempotency` sur table `idempotency_keys` | Conflit si même clé + payload différent ; retry doit rejouer le résultat complété. |
| `core/transaction-engine.ts` | `executeFinancialOperation` : orchestration atomique (idempotence optionnelle, tx wallet_transactions + postings ledger, statuts/complétion) | Point d'exécution principal à privilégier. |
| `fees/fee-engine.ts` | `calculateTransactionFees(type, amount, {isVip?, settings?})`, résolution taux par type/settings, calcul pur déterministe | Autorité serveur des frais ; `settings` explicite invalide => erreur, sinon fallback politique par défaut contrôlé. |
| `policies/limits.ts`, `policies/admin-policy.ts` | Politique financière (plafonds A/B/C, double approbation, refund) et décisions pures | Recharger/vérifier serveur-side à l'exécution. |
| `transactions/*.ts` | Briques métier : `issuance`, `transfer`, `deposit` (approval), `withdrawal` (reserve/approve/reject), `purchase` (order capture/payout), `tournament`, `refund` | Construisent/encadrent postings et règles métier ; doivent rester cohérents avec statuts. |
| `requests/{credit-requests,approval}.ts` | Demandes d'émission/crédit (`transaction_credit_requests`) et approbation ; aucun ledger avant approbation | Canal admin structuré A/B/C. |
| `audit/audit-log.ts` | Journal append-only `financial_audit_logs` | À écrire dans la même transaction métier sensible quand possible. |
| `index.ts` | Ré-exporte core + transactions + policies + audit **et** `./ledger/ledger-engine` | Attention : surface legacy incluse (voir ci-dessous). |

## 2. Données/contraintes clés (`database/schema.ts`, `drizzle/0016_finance_core.sql`)

- `financial_accounts`: `type`, `system_key` unique, `allow_negative_balance`, `isActive/isLocked`, devise.
- `user_wallets`: lien `financialAccountId`, PIN, verrou/state, métadonnées ; ne doit pas être la source de vérité du solde.
- `wallet_transactions`: journal opérationnel (`type`, `status`, montant/frais/net, acteurs, `reference`, `idempotency_key`, `created_by_user_id/actor_level`, `reason`, `reversal_of/reversed_by`, `completed_at`, `metadata`, `balanceAfter` présent mais non autoritaire).
- `ledger_entries`: écritures par transaction+compte (`debit/credit`, devise), index/contraintes d'intégrité (certaines ajoutées `NOT VALID` historiquement en migration 0016).
- `idempotency_keys`: `(scope,key)` unique, `request_hash`, `status` (`IN_PROGRESS/COMPLETED/FAILED`), lien transaction/réponse.
- `financial_audit_logs`: append-only (acteur/action/tx/request/account/montant/raison/métadonnées).
- `requests`: demandes génériques (dépôt/retrait/item etc.) avec statut/approbation — distinct de `transaction_credit_requests`.
- `orders`, `edition_registrations`, `vip_subscriptions`, `theme_purchases`, etc. portent les objets métier liés aux effets financiers.

## 3. Surfaces d'exécution actuelles (à auditer/consolider)

| Surface | État observé | Direction |
|---|---|---|
| `actions/transactions.ts` | Orchestrateur central riche (SEC checks, anti-doublons courts, branches par type, appel `executeFinancialOperation`) mais accepte/porte logique trop large et options sensibles | Conserver comme point d'entrée contrôlé uniquement si durci ; idéalement déléguer à services métier canoniques uniques. |
| `actions/requests.ts` | Création/approbation dépôt-retrait-item, réservation/settlement retrait, appels finance | Aligner strictement sur request-only, cooldown/idempotence déterministe, permissions et statuts. |
| `actions/orders.ts` | Capture escrow/payout/refund via builders finance | Compléter lifecycle/idempotence/éligibilité server-side. |
| `actions/editions.ts` | Join/participation avec pricing serveur partiel, idempotency `tournament-join:*` | Vérifier règles complètes (organisateur gratuit, capacité, prix/frais, atomicité). |
| `actions/wallets.ts` | Wallet mgmt + transferts/admin deposit + mutations directes `userWallets` | Supprimer usages financiers directs/legacy ; clés idempotentes déterministes. |
| `actions/admin-finance.ts` + `lib/finance/requests/*` | Canal émission/crédit/approbation dédié | Voie privilégiée pour émissions/admin credits. |
| `actions/vip.ts`, `actions/themes.ts`, `actions/games.ts` | Mélange métier/état ; certains flux paiement/fulfillment à clarifier ou canoniser | Chaque achat/effet monétaire doit passer par flux financier canonique. |
| `app/api/transactions/*` | Endpoints fins (create/calc-fees/list) proxy vers actions/libs | Ne jamais être source d'autorité ; valider/scoper strictement. |

## 4. Legacy / chemins interdits à ne pas étendre

- `lib/finance/ledger/ledger-engine.ts` : API parallèle (`executeTransaction`, `executeAtomicTransfer`, etc.) pouvant diverger du noyau `core/*`.
- `lib/ledger/ledger-utils.ts` : façade `use server` rétro-compatible exposant ces primitives.
- Idempotence non déterministe (ex. `admin-deposit:${wallet.id}:${Date.now()}` observé).
- Mutations directes de soldes/états financiers hors ledger/opération canonique.
- Raccourcis UI/client qui déclenchent un effet financier sans preuve/contrôle serveur à l'exécution.

## 5. Règle de consolidation

Pour un nouveau besoin financier : **étendre une brique canonique** (`core/*`, `transactions/*`, `policies/*`) et y faire converger actions/API/UI. Si un chemin legacy doit subsister temporairement, le marquer explicitement, le rendre non autoritaire, et éviter toute nouvelle dépendance.
