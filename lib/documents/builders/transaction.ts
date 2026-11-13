import {
  transactionStatusLabel,
  transactionTypeLabel,
} from "../format";
import type {
  DocumentField,
  DocumentModel,
  DocumentSection,
} from "../types";
import {
  buildDocumentMeta,
  createDocument,
  currencyField,
  dateField,
  field,
} from "./common";

export interface TransactionReceiptInput {
  transactionId: string;
  reference?: string | null;
  type: string;
  status: string;
  amount: number | string;
  fees?: number | string | null;
  netAmount?: number | string | null;
  currency?: string | null;
  balanceAfter?: number | string | null;
  createdAt: Date | string;
  completedAt?: Date | string | null;
  description?: string | null;
  userName?: string | null;
  senderName?: string | null;
  recipientName?: string | null;
  metadata?: Record<string, unknown> | null;
  entity?: Record<string, unknown> | null;
}

type Metadata = Record<string, unknown>;

function asMetadata(value: unknown): Metadata {
  return value && typeof value === "object" ? (value as Metadata) : {};
}

function pickString(record: Metadata, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function pickNumber(record: Metadata, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function pickStringList(record: Metadata, ...keys: string[]): string[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value
        .map((entry) =>
          typeof entry === "string"
            ? entry
            : typeof entry === "object" && entry
              ? pickString(entry as Metadata, "name", "label", "title")
              : null,
        )
        .filter((entry): entry is string => Boolean(entry));
    }
  }
  return [];
}

function maskAccount(value: string | null): string | null {
  if (!value) return null;
  const compact = value.replace(/\s+/g, "");
  if (compact.length <= 4) return `•••• ${compact}`;
  return `•••• ${compact.slice(-4)}`;
}

function resolveEntity(input: TransactionReceiptInput, metadata: Metadata) {
  const metadataEntity = asMetadata(metadata.entity);
  const entityData = asMetadata(metadata.entityData);
  const direct = asMetadata(input.entity);
  return { ...entityData, ...metadataEntity, ...direct };
}

function isCredit(type: string): boolean {
  return ["DEPOSIT", "BONUS", "REFUND"].includes(type);
}

