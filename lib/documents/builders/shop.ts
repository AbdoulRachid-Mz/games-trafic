import {
  labelFor,
  transactionStatusLabel,
  transactionTypeLabel,
} from "../format";
import type {
  DocumentColumn,
  DocumentField,
  DocumentModel,
  DocumentSection,
  DocumentTable,
} from "../types";
import {
  buildDocumentMeta,
  createDocument,
  currencyField,
  field,
  numberField,
} from "./common";
import type { BuildContext } from "./edition";

/* -------------------------------------------------------------------------- */
/* Types d'entrée                                                             */
/* -------------------------------------------------------------------------- */

export interface ShopInfo {
  id: string;
  name: string;
  ownerName?: string | null;
  country?: string | null;
  website?: string | null;
  verified?: boolean | null;
  createdAt?: Date | string | null;
}

export interface ShopProductRow {
  id: string;
  name: string;
  categoryName?: string | null;
  game?: string | null;
  platform?: string | null;
  price: number | string;
  currency?: string | null;
  status?: string | null;
  viewCount?: number | null;
  isActive?: boolean | null;
  createdAt?: Date | string | null;
}

export interface ShopOrderRow {
  id: string;
  reference?: string | null;
  createdAt?: Date | string | null;
  buyerName: string;
  productName: string;
  price: number | string;
  currency?: string | null;
  status?: string | null;
  orderType?: string | null;
}

export interface ShopClientRow {
  id: string;
  username: string;
  fullName?: string | null;
  email?: string | null;
  orderCount?: number | null;
  totalSpent?: number | string | null;
  lastOrderDate?: Date | string | null;
}

