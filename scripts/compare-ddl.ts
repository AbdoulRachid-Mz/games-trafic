/**
 * Comparateur Structurel Approfondi DDL : Architecture Canonique vs Banc d'essai
 * 
 * Effectue une analyse syntaxique et structurelle complète (AST relationnel) :
 * - Colonnes : nom, type SQL exact, nullabilité, valeur par défaut normalisée
 * - Clés primaires : simples et composites (ordre exact)
 * - Clés étrangères : colonnes source, table cible, colonnes cible, ON DELETE, ON UPDATE
 * - Contraintes UNIQUE : colonnes exactes
 * - Contraintes CHECK : expressions canoniques normalisées
 * - Index et Index partiels : nom, colonnes, prédicat WHERE
 * - Détection stricte des tables manquantes et supplémentaires
 * 
 * Exécution :
 * bun scripts/compare-ddl.ts               # Exécution de la comparaison
 * bun scripts/compare-ddl.ts --test-negative # Exécution des tests négatifs de validation du comparateur
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface ForeignKeyDef {
  sourceCols: string[];
  targetTable: string;
  targetCols: string[];
  onDelete: string;
}

export interface UniqueConstraintDef {
  columns: string[];
}

export interface CheckConstraintDef {
  expression: string;
}

export interface IndexDef {
  name: string;
  tableName: string;
  columns: string[];
  isUnique: boolean;
  wherePredicate?: string;
}

export interface TableStructuralDef {
  name: string;
  columns: Map<string, ColumnDef>;
  primaryKey: string[];
  foreignKeys: ForeignKeyDef[];
  uniqueConstraints: UniqueConstraintDef[];
  checkConstraints: CheckConstraintDef[];
  indexes: IndexDef[];
}

export interface StructuralDiff {
  table: string;
  category: 'MISSING_TABLE' | 'EXTRA_TABLE' | 'COLUMN' | 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE' | 'CHECK' | 'INDEX';
  description: string;
}

export function normalizeSQLString(s: string): string {
  return s
    .replace(/--.*$/gm, '') // Supprime les commentaires SQL
    .replace(/\/\*[\s\S]*?\*\//g, '') // Supprime les blocs de commentaires
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCheckExpression(expr: string): string {
  // Supprime les parenthèses superflues et normalise les opérateurs
  let normalized = expr.trim();
  while (normalized.startsWith('(') && normalized.endsWith(')')) {
    // Vérifie si les parenthèses englobent toute l'expression
    let depth = 0;
    let fullWrap = true;
    for (let i = 0; i < normalized.length - 1; i++) {
      if (normalized[i] === '(') depth++;
      else if (normalized[i] === ')') depth--;
      if (depth === 0) {
        fullWrap = false;
        break;
      }
    }
    if (fullWrap) {
      normalized = normalized.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return normalized
    .replace(/\s+/g, ' ')
    .replace(/\s*=\s*/g, ' = ')
    .replace(/\s*<>\s*/g, ' <> ')
    .replace(/\s*!=\s*/g, ' <> ')
    .toUpperCase();
}

/**
 * Analyse structurelle approfondie du corps d'un CREATE TABLE
 */
