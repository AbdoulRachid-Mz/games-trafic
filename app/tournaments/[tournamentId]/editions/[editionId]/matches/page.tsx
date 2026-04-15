// app/tournaments/[tournamentId]/editions/[editionId]/matches/page.tsx
import { Metadata } from "next";
import { EditionMatchesClient } from "./edition-matches-client";
import { getTournamentEditionWithRelations } from "@/actions/editions";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tournamentId, editionId } = await params;
  const edition = await getTournamentEditionWithRelations(editionId);
  
  return {
    title: `Matchs - ${edition?.name || `Édition ${edition?.editionNumber}`} | Game Trafics`,
    description: `Calendrier et résultats des matchs du tournoi`,
  };
}

export default async function EditionMatchesPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <EditionMatchesClient editionId={editionId} tournamentId={tournamentId} />
    </div>
  );
}