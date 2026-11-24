/**
 * Comparateur automatisé DDL : Architecture Canonique vs Banc d'essai
 * 
 * Compare table par table, colonne par colonne, type par type, et contrainte par contrainte :
 * - docs/audit-competition/05-PROPOSED-TARGET-ARCHITECTURE.md
 * - scripts/verify-competition-engine.ts
 * 
 * Exécution :
 * bun scripts/compare-ddl.ts
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  references?: string;
}

export interface TableDef {
  name: string;
  columns: Map<string, ColumnDef>;
  foreignKeys: string[];
  uniqueConstraints: string[];
  checkConstraints: string[];
  rawCleanSQL: string;
}

export interface DDLComparisonResult {
  table: string;
  status: 'IDENTICAL' | 'DIVERGENT';
  colCountDoc: number;
  colCountScript: number;
  fkCountDoc: number;
  fkCountScript: number;
  uniqueCountDoc: number;
  uniqueCountScript: number;
  checkCountDoc: number;
  checkCountScript: number;
  discrepancies: string[];
}

function cleanSQL(s: string): string {
  return s
    .replace(/--.*$/gm, '') // Supprime les commentaires de ligne
    .replace(/\s+/g, ' ')   // Normalise les espaces
    .trim();
}

export function parseTableBody(tableName: string, rawBody: string): TableDef {
  const clean = cleanSQL(rawBody);
  const columns = new Map<string, ColumnDef>();
  const foreignKeys: string[] = [];
  const uniqueConstraints: string[] = [];
  const checkConstraints: string[] = [];

  // Découpage en instructions séparées par des virgules (en préservant parenthèses imbriquées)
  const items: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      if (current.trim()) items.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) items.push(current.trim());

  for (const item of items) {
    const upper = item.toUpperCase();

    if (upper.startsWith('PRIMARY KEY')) {
      // Définition PK composite de table
      uniqueConstraints.push(item);
    } else if (upper.startsWith('FOREIGN KEY')) {
      foreignKeys.push(item);
    } else if (upper.startsWith('UNIQUE')) {
      uniqueConstraints.push(item);
    } else if (upper.startsWith('CHECK')) {
      checkConstraints.push(item);
    } else {
      // C'est une colonne
      const colMatch = item.match(/^([a-z_0-9]+)\s+([A-Z0-9_\[\]]+(?:\s*\([0-9,\s]+\))?(?:\s+WITH\s+TIME\s+ZONE)?)(.*)$/i);
      if (colMatch) {
        const colName = colMatch[1];
        const colType = colMatch[2].trim().toUpperCase();
        const rest = colMatch[3].trim();
        const restUpper = rest.toUpperCase();

        const isPrimaryKey = restUpper.includes('PRIMARY KEY');
        const nullable = !restUpper.includes('NOT NULL') && !isPrimaryKey;

        let defaultValue: string | undefined;
        const defaultMatch = rest.match(/DEFAULT\s+([^\s]+(?:\s*\(.*?\))?(?:::[a-z_]+)?)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1].replace(/,$/, '').trim();
        }

        let references: string | undefined;
        const refMatch = rest.match(/REFERENCES\s+([^\s]+(?:\(.*?\))?(?:\s+ON\s+DELETE\s+[A-Z]+)?)/i);
        if (refMatch) {
          references = refMatch[1].replace(/,$/, '').trim();
        }

        columns.set(colName, {
          name: colName,
          type: colType,
          nullable,
          defaultValue,
          isPrimaryKey,
          references
        });
      } else {
        // En cas de syntaxe atypique, enregistrer comme contrainte générique
        uniqueConstraints.push(item);
      }
    }
  }

  return {
    name: tableName,
    columns,
    foreignKeys,
    uniqueConstraints,
    checkConstraints,
    rawCleanSQL: clean
  };
}

export function extractTablesFromDoc(docPath: string): Map<string, TableDef> {
  const content = fs.readFileSync(docPath, 'utf8');
  const tableRegex = /CREATE TABLE\s+([a-z_]+)\s*\(([\s\S]*?)\);/gi;
  const tables = new Map<string, TableDef>();

  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const body = match[2];
    tables.set(tableName, parseTableBody(tableName, body));
  }

  return tables;
}

export function extractTablesFromScript(scriptPath: string): Map<string, TableDef> {
  const content = fs.readFileSync(scriptPath, 'utf8');
  const partA = content.substring(content.indexOf('PARTIE A'), content.indexOf('PARTIE B'));
  const tableRegex = /CREATE TABLE\s+([a-z_]+)\s*\(([\s\S]*?)\);/gi;
  const tables = new Map<string, TableDef>();

  let match;
  while ((match = tableRegex.exec(partA)) !== null) {
    const tableName = match[1];
    // Exclure les tables systèmes pré-existantes qui ne font pas partie des 21 tables canoniques
    if (['users', 'teams', 'financial_accounts', 'user_wallets', 'wallet_transactions', 'ledger_entries'].includes(tableName)) {
      continue;
    }
    const body = match[2];
    tables.set(tableName, parseTableBody(tableName, body));
  }

  return tables;
}

export function compareAllTables(): { results: DDLComparisonResult[]; totalDivergences: number } {
  const docPath = path.resolve(process.cwd(), 'docs/audit-competition/05-PROPOSED-TARGET-ARCHITECTURE.md');
  const scriptPath = path.resolve(process.cwd(), 'scripts/verify-competition-engine.ts');

  const docTables = extractTablesFromDoc(docPath);
  const scriptTables = extractTablesFromScript(scriptPath);

  const results: DDLComparisonResult[] = [];
  let totalDivergences = 0;

  for (const [name, docTable] of docTables.entries()) {
    const scriptTable = scriptTables.get(name);
    const discrepancies: string[] = [];

    if (!scriptTable) {
      discrepancies.push(`Table ${name} manquante dans le script !`);
      results.push({
        table: name,
        status: 'DIVERGENT',
        colCountDoc: docTable.columns.size,
        colCountScript: 0,
        fkCountDoc: docTable.foreignKeys.length,
        fkCountScript: 0,
        uniqueCountDoc: docTable.uniqueConstraints.length,
        uniqueCountScript: 0,
        checkCountDoc: docTable.checkConstraints.length,
        checkCountScript: 0,
        discrepancies
      });
      totalDivergences++;
      continue;
    }

    // 1. Comparaison du SQL normalisé exact
    if (docTable.rawCleanSQL !== scriptTable.rawCleanSQL) {
      // Identifier précisément les différences
      // Colonnes
      for (const [colName, docCol] of docTable.columns.entries()) {
        const scriptCol = scriptTable.columns.get(colName);
        if (!scriptCol) {
          discrepancies.push(`Colonne manquante dans le script: ${colName}`);
        } else {
          if (docCol.type !== scriptCol.type) {
            discrepancies.push(`Type différent pour ${colName}: Doc=${docCol.type} vs Script=${scriptCol.type}`);
          }
          if (docCol.nullable !== scriptCol.nullable) {
            discrepancies.push(`Nullabilité différente pour ${colName}: Doc=${docCol.nullable} vs Script=${scriptCol.nullable}`);
          }
          if (docCol.defaultValue !== scriptCol.defaultValue) {
            discrepancies.push(`Default différent pour ${colName}: Doc=${docCol.defaultValue} vs Script=${scriptCol.defaultValue}`);
          }
          if (docCol.references !== scriptCol.references) {
            discrepancies.push(`Référence FK différente pour ${colName}: Doc=${docCol.references} vs Script=${scriptCol.references}`);
          }
        }
      }
      for (const [colName] of scriptTable.columns.entries()) {
        if (!docTable.columns.has(colName)) {
          discrepancies.push(`Colonne en trop dans le script: ${colName}`);
        }
      }

      // Foreign Keys composites
      if (docTable.foreignKeys.length !== scriptTable.foreignKeys.length) {
        discrepancies.push(`Nombre de FK différent: Doc=${docTable.foreignKeys.length} vs Script=${scriptTable.foreignKeys.length}`);
      }

      // Unique constraints
      if (docTable.uniqueConstraints.length !== scriptTable.uniqueConstraints.length) {
        discrepancies.push(`Nombre de contraintes UNIQUE différent: Doc=${docTable.uniqueConstraints.length} vs Script=${scriptTable.uniqueConstraints.length}`);
      }

      // Check constraints
      if (docTable.checkConstraints.length !== scriptTable.checkConstraints.length) {
        discrepancies.push(`Nombre de contraintes CHECK différent: Doc=${docTable.checkConstraints.length} vs Script=${scriptTable.checkConstraints.length}`);
      }

      if (discrepancies.length === 0) {
        // Simple différence de formatage ou ordre interne mineur
        discrepancies.push(`Différence mineure de formatage SQL`);
      }
    }

    const isIdentical = discrepancies.length === 0;
    if (!isIdentical) totalDivergences++;

    results.push({
      table: name,
      status: isIdentical ? 'IDENTICAL' : 'DIVERGENT',
      colCountDoc: docTable.columns.size,
      colCountScript: scriptTable.columns.size,
      fkCountDoc: docTable.foreignKeys.length,
      fkCountScript: scriptTable.foreignKeys.length,
      uniqueCountDoc: docTable.uniqueConstraints.length,
      uniqueCountScript: scriptTable.uniqueConstraints.length,
      checkCountDoc: docTable.checkConstraints.length,
      checkCountScript: scriptTable.checkConstraints.length,
      discrepancies
    });
  }

  return { results, totalDivergences };
}

// Exécution directe
if (import.meta.main || process.argv[1]?.endsWith('compare-ddl.ts')) {
  console.log("================================================================================");
  console.log("   GAMES TRAFICS — COMPARATEUR AUTOMATISÉ DDL DES 21 TABLES CANONIQUES");
  console.log("================================================================================\n");

  const { results, totalDivergences } = compareAllTables();

  console.log("| #  | Table Name                | Colonnes | FKs | Uniques | Checks | Statut    |");
  console.log("|----|---------------------------|----------|-----|---------|--------|-----------|");

  let idx = 1;
  for (const r of results) {
    const num = String(idx++).padStart(2, ' ');
    const name = r.table.padEnd(25, ' ');
    const cols = `${r.colCountDoc}/${r.colCountScript}`.padEnd(8, ' ');
    const fks = `${r.fkCountDoc}/${r.fkCountScript}`.padEnd(3, ' ');
    const unqs = `${r.uniqueCountDoc}/${r.uniqueCountScript}`.padEnd(7, ' ');
    const chks = `${r.checkCountDoc}/${r.checkCountScript}`.padEnd(6, ' ');
    const status = r.status === 'IDENTICAL' ? '✔ IDENTIQUE' : '❌ DIVERGENT';
    console.log(`| ${num} | ${name} | ${cols} | ${fks} | ${unqs} | ${chks} | ${status} |`);
    if (r.discrepancies.length > 0) {
      for (const d of r.discrepancies) {
        console.log(`     ↳ [DIVERGENCE] ${d}`);
      }
    }
  }

  console.log("\n================================================================================");
  if (totalDivergences === 0 && results.length === 21) {
    console.log("✔ SUCCÈS TOTAL : Les 21 tables canoniques sont 100% identiques (ZÉRO DIVERGENCE).");
    console.log("================================================================================");
    process.exit(0);
  } else {
    console.error(`❌ ÉCHEC : ${totalDivergences} divergence(s) détectée(s) sur les 21 tables.`);
    console.log("================================================================================");
    process.exit(1);
  }
}
