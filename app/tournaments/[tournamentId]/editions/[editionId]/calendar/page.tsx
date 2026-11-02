import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournamentEditionById, getTournamentById } from "@/actions/tournaments";
import { getCurrentUser } from "@/lib/auth/session";
import { EditionCalendarTimeline } from "./edition-calendar-timeline";
import Link from "next/link";
import { ArrowLeft, Calendar, Trophy, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ tournamentId: string; editionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { editionId } = await params;
  const edition = await getTournamentEditionById(editionId);
  return {
    title: `Calendrier - ${edition?.name || `Édition #${edition?.editionNumber}`} | Games-Trafics`,
    description: "Consultez le programme officiel des matchs par date, phase et groupe.",
    keywords: "matchs, calendrier, programme, esport, tournoi",
    robots: "index, follow",
  };
}

export default async function EditionCalendarPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;
  const user = await getCurrentUser();
  const [edition, tournament] = await Promise.all([
    getTournamentEditionById(editionId),
    getTournamentById(tournamentId),
  ]);

  if (!edition) notFound();

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Navigation retour */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}`}>
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;édition
          </Link>
        </Button>
      </div>

      {/* Hero Header du Calendrier */}
      <div className="bg-gradient-to-r from-card via-card/80 to-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase font-black tracking-wider text-[10px]">
              Programme Officiel
            </Badge>
            {tournament?.game && (
              <Badge variant="outline" className="border-white/10 gap-1 text-xs">
                <Gamepad2 className="w-3 h-3 text-primary" />
                {tournament.game}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-foreground">
            Calendrier des Rencontres
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {edition.name || `Édition #${edition.editionNumber}`} — {tournament?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="border-white/10 font-bold">
            <Link href={`/tournaments/${tournamentId}/editions/${editionId}?tab=matches`}>
              Voir tous les matchs
            </Link>
          </Button>
        </div>
      </div>

      {/* Timeline des matchs */}
      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-xl">
        <EditionCalendarTimeline editionId={editionId} currentUserId={user?.id} />
      </div>
    </div>
  );
}