export interface ShopWalletRow {
  id: string;
  reference?: string | null;
  createdAt?: Date | string | null;
  type?: string | null;
  description?: string | null;
  amount: number | string;
  fees?: number | string | null;
  netAmount?: number | string | null;
  currency?: string | null;
  status?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function shopMetaFields(shop: ShopInfo): DocumentField[] {
  return [
    field("Boutique", shop.name),
    field("Propriétaire", shop.ownerName),
    field("Pays", shop.country),
    field("Site web", shop.website),
    field("Vérifiée", shop.verified, { type: "boolean" }),
    field("Créée le", shop.createdAt, { type: "date" }),
  ].filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== "");
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function productColumns(): DocumentColumn[] {
  return [
    { key: "name", label: "Produit", width: 2.4 },
    { key: "categoryName", label: "Catégorie", width: 1.4 },
    { key: "game", label: "Jeu", width: 1.2 },
    { key: "platform", label: "Plateforme", width: 1 },
    { key: "price", label: "Prix", type: "currency", align: "right", width: 1 },
    { key: "statusLabel", label: "Statut", width: 1.1 },
    { key: "viewCount", label: "Vues", type: "number", align: "right", width: 0.7 },
    { key: "createdAt", label: "Créé le", type: "date", width: 1.1 },
  ];
}

function orderColumns(): DocumentColumn[] {
  return [
    { key: "reference", label: "Référence", width: 1.1 },
    { key: "createdAt", label: "Date", type: "datetime", width: 1.3 },
    { key: "buyerName", label: "Acheteur", width: 1.5 },
    { key: "productName", label: "Produit", width: 2 },
    { key: "orderTypeLabel", label: "Type", width: 1 },
    { key: "price", label: "Montant", type: "currency", align: "right", width: 1 },
    { key: "statusLabel", label: "Statut", width: 1.1 },
  ];
}

function clientColumns(): DocumentColumn[] {
  return [
    { key: "username", label: "Client", width: 1.5 },
    { key: "fullName", label: "Nom complet", width: 1.7 },
    { key: "email", label: "Email", width: 2 },
    { key: "orderCount", label: "Commandes", type: "number", align: "right", width: 0.9 },
    { key: "totalSpent", label: "Total dépensé", type: "currency", align: "right", width: 1.2 },
    { key: "lastOrderDate", label: "Dernière commande", type: "datetime", width: 1.4 },
  ];
}

function walletColumns(): DocumentColumn[] {
  return [
    { key: "createdAt", label: "Date", type: "datetime", width: 1.3 },
    { key: "reference", label: "Référence", width: 1.2 },
    { key: "typeLabel", label: "Type", width: 1.2 },
    { key: "description", label: "Description", width: 2.2 },
    { key: "amount", label: "Montant", type: "currency", align: "right", width: 1 },
    { key: "fees", label: "Frais", type: "currency", align: "right", width: 0.9 },
    { key: "netAmount", label: "Net", type: "currency", align: "right", width: 1 },
    { key: "statusLabel", label: "Statut", width: 1.1 },
  ];
}

function createShopDocument(input: {
  type: "products-list" | "orders-list" | "shop-clients" | "shop-wallet" | "shop-report";
  title: string;
  filename: string;
  subject: string;
  shop: ShopInfo;
  columns: DocumentColumn[];
  rows: Array<Record<string, unknown>>;
  summary: DocumentField[];
  context?: BuildContext;
  jsonRows: unknown;
  extra?: DocumentSection[];
}): DocumentModel {
  const table: DocumentTable = { columns: input.columns, rows: input.rows };
  const sections: DocumentSection[] = [
    {
      kind: "badges",
      badges: [
        { label: input.title, tone: "info" },
        { label: `${input.rows.length} ligne${input.rows.length > 1 ? "s" : ""}`, tone: "neutral" },
      ],
    },
    { kind: "fields", title: "Boutique", fields: shopMetaFields(input.shop), columns: 2 },
    ...(input.extra ?? []),
    { kind: "table", title: input.title, table },
    { kind: "summary", title: "Synthèse", fields: input.summary },
  ];

  const meta = buildDocumentMeta({
    type: input.type,
    title: input.title,
    subtitle: input.shop.name,
    reference: `SHOP-${input.shop.id.slice(-6).toUpperCase()}`,
    generatedBy: input.context?.generatedBy,
    filters: input.context?.filters,
    totalRecords: input.rows.length,
    filename: input.filename,
    subject: input.subject,
  });

  return createDocument({
    meta,
    sections,
    primaryTable: table,
    jsonData: {
      shop: {
        id: input.shop.id,
        name: input.shop.name,
        ownerName: input.shop.ownerName ?? null,
        country: input.shop.country ?? null,
        verified: input.shop.verified ?? false,
      },
      data: input.jsonRows,
    },
    summary: input.summary,
  });
}

/* -------------------------------------------------------------------------- */
/* Produits                                                                   */
/* -------------------------------------------------------------------------- */

export function buildShopProductsDocument(input: {
  shop: ShopInfo;
  products: ShopProductRow[];
  context?: BuildContext;
}): DocumentModel {
  const { shop, products, context } = input;
  const rows = products.map((product) => ({
    ...product,
    categoryName: product.categoryName ?? "",
    game: product.game ?? "",
    platform: product.platform ?? "",
    statusLabel: labelFor("productStatus", product.status),
    viewCount: product.viewCount ?? 0,
    createdAt: product.createdAt ?? "",
  }));

  const available = products.filter(
    (product) => product.status === "NON_VENDU",
  ).length;
  const totalValue = products.reduce(
    (total, product) => total + toNumber(product.price),
    0,
  );
  const currency = products.find((product) => product.currency)?.currency ?? "GTC";

  return createShopDocument({
    type: "products-list",
    title: "Catalogue de produits",
    filename: `produits-${shop.name}`,
    subject: `Catalogue de produits — ${shop.name}`,
    shop,
    columns: productColumns(),
    rows,
    summary: [
      numberField("Produits", products.length),
      numberField("Disponibles", available),
      currencyField("Valeur du catalogue", totalValue, currency),
    ],
    context,
    jsonRows: products.map((product) => ({
      id: product.id,
      name: product.name,
      categoryName: product.categoryName ?? null,
      game: product.game ?? null,
      platform: product.platform ?? null,
      price: toNumber(product.price),
      currency: product.currency ?? null,
      status: product.status ?? null,
      viewCount: product.viewCount ?? 0,
      isActive: product.isActive ?? null,
      createdAt: product.createdAt ?? null,
    })),
  });
}

/* -------------------------------------------------------------------------- */
/* Commandes                                                                  */
/* -------------------------------------------------------------------------- */

export function buildShopOrdersDocument(input: {
  shop: ShopInfo;
  orders: ShopOrderRow[];
  context?: BuildContext;
}): DocumentModel {
  const { shop, orders, context } = input;
  const rows = orders.map((order) => ({
    ...order,
    reference: order.reference || `ORD-${order.id.slice(-8).toUpperCase()}`,
    statusLabel: labelFor("orderStatus", order.status),
    orderTypeLabel: order.orderType
      ? labelFor("orderType", order.orderType)
      : "Achat",
  }));

  const completed = orders.filter((order) => order.status === "COMPLETED");
  const revenue = completed.reduce(
    (total, order) => total + toNumber(order.price),
    0,
  );
  const currency = orders.find((order) => order.currency)?.currency ?? "GTC";

  return createShopDocument({
    type: "orders-list",
    title: "Commandes",
    filename: `commandes-${shop.name}`,
    subject: `Commandes — ${shop.name}`,
    shop,
    columns: orderColumns(),
    rows,
    summary: [
      numberField("Commandes", orders.length),
      numberField("Terminées", completed.length),
      currencyField("Chiffre d'affaires terminé", revenue, currency),
    ],
    context,
    jsonRows: orders.map((order) => ({
      id: order.id,
      reference: order.reference ?? null,
      createdAt: order.createdAt ?? null,
      buyerName: order.buyerName,
      productName: order.productName,
      price: toNumber(order.price),
      currency: order.currency ?? null,
      status: order.status ?? null,
      orderType: order.orderType ?? null,
    })),
  });
}

/* -------------------------------------------------------------------------- */
/* Clients                                                                    */
/* -------------------------------------------------------------------------- */

export function buildShopClientsDocument(input: {
  shop: ShopInfo;
  clients: ShopClientRow[];
  context?: BuildContext;
}): DocumentModel {
  const { shop, clients, context } = input;
  const rows = clients.map((client) => ({
    ...client,
    fullName: client.fullName ?? "",
    email: client.email ?? "",
    orderCount: client.orderCount ?? 0,
    totalSpent: toNumber(client.totalSpent),
    lastOrderDate: client.lastOrderDate ?? "",
  }));

  const totalSpent = clients.reduce(
    (total, client) => total + toNumber(client.totalSpent),
    0,
  );
  const orderCount = clients.reduce(
    (total, client) => total + (client.orderCount ?? 0),
    0,
  );

  return createShopDocument({
    type: "shop-clients",
    title: "Clients de la boutique",
    filename: `clients-${shop.name}`,
    subject: `Clients — ${shop.name}`,
    shop,
    columns: clientColumns(),
    rows,
    summary: [
      numberField("Clients", clients.length),
      numberField("Commandes", orderCount),
      currencyField("Total dépensé", totalSpent, "GTC"),
    ],
    context,
    jsonRows: clients.map((client) => ({
      id: client.id,
      username: client.username,
      fullName: client.fullName ?? null,
      email: client.email ?? null,
      orderCount: client.orderCount ?? 0,
      totalSpent: toNumber(client.totalSpent),
      lastOrderDate: client.lastOrderDate ?? null,
    })),
  });
}

/* -------------------------------------------------------------------------- */
/* Portefeuille                                                               */
/* -------------------------------------------------------------------------- */

export function buildShopWalletDocument(input: {
  shop: ShopInfo;
  entries: ShopWalletRow[];
  balance?: number | string | null;
  currency?: string | null;
  context?: BuildContext;
}): DocumentModel {
  const { shop, entries, context } = input;
  const currency =
    input.currency ?? entries.find((entry) => entry.currency)?.currency ?? "GTC";

  const rows = entries.map((entry) => ({
    ...entry,
    reference: entry.reference || `TX-${entry.id.slice(-8).toUpperCase()}`,
    typeLabel: transactionTypeLabel(entry.type),
    description: entry.description ?? "",
    fees: toNumber(entry.fees),
    netAmount: toNumber(entry.netAmount ?? entry.amount),
    statusLabel: transactionStatusLabel(entry.status),
  }));

  const completed = entries.filter((entry) => entry.status === "COMPLETED");
  const credited = completed
    .filter((entry) =>
      ["DEPOSIT", "TRANSFER", "ORDER_PURCHASE", "REFUND", "BONUS"].includes(
        entry.type ?? "",
      ),
    )
    .reduce((total, entry) => total + toNumber(entry.netAmount ?? entry.amount), 0);
  const debited = completed
    .filter(
      (entry) =>
        !["DEPOSIT", "TRANSFER", "ORDER_PURCHASE", "REFUND", "BONUS"].includes(
          entry.type ?? "",
        ),
    )
    .reduce((total, entry) => total + toNumber(entry.amount), 0);

  return createShopDocument({
    type: "shop-wallet",
    title: "Historique financier de la boutique",
    filename: `portefeuille-${shop.name}`,
    subject: `Historique financier — ${shop.name}`,
    shop,
    columns: walletColumns(),
    rows,
    summary: [
      ...(input.balance !== null && input.balance !== undefined
        ? [currencyField("Solde actuel", input.balance, currency)]
        : []),
      numberField("Opérations", entries.length),
      currencyField("Crédits terminés", credited, currency),
      currencyField("Débits terminés", debited, currency),
    ],
    context,
    jsonRows: entries.map((entry) => ({
      id: entry.id,
      reference: entry.reference ?? null,
      createdAt: entry.createdAt ?? null,
      type: entry.type ?? null,
      description: entry.description ?? null,
      amount: toNumber(entry.amount),
      fees: toNumber(entry.fees),
      netAmount: toNumber(entry.netAmount ?? entry.amount),
      currency: entry.currency ?? null,
      status: entry.status ?? null,
    })),
  });
}
