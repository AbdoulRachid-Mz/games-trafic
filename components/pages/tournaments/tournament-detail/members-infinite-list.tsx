"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { MemberCard } from "@/components/cards/member-card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

interface MembersInfiniteListProps {
  tournamentId: string;
}

export function MembersInfiniteList({
  tournamentId,
}: MembersInfiniteListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["tournament-members", tournamentId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/members?page=${pageParam}&limit=12&sortBy=joinedAt&sortOrder=desc`,
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive">Erreur de chargement des membres.</div>
    );
  }

  const all = data?.pages.flatMap((p: any) => p.data) || [];

  if (all.length === 0) {
    return (
      <div className="text-muted-foreground">Aucun membre pour ce tournoi.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
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

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-2"
        }
      >
        {all.map((m: any) => {
          // Normalize member data for the card
          const memberData = {
            ...m,
            user: {
              username: m.displayName || m.gameTag,
              avatar: m.avatar,
              ...m.user,
            },
          };

          return (
            <MemberCard key={m.id} member={memberData} viewMode={viewMode} />
          );
        })}
      </div>
      <div ref={ref} className="flex justify-center py-6 h-16">
        {isFetchingNextPage && (
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
      </div>
    </div>
  );
}
