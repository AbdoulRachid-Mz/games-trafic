/**
 * Comparateur Structurel Approfondi DDL : Architecture Canonique vs Banc d'essai
 *
 * Analyse syntaxique et structurelle complète (AST relationnel) :
 * - Colonnes : nom, type SQL exact, nullabilité, valeur par défaut normalisée
 * - Clés primaires : simples et composites (ordre POSITIONNEL exact — pas de tri)
 * - Clés étrangères : association positionnelle exacte (source[i] ↔ cible[i]), table cible, ON DELETE, ON UPDATE
 *   * Appariement 1-à-1 strict avec support des clés étrangères multiples partageant les mêmes colonnes sources
 * - Contraintes UNIQUE : colonnes exactes
 * - Contraintes CHECK : expressions canoniques normalisées
 * - Index et index partiels : nom, colonnes (ordre positionnel), sens de tri (ASC/DESC), clause INCLUDE, expressions, prédicat WHERE
 * - Détection stricte des tables manquantes, supplémentaires, colonnes manquantes/supplémentaires
 *
 * CAPACITÉS VÉRIFIÉES :
 * - Comparaison exacte de 100% des propriétés DDL canoniques des 21 tables
 * - 21 tests de mutation négatifs (PK, FK simples/composites/doubles, ON DELETE, ON UPDATE, UNIQUE, CHECK, INDEX, INCLUDE, DESC, EXPRESSIONS, COLONNES, DEFAULT)
 *
 * LIMITES CONNUES :
 * - Méthodes d'accès non BTREE (ex: USING GIN/BRIN/HASH non présent dans l'architecture canonique)
 * - Paramètres de stockage physique (ex: WITH fillfactor = 90) non analysés car absents de l'architecture cible
 *
 * Exécution :
 * bun scripts/compare-ddl.ts                  # Comparaison des 21 tables canoniques
 * bun scripts/compare-ddl.ts --test-negative  # 21 tests négatifs de validation du comparateur
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface ForeignKeyDef {
  /** Colonnes sources dans leur ordre de déclaration exact */
  sourceCols: string[];
  targetTable: string;
  /** Colonnes cibles dans leur ordre de déclaration exact (sourceCols[i] ↔ targetCols[i]) */
  targetCols: string[];
  onDelete: string;
  onUpdate: string;
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
  includeColumns?: string[];
  isUnique: boolean;
  wherePredicate?: string;
}

