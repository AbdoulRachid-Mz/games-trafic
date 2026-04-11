import { getTournamentById } from "@/actions/tournaments";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users2, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MembersList } from "./members-list";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Membres du tournoi | Games-Trafic",
  description: "Liste complète des membres et organisateurs du tournoi.",
};

export default async function TournamentMembersPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  
  const tournament = await getTournamentById(tournamentId);

  if (!tournament) {
    notFound();
  }

  const user = await getCurrentUser();
  const isOrganizer = user?.id === tournament.organizerId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
            asChild
          >
            <Link href={`/tournaments/${tournamentId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour au tournoi
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Users2 className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Membres & Staff</span>
              </div>
              <Typography variant="h2" weight="bold">
                Communauté du tournoi
              </Typography>
              <Typography variant="body-base" theme="muted" className="max-w-2xl">
                Découvrez tous les participants, co-organisateurs et l'équipe officielle qui font vivre <span className="text-foreground font-medium">{tournament.name}</span>.
              </Typography>
            </div>

            {isOrganizer && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Typography variant="body-sm" weight="bold">Espace Organisateur</Typography>
                  <Typography variant="caption2" theme="muted">Les outils de gestion sont actifs</Typography>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Members List with Filters (Client Component) */}
        <MembersList tournamentId={tournamentId} isOrganizer={isOrganizer} />
      </div>
    </div>
  );
}