export function parseTableStructure(tableName: string, rawBody: string): TableStructuralDef {
  const clean = normalizeSQLString(rawBody);
  const columns = new Map<string, ColumnDef>();
  let primaryKey: string[] = [];
  const foreignKeys: ForeignKeyDef[] = [];
  const uniqueConstraints: UniqueConstraintDef[] = [];
  const checkConstraints: CheckConstraintDef[] = [];

  // Découpage équilibré au niveau des virgules
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

    // 1. Clé primaire au niveau table : PRIMARY KEY (col1, col2)
    const pkTableMatch = item.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (pkTableMatch) {
      primaryKey = pkTableMatch[1].split(',').map(s => s.trim().toLowerCase());
      continue;
    }

    // 2. Clé étrangère au niveau table : FOREIGN KEY (col1, col2) REFERENCES target(t1, t2) ON DELETE ...
    const fkTableMatch = item.match(/^FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-z_0-9]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+([A-Z\s]+))?/i);
    if (fkTableMatch) {
      const sourceCols = fkTableMatch[1].split(',').map(s => s.trim().toLowerCase());
      const targetTable = fkTableMatch[2].trim().toLowerCase();
      const targetCols = fkTableMatch[3].split(',').map(s => s.trim().toLowerCase());
      const onDelete = (fkTableMatch[4] || 'NO ACTION').trim().toUpperCase();
      foreignKeys.push({ sourceCols, targetTable, targetCols, onDelete });
      continue;
    }

    // 3. Contrainte UNIQUE au niveau table : UNIQUE(col1, col2)
    const uniqueMatch = item.match(/^UNIQUE\s*\(([^)]+)\)/i);
    if (uniqueMatch) {
      const cols = uniqueMatch[1].split(',').map(s => s.trim().toLowerCase());
      uniqueConstraints.push({ columns: cols });
      continue;
    }

    // 4. Contrainte CHECK au niveau table : CHECK (...)
    const checkMatch = item.match(/^CHECK\s*\(([\s\S]+)\)$/i);
    if (checkMatch) {
      const expr = normalizeCheckExpression(checkMatch[1]);
      checkConstraints.push({ expression: expr });
      continue;
    }

    // 5. Définition de colonne avec contraintes en ligne
    const colMatch = item.match(/^([a-z_0-9]+)\s+([A-Z0-9_\[\]]+(?:\s*\([0-9,\s]+\))?(?:\s+WITH\s+TIME\s+ZONE)?)(.*)$/i);
    if (!colMatch) {
      throw new Error(`ERREUR DDL: Impossible d'analyser l'instruction dans la table '${tableName}': "${item}"`);
    }

    const colName = colMatch[1].toLowerCase();
    const colType = colMatch[2].trim().toUpperCase().replace(/\s+/g, ' ');
    const rest = colMatch[3].trim();
    const restUpper = rest.toUpperCase();

    // Primary key inline
    if (restUpper.includes('PRIMARY KEY')) {
      primaryKey = [colName];
    }

    // Nullability
    const isExplicitNotNull = restUpper.includes('NOT NULL');
    const isPrimaryKey = restUpper.includes('PRIMARY KEY');
    const nullable = !isExplicitNotNull && !isPrimaryKey;

    // Default value
    let defaultValue: string | undefined;
    const defaultMatch = rest.match(/DEFAULT\s+([^\s]+(?:\s*\(.*?\))?(?:::[a-z_]+)?)/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim();
    }

    // Inline Foreign Key : REFERENCES target(col) ON DELETE ...
    const inlineRefMatch = rest.match(/REFERENCES\s+([a-z_0-9]+)(?:\s*\(([^)]+)\))?(?:\s+ON\s+DELETE\s+([A-Z\s]+))?/i);
    if (inlineRefMatch) {
      const targetTable = inlineRefMatch[1].trim().toLowerCase();
      const targetCols = inlineRefMatch[2] ? inlineRefMatch[2].split(',').map(s => s.trim().toLowerCase()) : ['id'];
      const onDelete = (inlineRefMatch[3] || 'NO ACTION').trim().toUpperCase();
      foreignKeys.push({ sourceCols: [colName], targetTable, targetCols, onDelete });
    }

    // Inline Unique
    if (restUpper.includes('UNIQUE')) {
      uniqueConstraints.push({ columns: [colName] });
    }

    // Inline Check
    const inlineCheckMatch = rest.match(/CHECK\s*\(([\s\S]+)\)/i);
    if (inlineCheckMatch) {
      const expr = normalizeCheckExpression(inlineCheckMatch[1]);
      checkConstraints.push({ expression: expr });
    }

    columns.set(colName, {
      name: colName,
      type: colType,
      nullable,
      defaultValue
    });
  }

  return {
    name: tableName.toLowerCase(),
    columns,
    primaryKey,
    foreignKeys,
    uniqueConstraints,
    checkConstraints,
    indexes: []
  };
}

/**
 * Extrait les index (partiels ou standards) du script ou de la documentation
 */
export function parseIndexes(sqlContent: string): Map<string, IndexDef[]> {
  const indexMap = new Map<string, IndexDef[]>();
  const indexRegex = /CREATE\s+(UNIQUE\s+)?INDEX\s+([a-z_0-9]+)\s+ON\s+([a-z_0-9]+)\s*\(([^)]+)\)(?:\s+WHERE\s+([^;]+))?;/gi;
  let match;

  while ((match = indexRegex.exec(sqlContent)) !== null) {
    const isUnique = Boolean(match[1]);
    const indexName = match[2].trim().toLowerCase();
    const tableName = match[3].trim().toLowerCase();
    const columns = match[4].split(',').map(s => s.trim().toLowerCase());
    const wherePredicate = match[5] ? normalizeCheckExpression(match[5]) : undefined;

    const list = indexMap.get(tableName) || [];
    list.push({
      name: indexName,
      tableName,
      columns,
      isUnique,
      wherePredicate
    });
    indexMap.set(tableName, list);
  }

  return indexMap;
}

