'use server';

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as schema from '@/database/schema';

// ============================================================================
// TYPES
// ============================================================================

export interface TableStats {
  tableName: string;
  rowCount: number;
  totalSize: string;
  indexSize: string;
  toastSize: string;
}

export interface DatabaseStats {
  totalSize: string;
  tables: TableStats[];
  totalTables: number;
  totalRows: number;
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Extrait les lignes d'un résultat db.execute de manière agnostique au driver
 * (supporte à la fois postgres-js et neon-http)
 */
function getRows<T = Record<string, any>>(result: any): T[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.rows)) return result.rows;
  return [];
}

/**
 * Formate la taille en octets en chaîne lisible (Ko, Mo, Go)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Récupère les statistiques de toutes les tables
 */
export async function getAllTableStats(): Promise<TableStats[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        table_name AS "tableName",
        n_live_tup AS "rowCount",
        pg_total_relation_size(quote_ident(table_name)) AS "totalSizeBytes",
        pg_indexes_size(quote_ident(table_name)) AS "indexSizeBytes",
        pg_total_relation_size(quote_ident(table_name)) - pg_indexes_size(quote_ident(table_name)) - COALESCE(pg_total_relation_size(quote_ident(table_name) || '_toast'), 0) AS "toastSizeBytes"
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY n_live_tup DESC;
    `);

    return getRows(result).map((row: any) => ({
      tableName: row.tableName,
      rowCount: parseInt(row.rowCount, 10),
      totalSize: formatBytes(parseInt(row.totalSizeBytes, 10)),
      indexSize: formatBytes(parseInt(row.indexSizeBytes, 10)),
      toastSize: formatBytes(parseInt(row.toastSizeBytes, 10)),
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des tables:', error);
    throw new Error('Impossible de récupérer les statistiques des tables');
  }
}

/**
 * Récupère la taille totale de la base de données
 */
export async function getDatabaseTotalSize(): Promise<string> {
  try {
    const result = await db.execute(sql`
      SELECT pg_database_size(current_database()) AS size;
    `);
    const size = getRows(result)[0]?.size;
    return formatBytes(parseInt(size as string, 10));
  } catch (error) {
    console.error("Erreur lors de la récupération de la taille totale de la base:", error);
    throw new Error("Impossible de récupérer la taille de la base de données");
  }
}

/**
 * Récupère toutes les statistiques de la base de données
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const tables = await getAllTableStats();
    const totalSize = await getDatabaseTotalSize();
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

    return {
      totalSize,
      tables,
      totalTables: tables.length,
      totalRows,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw new Error('Impossible de récupérer les statistiques de la base de données');
  }
}

/**
 * Récupère les statistiques d'une table spécifique
 */
export async function getTableStats(tableName: keyof typeof schema): Promise<TableStats | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        table_name AS "tableName",
        n_live_tup AS "rowCount",
        pg_total_relation_size(quote_ident(table_name)) AS "totalSizeBytes",
        pg_indexes_size(quote_ident(table_name)) AS "indexSizeBytes",
        pg_total_relation_size(quote_ident(table_name)) - pg_indexes_size(quote_ident(table_name)) - COALESCE(pg_total_relation_size(quote_ident(table_name) || '_toast'), 0) AS "toastSizeBytes"
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name = ${tableName}
      LIMIT 1;
    `);

    const rows = getRows(result);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      tableName: String(row.tableName),
      rowCount: parseInt(String(row.rowCount), 10),
      totalSize: formatBytes(parseInt(String(row.totalSizeBytes), 10)),
      indexSize: formatBytes(parseInt(String(row.indexSizeBytes), 10)),
      toastSize: formatBytes(parseInt(String(row.toastSizeBytes), 10)),
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques de la table ${tableName}:`, error);
    throw new Error(`Impossible de récupérer les statistiques de la table ${tableName}`);
  }
}

/**
 * Récupère les noms de toutes les tables
 */
export async function getTableNames(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    return getRows(result).map((row: any) => row.table_name);
  } catch (error) {
    console.error('Erreur lors de la récupération des noms des tables:', error);
    throw new Error('Impossible de récupérer les noms des tables');
  }
}

/**
 * Récupère le nombre d'éléments par table (count rapide)
 */
export async function getTableCounts(): Promise<Record<string, number>> {
  try {
    const tableNames = await getTableNames();
    const counts: Record<string, number> = {};

    for (const tableName of tableNames) {
      const result = await db.execute(sql`SELECT COUNT(*) AS count FROM ${sql.identifier(tableName)};`);
      counts[tableName] = parseInt((getRows(result)[0] as any)?.count ?? '0', 10);
    }

    return counts;
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes par table:', error);
    throw new Error('Impossible de récupérer les comptes par table');
  }
}

/**
 * Récupère les statistiques des indexes
 */
export async function getIndexStats(): Promise<Array<{
  tableName: string;
  indexName: string;
  indexSize: string;
  isUnique: boolean;
  columnName: string;
}>> {
  try {
    const result = await db.execute(sql`
      SELECT 
        t.tablename AS "tableName",
        i.indexname AS "indexName",
        pg_size_pretty(pg_relation_size(i.indexname::regclass)) AS "indexSize",
        i.indexdef ~* 'UNIQUE' AS "isUnique",
        pg_get_indexdef(i.indexrelid) AS "columnName"
      FROM pg_indexes i
      JOIN pg_tables t ON i.schemaname = t.schemaname AND i.tablename = t.tablename
      WHERE t.schemaname = 'public'
      ORDER BY pg_relation_size(i.indexname::regclass) DESC;
    `);

    return getRows(result).map((row: any) => ({
      tableName: row.tableName,
      indexName: row.indexName,
      indexSize: row.indexSize,
      isUnique: row.isUnique,
      columnName: row.columnName,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des indexes:', error);
    throw new Error('Impossible de récupérer les statistiques des indexes');
  }
}

/**
 * Récupère les statistiques des colonnes d'une table
 */
export async function getColumnStats(tableName: keyof typeof schema): Promise<Array<{
  columnName: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
}>> {
  try {
    const result = await db.execute(sql`
      SELECT 
        column_name AS "columnName",
        data_type AS "dataType",
        is_nullable AS "isNullable",
        column_default AS "defaultValue",
        character_maximum_length AS "maxLength"
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY ordinal_position;
    `);

    return getRows(result).map((row: any) => ({
      columnName: row.columnName,
      dataType: row.dataType,
      isNullable: row.isNullable === 'YES',
      defaultValue: row.defaultValue,
      maxLength: row.maxLength ? parseInt(row.maxLength, 10) : null,
    }));
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques des colonnes de la table ${tableName}:`, error);
    throw new Error(`Impossible de récupérer les statistiques des colonnes de la table ${tableName}`);
  }
}