export interface TableStructuralDef {
  name: string;
  columns: Map<string, ColumnDef>;
  /** Ordre positionnel conservé — NE PAS TRIER */
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

// ============================================================================
// UTILITAIRES DE NORMALISATION
// ============================================================================

export function normalizeSQLString(s: string): string {
  return s
    .replace(/--.*$/gm, '')         // Commentaires SQL ligne
    .replace(/\/\*[\s\S]*?\*\//g, '') // Blocs de commentaires
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCheckExpression(expr: string): string {
  let normalized = expr.trim();
  // Supprime les parenthèses englobantes superflues
  while (normalized.startsWith('(') && normalized.endsWith(')')) {
    let depth = 0;
    let fullWrap = true;
    for (let i = 0; i < normalized.length - 1; i++) {
      if (normalized[i] === '(') depth++;
      else if (normalized[i] === ')') depth--;
      if (depth === 0) { fullWrap = false; break; }
    }
    if (fullWrap) normalized = normalized.slice(1, -1).trim();
    else break;
  }
  return normalized
    .replace(/\s+/g, ' ')
    .replace(/\s*=\s*/g, ' = ')
    .replace(/\s*<>\s*/g, ' <> ')
    .replace(/\s*!=\s*/g, ' <> ')
    .toUpperCase();
}

/**
 * Extrait ON DELETE et ON UPDATE d'une clause FK.
 * Les deux actions peuvent apparaître dans n'importe quel ordre.
 * La valeur par défaut est 'NO ACTION' si la clause est absente.
 */
function parseReferentialActions(rest: string): { onDelete: string; onUpdate: string } {
  const upper = rest.toUpperCase();

  // ON DELETE extraction — termine avant ON UPDATE ou fin de chaîne
  const delMatch = upper.match(/ON\s+DELETE\s+(SET\s+NULL|SET\s+DEFAULT|CASCADE|RESTRICT|NO\s+ACTION)/);
  const onDelete = delMatch ? delMatch[1].replace(/\s+/g, ' ').trim() : 'NO ACTION';

  // ON UPDATE extraction — termine avant ON DELETE ou fin de chaîne
  const updMatch = upper.match(/ON\s+UPDATE\s+(SET\s+NULL|SET\s+DEFAULT|CASCADE|RESTRICT|NO\s+ACTION)/);
  const onUpdate = updMatch ? updMatch[1].replace(/\s+/g, ' ').trim() : 'NO ACTION';

  return { onDelete, onUpdate };
}

// ============================================================================
// PARSEUR STRUCTUREL
// ============================================================================

/**
 * Analyse structurelle approfondie du corps d'un CREATE TABLE.
 * L'ordre positionnel des PK et des associations source/cible de FK est conservé exactement.
 */
export function parseTableStructure(tableName: string, rawBody: string): TableStructuralDef {
  const clean = normalizeSQLString(rawBody);
  const columns = new Map<string, ColumnDef>();
  let primaryKey: string[] = [];
  const foreignKeys: ForeignKeyDef[] = [];
  const uniqueConstraints: UniqueConstraintDef[] = [];
  const checkConstraints: CheckConstraintDef[] = [];

  // Découpage équilibré au niveau des virgules (respecte les parenthèses imbriquées)
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

    // 1. PRIMARY KEY au niveau table : PRIMARY KEY (col1, col2, ...)
    const pkTableMatch = item.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (pkTableMatch) {
      // Ordre positionnel conservé — PAS de .sort()
      primaryKey = pkTableMatch[1].split(',').map(s => s.trim().toLowerCase());
      continue;
    }

    // 2. FOREIGN KEY au niveau table : FOREIGN KEY (src1, src2) REFERENCES tbl(tgt1, tgt2) ON DELETE ... ON UPDATE ...
    const fkTableMatch = item.match(/^FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-z_0-9]+)\s*\(([^)]+)\)([\s\S]*)/i);
    if (fkTableMatch) {
      // Ordre positionnel des colonnes sources et cibles conservé — PAS de .sort()
      const sourceCols = fkTableMatch[1].split(',').map(s => s.trim().toLowerCase());
      const targetTable = fkTableMatch[2].trim().toLowerCase();
      const targetCols = fkTableMatch[3].split(',').map(s => s.trim().toLowerCase());
      const { onDelete, onUpdate } = parseReferentialActions(fkTableMatch[4] || '');
      foreignKeys.push({ sourceCols, targetTable, targetCols, onDelete, onUpdate });
      continue;
    }

    // 3. UNIQUE au niveau table : UNIQUE(col1, col2)
    const uniqueMatch = item.match(/^UNIQUE\s*\(([^)]+)\)/i);
    if (uniqueMatch) {
      const cols = uniqueMatch[1].split(',').map(s => s.trim().toLowerCase());
      uniqueConstraints.push({ columns: cols });
      continue;
    }

    // 4. CHECK au niveau table : CHECK (...)
    const checkMatch = item.match(/^CHECK\s*\(([\s\S]+)\)$/i);
    if (checkMatch) {
      const expr = normalizeCheckExpression(checkMatch[1]);
      checkConstraints.push({ expression: expr });
      continue;
    }

    // 5. Définition de colonne
    const colMatch = item.match(/^([a-z_0-9]+)\s+([A-Z0-9_\[\]]+(?:\s*\([0-9,\s]+\))?(?:\s+WITH\s+TIME\s+ZONE)?)(.*)$/i);
    if (!colMatch) {
      throw new Error(`ERREUR DDL: Impossible d'analyser l'instruction dans la table '${tableName}': "${item}"`);
    }

    const colName = colMatch[1].toLowerCase();
    const colType = colMatch[2].trim().toUpperCase().replace(/\s+/g, ' ');
    const rest = colMatch[3].trim();
    const restUpper = rest.toUpperCase();

    // PK inline
    if (restUpper.includes('PRIMARY KEY')) {
      primaryKey = [colName]; // Ordre positionnel (une seule colonne)
    }

    // Nullabilité
    const isExplicitNotNull = restUpper.includes('NOT NULL');
    const isPrimaryKey = restUpper.includes('PRIMARY KEY');
    const nullable = !isExplicitNotNull && !isPrimaryKey;

    // Valeur par défaut
    let defaultValue: string | undefined;
    const defaultMatch = rest.match(/DEFAULT\s+([^\s]+(?:\s*\(.*?\))?(?:::[a-z_]+)?)/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim();
    }

    // FK inline : REFERENCES tbl(col) ON DELETE ... ON UPDATE ...
    const inlineRefMatch = rest.match(/REFERENCES\s+([a-z_0-9]+)(?:\s*\(([^)]+)\))?([\s\S]*)/i);
    if (inlineRefMatch) {
      const targetTable = inlineRefMatch[1].trim().toLowerCase();
      const targetCols = inlineRefMatch[2]
        ? inlineRefMatch[2].split(',').map(s => s.trim().toLowerCase())
        : ['id'];
      const { onDelete, onUpdate } = parseReferentialActions(inlineRefMatch[3] || '');
      foreignKeys.push({ sourceCols: [colName], targetTable, targetCols, onDelete, onUpdate });
    }

    // UNIQUE inline
    if (restUpper.includes('UNIQUE')) {
      uniqueConstraints.push({ columns: [colName] });
    }

    // CHECK inline
    const inlineCheckMatch = rest.match(/CHECK\s*\(([\s\S]+)\)/i);
    if (inlineCheckMatch) {
      const expr = normalizeCheckExpression(inlineCheckMatch[1]);
      checkConstraints.push({ expression: expr });
    }

    columns.set(colName, { name: colName, type: colType, nullable, defaultValue });
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
 * Extrait les index (partiels ou standards) d'un texte SQL ou markdown.
 * L'ordre des colonnes de l'index est conservé.
 */
