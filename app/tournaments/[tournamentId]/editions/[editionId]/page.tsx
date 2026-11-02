import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditionPageContent } from "@/components/pages/tournaments/edition-detail/edition-page-content";
import { TournamentMember } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getTournamentEditionWithRelations, getEditionActivePhase } from "@/actions/editions";
import { getTournamentById, getTournamentEditionById, getTournamentMembers } from "@/actions/tournaments";
import { getTournamentPhases, getEditionRecentMatches } from "@/actions/phases";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { editionId } = await params;
  const edition = await getTournamentEditionById(editionId);
  return {
    title: edition
      ? `${edition.name || `Édition #${edition.editionNumber}`} | Games-Trafics Compétitions`
      : "Édition Inconnue | Games-Trafics",
    description: edition
      ? `Participez et suivez les rencontres de ${edition.name || `l'Édition #${edition.editionNumber}`} sur Games-Trafics.`
      : "Détails de l'édition du tournoi",
    keywords: "tournoi, édition, esport, gaming, matchs, bracket, classement",
    robots: "index, follow",
  };
}

export default async function EditionPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;
  const user = await getCurrentUser();

  const [tournament, editionWithRelations] = await Promise.all([
    getTournamentById(tournamentId),
    getTournamentEditionWithRelations(editionId),
  ]);

  if (!tournament || !editionWithRelations) {
    notFound();
  }

  const edition = editionWithRelations;

  // 1. Phases & Active Phase Logic
  const activePhase = await getEditionActivePhase(editionId);
  const phasesResponse = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const phases = phasesResponse.data || edition.phases;

  // 2. Vérifier si l'utilisateur est organisateur
  const isOrganizer = !!(user && tournament.organizerId === user.id);

  // 3. Vérifier si l'utilisateur est membre du tournoi et son inscription
  let currentUserMember: TournamentMember | undefined;
  let currentUserRegistration: any = undefined;

  if (user) {
    const memberResponse = await getTournamentMembers({
      filters: { tournamentId, userId: user.id },
      pagination: { limit: 1, page: 1 },
    });

    const member = memberResponse.data[0];
    if (member) {
      currentUserMember = member;

      const existingRegistration = edition.registrations?.find(
        (reg) => reg.memberId === member.id
      );
      if (existingRegistration) {
        currentUserRegistration = existingRegistration;
      }
    }
  }

  const entryFee = Number(edition.entryFee || "0");
  const isFree = entryFee === 0;
  const isRegistered = !!currentUserRegistration;
  const hasPaid = currentUserRegistration?.feePaid ?? false;
  const showQR = !isFree && isRegistered && !hasPaid;

  // 4. Matchs récents pour le ticker
  const recentMatches = await getEditionRecentMatches(editionId);

  return (
    <div className="w-full">
      <EditionPageContent
        tournament={tournament}
        edition={edition}
        phases={phases || edition.phases}
        activePhaseId={activePhase?.id}
        currentUserMember={currentUserMember}
        currentUserRegistration={currentUserRegistration}
        isOrganizer={isOrganizer}
        recentMatches={recentMatches}
      />

      {/* Bannière de paiement QR code pour les inscrits en attente de paiement */}
      {showQR && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm animate-in slide-in-from-bottom-6">
          <Card className="bg-card/95 backdrop-blur-2xl border-primary/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <CardContent className="p-5 flex flex-col items-center">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 uppercase font-black tracking-wider text-[10px] mb-2">
                Paiement Requis
              </Badge>
              <Typography variant="h5" className="font-black italic tracking-tight text-center mb-1">
                Réglez vos frais d&apos;inscription
              </Typography>
              <Typography variant="caption1" theme="muted" className="mb-3 text-center">
                Scannez pour régler {edition.entryFee} {edition.prizeCurrency || "GTC"}
              </Typography>
              <TransactionQRCode
                data={encodeTransactionQR({
                  t: "TOURNAMENT_PARTICIPATION",
                  id: edition.id,
                  a: entryFee,
                  i: tournament.profileImage || "/icons/tournament-500.png",
                  m: { tournamentId, editionNumber: edition.editionNumber }
                })}
                label={edition.name || `Édition #${edition.editionNumber}`}
                className="shadow-none border-none p-0 bg-transparent"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