function buildTypeSections(
  type: string,
  metadata: Metadata,
  entity: Metadata,
  input: TransactionReceiptInput,
): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const currency = input.currency || "GTC";
  const isObjectEmpty = Object.keys(entity).length === 0;

  const addFields = (title: string, fields: DocumentField[]) => {
    const visible = fields.filter(
      (entry) => !entry.hideWhenEmpty || (entry.value !== null && entry.value !== undefined && entry.value !== ""),
    );
    if (visible.length > 0) {
      sections.push({ kind: "fields", title, fields: visible, columns: 2 });
    }
  };

  switch (type) {
    case "DEPOSIT": {
      addFields("Détails du dépôt", [
        field("Montant reçu", pickNumber(metadata, "amountReal", "receivedAmount"), { type: "currency", currency: pickString(metadata, "currencyReal") || currency }),
        field("Devise d'origine", pickString(metadata, "currencyReal", "originCurrency")),
        field("Montant converti", pickNumber(metadata, "amountGTC", "convertedAmount"), { type: "currency", currency }),
        field("Taux de conversion", pickNumber(metadata, "exchangeRate", "conversionRate"), { type: "number" }),
        field("Moyen de paiement", pickString(metadata, "paymentMethod", "method")),
        field("Fournisseur", pickString(metadata, "paymentProvider", "provider")),
        field("Référence de paiement", pickString(metadata, "paymentReference", "providerReference")),
        dateField("Date de validation", pickString(metadata, "validatedAt", "completedAt")),
      ]);
      break;
    }
    case "WITHDRAWAL": {
      addFields("Détails du retrait", [
        field("Moyen de retrait", pickString(metadata, "paymentMethod", "method")),
        field("Fournisseur", pickString(metadata, "paymentProvider", "provider")),
        field("Destination", maskAccount(pickString(metadata, "paymentAccountId", "destinationAccount", "accountNumber"))),
        field("Référence de traitement", pickString(metadata, "paymentReference", "providerReference")),
        dateField("Date de traitement", pickString(metadata, "processedAt", "completedAt")),
      ]);
      break;
    }
    case "TRANSFER": {
      addFields("Détails du transfert", [
        field("Expéditeur", input.senderName || pickString(metadata, "senderName", "fromName")),
        field("Destinataire", input.recipientName || pickString(metadata, "recipientName", "toName")),
        field("Référence", input.reference || pickString(metadata, "reference", "transferReference")),
        dateField("Date", input.createdAt),
      ]);
      break;
    }
    case "ORDER_PURCHASE": {
      const quantity = pickNumber(metadata, "quantity", "qty");
      const unitPrice = pickNumber(metadata, "unitPrice", "price");
      const subtotal = pickNumber(metadata, "subtotal");
      addFields("Détails de la commande", [
        field("Produit", pickString(entity, "name", "title") || pickString(metadata, "productName", "itemName")),
        field("Boutique", pickString(entity, "shopName") || pickString(metadata, "shopName", "shop")),
        field("Vendeur", pickString(metadata, "sellerName", "seller")),
        field("Référence commande", pickString(metadata, "orderReference", "orderId")),
        quantity !== null ? field("Quantité", quantity, { type: "number" }) : field("Quantité", null),
        unitPrice !== null ? currencyField("Prix unitaire", unitPrice, currency) : field("Prix unitaire", null),
        subtotal !== null ? currencyField("Sous-total", subtotal, currency) : field("Sous-total", null),
        field("Statut commande", pickString(metadata, "orderStatus")),
        field("Statut paiement", pickString(metadata, "paymentStatus")),
      ]);
      break;
    }
    case "GAME_ITEM_PURCHASE": {
      addFields("Détails de l'item", [
        field("Jeu", pickString(entity, "game") || pickString(metadata, "game", "gameName")),
        field("Item", pickString(entity, "name", "title") || pickString(metadata, "itemName", "name")),
        field("Type", pickString(entity, "itemType") || pickString(metadata, "itemType", "type")),
        field("Quantité", pickNumber(metadata, "quantity", "qty"), { type: "number" }),
        currencyField("Prix unitaire", pickNumber(metadata, "unitPrice", "price"), currency),
        field("Vendeur", pickString(metadata, "sellerName", "seller")),
        field("Référence", pickString(metadata, "itemReference", "reference")),
      ]);
      break;
    }
    case "THEME_PURCHASE": {
      addFields("Détails du thème", [
        field("Thème", pickString(entity, "name", "title") || pickString(metadata, "themeName")),
        field("Catégorie", pickString(entity, "category") || pickString(metadata, "category")),
        pickNumber(entity, "price") !== null ? currencyField("Prix", pickNumber(entity, "price"), pickString(entity, "currency") || currency) : field("Prix", null),
        field("Licence", pickString(metadata, "licenseType", "license")),
        dateField("Date d'acquisition", input.completedAt || input.createdAt),
      ]);
      break;
    }
    case "VIP_SUBSCRIPTION": {
      addFields("Détails de l'abonnement", [
        field("Plan", pickString(metadata, "planName", "plan")),
        field("Durée", pickString(metadata, "durationLabel", "duration")),
        dateField("Début", pickString(metadata, "startDate", "startedAt")),
        dateField("Fin", pickString(metadata, "endDate", "expiresAt")),
        field("Renouvellement", pickString(metadata, "renewal", "renewalMode")),
        pickStringList(metadata, "benefits", "advantages").length > 0
          ? field("Avantages", pickStringList(metadata, "benefits", "advantages").join(", "))
          : field("Avantages", null),
        field("Statut abonnement", pickString(metadata, "subscriptionStatus")),
      ]);
      break;
    }
    case "TOURNAMENT_PARTICIPATION": {
      addFields("Détails de la participation", [
        field("Tournoi", pickString(entity, "name", "title") || pickString(metadata, "tournamentName")),
        field("Jeu", pickString(entity, "game") || pickString(metadata, "game", "gameName")),
        field("Édition", pickString(metadata, "editionName", "edition")),
        field("Numéro d'édition", pickNumber(metadata, "editionNumber"), { type: "number" }),
        field("Organisateur", pickString(metadata, "organizerName", "organizer")),
        field("Participant", pickString(metadata, "participantName") || input.userName),
        field("Équipe", pickString(metadata, "teamName", "team")),
        currencyField("Frais d'inscription", pickNumber(metadata, "registrationFee", "entryFee"), currency),
        field("Statut d'inscription", pickString(metadata, "registrationStatus")),
        field("Statut du paiement", pickString(metadata, "paymentStatus")),
      ]);
      break;
    }
    case "REFUND":
    case "BONUS": {
      addFields(type === "REFUND" ? "Détails du remboursement" : "Détails du bonus", [
        field("Motif", pickString(metadata, "refundReason", "bonusReason", "reason")),
        field("Source", pickString(metadata, "bonusSource", "source")),
        field("Transaction d'origine", pickString(metadata, "originalTransactionId", "originalTransaction")),
        dateField("Date", input.completedAt || input.createdAt),
      ]);
      break;
    }
    default: {
      if (!isObjectEmpty) {
        addFields("Détails", [
          field("Élément", pickString(entity, "name", "title") || pickString(metadata, "entityName")),
          field("Description", pickString(entity, "description")),
        ]);
      }
      break;
    }
  }

  return sections;
}