/**
 * Extrait les index (partiels, INCLUDE, fonctionnels ou standards) d'un texte SQL ou markdown.
 * Gère correctement les parenthèses imbriquées pour les index fonctionnels / expressions.
 */
export function parseIndexes(sqlContent: string): Map<string, IndexDef[]> {
  const indexMap = new Map<string, IndexDef[]>();
  const stmtRegex = /CREATE\s+(UNIQUE\s+)?INDEX\s+([a-z_0-9]+)\s+ON\s+([a-z_0-9]+)\s*\(/gi;
  let match;

  while ((match = stmtRegex.exec(sqlContent)) !== null) {
    const isUnique = Boolean(match[1]);
    const indexName = match[2].trim().toLowerCase();
    const tableName = match[3].trim().toLowerCase();
    const startIndex = stmtRegex.lastIndex; // Juste après la première parenthèse ouvrante

    // Extraction avec équilibrage de parenthèses pour les colonnes/expressions
    let depth = 1;
    let colEndIndex = -1;
    for (let i = startIndex; i < sqlContent.length; i++) {
      if (sqlContent[i] === '(') depth++;
      else if (sqlContent[i] === ')') depth--;
      if (depth === 0) {
        colEndIndex = i;
        break;
      }
    }
    if (colEndIndex === -1) continue;

    const colsRaw = sqlContent.substring(startIndex, colEndIndex).trim();
    // Découpage des colonnes en respectant les parenthèses imbriquées (ex: (lower(status)), score)
    const columns: string[] = [];
    let currentPart = '';
    let partDepth = 0;
    for (let i = 0; i < colsRaw.length; i++) {
      const ch = colsRaw[i];
      if (ch === '(') partDepth++;
      else if (ch === ')') partDepth--;
      if (ch === ',' && partDepth === 0) {
        columns.push(currentPart.trim().toLowerCase().replace(/\s+/g, ' '));
        currentPart = '';
      } else {
        currentPart += ch;
      }
    }
    if (currentPart.trim()) {
      columns.push(currentPart.trim().toLowerCase().replace(/\s+/g, ' '));
    }

    // Analyse du reste de l'instruction jusqu'au point-virgule
    const afterCols = sqlContent.substring(colEndIndex + 1);
    const semiColonIdx = afterCols.indexOf(';');
    const rest = (semiColonIdx !== -1 ? afterCols.substring(0, semiColonIdx) : afterCols).trim();

    // Clause INCLUDE (...)
    let includeColumns: string[] | undefined;
    const includeMatch = rest.match(/INCLUDE\s*\(([^)]+)\)/i);
    if (includeMatch) {
      includeColumns = includeMatch[1].split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, ' '));
    }

    // Clause WHERE ...
    let wherePredicate: string | undefined;
    const whereMatch = rest.match(/WHERE\s+([\s\S]+)$/i);
    if (whereMatch) {
      wherePredicate = normalizeCheckExpression(whereMatch[1]);
    }

    const list = indexMap.get(tableName) || [];
    list.push({ name: indexName, tableName, columns, includeColumns, isUnique, wherePredicate });
    indexMap.set(tableName, list);

    // Repositionne le regex au point-virgule si présent
    if (semiColonIdx !== -1) {
      stmtRegex.lastIndex = colEndIndex + 1 + semiColonIdx + 1;
    }
  }

  return indexMap;
}

/**
 * Extrait toutes les tables et index d'un texte SQL ou markdown.
 */
