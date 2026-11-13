// @/components/pages/tournaments/edition-detail/matches-dashboard-filters.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, X, ArrowUpDown } from "lucide-react";
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
  sortBy?: string;
  sortOrder?: string;
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

const SORT_OPTIONS = [
  { value: "scheduledTime_asc", label: "Date ↑" },
  { value: "scheduledTime_desc", label: "Date ↓" },
  { value: "matchNumber_asc", label: "N° match ↑" },
  { value: "matchNumber_desc", label: "N° match ↓" },
  { value: "status_asc", label: "Statut ↑" },
  { value: "status_desc", label: "Statut ↓" },
];

export function MatchesDashboardFilters({
  search,
  status,
  phaseId,
  groupId,
  sortBy,
  sortOrder,
  phases = [],
  groups = [],
}: MatchesDashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Controlled search input with debounce 300ms
  const [searchValue, setSearchValue] = useState(search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync controlled value when URL changes externally
  useEffect(() => {
    setSearchValue(search ?? "");
  }, [search]);

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
    // Always reset pagination on filter change (unless explicitly changing page)
    if (!("page" in updates)) {
      params.set("page", "1");
    }
    // replace : les filtres ne doivent pas polluer l'historique de navigation.
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);

    // Debounce URL update by 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: val || null });
    }, 300);
  };

  const clearFilters = () => {
    setSearchValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.replace(pathname);
  };

  // Compute current sort composite value for the Select
  const currentSort =
    sortBy && sortOrder ? `${sortBy}_${sortOrder}` : "scheduledTime_asc";

  const handleSortChange = (value: string) => {
    const lastUnderscore = value.lastIndexOf("_");
    const newSortBy = value.slice(0, lastUnderscore);
    const newSortOrder = value.slice(lastUnderscore + 1);
    updateParams({ sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const hasActiveFilters = !!(
    search ||
    (status && status !== "ALL") ||
    phaseId ||
    groupId
  );

  return (
    <div className="space-y-3">
      {/* Main filter row — responsive: stacks on mobile, horizontal on desktop */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
            placeholder="Rechercher par joueur, équipe, code match..."
            value={searchValue}
            onChange={handleSearchChange}
          />
          {searchValue && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-destructive"
              onClick={() => {
                setSearchValue("");
                if (debounceRef.current) clearTimeout(debounceRef.current);
                updateParams({ search: null });
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <Select
          value={status || "ALL"}
          onValueChange={(value) =>
            updateParams({ status: value === "ALL" ? null : value })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phase filter */}
        {phases.length > 0 && (
          <Select
            value={phaseId || "ALL"}
            onValueChange={(value) =>
              updateParams({
                phaseId: value === "ALL" ? null : value,
                groupId: null,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les phases</SelectItem>
              {phases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Group filter (contextual) */}
        {phaseId && groups.length > 0 && (
          <Select
            value={groupId || "ALL"}
            onValueChange={(value) =>
              updateParams({ groupId: value === "ALL" ? null : value })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les groupes</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[150px] h-10">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10 gap-1 shrink-0"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Recherche: {search}
              <button
                onClick={() => {
                  setSearchValue("");
                  updateParams({ search: null });
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {status && status !== "ALL" && (
            <Badge variant="secondary" className="gap-1">
              Statut: {STATUS_LABELS[status] ?? status}
              <button
                onClick={() => updateParams({ status: null })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {groupId && (
            <Badge variant="secondary" className="gap-1">
              Groupe: {groups.find((g) => g.id === groupId)?.name ?? groupId}
              <button
                onClick={() => updateParams({ groupId: null })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {phaseId && phases.find((p) => p.id === phaseId) && (
            <Badge variant="secondary" className="gap-1">
              Phase: {phases.find((p) => p.id === phaseId)?.name}
              <button
                onClick={() => updateParams({ phaseId: null })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