export function buildTransactionReceiptDocument(
  input: TransactionReceiptInput,
): DocumentModel {
  const metadata = asMetadata(input.metadata);
  const entity = resolveEntity(input, metadata);
  const typeLabel = transactionTypeLabel(input.type);
  const currency = input.currency || "GTC";
  const reference = input.reference || `TX-${input.transactionId.slice(-8)}`;

  const generalFields: DocumentField[] = [
    field("Référence", reference),
    field("Identifiant transaction", input.transactionId),
    dateField("Date", input.createdAt),
    dateField("Validation", input.completedAt),
    field("Type", typeLabel),
    field("Statut", transactionStatusLabel(input.status)),
    field("Utilisateur", input.userName),
  ].filter(
    (entry) => entry.value !== null && entry.value !== undefined && entry.value !== "",
  );

  const amountFields: DocumentField[] = [
    currencyField("Montant", input.amount, currency),
    currencyField("Frais", input.fees, currency),
    currencyField("Montant net", input.netAmount, currency),
    isCredit(input.type)
      ? currencyField("Montant crédité", input.netAmount, currency)
      : currencyField("Montant débité", input.amount, currency),
    currencyField("Solde après opération", input.balanceAfter, currency),
  ].filter(
    (entry) => entry.value !== null && entry.value !== undefined && entry.value !== "",
  );

  const description =
    input.description || pickString(metadata, "description", "notes", "motif");

  const sections: DocumentSection[] = [
    {
      kind: "badges",
      badges: [
        { label: typeLabel, tone: "info" },
        {
          label: transactionStatusLabel(input.status) || input.status,
          tone:
            input.status === "COMPLETED"
              ? "success"
              : input.status === "FAILED" || input.status === "CANCELLED"
                ? "danger"
                : input.status === "PENDING"
                  ? "warning"
                  : "neutral",
        },
      ],
    },
    { kind: "fields", title: "Informations générales", fields: generalFields, columns: 2 },
    ...buildTypeSections(input.type, metadata, entity, input),
    { kind: "summary", title: "Montants", fields: amountFields },
  ];

  if (description) {
    sections.push({ kind: "text", title: "Description", text: description });
  }

  const meta = buildDocumentMeta({
    type: "transaction-receipt",
    title: "Reçu de transaction",
    subtitle: typeLabel,
    reference,
    generatedAt: new Date(),
    filename: `recu-${reference.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`,
    totalRecords: 1,
  });

  const primaryTable = {
    columns: [
      { key: "label", label: "Élément" },
      { key: "value", label: "Valeur" },
    ],
    rows: [...generalFields, ...amountFields].map((entry) => ({
      label: entry.label,
      value: entry.value,
    })),
  };

  return createDocument({
    meta,
    sections,
    primaryTable,
    jsonData: {
      transactionId: input.transactionId,
      reference,
      type: input.type,
      typeLabel,
      status: input.status,
      statusLabel: transactionStatusLabel(input.status),
      amount: input.amount,
      fees: input.fees ?? null,
      netAmount: input.netAmount ?? null,
      currency,
      balanceAfter: input.balanceAfter ?? null,
      description: description ?? null,
      createdAt: input.createdAt,
      completedAt: input.completedAt ?? null,
      userName: input.userName ?? null,
      senderName: input.senderName ?? null,
      recipientName: input.recipientName ?? null,
    },
    summary: amountFields,
  });
}