export function extractSchemaDefinitions(sourceText: string, isDocument: boolean): Map<string, TableStructuralDef> {
  const tables = new Map<string, TableStructuralDef>();
  let contentToParse = sourceText;

  if (!isDocument) {
    // Isoler la Partie A du script (avant la Partie B qui contient les tables historiques)
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
    // Exclure les tables systèmes pré-existantes non canoniques
    if (['users', 'teams', 'financial_accounts', 'user_wallets', 'wallet_transactions', 'ledger_entries'].includes(tableName)) {
      continue;
    }
    const tableDef = parseTableStructure(tableName, match[2]);
    tables.set(tableName, tableDef);
  }

  // Association des index aux tables
  const indexMap = parseIndexes(contentToParse);
  for (const [tName, indexes] of indexMap.entries()) {
    if (tables.has(tName)) {
      tables.get(tName)!.indexes = indexes;
    }
  }

  return tables;
}

// ============================================================================
// COMPARATEUR STRUCTUREL
// ============================================================================

/**
 * Génère la signature positionnelle d'une FK : "src1,src2->tbl->tgt1,tgt2|ONDELETE|ONUPDATE"
 * Utilisée pour localiser la FK correspondante dans le script.
 */
function fkSignature(fk: ForeignKeyDef): string {
  return `${fk.sourceCols.join(',')}`;
}

/**
 * Compare structure par structure, champ par champ, deux tables.
 * Toutes les comparaisons sont positionnelles — aucun tri implicite.
 */
