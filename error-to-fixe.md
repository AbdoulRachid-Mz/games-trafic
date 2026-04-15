⨯ Error: Failed query: insert into "signals" ("id", "reporter_id", "target_type", "target_id", "category_id", "is_deleted", "title", "description", "attachments", "severity", "status", "assigned_to", "resolved_by", "resolution", "resolved_at", "metadata", "created_at", "updated_at") values (default, $1, $2, default, default, default, $3, $4, default, default, $5, default, default, default, default, $6, $7, $8) returning "id", "reporter_id", "target_type", "target_id", "category_id", "is_deleted", "title", "description", "attachments", "severity", "status", "assigned_to", "resolved_by", "resolution", "resolved_at", "metadata", "created_at", "updated_at"
params: anonymous,BUG,Probleme d'inscription au tournoi,je n'arrive pas a m'inscrire a un tournoi premier de hamani h3,PENDING,{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0","url":"http://localhost:3000/signals"},2026-04-15T13:23:21.126Z,2026-04-15T13:23:21.126Z
    at bV.queryWithCache (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:28:38411)
    at async (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:28:40974)
    at async i (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\_78eba91e._.js:1:469)
    at async m (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\_f1ead085._.js:1:7976) {
  query: 'insert into "signals" ("id", "reporter_id", "target_type", "target_id", "category_id", "is_deleted", "title", "description", "attachments", "severity", "status", "assigned_to", "resolved_by", "resolution", "resolved_at", "metadata", "created_at", "updated_at") values (default, $1, $2, default, default, default, $3, $4, default, default, $5, default, default, default, default, $6, $7, $8) returning "id", "reporter_id", "target_type", "target_id", "category_id", "is_deleted", "title", "description", "attachments", "severity", "status", "assigned_to", "resolved_by", "resolution", "resolved_at", "metadata", "created_at", "updated_at"',
  params: [Array],
  digest: '408500071',
  [cause]: i: insert or update on table "signals" violates foreign key constraint "signals_reporter_id_users_id_fk"
      at ad (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:2279)
      at <unknown> (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:3216)
      at TLSSocket.aS (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\ssr\lib_db_index_ts_bab9fa88._.js:4:3220) {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '23503',
    detail: 'Key (reporter_id)=(anonymous) is not present in table "users".',
    schema_name: 'public',
    table_name: 'signals',
    constraint_name: 'signals_reporter_id_users_id_fk',
    file: 'ri_triggers.c',
    line: '2599',
    routine: 'ri_ReportViolation'
  }
}