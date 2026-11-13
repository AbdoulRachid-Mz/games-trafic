import type { DocumentModel } from "../types";
import { getPrimaryTable } from "./shared";

/**
 * JSON : structure stable, machine-lisible.
 *
 * - `data` contient les lignes brutes (numéros, dates ISO) ou `jsonData`
 *   lorsque le builder fournit un DTO dédié.
 * - `columns` documente le schéma des lignes.
 */
export async function renderJson(model: DocumentModel): Promise<Blob> {
  const table = getPrimaryTable(model);
  const payload = {
    meta: {
      type: model.meta.type,
      title: model.meta.title,
      subtitle: model.meta.subtitle ?? null,
      reference: model.meta.reference ?? null,
      generatedAt: model.meta.generatedAt,
      generatedBy: model.meta.generatedBy ?? null,
      filters: model.meta.filters ?? {},
      totalRecords: model.meta.totalRecords ?? table?.rows.length ?? 0,
    },
    brand: model.brand,
    columns:
      table?.columns.map((column) => ({
        key: column.key,
        label: column.label,
        type: column.type ?? "text",
        currency: column.currency ?? null,
      })) ?? [],
    data: model.jsonData ?? table?.rows ?? [],
    totals: table?.totals ?? [],
    summary:
      model.summary?.map((entry) => ({
        label: entry.label,
        value: entry.value,
        type: entry.type ?? "text",
        currency: entry.currency ?? null,
      })) ?? [],
  };

  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
}
