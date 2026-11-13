/**
 * lib/documents/types.ts
 *
 * Modèle documentaire central, sérialisable et indépendant des bibliothèques
 * de rendu (jsPDF, XLSX, …).
 *
 * Flux :
 *   Data Builder (serveur, données métier autorisées)
 *     → DocumentModel (ce fichier, pur JSON)
 *       → Renderer (PDF / XLSX / CSV / JSON / Texte)
 *
 * Aucun renderer ne doit contenir de logique métier, et aucun builder ne doit
 * dépendre d'une bibliothèque de rendu.
 */

export type DocumentFormat = "pdf" | "xlsx" | "csv" | "json" | "text";

export type DocumentType =
  | "transaction-receipt"
  | "edition-report"
  | "edition-participants"
  | "edition-standings"
  | "matches-list"
  | "match-sheet"
  | "bracket"
  | "shop-report"
  | "products-list"
  | "orders-list"
  | "shop-clients"
  | "shop-wallet"
  | "generic-table";

export type DocumentValueType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "boolean"
  | "percentage";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface DocumentBadge {
  label: string;
  tone?: BadgeTone;
}

export interface DocumentField {
  label: string;
  value: unknown;
  type?: DocumentValueType;
  /** Devise ISO/application, uniquement si le montant en possède une. */
  currency?: string;
  /** Masque la ligne quand la valeur est absente. Par défaut : true. */
  hideWhenEmpty?: boolean;
}

export interface DocumentColumn {
  key: string;
  label: string;
  type?: DocumentValueType;
  currency?: string;
  /** Poids relatif de la colonne (PDF) ; 1 = largeur standard. */
  width?: number;
  align?: "left" | "center" | "right";
}

export interface DocumentTotal {
  label: string;
  value: number;
  type?: "number" | "currency" | "percentage";
  currency?: string;
}

export interface DocumentTable {
  columns: DocumentColumn[];
  rows: Array<Record<string, unknown>>;
  totals?: DocumentTotal[];
  /** Nom de feuille XLSX associé, si ce tableau est exporté dans un classeur. */
  sheetName?: string;
}

export interface DocumentFieldsSection {
  kind: "fields";
  title?: string;
  fields: DocumentField[];
  columns?: 1 | 2 | 3;
}

export interface DocumentTextSection {
  kind: "text";
  title?: string;
  text: string;
}

export interface DocumentBadgesSection {
  kind: "badges";
  title?: string;
  badges: DocumentBadge[];
}

export interface DocumentTableSection {
  kind: "table";
  title?: string;
  table: DocumentTable;
  /** Affiche les totaux sous le tableau dans le PDF. */
  showTotals?: boolean;
}

export interface DocumentSummarySection {
  kind: "summary";
  title?: string;
  fields: DocumentField[];
}

export type DocumentSection =
  | DocumentFieldsSection
  | DocumentTextSection
  | DocumentBadgesSection
  | DocumentTableSection
  | DocumentSummarySection;

export interface DocumentMeta {
  type: DocumentType;
  title: string;
  subtitle?: string;
  /** Référence lisible (reçu, édition, commande…). Jamais un secret. */
  reference?: string;
  /** ISO 8601 — toujours fourni par le builder. */
  generatedAt: string;
  generatedBy?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
  totalRecords?: number;
  orientation?: "portrait" | "landscape";
  /** Nom de fichier sans extension. */
  filename?: string;
  subject?: string;
}

export interface DocumentBrand {
  name: string;
  tagline?: string;
  logoPath?: string;
  email?: string;
  address?: string;
  website?: string;
}

export interface DocumentSheet {
  name: string;
  columns: DocumentColumn[];
  rows: Array<Record<string, unknown>>;
  totals?: DocumentTotal[];
  autoFilter?: boolean;
  freezeHeader?: boolean;
}

export interface DocumentModel {
  meta: DocumentMeta;
  brand: DocumentBrand;
  sections: DocumentSection[];
  /** Tableau principal utilisé par les renderers CSV / texte. */
  primaryTable?: DocumentTable;
  /** Feuilles du classeur XLSX (défaut : primaryTable + feuille de présentation). */
  sheets?: DocumentSheet[];
  /** Charges utiles structurées dédiées au JSON (DTO, jamais des objets Drizzle). */
  jsonData?: unknown;
  /** Résumé affiché en fin de document et exporté en JSON. */
  summary?: DocumentField[];
}

/** Retour standard des actions serveur d'export. */
export interface DocumentPayloadResult {
  success: boolean;
  document?: DocumentModel;
  error?: string;
}

export function isDocumentFormat(value: string): value is DocumentFormat {
  return ["pdf", "xlsx", "csv", "json", "text"].includes(value);
}

export function emptyDocumentPayload(
  error: string,
): DocumentPayloadResult {
  return { success: false, error };
}
