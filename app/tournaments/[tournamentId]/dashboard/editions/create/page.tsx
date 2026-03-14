"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreateEditionForm } from "@/components/pages/tournaments/editions/create-edition-form";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getTournamentById } from "@/actions/tournaments";

export default function CreateTournamentEditionPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    getTournamentById(tournamentId, { populate: ["editions"] }).then((t) => {
      setTournament(t);
      setLoading(false);
    });
  }, [tournamentId]);

  if (loading || !tournament) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="h-[500px] w-full bg-muted rounded-xl" />
      </div>
    );
  }

  const nextEditionNumber = (tournament.editions?.length || 0) + 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Typography variant="h2" weight="bold">Créer une nouvelle édition</Typography>
          <Typography variant="body-sm" theme="muted">
            Ajoutez un nouvel événement pour le tournoi {tournament.name}
          </Typography>
        </div>
      </div>

      <CreateEditionForm 
        tournamentId={tournamentId} 
        nextEditionNumber={nextEditionNumber} 
      />
    </div>
  );
}