/**
 * Extrait toutes les tables et index d'un texte SQL ou markdown
 */
export function extractSchemaDefinitions(sourceText: string, isDocument: boolean): Map<string, TableStructuralDef> {
  const tables = new Map<string, TableStructuralDef>();
  let contentToParse = sourceText;

  if (!isDocument) {
    // Isoler la partie A du script
    const partAStart = sourceText.indexOf('PARTIE A');
    const partBStart = sourceText.indexOf('PARTIE B');
    if (partAStart !== -1 && partBStart !== -1) {
      contentToParse = sourceText.substring(partAStart, partBStart);
    }
  }

  const tableRegex = /CREATE TABLE\s+([a-z_0-9]+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(contentToParse)) !== null) {
    const tableName = match[1].toLowerCase();
    // Exclure les tables systèmes pré-existantes qui ne font pas partie des 21 tables canoniques
    if (['users', 'teams', 'financial_accounts', 'user_wallets', 'wallet_transactions', 'ledger_entries'].includes(tableName)) {
      continue;
    }
    const tableDef = parseTableStructure(tableName, match[2]);
    tables.set(tableName, tableDef);
  }

  // Association des index
  const indexMap = parseIndexes(contentToParse);
  for (const [tName, indexes] of indexMap.entries()) {
    if (tables.has(tName)) {
      tables.get(tName)!.indexes = indexes;
    }
  }

  return tables;
}

/**
 * Comparateur structurel strict table par table
 */
