import type { DocumentModel } from "./types";
import { formatColumnValue, toDisplayString } from "./format";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return toDisplayString(value).replace(
    /[&<>"']/g,
    (character) => HTML_ESCAPES[character] ?? character,
  );
}

/**
 * Document HTML imprimable sûr (aucune donnée utilisateur injectée brute).
 * Utilisé uniquement en dernier recours ; le PDF reste le format officiel.
 */
export function renderPrintableHtml(model: DocumentModel): string {
  const brand = model.brand;
  const table = model.primaryTable;
  const headerCells = table
    ? table.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")
    : "";
  const bodyRows = table
    ? table.rows
        .map(
          (row) =>
            `<tr>${table.columns
              .map(
                (column) =>
                  `<td class="${column.type === "number" || column.type === "currency" ? "num" : ""}">${escapeHtml(
                    formatColumnValue(row[column.key], column),
                  )}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("")
    : "";

  const fields = model.sections
    .filter((section) => section.kind === "fields" || section.kind === "summary")
    .flatMap((section) => section.fields)
    .map(
      (field) =>
        `<div class="field"><span>${escapeHtml(field.label)}</span><strong>${escapeHtml(
          formatColumnValue(field.value, { type: field.type, currency: field.currency }),
        )}</strong></div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(model.meta.title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; margin: 32px; }
  header { border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { margin: 0; font-size: 24px; }
  .subtitle { color: #6b7280; margin-top: 4px; }
  .brand { font-weight: 700; color: #4f46e5; letter-spacing: .04em; text-transform: uppercase; font-size: 12px; }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin-bottom: 24px; }
  .field { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e5e7eb; padding: 6px 0; font-size: 13px; }
  .field span { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #eef2ff; text-align: left; padding: 8px; border-bottom: 1px solid #c7d2fe; }
  td { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  footer { margin-top: 32px; color: #9ca3af; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <header>
    <div class="brand">${escapeHtml(brand.name)}</div>
    <h1>${escapeHtml(model.meta.title)}</h1>
    ${model.meta.subtitle ? `<div class="subtitle">${escapeHtml(model.meta.subtitle)}</div>` : ""}
    ${model.meta.reference ? `<div class="subtitle">Référence : ${escapeHtml(model.meta.reference)}</div>` : ""}
  </header>
  ${fields ? `<section class="fields">${fields}</section>` : ""}
  ${table ? `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>` : ""}
  <footer>
    ${escapeHtml(brand.name)}${brand.email ? ` · ${escapeHtml(brand.email)}` : ""}${brand.address ? ` · ${escapeHtml(brand.address)}` : ""}
  </footer>
</body>
</html>`;
}
