"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileJson, 
  FileText, 
  Table as TableIcon,
  ChevronDown
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

interface BracketExportButtonProps {
  phase: any;
  nodes: any[];
  tournamentName?: string;
}

export function BracketExportButton({ phase, nodes, tournamentName = "Tournoi" }: BracketExportButtonProps) {
  
  const exportToJSON = () => {
    try {
      const data = {
        phase: {
          id: phase.id,
          name: phase.name,
          type: phase.phaseType,
        },
        nodes: nodes.map(n => ({
          code: n.nodeCode,
          round: n.round,
          matchNumber: n.matchNumber,
          participants: n.metadata?.participants || [],
          status: n.isCompleted ? "Terminé" : "En cours",
        }))
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bracket-${phase.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("JSON exporté avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export JSON");
    }
  };

  const exportToExcel = () => {
    try {
      const rows = nodes.map(n => ({
        "Round": n.round,
        "Code Match": n.nodeCode,
        "Participant 1": n.metadata?.participants?.[0] || "TBD",
        "Participant 2": n.metadata?.participants?.[1] || "TBD",
        "Status": n.isCompleted ? "Terminé" : "En cours",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bracket");
      
      XLSX.writeFile(workbook, `bracket-${phase.name.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
      toast.success("Excel exporté avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text(`${tournamentName} - ${phase.name}`, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Type: ${phase.phaseType} | Date: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = nodes.map(n => [
        n.round,
        n.nodeCode,
        n.metadata?.participants?.[0] || "TBD",
        "vs",
        n.metadata?.participants?.[1] || "TBD",
        n.isCompleted ? "Terminé" : "En cours"
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Round', 'Match', 'Part. 1', '', 'Part. 2', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      });

      doc.save(`bracket-${phase.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("PDF exporté avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToJSON} className="gap-2 cursor-pointer">
          <FileJson className="h-4 w-4 text-amber-500" />
          Format JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <TableIcon className="h-4 w-4 text-emerald-500" />
          Format Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-500" />
          Format PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