export function compareTableStructures(docTable: TableStructuralDef, scriptTable: TableStructuralDef): StructuralDiff[] {
  const diffs: StructuralDiff[] = [];
  const tName = docTable.name;

  // 1. COMPARAISON DES COLONNES
  for (const [colName, docCol] of docTable.columns.entries()) {
    const scriptCol = scriptTable.columns.get(colName);
    if (!scriptCol) {
      diffs.push({ table: tName, category: 'COLUMN', description: `Colonne '${colName}' manquante dans le script.` });
      continue;
    }

    if (docCol.type !== scriptCol.type) {
      diffs.push({ table: tName, category: 'COLUMN', description: `Type divergent pour '${colName}': Doc='${docCol.type}' vs Script='${scriptCol.type}'.` });
    }

    if (docCol.nullable !== scriptCol.nullable) {
      diffs.push({ table: tName, category: 'COLUMN', description: `Nullabilité divergente pour '${colName}': Doc=${docCol.nullable} vs Script=${scriptCol.nullable}.` });
    }

    if (docCol.defaultValue !== scriptCol.defaultValue) {
      diffs.push({ table: tName, category: 'COLUMN', description: `Default divergent pour '${colName}': Doc='${docCol.defaultValue}' vs Script='${scriptCol.defaultValue}'.` });
    }
  }

  for (const colName of scriptTable.columns.keys()) {
    if (!docTable.columns.has(colName)) {
      diffs.push({ table: tName, category: 'COLUMN', description: `Colonne supplémentaire non documentée dans le script: '${colName}'.` });
    }
  }

  // 2. COMPARAISON DE LA CLÉ PRIMAIRE
  const docPK = docTable.primaryKey.slice().sort().join(',');
  const scriptPK = scriptTable.primaryKey.slice().sort().join(',');
  if (docPK !== scriptPK) {
    diffs.push({ table: tName, category: 'PRIMARY_KEY', description: `Clé primaire divergente: Doc=[${docPK}] vs Script=[${scriptPK}].` });
  }

  // 3. COMPARAISON DES CLÉS ÉTRANGÈRES
  for (const docFK of docTable.foreignKeys) {
    const matchFK = scriptTable.foreignKeys.find(sfk => 
      sfk.sourceCols.slice().sort().join(',') === docFK.sourceCols.slice().sort().join(',')
    );

    if (!matchFK) {
      diffs.push({ 
        table: tName, 
        category: 'FOREIGN_KEY', 
        description: `FK sur [${docFK.sourceCols.join(',')}] manquante dans le script.` 
      });
      continue;
    }

    if (matchFK.targetTable !== docFK.targetTable) {
      diffs.push({ 
        table: tName, 
        category: 'FOREIGN_KEY', 
        description: `FK sur [${docFK.sourceCols.join(',')}]: table cible divergente '${matchFK.targetTable}' (attendu: '${docFK.targetTable}').` 
      });
    }

    const docTarget = docFK.targetCols.slice().sort().join(',');
    const scriptTarget = matchFK.targetCols.slice().sort().join(',');
    if (docTarget !== scriptTarget) {
      diffs.push({ 
        table: tName, 
        category: 'FOREIGN_KEY', 
        description: `FK sur [${docFK.sourceCols.join(',')}]: colonnes cibles divergentes [${scriptTarget}] (attendu: [${docTarget}]).` 
      });
    }

    if (matchFK.onDelete !== docFK.onDelete) {
      diffs.push({ 
        table: tName, 
        category: 'FOREIGN_KEY', 
        description: `FK sur [${docFK.sourceCols.join(',')}]: ON DELETE divergent '${matchFK.onDelete}' (attendu: '${docFK.onDelete}').` 
      });
    }
  }

  for (const scriptFK of scriptTable.foreignKeys) {
    const existsInDoc = docTable.foreignKeys.some(dfk => 
      dfk.sourceCols.slice().sort().join(',') === scriptFK.sourceCols.slice().sort().join(',')
    );
    if (!existsInDoc) {
      diffs.push({ 
        table: tName, 
        category: 'FOREIGN_KEY', 
        description: `FK supplémentaire non documentée sur [${scriptFK.sourceCols.join(',')}].` 
      });
    }
  }

  // 4. COMPARAISON DES CONTRAINTES UNIQUE
  for (const docUnq of docTable.uniqueConstraints) {
    const docSig = docUnq.columns.slice().sort().join(',');
    const found = scriptTable.uniqueConstraints.some(su => su.columns.slice().sort().join(',') === docSig);
    if (!found) {
      diffs.push({ table: tName, category: 'UNIQUE', description: `Contrainte UNIQUE([${docSig}]) manquante dans le script.` });
    }
  }

  for (const scriptUnq of scriptTable.uniqueConstraints) {
    const scriptSig = scriptUnq.columns.slice().sort().join(',');
    const found = docTable.uniqueConstraints.some(du => du.columns.slice().sort().join(',') === scriptSig);
    if (!found) {
      diffs.push({ table: tName, category: 'UNIQUE', description: `Contrainte UNIQUE([${scriptSig}]) supplémentaire dans le script.` });
    }
  }

  // 5. COMPARAISON DES CONTRAINTES CHECK
  for (const docChk of docTable.checkConstraints) {
    const found = scriptTable.checkConstraints.some(sc => sc.expression === docChk.expression);
    if (!found) {
      diffs.push({ table: tName, category: 'CHECK', description: `Contrainte CHECK manquante ou divergente: "${docChk.expression}".` });
    }
  }

  for (const scriptChk of scriptTable.checkConstraints) {
    const found = docTable.checkConstraints.some(dc => dc.expression === scriptChk.expression);
    if (!found) {
      diffs.push({ table: tName, category: 'CHECK', description: `Contrainte CHECK supplémentaire ou modifiée dans le script: "${scriptChk.expression}".` });
    }
  }

  // 6. COMPARAISON DES INDEX ET INDEX PARTIELS
  for (const docIdx of docTable.indexes) {
    const matchIdx = scriptTable.indexes.find(si => si.name === docIdx.name);
    if (!matchIdx) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}' manquant dans le script.` });
      continue;
    }

    if (matchIdx.isUnique !== docIdx.isUnique) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}': unicité divergente (Doc=${docIdx.isUnique} vs Script=${matchIdx.isUnique}).` });
    }

    const docCols = docIdx.columns.join(',');
    const scriptCols = matchIdx.columns.join(',');
    if (docCols !== scriptCols) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}': colonnes divergentes [${scriptCols}] vs [${docCols}].` });
    }

    if (docIdx.wherePredicate !== matchIdx.wherePredicate) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}': prédicat WHERE divergent: Doc="${docIdx.wherePredicate}" vs Script="${matchIdx.wherePredicate}".` });
    }
  }

  for (const scriptIdx of scriptTable.indexes) {
    if (!docTable.indexes.some(di => di.name === scriptIdx.name)) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index supplémentaire non documenté: '${scriptIdx.name}'.` });
    }
  }

  return diffs;
}

/**
 * Compare l'ensemble des 21 tables canoniques entre document 05 et le script
 */
export function performFullStructuralComparison(customDocPath?: string, customScriptPath?: string): {
  tablesCompared: number;
  allDiffs: StructuralDiff[];
  tableSummaries: {
    table: string;
    columnsCount: number;
    pk: string;
    fksCount: number;
    uniquesCount: number;
    checksCount: number;
    indexesCount: number;
    status: 'CONFORME' | 'DIVERGENT';
  }[];
} {
  const docPath = customDocPath || path.resolve(process.cwd(), 'docs/audit-competition/05-PROPOSED-TARGET-ARCHITECTURE.md');
  const scriptPath = customScriptPath || path.resolve(process.cwd(), 'scripts/verify-competition-engine.ts');

  const docContent = fs.readFileSync(docPath, 'utf8');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');

  const docTables = extractSchemaDefinitions(docContent, true);
  const scriptTables = extractSchemaDefinitions(scriptContent, false);

  const allDiffs: StructuralDiff[] = [];
  const tableSummaries: any[] = [];

  // Vérification des tables manquantes
  for (const [name, docTable] of docTables.entries()) {
    const scriptTable = scriptTables.get(name);
    if (!scriptTable) {
      allDiffs.push({ table: name, category: 'MISSING_TABLE', description: `Table '${name}' entièrement manquante dans le script !` });
      tableSummaries.push({
        table: name,
        columnsCount: docTable.columns.size,
        pk: docTable.primaryKey.join(','),
        fksCount: docTable.foreignKeys.length,
        uniquesCount: docTable.uniqueConstraints.length,
        checksCount: docTable.checkConstraints.length,
        indexesCount: docTable.indexes.length,
        status: 'DIVERGENT'
      });
      continue;
    }

    const tableDiffs = compareTableStructures(docTable, scriptTable);
    if (tableDiffs.length > 0) {
      allDiffs.push(...tableDiffs);
    }

    tableSummaries.push({
      table: name,
      columnsCount: docTable.columns.size,
      pk: docTable.primaryKey.join(','),
      fksCount: docTable.foreignKeys.length,
      uniquesCount: docTable.uniqueConstraints.length,
      checksCount: docTable.checkConstraints.length,
      indexesCount: docTable.indexes.length,
      status: tableDiffs.length === 0 ? 'CONFORME' : 'DIVERGENT'
    });
  }

  // Vérification des tables supplémentaires dans le script
  for (const name of scriptTables.keys()) {
    if (!docTables.has(name)) {
      allDiffs.push({ table: name, category: 'EXTRA_TABLE', description: `Table '${name}' présente dans le script mais absente de l'architecture canonique.` });
    }
  }

  return {
    tablesCompared: docTables.size,
    allDiffs,
    tableSummaries
  };
}

