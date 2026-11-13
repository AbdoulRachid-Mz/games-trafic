import type { DocumentFormat, DocumentType } from "./types";

export interface DocumentTemplateDefinition {
  type: DocumentType;
  label: string;
  defaultTitle: string;
  filenamePrefix: string;
  orientation: "portrait" | "landscape";
  supportedFormats: DocumentFormat[];
}

const ALL_FORMATS: DocumentFormat[] = ["pdf", "xlsx", "csv", "json", "text"];

export const DOCUMENT_TEMPLATES: Record<
  DocumentType,
  DocumentTemplateDefinition
> = {
  "transaction-receipt": {
    type: "transaction-receipt",
    label: "Reçu de transaction",
    defaultTitle: "Reçu de transaction",
    filenamePrefix: "recu",
    orientation: "portrait",
    supportedFormats: ["pdf", "json", "text"],
  },
  "edition-report": {
    type: "edition-report",
    label: "Rapport d'édition",
    defaultTitle: "Rapport de l'édition",
    filenamePrefix: "edition",
    orientation: "portrait",
    supportedFormats: ALL_FORMATS,
  },
  "edition-participants": {
    type: "edition-participants",
    label: "Participants de l'édition",
    defaultTitle: "Liste des participants",
    filenamePrefix: "participants",
    orientation: "portrait",
    supportedFormats: ALL_FORMATS,
  },
  "edition-standings": {
    type: "edition-standings",
    label: "Classement",
    defaultTitle: "Classement",
    filenamePrefix: "classement",
    orientation: "portrait",
    supportedFormats: ALL_FORMATS,
  },
  "matches-list": {
    type: "matches-list",
    label: "Matchs",
    defaultTitle: "Liste des matchs",
    filenamePrefix: "matchs",
    orientation: "landscape",
    supportedFormats: ALL_FORMATS,
  },
  "match-sheet": {
    type: "match-sheet",
    label: "Feuille de match",
    defaultTitle: "Feuille de match",
    filenamePrefix: "feuille-match",
    orientation: "portrait",
    supportedFormats: ["pdf", "json", "text"],
  },
  bracket: {
    type: "bracket",
    label: "Bracket",
    defaultTitle: "Bracket",
    filenamePrefix: "bracket",
    orientation: "landscape",
    supportedFormats: ALL_FORMATS,
  },
  "shop-report": {
    type: "shop-report",
    label: "Rapport boutique",
    defaultTitle: "Rapport de la boutique",
    filenamePrefix: "boutique",
    orientation: "portrait",
    supportedFormats: ALL_FORMATS,
  },
  "products-list": {
    type: "products-list",
    label: "Produits",
    defaultTitle: "Catalogue de produits",
    filenamePrefix: "produits",
    orientation: "landscape",
    supportedFormats: ALL_FORMATS,
  },
  "orders-list": {
    type: "orders-list",
    label: "Commandes",
    defaultTitle: "Liste des commandes",
    filenamePrefix: "commandes",
    orientation: "landscape",
    supportedFormats: ALL_FORMATS,
  },
  "shop-clients": {
    type: "shop-clients",
    label: "Clients",
    defaultTitle: "Clients de la boutique",
    filenamePrefix: "clients",
    orientation: "portrait",
    supportedFormats: ALL_FORMATS,
  },
  "shop-wallet": {
    type: "shop-wallet",
    label: "Portefeuille boutique",
    defaultTitle: "Historique financier de la boutique",
    filenamePrefix: "portefeuille-boutique",
    orientation: "landscape",
    supportedFormats: ALL_FORMATS,
  },
  "generic-table": {
    type: "generic-table",
    label: "Export de données",
    defaultTitle: "Export de données",
    filenamePrefix: "export",
    orientation: "portrait",
    supportedFormats: ALL_FORMATS,
  },
};

export function getDocumentTemplate(
  type: DocumentType,
): DocumentTemplateDefinition {
  return DOCUMENT_TEMPLATES[type] ?? DOCUMENT_TEMPLATES["generic-table"];
}

export function supportsDocumentFormat(
  type: DocumentType,
  format: DocumentFormat,
): boolean {
  return getDocumentTemplate(type).supportedFormats.includes(format);
}