/**
 * Récupère les statistiques des clés étrangères
 */
export async function getForeignKeyStats(): Promise<Array<{
  tableName: string;
  constraintName: string;
  columnName: string;
  foreignTableName: string;
  foreignColumnName: string;
}>> {
  try {
    const result = await db.execute(sql`
      SELECT
        tc.table_name AS "tableName",
        tc.constraint_name AS "constraintName",
        kcu.column_name AS "columnName",
        ccu.table_name AS "foreignTableName",
        ccu.column_name AS "foreignColumnName"
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    return getRows(result).map((row: any) => ({
      tableName: row.tableName,
      constraintName: row.constraintName,
      columnName: row.columnName,
      foreignTableName: row.foreignTableName,
      foreignColumnName: row.foreignColumnName,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des clés étrangères:', error);
    throw new Error('Impossible de récupérer les statistiques des clés étrangères');
  }
}

/**
 * Génère un rapport complet des statistiques de la base de données
 */
export async function generateDatabaseReport(): Promise<{
  database: DatabaseStats;
  indexes: Awaited<ReturnType<typeof getIndexStats>>;
  foreignKeys: Awaited<ReturnType<typeof getForeignKeyStats>>;
  tableCounts: Record<string, number>;
}> {
  try {
    const [database, indexes, foreignKeys, tableCounts] = await Promise.all([
      getDatabaseStats(),
      getIndexStats(),
      getForeignKeyStats(),
      getTableCounts(),
    ]);

    return {
      database,
      indexes,
      foreignKeys,
      tableCounts,
    };
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de la base de données:', error);
    throw new Error('Impossible de générer le rapport de la base de données');
  }
}
