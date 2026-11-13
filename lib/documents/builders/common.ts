import { getDocumentBrand } from "../app-info";
import { slugifyFilename } from "../format";
import { getDocumentTemplate } from "../templates";
import type {
  DocumentField,
  DocumentMeta,
  DocumentModel,
  DocumentType,
} from "../types";

export interface BuildMetaInput {
  type: DocumentType;
  title?: string;
  subtitle?: string;
  reference?: string;
  generatedAt?: Date | string;
  generatedBy?: string | null;
  filters?: Record<string, string | number | boolean | null | undefined>;
  totalRecords?: number;
  orientation?: "portrait" | "landscape";
  filename?: string;
  subject?: string;
}

export function buildDocumentMeta(input: BuildMetaInput): DocumentMeta {
  const template = getDocumentTemplate(input.type);
  const generatedAt =
    input.generatedAt instanceof Date
      ? input.generatedAt.toISOString()
      : input.generatedAt ?? new Date().toISOString();
  const title = input.title || template.defaultTitle;
  return {
    type: input.type,
    title,
    subtitle: input.subtitle,
    reference: input.reference,
    generatedAt,
    generatedBy: input.generatedBy || undefined,
    filters: input.filters,
    totalRecords: input.totalRecords,
    orientation: input.orientation ?? template.orientation,
    filename:
      input.filename ||
      `${template.filenamePrefix}-${slugifyFilename(title, "document")}`,
    subject: input.subject,
  };
}

export function createDocument(input: {
  meta: DocumentMeta;
  sections: DocumentModel["sections"];
  primaryTable?: DocumentModel["primaryTable"];
  sheets?: DocumentModel["sheets"];
  jsonData?: unknown;
  summary?: DocumentField[];
}): DocumentModel {
  return {
    meta: input.meta,
    brand: getDocumentBrand(),
    sections: input.sections,
    primaryTable: input.primaryTable,
    sheets: input.sheets,
    jsonData: input.jsonData,
    summary: input.summary,
  };
}

export function field(
  label: string,
  value: unknown,
  options: {
    type?: DocumentField["type"];
    currency?: string;
    hideWhenEmpty?: boolean;
  } = {},
): DocumentField {
  return {
    label,
    value,
    type: options.type ?? "text",
    currency: options.currency,
    hideWhenEmpty: options.hideWhenEmpty ?? true,
  };
}

export function currencyField(
  label: string,
  value: unknown,
  currency?: string | null,
): DocumentField {
  return field(label, value, { type: "currency", currency: currency ?? undefined });
}

export function dateField(label: string, value: unknown): DocumentField {
  return field(label, value, { type: "datetime" });
}

export function numberField(label: string, value: unknown): DocumentField {
  return field(label, value, { type: "number" });
}

export const TRANSACTION_LABELS: Record<string, string> = {
  DEPOSIT: "Dépôt",
  WITHDRAWAL: "Retrait",
  TRANSFER: "Transfert",
  THEME_PURCHASE: "Achat de thème",
  VIP_SUBSCRIPTION: "Abonnement VIP",
  ORDER_PURCHASE: "Achat de produit",
  GAME_ITEM_PURCHASE: "Achat d'item de jeu",
  TOURNAMENT_PARTICIPATION: "Participation à un tournoi",
  PURCHASE: "Achat",
  REFUND: "Remboursement",
  BONUS: "Bonus",
};
