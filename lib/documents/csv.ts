/**
 * Sérialisation CSV sûre et déterministe.
 *
 * - UTF-8 avec BOM optionnel (ouverture Excel correcte des accents).
 * - Délimiteur explicite (`,` par défaut).
 * - Échappement des guillemets, retours ligne et délimiteurs.
 * - Protection contre l'injection de formules (OWASP CSV Injection).
 */

export interface CsvOptions {
  delimiter?: string;
  includeBom?: boolean;
  eol?: "\n" | "\r\n";
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const NUMERIC_STRING = /^-?\d+(?:[.,]\d+)?$/;

/**
 * Préfixe d'une apostrophe les cellules textuelles interprétables comme
 * formules par Excel / LibreOffice. Les nombres négatifs restent numériques.
 */
export function protectCsvFormula(value: string): string {
  if (!value) return value;
  if (!FORMULA_PREFIX.test(value)) return value;
  if (NUMERIC_STRING.test(value)) return value;
  return `'${value}`;
}

export function escapeCsvCell(
  value: unknown,
  options: { delimiter?: string; protectFormulas?: boolean } = {},
): string {
  const delimiter = options.delimiter ?? ",";
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (options.protectFormulas !== false) {
    text = protectCsvFormula(text);
  }

  const needsQuotes =
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r");

  if (!needsQuotes) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeCsv(
  headers: string[],
  rows: Array<Array<unknown>>,
  options: CsvOptions = {},
): string {
  const delimiter = options.delimiter ?? ",";
  const eol = options.eol ?? "\r\n";
  const escape = (value: unknown) =>
    escapeCsvCell(value, { delimiter, protectFormulas: true });

  const lines = [
    headers.map(escape).join(delimiter),
    ...rows.map((row) => row.map(escape).join(delimiter)),
  ];

  const body = lines.join(eol);
  return options.includeBom === false ? body : `\uFEFF${body}`;
}
