# Anti-patterns financiers (interdits)

## 1. Autorité client / confiance aux entrées

```ts
// INTERDIT: montant, frais, isVip, statut ou compte choisis par le client
await createTransaction({ amount: body.amount, fees: body.fees, type: body.type, status: "COMPLETED" });
await calculateTransactionFees(type, amount, { isVip: body.isVip }); // comme autorité d'exécution
```

**Correct :** recalculer prix/frais/statut/comptes depuis la DB et les politiques serveur à l'exécution.

## 2. Idempotence non déterministe

```ts
// INTERDIT: chaque tentative génère une nouvelle clé => retries dupliquent
idempotencyKey: `admin-deposit:${wallet.id}:${Date.now()}`
```

**Correct :** clé stable par intention métier (`{operation}:{entityId}` ou clé fournie par orchestrateur fiable) + `requestHash`.

## 3. Contournements exposés

```ts
// INTERDIT sur chemins utilisateur/public: options qui sautent les garde-fous
createTransaction(data, { allowDuplicate: true, isSystem: true, pin: "..." /* non vérifié */ })
```

**Correct :** modes internes strictement serveur, non exposés aux clients/API; contrôles toujours actifs.

## 4. Écritures directes / chemins parallèles

```ts
// INTERDIT: solde ou état financier maintenu hors ledger canonique
await db.update(userWallets).set({ balance: sql`${userWallets.balance} + ${amount}` });
await executeAtomicTransfer(...); // via facade/engine legacy parallèle
```

**Correct :** `executeFinancialOperation` + `postLedgerEntries` + comptes/soldes ledger-derived.

## 5. Effets prématurés ou demande traitée comme paiement

```ts
// INTERDIT: dépôt demandé => crédit immédiat utilisateur
// INTERDIT: marquer COMPLETED avant règlement/fulfillment réel
await db.update(requests).set({ status: "COMPLETED", completedAt: new Date() }); // sans exécution financière requise
```

**Correct :** demande `PENDING`, effet financier à l'approbation/règlement/fulfillment réel, transitions atomiques.

## 6. Cooldown absent ou non atomique

```ts
// INTERDIT: fenêtre courte best-effort (10s) à la place du cooldown 2 min requis,
// ou vérification en mémoire sujette aux races.
if (Date.now() - last < 10_000) throw ...
```

**Correct :** cooldown serveur 120s, vérifié atomiquement en DB/transaction, exemptions limitées aux retries idempotents.

## 7. Preuve PIN/passkey décorative

```ts
// INTERDIT: valider côté UI puis exécuter sans preuve serveur liée à l'intention
await verifyPasskeyChallenge(...); // UI
await createTransaction(...);      // exécution sans challenge consommé lié
```

**Correct :** preuve à usage unique, hashée sur paramètres exacts, exigée et consommée au point d'exécution serveur.

## 8. Mutation historique automatique

```ts
// INTERDIT: script/cron qui modifie ou recrédite des transactions/ledger passés
await db.update(walletTransactions).set({ status: "COMPLETED" }); // réparation silencieuse
```

**Correct :** diagnostic read-only, rapport d'anomalies, plan de réconciliation contrôlé/audité.
