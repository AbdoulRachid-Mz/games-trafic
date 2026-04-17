// @/components/pages/tournaments/edition-detail/export-matches-button.tsx
"use client";

import { useState, useTransition } from "react";
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
import { Download, FileSpreadsheet, FileJson, FileText, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportMatchesToFormat, type ExportFormat } from "@/actions/editions";
import { useSearchParams } from "next/navigation";

interface ExportMatchesButtonProps {
  editionId: string;
  phaseId?: string;
  groupId?: string;
  bracketNodeId?: string;
}

export function ExportMatchesButton({ editionId, phaseId, groupId, bracketNodeId }: ExportMatchesButtonProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const handleExport = async (format: ExportFormat, scope: "all" | "phase" | "group" | "bracket") => {
    let filters: any = { editionId };
    
    if (scope === "phase") {
      filters.phaseId = phaseId || searchParams.get("phaseId") || undefined;
    } else if (scope === "group") {
      filters.groupId = groupId || searchParams.get("groupId") || undefined;
    } else if (scope === "bracket") {
      filters.bracketNodeId = bracketNodeId || searchParams.get("bracketNodeId") || undefined;
    }

    startTransition(async () => {
      try {
        const { exportData: exportToFormat, createExportData } = await import("@/utils/export-utils");
        
        const result = await exportMatchesToFormat(editionId, format, filters);
        
        if (result.success && result.data) {
          const rawData = JSON.parse(result.data);
          const config = {
            filename: result.filename || `matches_${scope}_${editionId}`,
            title: scope === "all" ? "Tous les matchs" : `Matchs - ${scope}`,
            subtitle: `Édition: ${editionId.slice(0, 8)}`,
          };

          const tableData = createExportData(rawData, "matches");
          await exportToFormat(format, tableData, config);

          toast.success(`Export ${format.toUpperCase()} réussi`, {
            description: `${result.count || rawData.length} matchs exportés`
          });
        } else {
          toast.error(result.error || "Erreur lors de l'export");
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'export");
      }
    });
  };

  const getScopeLabel = () => {
    if (bracketNodeId || searchParams.get("bracketNodeId")) return "ce bracket";
    if (groupId || searchParams.get("groupId")) return "ce groupe";
    if (phaseId || searchParams.get("phaseId")) return "cette phase";
    return "tous les matchs";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exporter {isPending ? "..." : getScopeLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel / CSV
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleExport("excel", "all")}>
              Excel - Tous les matchs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel", "phase")}>
              Excel - {phaseId ? "Cette phase" : "Phase filtrée"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel", "group")}>
              Excel - {groupId ? "Ce groupe" : "Groupe filtré"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv", "all")}>
              CSV - Tous les matchs
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileJson className="h-4 w-4 mr-2" />
            JSON
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleExport("json", "all")}>
              JSON - Tous les matchs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json", "phase")}>
              JSON - Cette phase
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json", "group")}>
              JSON - Ce groupe
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleExport("pdf", "all")}>
              PDF - Tous les matchs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf", "phase")}>
              PDF - Cette phase
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf", "group")}>
              PDF - Ce groupe
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}