"use client";

import React, { useState, useEffect } from "react";
import { MemberCard } from "@/components/pages/tournaments/members/member-card";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { 
  Users2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  Crown,
  Gamepad2,
  Grid,
  List as ListIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getTournamentMembers } from "@/actions/members";
import { TournamentMember } from "@/database/schema";
import { PaginationResponse } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MembersListProps {
  tournamentId: string;
  isOrganizer?: boolean;
}

export function MembersList({ tournamentId, isOrganizer }: MembersListProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginationResponse<TournamentMember> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const filters: any = { tournamentId };
      if (roleFilter !== "ALL") {
        filters.role = roleFilter;
      }
      
      // Note: getTournamentMembers action handles name filtering if we pass it, 
      // but let's check if it supports 'displayName' or 'name'
      // For now, we'll do client-side search if the API doesn't support it well, 
      // but usually these actions support some kind of query.
      
      const res = await getTournamentMembers({
        pagination: { page: currentPage, limit: pageSize },
        filters,
      });
      setData(res);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [tournamentId, roleFilter, currentPage]);

  const members = data?.data || [];
  
  // Client-side search for smoother UX if data is small, otherwise should be server-side
  const filteredMembers = members.filter(member => 
    member.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.gameTag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeFiltersCount = (roleFilter !== "ALL" ? 1 : 0);

  const handleReset = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Users2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Typography variant="h4" weight="bold">Membres ({data?.pagination.total || 0})</Typography>
            <Typography variant="caption2" theme="muted">Gérez et consultez les participants du tournoi</Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
            <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <ResponsiveFilters
            type="dialog"
            title="Filtrer les membres"
            triggerLabel="Filtrer"
            activeFiltersCount={activeFiltersCount}
            onReset={handleReset}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher un membre..."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Typography variant="body-sm" weight="medium">Rôle</Typography>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les rôles</SelectItem>
                    <SelectItem value="ORGANIZER">Organisateur</SelectItem>
                    <SelectItem value="PARTICIPANT">Participant</SelectItem>
                    <SelectItem value="CO_ORGANIZER">Co-organisateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ResponsiveFilters>
        </div>
      </div>

      {loading ? (
        <div className={cn(
            "grid gap-4",
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className={cn("rounded-2xl", viewMode === "grid" ? "h-[280px]" : "h-20")} />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-card/50">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users2 className="h-10 w-10 text-muted-foreground opacity-20" />
          </div>
          <Typography variant="h4" weight="bold">Aucun membre trouvé</Typography>
          <Typography variant="body-base" theme="muted" className="max-w-xs mt-2">
            Essayez de modifier vos filtres ou effectuez une nouvelle recherche.
          </Typography>
          <Button variant="outline" className="mt-6" onClick={handleReset}>
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className={cn(
            "gap-4",
            viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "flex flex-col"
        )}>
          {filteredMembers.map((member) => (
            <MemberCard 
              key={member.id} 
              member={member} 
              viewMode={viewMode}
              isOrganizer={isOrganizer}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!data.pagination.hasPrev}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
          </Button>
          <div className="flex items-center gap-1">
            {[...Array(data.pagination.totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "ghost"}
                size="sm"
                className="w-9 h-9 rounded-xl"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(data.pagination.totalPages, prev + 1))}
            disabled={!data.pagination.hasNext}
            className="rounded-xl"
          >
            Suivant <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
