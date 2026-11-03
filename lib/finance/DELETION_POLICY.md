# Politique d'Immutabilité et de Rétention Comptable (Games-Trafics)

> **Règle fondamentale :** Aucun enregistrement financier ne doit JAMAIS faire l'objet d'une suppression physique (`DELETE FROM`) ou d'une suppression logique masquante (`is_deleted = true`).

## 1. Périmètre des tables financières protégées

Les tables suivantes sont protégées par cette politique :
1. **`ledger_entries`** : Grand livre comptable en partie double (débit / crédit). Strictement immuable (append-only).
2. **`wallet_transactions`** : Historique des opérations financières des utilisateurs.
3. **`financial_accounts`** : Comptes d'utilisateurs et comptes système (`SYSTEM_GTC_ISSUANCE`, `PLATFORM_ESCROW`, etc.).
4. **`user_wallets`** : Porte-monnaie utilisateur.
5. **`receipts`** : Reçus et preuves de transaction horodatées.

---

## 2. Procédure d'annulation et de correction

Toute annulation d'opération, correction d'erreur ou compensation commerciale **DOIT** passer exclusivement par :
1. La création d'une nouvelle transaction de compensation de type `REFUND` ou `REVERSAL`.
2. L'écriture d'entrées inverses strictes dans `ledger_entries` (inversion débit ↔ crédit sur les mêmes comptes financiers).
3. Le référencement bidirectionnel de la transaction d'origine (`reversal_of` ou champ équivalent dans `metadata`).

---

## 3. Audits et Réconciliations

- Les calculs de solde réel sont systématiquement dérivés de `SUM(credit) - SUM(debit)` dans `ledger_entries`.
- Les requêtes d'audit et d'historique ne doivent jamais filtrer sur `is_deleted` pour les entités financières, afin de garantir l'intégrité de la piste d'audit.
