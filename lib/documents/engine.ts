import { DOCUMENT_FILE_EXTENSIONS, slugifyFilename } from "./format";
import { getDocumentTemplate, supportsDocumentFormat } from "./templates";
import type { DocumentFormat, DocumentModel } from "./types";

/**
 * lib/documents/engine.ts
 *
 * Point d'entrée UNIQUE de rendu et de téléchargement.
 *
 * - Le modèle est déjà construit et autorisé côté serveur.
 * - Les bibliothèques lourdes (jsPDF, XLSX, file-saver) sont importées
 *   dynamiquement : elles ne sont chargées que pour le format demandé.
 * - Aucun accès base de données, aucune règle métier ici.
 */

export class DocumentRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentRenderError";
  }
}

export interface RenderDocumentOptions {
  /** Logo déjà encodé en data URL ; sinon tentative de chargement navigateur. */
  logoDataUrl?: string;
}

export interface GeneratedDocument {
  blob: Blob;
  filename: string;
  mimeType: string;
}

const MIME_TYPES: Record<DocumentFormat, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv;charset=utf-8",
  json: "application/json;charset=utf-8",
  text: "text/plain;charset=utf-8",
};

export function getDocumentMimeType(format: DocumentFormat): string {
  return MIME_TYPES[format];
}

export function buildDocumentFilename(
  model: DocumentModel,
  format: DocumentFormat,
): string {
  const template = getDocumentTemplate(model.meta.type);
  const base = slugifyFilename(
    model.meta.filename || template.filenamePrefix,
    template.filenamePrefix,
  );
  return `${base}.${DOCUMENT_FILE_EXTENSIONS[format]}`;
}

async function tryLoadLogo(path?: string): Promise<string | undefined> {
  if (!path || typeof window === "undefined" || typeof fetch !== "function") {
    return undefined;
  }
  try {
    const response = await fetch(path);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Le logo est purement décoratif : son absence ne bloque jamais l'export.
    return undefined;
  }
}

export async function renderDocument(
  model: DocumentModel,
  format: DocumentFormat,
  options: RenderDocumentOptions = {},
): Promise<Blob> {
  if (!model || !model.meta || !model.brand) {
    throw new DocumentRenderError("Modèle documentaire invalide.");
  }
  if (!supportsDocumentFormat(model.meta.type, format)) {
    throw new DocumentRenderError(
      `Le format « ${format} » n'est pas pris en charge pour ce document.`,
    );
  }

  try {
    switch (format) {
      case "pdf": {
        const { renderPdf } = await import("./renderers/pdf");
        const logoDataUrl =
          options.logoDataUrl ?? (await tryLoadLogo(model.brand.logoPath));
        return await renderPdf(model, { logoDataUrl });
      }
      case "xlsx": {
        const { renderXlsx } = await import("./renderers/xlsx");
        return await renderXlsx(model);
      }
      case "csv": {
        const { renderCsv } = await import("./renderers/csv");
        return await renderCsv(model);
      }
      case "json": {
        const { renderJson } = await import("./renderers/json");
        return await renderJson(model);
      }
      case "text": {
        const { renderText } = await import("./renderers/text");
        return await renderText(model);
      }
      default:
        throw new DocumentRenderError("Format de document inconnu.");
    }
  } catch (error) {
    if (error instanceof DocumentRenderError) throw error;
    throw new DocumentRenderError(
      `La génération du document a échoué : ${
        error instanceof Error ? error.message : "erreur inconnue"
      }`,
    );
  }
}

export async function generateDocument(
  model: DocumentModel,
  format: DocumentFormat,
  options: RenderDocumentOptions = {},
): Promise<GeneratedDocument> {
  const blob = await renderDocument(model, format, options);
  return {
    blob,
    filename: buildDocumentFilename(model, format),
    mimeType: getDocumentMimeType(format),
  };
}

/**
 * Rend puis télécharge le document. Retourne le résultat pour permettre aux
 * appelants d'afficher un toast ou de journaliser l'export (jamais de secret).
 */
export async function downloadDocument(
  model: DocumentModel,
  format: DocumentFormat,
  options: RenderDocumentOptions = {},
): Promise<GeneratedDocument> {
  const generated = await generateDocument(model, format, options);
  const fileSaverModule: any = await import("file-saver");
  const saveAs =
    fileSaverModule.saveAs ?? fileSaverModule.default?.saveAs ?? fileSaverModule.default;
  if (typeof saveAs !== "function") {
    throw new DocumentRenderError("Le téléchargement de fichier est indisponible.");
  }
  saveAs(generated.blob, generated.filename);
  return generated;
}

/** Ouvre le document dans un nouvel onglet (aperçu PDF/HTML uniquement). */
export async function openDocumentPreview(
  model: DocumentModel,
  format: DocumentFormat,
  options: RenderDocumentOptions = {},
): Promise<void> {
  if (typeof window === "undefined") {
    throw new DocumentRenderError("L'aperçu nécessite un navigateur.");
  }
  const generated = await generateDocument(model, format, options);
  const url = URL.createObjectURL(generated.blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
