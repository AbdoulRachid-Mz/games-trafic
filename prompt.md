Error getting categories by entity type: Error: Failed query: select "id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at" from "categories" where ("categories"."is_deleted" = $1 and "categories"."applicable_entities" && ($2)) order by "categories"."sort_order" asc, "categories"."name" asc
params: false,USER
    at async getCategoriesByEntityType (actions\categories.ts:238:12)
  236 |       .orderBy(asc(categories.sortOrder), asc(categories.name));
  237 |
> 238 |     return await query;
      |            ^
  239 |   } catch (error) {
  240 |     console.error('Error getting categories by entity type:', error);
  241 |     throw new Error('Failed to fetch categories by entity type'); {
  query: 'select "id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at" from "categories" where ("categories"."is_deleted" = $1 and "categories"."applicable_entities" && ($2)) order by "categories"."sort_order" asc, "categories"."name" asc',
  params: [Array],
  [cause]: Error [PostgresError]: malformed array literal: "USER"
      at ignore-listed frames {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '22P02',
    detail: 'Array value must start with "{" or dimension information.',
    where: "unnamed portal parameter $2 = '...'",
    file: 'arrayfuncs.c',
    line: '262',
    routine: 'array_in'
  }
}
 Cache  Error getting categories by entity type: Error: Failed query: select "id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at" from "categories" where ("categories"."is_deleted" = $1 and "categories"."applicable_entities" && ($2)) order by "categories"."sort_order" asc, "categories"."name" asc
params: false,USER
    at getCategoriesByEntityType (actions\categories.ts:238:12)
  236 |       .orderBy(asc(categories.sortOrder), asc(categories.name));
  237 |
> 238 |     return await query;
      |            ^
  239 |   } catch (error) {
  240 |     console.error('Error getting categories by entity type:', error);
  241 |     throw new Error('Failed to fetch categories by entity type'); {
  environmentName: 'Cache'
}
⨯ Error: Failed to fetch categories by entity type
    at getCategoriesByEntityType (actions\categories.ts:241:11)
  239 |   } catch (error) {
  240 |     console.error('Error getting categories by entity type:', error);
> 241 |     throw new Error('Failed to fetch categories by entity type');
      |           ^
  242 |   }
  243 | }
  244 | {
  environmentName: 'Cache',
  digest: '333199655'
}
 POST /admin/categories 500 in 567ms (compile: 9ms, proxy.ts: 13ms, render: 545ms)
Error creating category: Error: Failed query: insert into "categories" ("id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at") values (default, $1, $2, $3, default, default, default, $4, $5, $6, $7, $8, default, $9, default, default, default, $10, default, $11, $12) returning "id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at"
params: jeu,premiere categorie,jeu,,0,jeu,jeu,{"USER"},0,true,2026-03-25T21:56:41.217Z,2026-03-25T21:56:41.217Z
    at async createCategory (actions\categories.ts:339:20)
  337 |     }
  338 |
> 339 |     const result = await db
      |                    ^
  340 |       .insert(categories)
  341 |       .values({
  342 |         ...categoryData, {
  query: 'insert into "categories" ("id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at") values (default, $1, $2, $3, default, default, default, $4, $5, $6, $7, $8, default, $9, default, default, default, $10, default, $11, $12) returning "id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at"',
  params: [Array],
  [cause]: Error [PostgresError]: insert or update on table "categories" violates foreign key constraint "categories_parent_id_categories_id_fk"
      at ignore-listed frames {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '23503',
    detail: 'Key (parent_id)=() is not present in table "categories".',
    schema_name: 'public',
    table_name: 'categories',
    constraint_name: 'categories_parent_id_categories_id_fk',
    file: 'ri_triggers.c',
    line: '2599',
    routine: 'ri_ReportViolation'
  }
}
⨯ Error: Failed query: insert into "categories" ("id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at") values (default, $1, $2, $3, default, default, default, $4, $5, $6, $7, $8, default, $9, default, default, default, $10, default, $11, $12) returning "id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at"
params: jeu,premiere categorie,jeu,,0,jeu,jeu,{"USER"},0,true,2026-03-25T21:56:41.217Z,2026-03-25T21:56:41.217Z
    at async createCategory (actions\categories.ts:339:20)
  337 |     }
  338 |
> 339 |     const result = await db
      |                    ^
  340 |       .insert(categories)
  341 |       .values({
  342 |         ...categoryData, {
  query: 'insert into "categories" ("id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at") values (default, $1, $2, $3, default, default, default, $4, $5, $6, $7, $8, default, $9, default, default, default, $10, default, $11, $12) returning "id", "name", "description", "slug", "icon", "color", "image", "parent_id", "level", "path", "full_path", "applicable_entities", "filters", "sort_order", "metadata", "item_count", "is_featured", "is_active", "is_deleted", "created_at", "updated_at"',
  params: [Array],
  digest: '1188116301',
  [cause]: Error [PostgresError]: insert or update on table "categories" violates foreign key constraint "categories_parent_id_categories_id_fk"
      at ignore-listed frames {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '23503',
    detail: 'Key (parent_id)=() is not present in table "categories".',
    schema_name: 'public',
    table_name: 'categories',
    constraint_name: 'categories_parent_id_categories_id_fk',
    file: 'ri_triggers.c',
    line: '2599',
    routine: 'ri_ReportViolation'
  }
}
 POST /admin/categories 500 in 1980ms (compile: 12ms, proxy.ts: 22ms, render: 1945ms)