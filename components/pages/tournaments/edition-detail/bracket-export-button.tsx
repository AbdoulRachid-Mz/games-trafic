"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileJson,
  FileText,
  Table as TableIcon,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BracketNodeParticipant {
  registrationId?: string;
  displayName?: string;
  username?: string;
  teamName?: string;
}

interface BracketNodeMetadata {
  participants?: Array<BracketNodeParticipant | string>;
  winner?: string;
  [key: string]: unknown;
}

interface BracketNode {
  id: string;
  nodeCode?: string | null;
  round?: number | null;
  matchNumber?: number | null;
  isCompleted?: boolean | null;
  metadata?: BracketNodeMetadata;
}

interface BracketExportButtonProps {
  phase: {
    id: string;
    name: string;
    phaseType?: string | null;
  };
  /** Accept any DB row shape — metadata is typed as unknown in drizzle jsonb columns */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: any[];
  tournamentName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves a participant entry to a human-readable name.
 * BracketNode.metadata.participants can be:
 *   - A string (legacy UUID / registrationId) — shown as "Participant" fallback
 *   - An object with displayName / username / teamName
 */
function resolveParticipantName(
  participant: BracketNodeParticipant | string | undefined,
  index: number
): string {
  if (!participant) return "TBD";

  if (typeof participant === "string") {
    // Legacy: raw UUID or already a name. UUIDs are 36 chars with dashes.
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(participant)) {
      // Raw UUID — cannot resolve without a DB call; show a clear placeholder
      return `Participant ${index + 1}`;
    }
    return participant;
  }

  return (
    participant.displayName ||
    participant.username ||
    participant.teamName ||
    `Participant ${index + 1}`
  );
}

function getNodeParticipants(node: BracketNode): [string, string] {
  const participants = node.metadata?.participants ?? [];
  return [
    resolveParticipantName(participants[0], 0),
    resolveParticipantName(participants[1], 1),
  ];
}

function getStatusLabel(node: BracketNode): string {
  return node.isCompleted ? "Terminé" : "En cours";
}

function getSafeFileName(name: string | null | undefined): string {
  return (name ?? "bracket").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BracketExportButton({
  phase,
  nodes,
  tournamentName = "Tournoi",
}: BracketExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const isEmpty = nodes.length === 0;
  const safePhaseName = getSafeFileName(phase.name);

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        tournament: tournamentName,
        phase: {
          id: phase.id,
          name: phase.name,
          type: phase.phaseType,
        },
        nodes: nodes.map((n) => {
          const [p1, p2] = getNodeParticipants(n);
          return {
            code: n.nodeCode,
            round: n.round,
            matchNumber: n.matchNumber,
            participant1: p1,
            participant2: p2,
            status: getStatusLabel(n),
          };
        }),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bracket-${safePhaseName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("JSON exporté avec succès");
    } catch {
      toast.error("Erreur lors de l'export JSON");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const rows = nodes.map((n) => {
        const [p1, p2] = getNodeParticipants(n);
        return {
          Round: n.round ?? "",
          "Code Match": n.nodeCode ?? "",
          "Participant 1": p1,
          "Participant 2": p2,
          Statut: getStatusLabel(n),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-size columns
      const maxLens = Object.keys(rows[0] ?? {}).map((key) =>
        Math.max(key.length, ...rows.map((r) => String((r as any)[key] ?? "").length))
      );
      worksheet["!cols"] = maxLens.map((w) => ({ wch: Math.min(w + 2, 40) }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bracket");

      XLSX.writeFile(workbook, `bracket-${safePhaseName}.xlsx`);
      toast.success("Excel exporté avec succès");
    } catch {
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(`${tournamentName} — ${phase.name}`, 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `Type : ${phase.phaseType ?? "—"} | Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
        14,
        30
      );

      const tableData = nodes.map((n) => {
        const [p1, p2] = getNodeParticipants(n);
        return [n.round ?? "", n.nodeCode ?? "", p1, "vs", p2, getStatusLabel(n)];
      });

      autoTable(doc, {
        startY: 38,
        head: [["Round", "Match", "Participant 1", "", "Participant 2", "Statut"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
        columnStyles: {
          3: { halign: "center", fontStyle: "bold" },
        },
      });

      doc.save(`bracket-${safePhaseName}.pdf`);
      toast.success("PDF exporté avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export PDF");
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
          <ChevronDown className="h-3 w-3 opacity-50" />
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
              onClick={exportToJSON}
              className="gap-2 cursor-pointer"
              disabled={isExporting}
            >
              <FileJson className="h-4 w-4 text-amber-500" />
              Format JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={exportToExcel}
              className="gap-2 cursor-pointer"
              disabled={isExporting}
            >
              <TableIcon className="h-4 w-4 text-emerald-500" />
              Format Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={exportToPDF}
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
