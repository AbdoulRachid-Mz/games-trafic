"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  LayoutGrid,
  List,
  Download,
  FileText,
  FileDown,
  FileJson,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberCard } from "@/components/cards/member-card";
import { useEditionManager } from "@/hooks/use-edition-manager";
import { EditionBestPlayersStats } from "./edition-best-players-stats";
import { Star } from "lucide-react";

interface EditionParticipantsListProps {
  participants: any[];
  editionId: string;
}

export function EditionParticipantsList({
  participants,
  editionId,
}: EditionParticipantsListProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { exportParticipants } = useEditionManager(editionId);

  const filtered = participants.filter((reg) => {
    const member = reg.member;
    if (!member) return false;

    const teamName = member.team?.name || "";
    const displayName = member.displayName || "";
    const userName = member.user?.username || member.user?.fullName || "";

    const searchString = (teamName + displayName + userName).toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const handleExport = (format: "pdf" | "csv" | "json") => {
    exportParticipants.mutate(format);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Participants
            <Badge variant="secondary" className="rounded-full px-2.5">
              {participants.length}
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground">
            Liste des membres et équipes inscrits officiellement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px] lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un participant..."
              className="pl-9 bg-card h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1 border rounded-lg p-1 bg-card">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
              title="Vue Grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
              title="Vue Liste"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* <EditionBestPlayersStats 
            editionId={editionId}
            trigger={
              <Button variant="outline" size="sm" className="h-10 px-4 whitespace-nowrap gap-2 bg-card hover:bg-muted border-dashed border-primary/30">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="hidden sm:inline">Stats & Hall of Fame</span>
                <span className="sm:hidden text-xs">Stats</span>
              </Button>
            }
          /> */}

          <Select onValueChange={(val: string) => handleExport(val as any)}>
            <SelectTrigger className="h-10 px-4 w-full sm:w-[160px] bg-primary text-white hover:bg-primary/90 border-none shadow-sm">
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Exporter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-500" />
                  <span>Liste PDF</span>
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileDown className="h-4 w-4 text-green-500" />
                  <span>Format CSV</span>
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-blue-500" />
                  <span>Format JSON</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
          {participants.length === 0
            ? "Aucun participant inscrit pour le moment."
            : "Aucun participant ne correspond à votre recherche."}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
              : "flex flex-col gap-2"
          }
        >
          {filtered.map((reg) => (
            <MemberCard key={reg.id} member={reg.member} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
