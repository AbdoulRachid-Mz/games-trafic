"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { MemberCard } from "@/components/cards/member-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { updateTournamentMemberRole, deleteTournamentMember } from "@/actions/tournaments";

interface MembersInfiniteListProps {
  tournamentId: string;
  isDashboard?: boolean;
  onUpdate?: () => void;
}

export function MembersInfiniteList({
  tournamentId,
  isDashboard = false,
  onUpdate,
}: MembersInfiniteListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["tournament-members", tournamentId, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";
      const res = await fetch(
        `/api/tournaments/${tournamentId}/members?page=${pageParam}&limit=12&sortBy=joinedAt&sortOrder=desc${searchParam}`,
        { cache: "no-store" }
      );
      return res.json();
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });

  useEffect(() => {
    if (isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, fetchNextPage]);

  const handleUpdateRole = async (memberId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "CO_ORGANIZER" ? "PARTICIPANT" : "CO_ORGANIZER";
      const isCoOrganizer = newRole === "CO_ORGANIZER";
      await updateTournamentMemberRole(memberId, newRole, isCoOrganizer);
      toast.success("Rôle mis à jour avec succès");
      refetch();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre ?")) return;
    try {
      await deleteTournamentMember(memberId);
      toast.success("Membre retiré avec succès");
      refetch();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erreur lors du retrait du membre");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive">Erreur de chargement des membres.</div>
    );
  }

  const all = data?.pages.flatMap((p: any) => p.data) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex justify-end gap-2 shrink-0">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-muted/20">
          <p className="text-muted-foreground">Aucun membre trouvé pour ce tournoi.</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-2"
          }
        >
          {all.map((m: any) => {
            const memberData = {
              ...m,
              user: {
                username: m.displayName || m.gameTag,
                avatar: m.avatar,
                ...m.user,
              },
            };

              return (
                <MemberCard
                  key={m.id}
                  item={memberData as any}
                  viewMode={viewMode}
                  userDisplay={isDashboard ? "organizer" : "member"}
                  onToggleCoOrganizer={isDashboard ? () => handleUpdateRole(m.id, m.role) : undefined}
                  onDelete={isDashboard ? () => handleDeleteMember(m.id) : undefined}
                  onViewProfile={isDashboard ? () => window.open(`/profile/${m.user?.username}`, "_blank") : undefined}
                />
              );
          })}
        </div>
      )}
      <div ref={ref} className="flex justify-center py-6 h-16">
        {isFetchingNextPage && (
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
      </div>
    </div>
  );
}