export function compareTableStructures(docTable: TableStructuralDef, scriptTable: TableStructuralDef): StructuralDiff[] {
  const diffs: StructuralDiff[] = [];
  const tName = docTable.name;

  // -------------------------------------------------------------------------
  // 1. COLONNES : présence, type, nullabilité, valeur par défaut
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 2. CLÉ PRIMAIRE : ordre positionnel exact (PAS de tri)
  // -------------------------------------------------------------------------
  const docPK = docTable.primaryKey.join(',');
  const scriptPK = scriptTable.primaryKey.join(',');
  if (docPK !== scriptPK) {
    diffs.push({ table: tName, category: 'PRIMARY_KEY', description: `Clé primaire divergente: Doc=[${docPK}] vs Script=[${scriptPK}].` });
  }

  // -------------------------------------------------------------------------
  // 3. CLÉS ÉTRANGÈRES
  //    Appariement 1-à-1 strict des FK :
  //      - Support des FK multiples partageant les mêmes colonnes sources
  //      - Association positionnelle exacte (sourceCols[i] ↔ targetCols[i])
  //      - Table cible, onDelete, onUpdate
  // -------------------------------------------------------------------------
  const usedScriptFkIndices = new Set<number>();

  for (const docFK of docTable.foreignKeys) {
    const docSig = fkSignature(docFK);

    // Recherche d'une FK correspondante non encore appariée
    // Priorité 1: sourceCols identiquement ordonnées ET même table cible
    let matchIdx = scriptTable.foreignKeys.findIndex(
      (sfk, idx) => !usedScriptFkIndices.has(idx) && fkSignature(sfk) === docSig && sfk.targetTable === docFK.targetTable
    );
    // Priorité 2: sourceCols identiquement ordonnées (pour détecter altération table cible)
    if (matchIdx === -1) {
      matchIdx = scriptTable.foreignKeys.findIndex(
        (sfk, idx) => !usedScriptFkIndices.has(idx) && fkSignature(sfk) === docSig
      );
    }

    if (matchIdx === -1) {
      diffs.push({ table: tName, category: 'FOREIGN_KEY', description: `FK sur [${docFK.sourceCols.join(',')}] ciblant '${docFK.targetTable}' manquante dans le script.` });
      continue;
    }

    usedScriptFkIndices.add(matchIdx);
    const matchFK = scriptTable.foreignKeys[matchIdx];

    // Table cible
    if (matchFK.targetTable !== docFK.targetTable) {
      diffs.push({ table: tName, category: 'FOREIGN_KEY', description: `FK sur [${docFK.sourceCols.join(',')}]: table cible divergente '${matchFK.targetTable}' (attendu: '${docFK.targetTable}').` });
    }

    // Colonnes cibles — comparaison positionnelle exacte (sourceCols[i] ↔ targetCols[i])
    if (docFK.targetCols.length !== matchFK.targetCols.length) {
      diffs.push({ table: tName, category: 'FOREIGN_KEY', description: `FK sur [${docFK.sourceCols.join(',')}]: nombre de colonnes cibles divergent (Doc=${docFK.targetCols.length} vs Script=${matchFK.targetCols.length}).` });
    } else {
      for (let i = 0; i < docFK.targetCols.length; i++) {
        if (docFK.targetCols[i] !== matchFK.targetCols[i]) {
          diffs.push({ table: tName, category: 'FOREIGN_KEY', description: `FK sur [${docFK.sourceCols.join(',')}]: colonne cible[${i}] divergente: Doc='${docFK.targetCols[i]}' vs Script='${matchFK.targetCols[i]}'.` });
        }
      }
    }

    // ON DELETE
    if (matchFK.onDelete !== docFK.onDelete) {
      diffs.push({ table: tName, category: 'FOREIGN_KEY', description: `FK sur [${docFK.sourceCols.join(',')}]: ON DELETE divergent '${matchFK.onDelete}' (attendu: '${docFK.onDelete}').` });
    }

    // ON UPDATE
    if (matchFK.onUpdate !== docFK.onUpdate) {
      diffs.push({ table: tName, category: 'FOREIGN_KEY', description: `FK sur [${docFK.sourceCols.join(',')}]: ON UPDATE divergent '${matchFK.onUpdate}' (attendu: '${docFK.onUpdate}').` });
    }
  }

  // FK supplémentaires dans le script
  for (let idx = 0; idx < scriptTable.foreignKeys.length; idx++) {
    if (!usedScriptFkIndices.has(idx)) {
      const scriptFK = scriptTable.foreignKeys[idx];
      diffs.push({ table: tName, category: 'FOREIGN_KEY', description: `FK supplémentaire non documentée sur [${scriptFK.sourceCols.join(',')}] ciblant '${scriptFK.targetTable}'.` });
    }
  }

  // -------------------------------------------------------------------------
  // 4. CONTRAINTES UNIQUE
  // -------------------------------------------------------------------------
  for (const docUnq of docTable.uniqueConstraints) {
    const docSig = docUnq.columns.slice().sort().join(',');
    const found = scriptTable.uniqueConstraints.some(su => su.columns.slice().sort().join(',') === docSig);
    if (!found) {
      diffs.push({ table: tName, category: 'UNIQUE', description: `Contrainte UNIQUE([${docUnq.columns.join(',')}]) manquante dans le script.` });
    }
  }
  for (const scriptUnq of scriptTable.uniqueConstraints) {
    const scriptSig = scriptUnq.columns.slice().sort().join(',');
    const found = docTable.uniqueConstraints.some(du => du.columns.slice().sort().join(',') === scriptSig);
    if (!found) {
      diffs.push({ table: tName, category: 'UNIQUE', description: `Contrainte UNIQUE([${scriptUnq.columns.join(',')}]) supplémentaire dans le script.` });
    }
  }

  // -------------------------------------------------------------------------
  // 5. CONTRAINTES CHECK
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 6. INDEX ET INDEX PARTIELS
  //    Comparaison par nom, puis : unicité, colonnes/expressions, clause INCLUDE, prédicat WHERE
  // -------------------------------------------------------------------------
  for (const docIdx of docTable.indexes) {
    const matchIdx = scriptTable.indexes.find(si => si.name === docIdx.name);
    if (!matchIdx) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}' manquant dans le script.` });
      continue;
    }
    if (matchIdx.isUnique !== docIdx.isUnique) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}': unicité divergente (Doc=${docIdx.isUnique} vs Script=${matchIdx.isUnique}).` });
    }
    // Colonnes d'index : ordre positionnel exact et sens de tri / expressions
    const docCols = docIdx.columns.join(',');
    const scriptCols = matchIdx.columns.join(',');
    if (docCols !== scriptCols) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}': colonnes ou expressions divergentes [${scriptCols}] vs [${docCols}].` });
    }
    // Clause INCLUDE
    const docInc = (docIdx.includeColumns || []).join(',');
    const scriptInc = (matchIdx.includeColumns || []).join(',');
    if (docInc !== scriptInc) {
      diffs.push({ table: tName, category: 'INDEX', description: `Index '${docIdx.name}': clause INCLUDE divergente: Doc=[${docInc}] vs Script=[${scriptInc}].` });
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

// ============================================================================
// COMPARAISON COMPLÈTE DES 21 TABLES
// ============================================================================

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

  for (const [name, docTable] of docTables.entries()) {
    const scriptTable = scriptTables.get(name);
    if (!scriptTable) {
      allDiffs.push({ table: name, category: 'MISSING_TABLE', description: `Table '${name}' entièrement manquante dans le script !` });
      tableSummaries.push({
        table: name, columnsCount: docTable.columns.size, pk: docTable.primaryKey.join(','),
        fksCount: docTable.foreignKeys.length, uniquesCount: docTable.uniqueConstraints.length,
        checksCount: docTable.checkConstraints.length, indexesCount: docTable.indexes.length,
        status: 'DIVERGENT'
      });
      continue;
    }

    const tableDiffs = compareTableStructures(docTable, scriptTable);
    allDiffs.push(...tableDiffs);
    tableSummaries.push({
      table: name, columnsCount: docTable.columns.size, pk: docTable.primaryKey.join(','),
      fksCount: docTable.foreignKeys.length, uniquesCount: docTable.uniqueConstraints.length,
      checksCount: docTable.checkConstraints.length, indexesCount: docTable.indexes.length,
      status: tableDiffs.length === 0 ? 'CONFORME' : 'DIVERGENT'
    });
  }

  for (const name of scriptTables.keys()) {
    if (!docTables.has(name)) {
      allDiffs.push({ table: name, category: 'EXTRA_TABLE', description: `Table '${name}' présente dans le script mais absente de l'architecture canonique.` });
    }
  }

  return { tablesCompared: docTables.size, allDiffs, tableSummaries };
}

