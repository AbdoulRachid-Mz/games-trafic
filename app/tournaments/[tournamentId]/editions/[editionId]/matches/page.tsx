// app/tournaments/[tournamentId]/editions/[editionId]/matches/page.tsx
import { Metadata } from "next";
import { EditionMatchesClient } from "./edition-matches-client";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    title: `Matchs & Résultats - ${edition?.name || `Édition #${edition?.editionNumber}`} | Games-Trafics`,
    description: `Consultez le calendrier, les scores et les résultats en direct des matchs de l'édition.`,
  };
}

export default async function EditionMatchesPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card/10 to-background pb-12">
      <div className="container mx-auto px-4 md:px-6 pt-6">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground mb-4">
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}`}>
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;édition
          </Link>
        </Button>
      </div>
      <EditionMatchesClient editionId={editionId} tournamentId={tournamentId} />
    </div>
  );
}
