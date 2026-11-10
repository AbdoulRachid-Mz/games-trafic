// @/components/pages/tournaments/edition-detail/matches-dashboard-filters.tsx
"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchesDashboardFiltersProps {
  search?: string;
  status?: string;
  phaseId?: string;
  groupId?: string;
  phases?: any[];
  /** Groupes de la phase active — prop groupes utilisée seulement ici. */
  groups?: any[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  PENDING_REVIEW: "À valider",
  AWAITING_ADMIN_CONFIRMATION: "Confirmation admin",
  DISPUTED: "Litige",
};

export function MatchesDashboardFilters({ 
  search, 
  status, 
  phaseId, 
  groupId, 
  phases = [],
  groups = [],
}: MatchesDashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Un changement de phase invalide le groupe courant.
    if ("phaseId" in updates && updates.phaseId) {
      params.delete("groupId");
    }
    params.set("page", "1");
    // replace : les filtres ne doivent pas polluer l'historique de navigation.
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      updateParams({ search: e.currentTarget.value || null });
    }
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = !!(search || (status && status !== "ALL") || phaseId || groupId);  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
            placeholder="Rechercher par joueur, équipe, code match..."
            defaultValue={search}
            onKeyDown={handleSearch}
          />
        </div>

        <Select
          defaultValue={status || "ALL"}
          onValueChange={(value) => updateParams({ status: value === "ALL" ? null : value })}
        >
          <SelectTrigger className="w-[160px] max-w-full h-10">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {phases.length > 0 && (
          <Select
            defaultValue={phaseId || "ALL"}
            onValueChange={(value) => updateParams({ phaseId: value === "ALL" ? null : value, groupId: null })}
          >
            <SelectTrigger className="w-[180px] max-w-full h-10">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les phases</SelectItem>
              {phases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {phaseId && groups.length > 0 && (
          <Select
            defaultValue={groupId || "ALL"}
            onValueChange={(value) => updateParams({ groupId: value === "ALL" ? null : value })}
          >
            <SelectTrigger className="w-[160px] max-w-full h-10">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les groupes</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 gap-1">
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Recherche: {search}
              <button onClick={() => updateParams({ search: null })} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(status && status !== "ALL") && (
            <Badge variant="secondary" className="gap-1">
              Statut: {STATUS_LABELS[status] ?? status}
              <button onClick={() => updateParams({ status: null })} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {groupId && (
            <Badge variant="secondary" className="gap-1">
              Groupe: {groups.find((g) => g.id === groupId)?.name ?? groupId}
              <button onClick={() => updateParams({ groupId: null })} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {phaseId && phases.find(p => p.id === phaseId) && (
            <Badge variant="secondary" className="gap-1">
              Phase: {phases.find(p => p.id === phaseId)?.name}
              <button onClick={() => updateParams({ phaseId: null })} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}