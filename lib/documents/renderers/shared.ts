import type {
  DocumentFieldsSection,
  DocumentModel,
  DocumentSection,
  DocumentSummarySection,
  DocumentTable,
  DocumentTableSection,
} from "../types";

/**
 * Helpers partagés par les renderers. Aucune dépendance à une bibliothèque
 * de rendu : uniquement de la lecture de modèle.
 */

export function getPrimaryTable(model: DocumentModel): DocumentTable | null {
  if (model.primaryTable) return model.primaryTable;
  const tableSection = model.sections.find(
    (section): section is DocumentTableSection => section.kind === "table",
  );
  return tableSection?.table ?? null;
}

export function getTableSections(
  model: DocumentModel,
): DocumentTableSection[] {
  return model.sections.filter(
    (section): section is DocumentTableSection => section.kind === "table",
  );
}

export function getFieldSections(
  model: DocumentModel,
): Array<DocumentFieldsSection | DocumentSummarySection> {
  return model.sections.filter(
    (section): section is DocumentFieldsSection | DocumentSummarySection =>
      section.kind === "fields" || section.kind === "summary",
  );
}

export function getVisibleSections(model: DocumentModel): DocumentSection[] {
  return model.sections;
}

/** Nom de feuille XLSX valide (31 caractères max, sans caractères interdits). */
export function toSheetName(name: string, fallback = "Données"): string {
  const cleaned = (name || fallback)
    .replace(/[[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);
  return cleaned || fallback;
}

/** Aligne une chaîne sur une largeur donnée (troncature avec ellipse). */
export function padCell(
  value: string,
  width: number,
  align: "left" | "right" = "left",
): string {
  const max = Math.max(width, 3);
  const text =
    value.length > max ? `${value.slice(0, Math.max(1, max - 1))}…` : value;
  return align === "right" ? text.padStart(max) : text.padEnd(max);
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