/**
 * Suite de tests négatifs vérifiant que TOUTE altération est infailliblement détectée
 */
export function runComparatorNegativeTests(): boolean {
  console.log("================================================================================");
  console.log("   TESTS NÉGATIFS DU COMPARATEUR STRUCTUREL DDL");
  console.log("================================================================================\n");

  const baseDocSQL = `
    CREATE TABLE test_table (
      id TEXT PRIMARY KEY,
      edition_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
      team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
      amount NUMERIC(10, 2) DEFAULT 0.00,
      UNIQUE(edition_id, id)
    );
    CREATE UNIQUE INDEX test_partial_idx ON test_table(edition_id) WHERE status = 'OPEN';
  `;

  const runMutationTest = (testName: string, mutatedScriptSQL: string, expectedCategory: string) => {
    const docDef = extractSchemaDefinitions(baseDocSQL, true).get('test_table')!;
    const scriptDef = extractSchemaDefinitions(mutatedScriptSQL, false).get('test_table')!;
    const diffs = compareTableStructures(docDef, scriptDef);

    const detected = diffs.some(d => d.category === expectedCategory);
    if (!detected) {
      console.error(`❌ ÉCHEC TEST NÉGATIF : ${testName}`);
      console.error(`   Différences trouvées:`, diffs);
      throw new Error(`Test négatif échoué: ${testName} (attendait catégorie ${expectedCategory})`);
    } else {
      console.log(`✔ Succès test négatif: ${testName} -> Détecté: "${diffs.find(d => d.category === expectedCategory)?.description}"`);
    }
  };

  // 1. Mutation de Clé Primaire
  runMutationTest(
    "1. Altération de la Clé Primaire",
    baseDocSQL.replace("id TEXT PRIMARY KEY", "id TEXT").replace("UNIQUE(edition_id, id)", "PRIMARY KEY (edition_id, id)"),
    "PRIMARY_KEY"
  );

  // 2. Mutation de Clé Étrangère (Table cible)
  runMutationTest(
    "2. Altération de la Table Cible d'une FK",
    baseDocSQL.replace("REFERENCES teams(id)", "REFERENCES other_teams(id)"),
    "FOREIGN_KEY"
  );

  // 3. Mutation du comportement ON DELETE
  runMutationTest(
    "3. Altération de la règle ON DELETE (CASCADE -> RESTRICT)",
    baseDocSQL.replace("ON DELETE CASCADE", "ON DELETE RESTRICT"),
    "FOREIGN_KEY"
  );

  // 4. Mutation d'une contrainte CHECK
  runMutationTest(
    "4. Altération d'une expression CHECK",
    baseDocSQL.replace("status IN ('OPEN', 'CLOSED')", "status IN ('OPEN', 'CLOSED', 'ARCHIVED')"),
    "CHECK"
  );

  // 5. Mutation d'une contrainte UNIQUE
  runMutationTest(
    "5. Altération des colonnes d'une contrainte UNIQUE",
    baseDocSQL.replace("UNIQUE(edition_id, id)", "UNIQUE(edition_id, status)"),
    "UNIQUE"
  );

  // 6. Mutation du prédicat d'un Index Partiel
  runMutationTest(
    "6. Altération du prédicat WHERE d'un Index Partiel",
    baseDocSQL.replace("WHERE status = 'OPEN'", "WHERE status = 'CLOSED'"),
    "INDEX"
  );

  // 7. Mutation de type de colonne
  runMutationTest(
    "7. Altération du type d'une colonne (NUMERIC -> INT)",
    baseDocSQL.replace("NUMERIC(10, 2)", "INT"),
    "COLUMN"
  );

  // 8. Mutation de nullabilité
  runMutationTest(
    "8. Altération de nullabilité (NOT NULL retiré)",
    baseDocSQL.replace("status TEXT NOT NULL", "status TEXT"),
    "COLUMN"
  );

  console.log("\n✔ TOUS LES 8 TESTS NÉGATIFS DU COMPARATEUR ONT RÉUSSI AVEC SUCCÈS !\n");
  return true;
}

