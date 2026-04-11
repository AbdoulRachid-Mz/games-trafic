import { getTournamentById } from "@/actions/tournaments";
import { EditionCard } from "@/components/pages/tournaments/editions/edition-card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { TournamentEdition } from "@/database/schema";

export default async function TournamentEditionsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  
  const tournament = await getTournamentById(tournamentId, { populate: ["editions"] });

  if (!tournament) {
    notFound();
  }

  const editions = (tournament.editions as TournamentEdition[]) || [];
  
  // Sorte editions by start date descending
  const sortedEditions = [...editions].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-primary/5"
                asChild
              >
                <Link href={`/tournaments/${tournamentId}`}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Retour au tournoi
                </Link>
              </Button>
            </div>
            <Typography variant="h2" weight="bold" className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Toutes les éditions
            </Typography>
            <Typography variant="body-base" theme="muted" className="max-w-2xl">
              Historique et éditions à venir du tournoi {tournament.name}.
            </Typography>
          </div>
          
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-lg px-4 py-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-bold">{editions.length}</span>
            <span className="text-muted-foreground text-sm">éditions au total</span>
          </div>
        </div>

        {sortedEditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl bg-card border-dashed">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-primary opacity-50" />
            </div>
            <Typography variant="h4" weight="bold" className="mb-2">Aucune édition</Typography>
            <Typography variant="body-base" theme="muted" className="max-w-sm">
              Ce tournoi ne possède pas encore d'éditions.
            </Typography>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedEditions.map((edition) => (
              <div key={edition.id} className="h-[320px]">
                <EditionCard
                  edition={edition}
                  tournamentId={tournamentId}
                  showDetails={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
