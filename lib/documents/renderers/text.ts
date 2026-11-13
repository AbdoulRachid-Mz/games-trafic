import {
  formatColumnValue,
  formatDateTime,
  isBlank,
  toPdfSafeText,
} from "../format";
import type { DocumentModel, DocumentTable } from "../types";
import { getFieldSections, getPrimaryTable, padCell } from "./shared";

const MAX_COLUMN_WIDTH = 28;
const SEPARATOR = "=";

function renderTable(table: DocumentTable): string[] {
  const widths = table.columns.map((column) => {
    const header = column.label.length;
    const samples = table.rows
      .slice(0, 500)
      .map(
        (row) =>
          formatColumnValue(row[column.key], column).length,
      );
    return Math.min(Math.max(header, ...samples, 6), MAX_COLUMN_WIDTH);
  });

  const formatRow = (values: string[]) =>
    values
      .map((value, index) => {
        const column = table.columns[index];
        const isRight =
          column?.align === "right" ||
          column?.type === "number" ||
          column?.type === "currency";
        return padCell(value, widths[index] ?? 10, isRight ? "right" : "left");
      })
      .join(" | ")
      .trimEnd();

  const headerLine = formatRow(table.columns.map((column) => column.label));
  const lines = [
    headerLine,
    widths.map((width) => "-".repeat(width)).join("-+-"),
  ];

  for (const row of table.rows) {
    lines.push(
      formatRow(
        table.columns.map((column) =>
          formatColumnValue(row[column.key], column),
        ),
      ),
    );
  }

  if (table.totals && table.totals.length > 0) {
    lines.push("");
    for (const total of table.totals) {
      lines.push(
        `${total.label} : ${formatColumnValue(total.value, {
          type: total.type ?? "number",
          currency: total.currency,
        })}`,
      );
    }
  }

  return lines;
}

/**
 * Texte brut lisible (journaux, e-mails, aperçu terminal).
 * Aucune donnée sensible n'est ajoutée ici : uniquement le modèle fourni.
 */
export async function renderText(model: DocumentModel): Promise<Blob> {
  const lines: string[] = [];
  const header = `${model.brand.name.toUpperCase()}${
    model.brand.tagline ? ` — ${model.brand.tagline}` : ""
  }`;
  lines.push(SEPARATOR.repeat(Math.min(header.length, 80)));
  lines.push(toPdfSafeText(header));
  lines.push(SEPARATOR.repeat(Math.min(header.length, 80)));
  lines.push("");

  lines.push(toPdfSafeText(model.meta.title));
  if (model.meta.subtitle) lines.push(toPdfSafeText(model.meta.subtitle));
  if (model.meta.reference) {
    lines.push(`Référence : ${toPdfSafeText(model.meta.reference)}`);
  }
  lines.push(
    `Généré le : ${toPdfSafeText(formatDateTime(model.meta.generatedAt))}`,
  );
  if (model.meta.generatedBy) {
    lines.push(`Généré par : ${toPdfSafeText(model.meta.generatedBy)}`);
  }
  if (model.meta.totalRecords !== undefined) {
    lines.push(`Enregistrements : ${model.meta.totalRecords}`);
  }
  lines.push("");

  const filters = Object.entries(model.meta.filters ?? {}).filter(
    ([, value]) => !isBlank(value),
  );
  if (filters.length > 0) {
    lines.push("Filtres appliqués");
    for (const [key, value] of filters) {
      lines.push(`- ${toPdfSafeText(key)} : ${toPdfSafeText(value)}`);
    }
    lines.push("");
  }

  for (const section of getFieldSections(model)) {
    const visible = section.fields.filter((entry) => !isBlank(entry.value));
    if (visible.length === 0) continue;
    lines.push((section.title ?? "Informations").toUpperCase());
    for (const entry of visible) {
      const value = formatColumnValue(entry.value, {
        type: entry.type,
        currency: entry.currency,
      });
      lines.push(`- ${toPdfSafeText(entry.label)} : ${toPdfSafeText(value)}`);
    }
    lines.push("");
  }

  for (const section of model.sections) {
    if (section.kind !== "table" && section.kind !== "text") continue;
    if (section.kind === "text") {
      if (isBlank(section.text)) continue;
      if (section.title) lines.push(section.title.toUpperCase());
      lines.push(toPdfSafeText(section.text));
      lines.push("");
      continue;
    }
    if (section.title) lines.push(section.title.toUpperCase());
    lines.push(...renderTable(section.table));
    lines.push("");
  }

  const primary = getPrimaryTable(model);
  const hasPrimaryRendered = model.sections.some(
    (section) => section.kind === "table",
  );
  if (primary && !hasPrimaryRendered) {
    lines.push(...renderTable(primary));
    lines.push("");
  }

  lines.push(SEPARATOR.repeat(60));
  const contact = [model.brand.email, model.brand.address]
    .filter(Boolean)
    .join(" · ");
  lines.push(
    toPdfSafeText(
      `${model.brand.name}${contact ? ` · ${contact}` : ""}`,
    ),
  );

  return new Blob([lines.join("\r\n")], {
    type: "text/plain;charset=utf-8",
  });
}
