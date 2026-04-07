"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface MatchesDashboardFiltersProps {
  search?: string;
  status?: string;
  phaseId?: string;
}

export function MatchesDashboardFilters({ search, status, phaseId }: MatchesDashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = e.currentTarget.value;
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set("search", val);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val === "ALL") {
      params.delete("status");
    } else {
      params.set("status", val);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 w-full">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
          placeholder="Rechercher un participant..."
          defaultValue={search}
          onKeyDown={handleSearch}
        />
      </div>

      <select 
        className="h-10 px-3 rounded-md border border-input bg-background text-sm outline-none w-full sm:w-auto"
        defaultValue={status || "ALL"}
        onChange={handleStatusChange}
      >
        <option value="ALL">Tous les statuts</option>
        <option value="PENDING">En attente</option>
        <option value="IN_PROGRESS">En cours</option>
        <option value="COMPLETED">Terminé</option>
        <option value="PENDING_REVIEW">A valider</option>
        <option value="DISPUTED">Litige</option>
      </select>

      {phaseId && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleReset}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
