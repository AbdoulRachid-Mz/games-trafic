"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditionsInfiniteList } from "@/components/pages/tournaments/tournament-detail/editions-infinite-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TournamentDashboardEditionsPage() {
  const params = useParams();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Éditions du tournoi</h2>
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${params.tournamentId}`}>Voir la page publique</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des éditions</CardTitle>
        </CardHeader>
        <CardContent>
          <EditionsInfiniteList tournamentId={params.tournamentId as string} />
        </CardContent>
      </Card>
    </div>
  );
}
