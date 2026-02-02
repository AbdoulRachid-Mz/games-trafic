"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EditionsInfiniteListProps {
  tournamentId: string;
}

export function EditionsInfiniteList({ tournamentId }: EditionsInfiniteListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["tournament-editions", tournamentId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/editions?page=${pageParam}&limit=10&sortBy=startDate&sortOrder=desc`,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-destructive">Erreur de chargement des éditions.</div>;
  }

  const all = data?.pages.flatMap((p: any) => p.data) || [];

  if (all.length === 0) {
    return <div className="text-muted-foreground">Aucune édition disponible.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {all.map((ed: any) => (
          <Card key={ed.id} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{ed.name || `Édition ${ed.editionNumber}`}</CardTitle>
              <Badge variant="outline">{ed.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {ed.startDate
                    ? format(new Date(ed.startDate), "d MMM yyyy", { locale: fr })
                    : "Date non définie"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{ed.prizePool || "0"} GTC</span>
              </div>
              <div className="text-muted-foreground">
                Participants: {ed.currentParticipants || 0}/{ed.maxParticipants || "-"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div ref={ref} className="flex justify-center py-6 h-16">
        {isFetchingNextPage && <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
      </div>
    </div>
  );
}
