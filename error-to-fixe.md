Error getting transactions: Error: Failed query: select "id", "wallet_id", "financial_account_id", "from_user_id", "to_user_id", "amount", "fees", "net_amount", "balance_after", "currency", "type", "metadata", "status", "is_deleted", "reference", "idempotency_key", "created_by_user_id", "actor_level", "reason", "reversal_of", "reversed_by", "completed_at", "description", "created_at" from "wallet_transactions" where ("wallet_transactions"."is_deleted" = $1 and "wallet_transactions"."wallet_id" = $2) order by "wallet_transactions"."created_at" desc limit $3
params: false,306828fe-f199-4312-a46a-0f64cf067b28,10
    at async getWalletTransactions (actions\wallets.ts:636:30)
  634 |
  635 |     // Requête pour les données
> 636 |     const transactionsData = await db
      |                              ^
  637 |       .select()
  638 |       .from(walletTransactions)
  639 |       .where(conditions) {
  query: 'select "id", "wallet_id", "financial_account_id", "from_user_id", "to_user_id", "amount", "fees", "net_amount", "balance_after", "currency", "type", "metadata", "status", "is_deleted", "reference", "idempotency_key", "created_by_user_id", "actor_level", "reason", "reversal_of", "reversed_by", "completed_at", "description", "created_at" from "wallet_transactions" where ("wallet_transactions"."is_deleted" = $1 and "wallet_transactions"."wallet_id" = $2) order by "wallet_transactions"."created_at" desc limit $3',
  params: [ false, '306828fe-f199-4312-a46a-0f64cf067b28', 10 ],
  [cause]: error: column "reference" does not exist
      at async getWalletTransactions (actions\wallets.ts:636:30)
    634 |
    635 |     // Requête pour les données
  > 636 |     const transactionsData = await db
        |                              ^
    637 |       .select()
    638 |       .from(walletTransactions)
    639 |       .where(conditions) {
    length: 110,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '186',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3716',
    routine: 'errorMissingColumn'
  }
}
⨯ Error: Failed to fetch transactions
    at getWalletTransactions (actions\wallets.ts:666:11)
  664 |   } catch (error) {
  665 |     console.error('Error getting transactions:', error);
> 666 |     throw new Error('Failed to fetch transactions');
      |           ^
  667 |   }
  668 | }
  669 | {
  digest: '3909842078'
}
 POST /wallet 500 in 2.7s (next.js: 101ms, proxy.ts: 57ms, application-code: 2.5s)
  └─ ƒ getWalletTransactions({"filters":{"walletId":"306828fe-f199-4312-a46a-0f64cf067b28"},"options":{"sortBy":"createdAt","sortOrder":"desc"},"pagination":{"limit":10,"page":1}}) in 2448ms actions/wallets.ts
[RouteResolver] Match: {
  pathname: '/wallet',
  matched: 'Wallet',
  score: 2,
  patterns: [ '/^\\/wallet$/', '/^\\/wallet\\/.*$/' ]
}
[RouteResolver] Match: {
  pathname: '/wallet',
  matched: 'Wallet',
  score: 2,
  patterns: [ '/^\\/wallet$/', '/^\\/wallet\\/.*$/' ]
}