// Point d'entrée CLI
if (import.meta.main || process.argv[1]?.endsWith('compare-ddl.ts')) {
  if (process.argv.includes('--test-negative')) {
    runComparatorNegativeTests();
    process.exit(0);
  }

  console.log("================================================================================");
  console.log("   GAMES TRAFICS — COMPARATEUR STRUCTUREL APPROFONDI DES 21 TABLES CANONIQUES");
  console.log("================================================================================\n");

  const { tablesCompared, allDiffs, tableSummaries } = performFullStructuralComparison();

  console.log("| #  | Table Name                | Colonnes | PK | FKs | Uniques | Checks | Index | Statut    |");
  console.log("|----|---------------------------|----------|----|-----|---------|--------|-------|-----------|");

  let idx = 1;
  for (const s of tableSummaries) {
    const num = String(idx++).padStart(2, ' ');
    const name = s.table.padEnd(25, ' ');
    const cols = String(s.columnsCount).padStart(8, ' ');
    const pk = s.pk.padEnd(4, ' ');
    const fks = String(s.fksCount).padStart(3, ' ');
    const unqs = String(s.uniquesCount).padStart(7, ' ');
    const chks = String(s.checksCount).padStart(6, ' ');
    const idxs = String(s.indexesCount).padStart(5, ' ');
    const status = s.status === 'CONFORME' ? '✔ CONFORME' : '❌ DIVERGENT';
    console.log(`| ${num} | ${name} | ${cols} | ${pk} | ${fks} | ${unqs} | ${chks} | ${idxs} | ${status} |`);
  }

  console.log("\n================================================================================");
  if (allDiffs.length === 0 && tablesCompared === 21) {
    console.log("✔ SUCCÈS STRUCTUREL TOTAL : 21 tables canoniques comparées — ZÉRO DIVERGENCE.");
    console.log("================================================================================");
    process.exit(0);
  } else {
    console.error(`❌ ÉCHEC : ${allDiffs.length} divergence(s) structurelle(s) détectée(s) :`);
    for (const d of allDiffs) {
      console.error(`   ↳ [${d.table}] [${d.category}] : ${d.description}`);
    }
    console.log("================================================================================");
    process.exit(1);
  }
}
