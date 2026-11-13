"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileJson,
  FileText,
  Loader2,
  Table as TableIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getBracketDocument } from "@/actions/documents";
import { downloadDocument } from "@/lib/documents/engine";
import type { DocumentFormat } from "@/lib/documents/types";

/**
 * Export d'un bracket.
 *
 * Le client n'envoie QUE l'identifiant de l'édition et de la phase : les
 * données, les autorisations et la mise en page sont produits côté serveur
 * par le moteur documentaire (`actions/documents.ts` → `lib/documents`).
 */

interface BracketExportButtonProps {
  editionId: string;
  phase: {
    id: string;
    name: string;
    phaseType?: string | null;
  };
  /** Sert uniquement à l'état vide de l'UI — jamais à construire l'export. */
  nodes?: unknown[];
}

export function BracketExportButton({
  editionId,
  phase,
  nodes = [],
}: BracketExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const isEmpty = nodes.length === 0;

  const handleExport = async (format: DocumentFormat) => {
    if (isExporting) return;

    if (!editionId) {
      toast.error("Export indisponible : édition non identifiée.");
      return;
    }

    setIsExporting(true);
    try {
      const result = await getBracketDocument(editionId, phase.id);
      if (!result.success || !result.document) {
        toast.error(result.error || "Export impossible.");
        return;
      }

      await downloadDocument(result.document, format);
      toast.success("Export généré avec succès.");
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isEmpty || isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isEmpty ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Aucun nœud à exporter
          </div>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => void handleExport("json")}
              className="gap-2 cursor-pointer"
              disabled={isExporting}
            >
              <FileJson className="h-4 w-4 text-amber-500" />
              Format JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleExport("xlsx")}
              className="gap-2 cursor-pointer"
              disabled={isExporting}
            >
              <TableIcon className="h-4 w-4 text-emerald-500" />
              Format Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleExport("pdf")}
              className="gap-2 cursor-pointer"
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 text-red-500" />
              Format PDF
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