// ============================================================================
// TESTS NÉGATIFS (21 mutations — chacune DOIT être détectée)
// ============================================================================

export function runComparatorNegativeTests(): boolean {
  console.log("================================================================================");
  console.log("   TESTS NÉGATIFS DU COMPARATEUR STRUCTUREL DDL (21 mutations)");
  console.log("================================================================================\n");

  // DDL de référence : table avec PK composite, FK composites, multiples FK sur même source,
  // ON UPDATE, DEFAULT, index unique partiel, index INCLUDE, index DESC, index expression
  const baseDocSQL = `
    CREATE TABLE test_table (
      id TEXT NOT NULL,
      edition_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
      team_id TEXT REFERENCES teams(id) ON DELETE CASCADE ON UPDATE NO ACTION,
      amount NUMERIC(10, 2) DEFAULT 0.00,
      score INT,
      PRIMARY KEY (id, edition_id),
      UNIQUE(edition_id, id),
      FOREIGN KEY (team_id) REFERENCES second_teams(id) ON DELETE CASCADE ON UPDATE NO ACTION,
      FOREIGN KEY (team_id, edition_id) REFERENCES other_teams(team_id, edition_id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX test_partial_idx ON test_table(edition_id) WHERE status = 'OPEN';
    CREATE INDEX test_score_idx ON test_table(score, edition_id);
    CREATE INDEX test_include_idx ON test_table(id) INCLUDE (amount);
    CREATE INDEX test_desc_idx ON test_table(score DESC);
    CREATE INDEX test_expr_idx ON test_table((lower(status)));
    CREATE INDEX test_complex_partial_idx ON test_table(score) WHERE status = 'OPEN' AND score > 0;
  `;

  let allPassed = true;

  /**
   * Exécute un test négatif : la mutation DOIT produire une divergence dans la catégorie attendue.
   * Si le comparateur laisse passer la divergence → ÉCHEC du test.
   */
  const runMutationTest = (testName: string, mutatedScriptSQL: string, expectedCategory: string) => {
    const docDef = extractSchemaDefinitions(baseDocSQL, true).get('test_table');
    if (!docDef) throw new Error(`ERREUR INTERNE: test_table non trouvée dans le DDL de référence.`);
    const scriptDef = extractSchemaDefinitions(mutatedScriptSQL, false).get('test_table');
    if (!scriptDef) throw new Error(`ERREUR INTERNE: test_table non trouvée dans le DDL muté pour: ${testName}`);

    // Merge indexes (parseIndexes ne retourne que les index CREATE INDEX)
    const docIdxMap = parseIndexes(baseDocSQL);
    docDef.indexes = docIdxMap.get('test_table') || [];
    const scriptIdxMap = parseIndexes(mutatedScriptSQL);
    scriptDef.indexes = scriptIdxMap.get('test_table') || [];

    const diffs = compareTableStructures(docDef, scriptDef);
    const detected = diffs.some(d => d.category === expectedCategory);

    if (!detected) {
      console.error(`❌ ÉCHEC TEST NÉGATIF [${testName}]`);
      console.error(`   Aucune divergence de catégorie '${expectedCategory}' détectée.`);
      console.error(`   Divergences effectives:`, diffs.length === 0 ? '(aucune)' : diffs.map(d => d.description));
      allPassed = false;
    } else {
      const detectedDiff = diffs.find(d => d.category === expectedCategory)!;
      console.log(`✔ Test négatif ${testName}`);
      console.log(`   → Détecté [${expectedCategory}]: "${detectedDiff.description}"\n`);
    }
  };

  // ── 1. Inversion de l'ordre d'une PK composite ────────────────────────────
  runMutationTest(
    "1. Inversion ordre PK composite",
    baseDocSQL.replace("PRIMARY KEY (id, edition_id)", "PRIMARY KEY (edition_id, id)"),
    "PRIMARY_KEY"
  );

  // ── 2. Inversion de l'ordre des colonnes sources d'une FK composite ───────
  runMutationTest(
    "2. Inversion ordre colonnes sources FK composite",
    baseDocSQL.replace(
      "FOREIGN KEY (team_id, edition_id) REFERENCES other_teams(team_id, edition_id)",
      "FOREIGN KEY (edition_id, team_id) REFERENCES other_teams(edition_id, team_id)"
    ),
    "FOREIGN_KEY"
  );

  // ── 3. Inversion de l'association source/cible d'une FK composite ─────────
  //    Les colonnes sources restent (team_id, edition_id) mais les cibles sont inversées
  runMutationTest(
    "3. Inversion association source/cible FK composite (targetCols[0]↔targetCols[1])",
    baseDocSQL.replace(
      "FOREIGN KEY (team_id, edition_id) REFERENCES other_teams(team_id, edition_id)",
      "FOREIGN KEY (team_id, edition_id) REFERENCES other_teams(edition_id, team_id)"
    ),
    "FOREIGN_KEY"
  );

  // ── 4. Altération de la table cible d'une FK ─────────────────────────────
  runMutationTest(
    "4. Altération table cible FK (teams → wrong_teams)",
    baseDocSQL.replace("REFERENCES teams(id)", "REFERENCES wrong_teams(id)"),
    "FOREIGN_KEY"
  );

  // ── 5. Altération ON DELETE ───────────────────────────────────────────────
  runMutationTest(
    "5. Altération ON DELETE (CASCADE → RESTRICT sur FK inline)",
    baseDocSQL.replace("ON DELETE CASCADE ON UPDATE NO ACTION", "ON DELETE RESTRICT ON UPDATE NO ACTION"),
    "FOREIGN_KEY"
  );

  // ── 6. Altération ON UPDATE ───────────────────────────────────────────────
  runMutationTest(
    "6. Altération ON UPDATE (CASCADE → RESTRICT sur FK composite)",
    baseDocSQL.replace("ON DELETE RESTRICT ON UPDATE CASCADE", "ON DELETE RESTRICT ON UPDATE RESTRICT"),
    "FOREIGN_KEY"
  );

  // ── 7. Suppression d'un index ─────────────────────────────────────────────
  runMutationTest(
    "7. Suppression d'un index (test_score_idx absent)",
    baseDocSQL.replace("CREATE INDEX test_score_idx ON test_table(score, edition_id);", ""),
    "INDEX"
  );

  // ── 8. Modification unicité d'un index (UNIQUE → non-UNIQUE) ─────────────
  runMutationTest(
    "8. Perte du UNIQUE sur test_partial_idx",
    baseDocSQL.replace("CREATE UNIQUE INDEX test_partial_idx", "CREATE INDEX test_partial_idx"),
    "INDEX"
  );

  // ── 9. Ajout d'une colonne supplémentaire ─────────────────────────────────
  runMutationTest(
    "9. Ajout d'une colonne supplémentaire (extra_col INT)",
    baseDocSQL.replace("score INT,", "score INT, extra_col INT,"),
    "COLUMN"
  );

  // ── 10. Modification d'une valeur DEFAULT ─────────────────────────────────
  runMutationTest(
    "10. Modification valeur DEFAULT (0.00 → 99.99)",
    baseDocSQL.replace("NUMERIC(10, 2) DEFAULT 0.00", "NUMERIC(10, 2) DEFAULT 99.99"),
    "COLUMN"
  );

  // ── 11. Altération du prédicat WHERE d'un index partiel ───────────────────
  runMutationTest(
    "11. Altération prédicat WHERE index partiel (OPEN → CLOSED)",
    baseDocSQL.replace("WHERE status = 'OPEN'", "WHERE status = 'CLOSED'"),
    "INDEX"
  );

  // ── 12. Altération d'une expression CHECK ────────────────────────────────
  runMutationTest(
    "12. Altération expression CHECK",
    baseDocSQL.replace("status IN ('OPEN', 'CLOSED')", "status IN ('OPEN', 'CLOSED', 'ARCHIVED')"),
    "CHECK"
  );

  // ── 13. Altération du type d'une colonne (NUMERIC → INT) ─────────────────
  runMutationTest(
    "13. Altération type de colonne (NUMERIC → INT)",
    baseDocSQL.replace("NUMERIC(10, 2)", "INT"),
    "COLUMN"
  );

  // ── 14. Altération de nullabilité (NOT NULL retiré) ───────────────────────
  runMutationTest(
    "14. Altération nullabilité (NOT NULL retiré sur status)",
    baseDocSQL.replace("status TEXT NOT NULL CHECK", "status TEXT CHECK"),
    "COLUMN"
  );

  // ── 15. Altération des colonnes d'une contrainte UNIQUE ───────────────────
  runMutationTest(
    "15. Altération colonnes UNIQUE (edition_id,id → edition_id,status)",
    baseDocSQL.replace("UNIQUE(edition_id, id)", "UNIQUE(edition_id, status)"),
    "UNIQUE"
  );

  // ── 16. Altération de la Clé Primaire simple ─────────────────────────────
  runMutationTest(
    "16. Mutation PK composite vers PK différente",
    baseDocSQL.replace("PRIMARY KEY (id, edition_id)", "PRIMARY KEY (score, edition_id)"),
    "PRIMARY_KEY"
  );

  // ── 17. Deux clés étrangères avec les mêmes colonnes sources ─────────────
  runMutationTest(
    "17. Deux FK sur même colonne source (omission de la FK vers second_teams)",
    baseDocSQL.replace("FOREIGN KEY (team_id) REFERENCES second_teams(id) ON DELETE CASCADE ON UPDATE NO ACTION,", ""),
    "FOREIGN_KEY"
  );

  // ── 18. Index avec clause INCLUDE ─────────────────────────────────────────
  runMutationTest(
    "18. Altération clause INCLUDE d'un index (amount → score)",
    baseDocSQL.replace("INCLUDE (amount)", "INCLUDE (score)"),
    "INDEX"
  );

  // ── 19. Index fonctionnel / expression ────────────────────────────────────
  runMutationTest(
    "19. Altération expression index fonctionnel ((lower(status)) → (upper(status)))",
    baseDocSQL.replace("((lower(status)))", "((upper(status)))"),
    "INDEX"
  );

  // ── 20. Index avec ordre DESC ─────────────────────────────────────────────
  runMutationTest(
    "20. Inversion ordre de tri index (score DESC → score ASC)",
    baseDocSQL.replace("score DESC", "score ASC"),
    "INDEX"
  );

  // ── 21. Index partiel avec prédicat complexe ──────────────────────────────
  runMutationTest(
    "21. Altération prédicat partiel complexe (retrait de AND score > 0)",
    baseDocSQL.replace("WHERE status = 'OPEN' AND score > 0", "WHERE status = 'OPEN'"),
    "INDEX"
  );

  if (allPassed) {
    console.log("✔ TOUS LES 21 TESTS NÉGATIFS DU COMPARATEUR ONT RÉUSSI AVEC SUCCÈS !\n");
  } else {
    console.error("❌ CERTAINS TESTS NÉGATIFS ONT ÉCHOUÉ — le comparateur laisse passer des divergences !\n");
    process.exit(1);
  }

  return allPassed;
}

