import type {
  DocumentColumn,
  DocumentValueType,
} from "./types";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function formatDate(value: unknown): string {
  const date = toDate(value);
  return date ? DATE_FORMATTER.format(date) : "";
}

export function formatDateTime(value: unknown): string {
  const date = toDate(value);
  return date ? DATETIME_FORMATTER.format(date) : "";
}

export function formatNumber(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(number);
}

/**
 * Les montants de l'application ne sont pas tous des devises ISO 4217 (GTC).
 * On formate donc le nombre puis on suffixe la devise réelle fournie.
 */
export function formatAmount(value: unknown, currency?: string | null): string {
  const formatted = formatNumber(value);
  if (!formatted) return "";
  return currency ? `${formatted} ${currency}` : formatted;
}

export function formatPercentage(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(number)} %`;
}

export function formatBoolean(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return value ? "Oui" : "Non";
}

const LABELS: Record<string, Record<string, string>> = {
  transaction: {
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
  },
  transactionStatus: {
    PENDING: "En attente",
    COMPLETED: "Complétée",
    FAILED: "Échouée",
    CANCELLED: "Annulée",
    REFUNDED: "Remboursée",
    PROCESSING: "En traitement",
  },
  matchStatus: {
    PENDING: "Programmé",
    SCHEDULED: "Programmé",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminé",
    FINISHED: "Terminé",
    CANCELLED: "Annulé",
    FORFEIT: "Forfait",
    PENDING_REVIEW: "En attente de validation",
    AWAITING_ADMIN_CONFIRMATION: "Validation administrateur",
    DISPUTED: "Litige",
  },
  registrationStatus: {
    REGISTERED: "Inscrit",
    PARTICIPATED: "A participé",
    ELIMINATED: "Éliminé",
    QUALIFIED: "Qualifié",
    WINNER: "Vainqueur",
    DISQUALIFIED: "Disqualifié",
    WITHDRAWN: "Retiré",
  },
  orderStatus: {
    PENDING: "En attente",
    ACCEPTED_BY_SHOP: "Acceptée par la boutique",
    PROCESSING_BY_ADMIN: "En traitement (admin)",
    COMPLETED: "Terminée",
    REJECTED_BY_SHOP: "Refusée par la boutique",
    REJECTED_BY_ADMIN: "Refusée par l'administration",
    CANCELLED: "Annulée",
    REFUNDED: "Remboursée",
    DISPUTED: "Litige",
  },
  orderType: {
    PURCHASE: "Achat",
    EXCHANGE: "Échange",
    AUCTION: "Enchère",
    GIFT: "Cadeau",
  },
  productStatus: {
    NON_VENDU: "Disponible",
    RESERVE: "Réservé",
    EN_ECHANGE: "En échange",
    LIVRE: "Livré",
    VENDU: "Vendu",
    ANNULER: "Annulé",
    ACTIVE: "Actif",
    INACTIVE: "Inactif",
    ARCHIVED: "Archivé",
  },
  editionStatus: {
    UPCOMING: "À venir",
    ONGOING: "En cours",
    LIVE: "En direct",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
  },
};

export function labelFor(
  group: keyof typeof LABELS,
  value: unknown,
): string {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value);
  return LABELS[group]?.[raw] ?? raw.replaceAll("_", " ");
}

export function transactionTypeLabel(value: unknown): string {
  return labelFor("transaction", value);
}

export function transactionStatusLabel(value: unknown): string {
  return labelFor("transactionStatus", value);
}

export function matchStatusLabel(value: unknown): string {
  return labelFor("matchStatus", value);
}

export function registrationStatusLabel(value: unknown): string {
  return labelFor("registrationStatus", value);
}

/**
 * Convertit une valeur inconnue en chaîne sûre (jamais "[object Object]").
 */
export function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDateTime(value);
  if (typeof value === "object") return "";
  return String(value);
}

/**
 * Normalise le texte destiné à la police WinAnsi de jsPDF (Helvetica).
 * Les accents français sont conservés ; les caractères typographiques
 * exotiques sont convertis pour éviter tout rendu corrompu.
 */
export function toPdfSafeText(value: unknown): string {
  const text = toDisplayString(value);
  if (!text) return "";
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/\u0152/g, "OE")
    .replace(/\u0153/g, "oe")
    .replace(/\u20ac/g, "EUR")
    .replace(/[^\u0000-\u00ff]/g, "?");
}

export function formatColumnValue(
  value: unknown,
  column: Pick<DocumentColumn, "type" | "currency">,
): string {
  const type: DocumentValueType = column.type ?? "text";
  switch (type) {
    case "date":
      return formatDate(value);
    case "datetime":
      return formatDateTime(value);
    case "currency":
      return formatAmount(value, column.currency);
    case "number":
      return formatNumber(value);
    case "percentage":
      return formatPercentage(value);
    case "boolean":
      return formatBoolean(value);
    default:
      return toDisplayString(value);
  }
}

export function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

export function slugifyFilename(value: string, fallback = "document"): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

export const DOCUMENT_FILE_EXTENSIONS: Record<
  "pdf" | "xlsx" | "csv" | "json" | "text",
  string
> = {
  pdf: "pdf",
  xlsx: "xlsx",
  csv: "csv",
  json: "json",
  text: "txt",
};
