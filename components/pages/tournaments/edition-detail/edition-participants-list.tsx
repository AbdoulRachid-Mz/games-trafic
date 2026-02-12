"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/cards/member-card";

interface EditionParticipantsListProps {
  participants: any[];
}

export function EditionParticipantsList({
  participants,
}: EditionParticipantsListProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = participants.filter((reg) => {
    const member = reg.member;
    if (!member) return false;

    const teamName = member.team?.name || "";
    const displayName = member.displayName || "";
    const userName = member.user?.username || member.user?.fullName || "";

    const searchString = (teamName + displayName + userName).toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="text-xl font-bold">
          Participants ({participants.length})
        </h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 border rounded-lg p-0.5 bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
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
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-2"
          }
        >
          {filtered.map((reg) => (
            <MemberCard
              key={reg.id}
              member={reg.member}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