// ============================================================================
// POINT D'ENTRÉE CLI
// ============================================================================

if (import.meta.main || process.argv[1]?.endsWith('compare-ddl.ts')) {
  if (process.argv.includes('--test-negative')) {
    runComparatorNegativeTests();
    process.exit(0);
  }

  console.log("================================================================================");
  console.log("   GAMES TRAFICS — COMPARATEUR STRUCTUREL APPROFONDI DES 21 TABLES CANONIQUES");
  console.log("================================================================================\n");

  const { tablesCompared, allDiffs, tableSummaries } = performFullStructuralComparison();

  console.log("| #  | Table Name                | Colonnes | PK                             | FKs | Uniques | Checks | Index | Statut      |");
  console.log("|----|---------------------------|----------|--------------------------------|-----|---------|--------|-------|-------------|");

  let idx = 1;
  for (const s of tableSummaries) {
    const num = String(idx++).padStart(2, ' ');
    const name = s.table.padEnd(25, ' ');
    const cols = String(s.columnsCount).padStart(8, ' ');
    const pk = s.pk.padEnd(30, ' ');
    const fks = String(s.fksCount).padStart(3, ' ');
    const unqs = String(s.uniquesCount).padStart(7, ' ');
    const chks = String(s.checksCount).padStart(6, ' ');
    const idxs = String(s.indexesCount).padStart(5, ' ');
    const status = s.status === 'CONFORME' ? '✔ CONFORME ' : '❌ DIVERGENT';
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
