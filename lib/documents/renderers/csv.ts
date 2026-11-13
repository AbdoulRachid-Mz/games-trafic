import { serializeCsv } from "../csv";
import { formatColumnValue } from "../format";
import type { DocumentModel } from "../types";
import { getPrimaryTable } from "./shared";

/**
 * CSV : une seule table, valeurs formatées (accents, devises, dates) et
 * protection contre l'injection de formules.
 */
export async function renderCsv(model: DocumentModel): Promise<Blob> {
  const table = getPrimaryTable(model);
  if (!table || table.columns.length === 0) {
    return new Blob(["\uFEFF"], { type: "text/csv;charset=utf-8" });
  }

  const headers = table.columns.map((column) => column.label);
  const rows = table.rows.map((row) =>
    table.columns.map((column) =>
      formatColumnValue(row[column.key], column),
    ),
  );

  const content = serializeCsv(headers, rows, {
    delimiter: ",",
    includeBom: true,
    eol: "\r\n",
  });

  return new Blob([content], { type: "text/csv;charset=utf-8" });
}
