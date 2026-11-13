"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  File,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getShopClientsDocument,
  getShopOrdersDocument,
  getShopProductsDocument,
  getShopWalletDocument,
} from "@/actions/documents";
import { downloadDocument } from "@/lib/documents/engine";
import type {
  DocumentFormat,
  DocumentPayloadResult,
} from "@/lib/documents/types";

/**
 * Export documentaire d'une boutique.
 *
 * Le client ne transmet que l'identifiant de la boutique et le type de
 * document ; les données, la mise en page et la vérification de propriété
 * sont entièrement réalisées côté serveur (`actions/documents.ts`).
 */

export type ShopDocumentKind = "products" | "orders" | "clients" | "wallet";

const DOCUMENT_ACTIONS: Record<
  ShopDocumentKind,
  (shopId: string) => Promise<DocumentPayloadResult>
> = {
  products: getShopProductsDocument,
  orders: getShopOrdersDocument,
  clients: getShopClientsDocument,
  wallet: getShopWalletDocument,
};

const DOCUMENT_LABELS: Record<ShopDocumentKind, string> = {
  products: "Produits",
  orders: "Commandes",
  clients: "Clients",
  wallet: "Portefeuille",
};

const ALL_KINDS: ShopDocumentKind[] = [
  "products",
  "orders",
  "clients",
  "wallet",
];

const FORMATS: Array<{
  format: DocumentFormat;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    format: "xlsx",
    label: "Excel (XLSX)",
    icon: <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />,
  },
  {
    format: "csv",
    label: "CSV",
    icon: <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-500" />,
  },
  {
    format: "json",
    label: "JSON",
    icon: <FileJson className="h-4 w-4 mr-2 text-amber-500" />,
  },
  {
    format: "pdf",
    label: "PDF",
    icon: <FileText className="h-4 w-4 mr-2 text-red-500" />,
  },
];

export interface ShopExportButtonProps {
  shopId: string;
  /** Type de document ; absent = menu complet (produits, commandes, clients, portefeuille). */
  kind?: ShopDocumentKind;
  label?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function ShopExportButton({
  shopId,
  kind,
  label = "Exporter",
  variant = "outline",
  size = "sm",
  className,
}: ShopExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (
    documentKind: ShopDocumentKind,
    format: DocumentFormat,
  ) => {
    if (isExporting) return;
    if (!shopId) {
      toast.error("Boutique non identifiée.");
      return;
    }

    setIsExporting(true);
    try {
      const result = await DOCUMENT_ACTIONS[documentKind](shopId);
      if (!result.success || !result.document) {
        toast.error(result.error || "Export impossible.");
        return;
      }

      await downloadDocument(result.document, format);
      const count = result.document.meta.totalRecords ?? 0;
      toast.success(
        `${DOCUMENT_LABELS[documentKind]} — export ${format.toUpperCase()} réussi`,
        { description: `${count} ligne(s)` },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de générer le document.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const trigger = (
    <Button
      variant={variant}
      size={size}
      className={className ?? "gap-2"}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {kind ? (
          <>
            <DropdownMenuLabel className="text-xs">
              Format d&apos;export
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {FORMATS.map((entry) => (
              <DropdownMenuItem
                key={entry.format}
                onClick={() => void handleExport(kind, entry.format)}
                disabled={isExporting}
              >
                {entry.icon}
                {entry.label}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs">
              Documents de la boutique
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_KINDS.map((documentKind) => (
              <DropdownMenuSub key={documentKind}>
                <DropdownMenuSubTrigger>
                  <File className="h-4 w-4 mr-2 text-muted-foreground" />
                  {DOCUMENT_LABELS[documentKind]}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {FORMATS.map((entry) => (
                    <DropdownMenuItem
                      key={`${documentKind}-${entry.format}`}
                      onClick={() =>
                        void handleExport(documentKind, entry.format)
                      }
                      disabled={isExporting}
                    >
                      {entry.icon}
                      {entry.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
