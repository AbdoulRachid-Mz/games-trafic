// @/components/pages/tournaments/edition-detail/export-matches-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { getEditionMatchesDocument } from "@/actions/documents";
import { downloadDocument } from "@/lib/documents/engine";
import type { DocumentFormat } from "@/lib/documents/types";

/**
 * Export des matchs d'une édition.
 *
 * Le client ne fournit que des identifiants de filtres ; les données, les
 * libellés et les autorisations sont résolus côté serveur.
 */

interface ExportMatchesButtonProps {
  editionId: string;
  phaseId?: string;
  groupId?: string;
  bracketNodeId?: string;
}

type ExportScope = "all" | "phase" | "group" | "bracket";

export function ExportMatchesButton({
  editionId,
  phaseId,
  groupId,
  bracketNodeId,
}: ExportMatchesButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const searchParams = useSearchParams();

  const resolvedPhaseId = phaseId || searchParams.get("phaseId") || undefined;
  const resolvedGroupId = groupId || searchParams.get("groupId") || undefined;
  const resolvedBracketNodeId =
    bracketNodeId || searchParams.get("bracketNodeId") || undefined;

  const handleExport = async (format: DocumentFormat, scope: ExportScope) => {
    if (isExporting) return;

    const filters: {
      phaseId?: string;
      groupId?: string;
      bracketNodeId?: string;
    } = {};

    if (scope === "phase" && resolvedPhaseId) {
      filters.phaseId = resolvedPhaseId;
    } else if (scope === "group" && resolvedGroupId) {
      filters.groupId = resolvedGroupId;
    } else if (scope === "bracket" && resolvedBracketNodeId) {
      filters.bracketNodeId = resolvedBracketNodeId;
    }

    if (scope !== "all") {
      const hasFilter =
        filters.phaseId || filters.groupId || filters.bracketNodeId;
      if (!hasFilter) {
        toast.error("Aucun filtre actif pour cet export.");
        return;
      }
    }

    setIsExporting(true);
    try {
      const result = await getEditionMatchesDocument(editionId, filters);
      if (!result.success || !result.document) {
        toast.error(result.error || "Export impossible.");
        return;
      }

      await downloadDocument(result.document, format);
      const count = result.document.meta.totalRecords ?? 0;
      toast.success(`Export ${format.toUpperCase()} réussi`, {
        description: `${count} match(s) exporté(s)`,
      });
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

  const getScopeLabel = () => {
    if (resolvedBracketNodeId) return "ce bracket";
    if (resolvedGroupId) return "ce groupe";
    if (resolvedPhaseId) return "cette phase";
    return "tous les matchs";
  };

  const scopeOptions: Array<{ scope: ExportScope; label: string; enabled: boolean }> = [
    { scope: "all", label: "Tous les matchs", enabled: true },
    {
      scope: "phase",
      label: "Cette phase",
      enabled: Boolean(resolvedPhaseId),
    },
    {
      scope: "group",
      label: "Ce groupe",
      enabled: Boolean(resolvedGroupId),
    },
    {
      scope: "bracket",
      label: "Ce bracket",
      enabled: Boolean(resolvedBracketNodeId),
    },
  ];

  const renderFormatSub = (
    format: DocumentFormat,
    label: string,
    icon: React.ReactNode,
  ) => (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {icon}
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {scopeOptions
          .filter((option) => option.enabled)
          .map((option) => (
            <DropdownMenuItem
              key={`${format}-${option.scope}`}
              onClick={() => void handleExport(format, option.scope)}
              disabled={isExporting}
            >
              {label} - {option.label}
            </DropdownMenuItem>
          ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter {isExporting ? "..." : getScopeLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Format d&apos;export</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {renderFormatSub(
          "xlsx",
          "Excel",
          <FileSpreadsheet className="h-4 w-4 mr-2" />,
        )}
        {renderFormatSub(
          "csv",
          "CSV",
          <FileSpreadsheet className="h-4 w-4 mr-2" />,
        )}
        {renderFormatSub("json", "JSON", <FileJson className="h-4 w-4 mr-2" />)}
        {renderFormatSub("pdf", "PDF", <FileText className="h-4 w-4 mr-2" />)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
