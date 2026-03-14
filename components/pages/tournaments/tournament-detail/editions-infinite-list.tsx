"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { EditionCard } from "@/components/pages/tournaments/editions/edition-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface EditionsInfiniteListProps {
  tournamentId: string;
  isDashboard?: boolean;
}

import { deleteTournamentEdition } from "@/actions/tournaments";
import { toast } from "sonner";

export function EditionsInfiniteList({
  tournamentId,
  isDashboard = false,
}: EditionsInfiniteListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["tournament-editions", tournamentId, statusFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const statusParam = statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
      const res = await fetch(
        `/api/tournaments/${tournamentId}/editions?page=${pageParam}&limit=10&sortBy=startDate&sortOrder=desc${statusParam}`,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette édition ?")) return;
    try {
      await deleteTournamentEdition(id);
      toast.success("Édition supprimée");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="UPCOMING">À venir</SelectItem>
              <SelectItem value="LIVE">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminé</SelectItem>
              <SelectItem value="CANCELLED">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isDashboard && (
          <Button asChild className="w-full sm:w-auto gap-2">
            <Link href={`/tournaments/${tournamentId}/dashboard/editions/create`}>
              <Plus className="h-4 w-4" />
              Créer une édition
            </Link>
          </Button>
        )}
      </div>

      {all.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-muted/20">
          <p className="text-muted-foreground">Aucune édition trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {all.map((ed: any) => (
            <EditionCard
              key={ed.id}
              edition={ed}
              tournamentId={tournamentId}
              isDashboard={isDashboard}
              onDelete={handleDelete}
              className="h-full"
            />
          ))}
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
