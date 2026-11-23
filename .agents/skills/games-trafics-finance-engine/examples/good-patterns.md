# Bons patterns financiers

## 1. Idempotence déterministe et retry-safe

```ts
// Clé stable dérivée de l'intention métier (pas de Date.now / random)
const idempotencyKey = `withdrawal-settle:${requestId}`;
const result = await executeFinancialOperation({
  // ...
  idempotencyKey,
  idempotencyScope: "withdrawal:settlement",
  client: tx,
});
// Un retry identique rejoue le résultat complété sans double effet.
```

## 2. Pricing/frais recalculés serveur à l'exécution

```ts
// Charger prix/politique depuis la DB au moment d'exécuter
const edition = await getEditionById(editionId); // serveur
const entryFee = money(edition.entryFee);
const { fees } = await calculateTransactionFees("TOURNAMENT_PARTICIPATION", entryFee /*, options serveur */);
const totalDebit = add(entryFee, fees);

if (clientIntentTotal !== undefined && !equals(clientIntentTotal, totalDebit)) {
  throw new FinanceError("PRICE_CHANGED", "Le tarif a changé, veuillez revalider.", { entryFee, fees, totalDebit });
}
```

## 3. Vérifications d'exécution dans la transaction

```ts
await db.transaction(async (tx) => {
  const actor = await getCurrentUserOrThrow();
  const wallet = await getOwnedActiveWalletForUpdate(tx, actor.id, walletId);
  await assertUserFinancialCooldown(tx, actor.id, "TRANSFER"); // 2 min, atomique, retries exemptés

  // vérifier destinataire/éligibilité/solde via ledger, puis exécuter
  const op = await executeFinancialOperation({ /* postings, ids serveur */ client: tx });
  await writeFinancialAuditLog(tx, { action: "TRANSFER_EXECUTED", transactionId: op.transaction.id, /* ... */ });
  return op;
});
```

## 4. Demande avant effet externe/utilisateur

```ts
// Dépôt/retrait: créer d'abord une demande en PENDING (aucun crédit/débit utilisateur immédiat non prévu)
// Crédit/débit réel uniquement via approbation/règlement canonique:
await executeDepositApproval({ requestId, userId, walletId, walletAccountId, amount, actorId, actorLevel, client: tx });
```

## 5. Postings équilibrés et comptes système par clé

```ts
const escrow = await getOrCreateSystemAccount(tx, "ESCROW");
const feesAcc = await getOrCreateSystemAccount(tx, "FEES");
// debit total == credit total, montants normalisés, comptes résolus serveur-side
```

## 6. PIN/passkey comme preuve d'exécution

- Générer/valider un challenge lié à `{walletId,type,amount,recipientId,fees,...}`.
- Consommer le challenge **une seule fois** côté serveur et exiger cette consommation dans le chemin d'exécution financier (pas seulement dans l'UI).
- Rejeter si les paramètres d'exécution diffèrent de ceux du challenge.

## 7. Lecture de solde

```ts
const balance = await getAccountBalanceCents(tx, accountId); // ledger-derived
// Ne pas lire userWallets.balance ou balanceAfter comme vérité.
```
