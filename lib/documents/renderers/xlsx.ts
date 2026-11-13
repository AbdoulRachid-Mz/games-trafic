import { formatColumnValue, formatDateTime, isBlank } from "../format";
import type { DocumentColumn, DocumentModel, DocumentSheet } from "../types";
import { getFieldSections, getPrimaryTable, toSheetName } from "./shared";

type CellValue = string | number | boolean | null;

function toCellValue(value: unknown, column: DocumentColumn): CellValue {
  if (isBlank(value)) return null;
  switch (column.type) {
    case "number":
    case "percentage": {
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : String(value);
    }
    case "currency": {
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : String(value);
    }
    case "date":
    case "datetime":
      return formatColumnValue(value, column);
    case "boolean":
      return value ? "Oui" : "Non";
    default:
      return formatColumnValue(value, column);
  }
}

function sheetFromTable(
  name: string,
  columns: DocumentColumn[],
  rows: Array<Record<string, unknown>>,
): DocumentSheet {
  return { name, columns, rows };
}

function deriveSheets(model: DocumentModel): DocumentSheet[] {
  if (model.sheets && model.sheets.length > 0) return model.sheets;
  const table = getPrimaryTable(model);
  if (table) {
    return [sheetFromTable("Données", table.columns, table.rows)];
  }
  return [];
}

function computeColumnWidths(sheet: DocumentSheet): Array<{ wch: number }> {
  return sheet.columns.map((column) => {
    const headerLength = column.label.length;
    const sample = sheet.rows
      .slice(0, 200)
      .map((row) => String(formatColumnValue(row[column.key], column)).length);
    const max = Math.max(headerLength, ...sample, 8);
    return { wch: Math.min(Math.max(max + 2, 10), 48) };
  });
}

function buildSheetAoa(sheet: DocumentSheet): CellValue[][] {
  const header = sheet.columns.map((column) => column.label);
  const body = sheet.rows.map((row) =>
    sheet.columns.map((column) => toCellValue(row[column.key], column)),
  );
  return [header, ...body];
}

function applySheetMeta(
  worksheet: Record<string, unknown>,
  sheet: DocumentSheet,
  rowCount: number,
) {
  worksheet["!cols"] = computeColumnWidths(sheet);
  if (sheet.freezeHeader !== false) {
    worksheet["!freeze"] = { xSplit: "0", ySplit: "1", topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
  }
  if (sheet.autoFilter !== false && rowCount > 0) {
    const lastColumn = String.fromCharCode(65 + Math.min(sheet.columns.length - 1, 25));
    worksheet["!autofilter"] = { ref: `A1:${lastColumn}${rowCount + 1}` };
  }
}

export async function renderXlsx(model: DocumentModel): Promise<Blob> {
  const xlsxModule: any = await import("xlsx");
  const XLSX = xlsxModule.default ?? xlsxModule;

  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  const uniqueName = (name: string) => {
    let candidate = toSheetName(name);
    let counter = 2;
    while (usedNames.has(candidate)) {
      candidate = toSheetName(`${name} ${counter}`);
      counter += 1;
    }
    usedNames.add(candidate);
    return candidate;
  };

  const sheets = deriveSheets(model);
  for (const sheet of sheets) {
    const name = uniqueName(sheet.name);
    const worksheet = XLSX.utils.aoa_to_sheet(buildSheetAoa(sheet));
    applySheetMeta(worksheet, sheet, sheet.rows.length);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  }

  // Feuille de présentation : métadonnées, filtres et résumé.
  const infoRows: CellValue[][] = [
    ["INFORMATIONS DU DOCUMENT"],
    ["Document", model.meta.title],
    ["Référence", model.meta.reference ?? ""],
    ["Type", model.meta.type],
    ["Généré le", formatDateTime(model.meta.generatedAt)],
    ["Généré par", model.meta.generatedBy ?? ""],
    ["Nombre d'enregistrements", model.meta.totalRecords ?? ""],
    [],
  ];

  if (model.brand.name) {
    infoRows.push(["ÉDITEUR"]);
    infoRows.push(["Nom", model.brand.name]);
    if (model.brand.email) infoRows.push(["Email", model.brand.email]);
    if (model.brand.address) infoRows.push(["Adresse", model.brand.address]);
    if (model.brand.website) infoRows.push(["Site web", model.brand.website]);
    infoRows.push([]);
  }

  const filters = Object.entries(model.meta.filters ?? {}).filter(
    ([, value]) => !isBlank(value),
  );
  if (filters.length > 0) {
    infoRows.push(["FILTRES APPLIQUÉS"]);
    for (const [key, value] of filters) {
      infoRows.push([key, String(value)]);
    }
    infoRows.push([]);
  }

  const fieldSections = getFieldSections(model);
  for (const section of fieldSections) {
    const visible = section.fields.filter((entry) => !isBlank(entry.value));
    if (visible.length === 0) continue;
    infoRows.push([(section.title ?? "RÉSUMÉ").toUpperCase()]);
    for (const entry of visible) {
      infoRows.push([
        entry.label,
        formatColumnValue(entry.value, {
          type: entry.type,
          currency: entry.currency,
        }),
      ]);
    }
    infoRows.push([]);
  }

  const tableTotals = getPrimaryTable(model)?.totals ?? [];
  if (tableTotals.length > 0) {
    infoRows.push(["TOTAUX"]);
    for (const total of tableTotals) {
      infoRows.push([
        total.label,
        total.type === "currency"
          ? formatColumnValue(total.value, {
              type: "currency",
              currency: total.currency,
            })
          : formatColumnValue(total.value, { type: total.type ?? "number" }),
      ]);
    }
  }

  const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
  infoSheet["!cols"] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, uniqueName("Informations"));

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
