Error marking group complete: Error: Failed query: insert into "edition_results" ("id", "edition_id", "registration_id", "position", "tier", "prize_amount", "prize_currency", "prize_description", "matches_played", "matches_won", "matches_lost", "matches_drawn", "total_score", "average_score", "awards", "special_mentions", "prize_paid", "payment_transaction_id", "paid_at", "statistics", "metadata", "is_deleted", "created_at", "updated_at") values (default, $1, $2, default, default, default, default, default, $3, $4, $5, $6, default, default, default, default, default, default, default, default, default, default, default, $7) on conflict ("edition_id","registration_id") do update set "matches_played" = $8, "matches_won" = $9, "matches_lost" = $10, "matches_drawn" = $11, "updated_at" = $12
params: 16e0181f-cc81-434f-b2f5-dffe38170283,b69f37be-e734-4070-8e37-cf993a0220bb,3,3,0,0,2026-04-27T15:45:44.600Z,3,3,0,0,2026-04-27T15:45:44.601Z
    at bV.queryWithCache (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:28:38411)
    at async o (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\_224c3e5b._.js:1:8598)
    at async aJ (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\actions_phases_ts_5562eba9._.js:1:71943)
    at async (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\actions_phases_ts_5562eba9._.js:1:54380)
    at async g (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:21:10448)
    at async d.F [as begin] (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:21:10021)
    at async ay (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\actions_phases_ts_5562eba9._.js:1:53976) {
  query: 'insert into "edition_results" ("id", "edition_id", "registration_id", "position", "tier", "prize_amount", "prize_currency", "prize_description", "matches_played", "matches_won", "matches_lost", "matches_drawn", "total_score", "average_score", "awards", "special_mentions", "prize_paid", "payment_transaction_id", "paid_at", "statistics", "metadata", "is_deleted", "created_at", "updated_at") values (default, $1, $2, default, default, default, default, default, $3, $4, $5, $6, default, default, default, default, default, default, default, default, default, default, default, $7) on conflict ("edition_id","registration_id") do update set "matches_played" = $8, "matches_won" = $9, "matches_lost" = $10, "matches_drawn" = $11, "updated_at" = $12',
  params: [Array],
  [cause]: i: null value in column "position" of relation "edition_results" violates not-null constraint
      at ad (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:2279)
      at <unknown> (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:3216)
      at TLSSocket.aS (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:3220) {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '23502',
    detail: 'Failing row contains (e9185c0b-cea5-4ba7-8be2-28a6225ac0f6, 16e0181f-cc81-434f-b2f5-dffe38170283, b69f37be-e734-4070-8e37-cf993a0220bb, null, null, null, GTC, null, 3, 3, 0, 0, 0, null, {}, {}, f, null, null, {}, {}, f, 2026-04-27 15:45:41.494884, 2026-04-27 15:45:44.6).',
    schema_name: 'public',
    table_name: 'edition_results',
    column_name: 'position',
    file: 'execMain.c',
    line: '2032',
    routine: 'ExecConstraints'
  }
}
⨯ Error: Failed query: insert into "edition_results" ("id", "edition_id", "registration_id", "position", "tier", "prize_amount", "prize_currency", "prize_description", "matches_played", "matches_won", "matches_lost", "matches_drawn", "total_score", "average_score", "awards", "special_mentions", "prize_paid", "payment_transaction_id", "paid_at", "statistics", "metadata", "is_deleted", "created_at", "updated_at") values (default, $1, $2, default, default, default, default, default, $3, $4, $5, $6, default, default, default, default, default, default, default, default, default, default, default, $7) on conflict ("edition_id","registration_id") do update set "matches_played" = $8, "matches_won" = $9, "matches_lost" = $10, "matches_drawn" = $11, "updated_at" = $12
params: 16e0181f-cc81-434f-b2f5-dffe38170283,b69f37be-e734-4070-8e37-cf993a0220bb,3,3,0,0,2026-04-27T15:45:44.600Z,3,3,0,0,2026-04-27T15:45:44.601Z
    at bV.queryWithCache (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:28:38411)
    at async o (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\_224c3e5b._.js:1:8598)
    at async aJ (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\actions_phases_ts_5562eba9._.js:1:71943)
    at async (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\actions_phases_ts_5562eba9._.js:1:54380)
    at async g (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:21:10448)
    at async d.F [as begin] (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:21:10021)
    at async ay (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\actions_phases_ts_5562eba9._.js:1:53976) {
  query: 'insert into "edition_results" ("id", "edition_id", "registration_id", "position", "tier", "prize_amount", "prize_currency", "prize_description", "matches_played", "matches_won", "matches_lost", "matches_drawn", "total_score", "average_score", "awards", "special_mentions", "prize_paid", "payment_transaction_id", "paid_at", "statistics", "metadata", "is_deleted", "created_at", "updated_at") values (default, $1, $2, default, default, default, default, default, $3, $4, $5, $6, default, default, default, default, default, default, default, default, default, default, default, $7) on conflict ("edition_id","registration_id") do update set "matches_played" = $8, "matches_won" = $9, "matches_lost" = $10, "matches_drawn" = $11, "updated_at" = $12',
  params: [Array],
  digest: '1607877543',
  [cause]: i: null value in column "position" of relation "edition_results" violates not-null constraint
      at ad (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:2279)
      at <unknown> (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:3216)
      at TLSSocket.aS (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:3220) {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '23502',
    detail: 'Failing row contains (e9185c0b-cea5-4ba7-8be2-28a6225ac0f6, 16e0181f-cc81-434f-b2f5-dffe38170283, b69f37be-e734-4070-8e37-cf993a0220bb, null, null, null, GTC, null, 3, 3, 0, 0, 0, null, {}, {}, f, null, null, {}, {}, f, 2026-04-27 15:45:41.494884, 2026-04-27 15:45:44.6).',
    schema_name: 'public',
    table_name: 'edition_results',
    column_name: 'position',
    file: 'execMain.c',
    line: '2032',
    routine: 'ExecConstraints'
  }
}
