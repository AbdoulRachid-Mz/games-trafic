import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditionPageContent } from "@/components/pages/tournaments/edition-detail/edition-page-content";
import {
  TournamentMember
} from "@/database/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getTournamentEditionWithRelations, getEditionActivePhase } from "@/actions/editions";
import { getTournamentById, getTournamentEditionById, getTournamentMembers } from "@/actions/tournaments";
import { getTournamentPhases } from "@/actions/phases";
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
      ? `Édition ${edition.name || `#${edition.editionNumber}`}`
      : "Édition Inconnue",
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
  // console.log("phasesResponse", phases)

  // Removed server-side standings load to use Client Component independent loading.

  // 2. Vérifier si l'utilisateur est organisateur
  const isOrganizer = !!(user && tournament.organizerId === user.id);

  // 3. Vérifier si l'utilisateur est membre du tournoi
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

  return (
    <div className="space-y-8">
      <EditionPageContent
        tournament={tournament}
        edition={edition}
        phases={phases || edition.phases}
        activePhaseId={activePhase?.id}
        currentUserMember={currentUserMember}
        currentUserRegistration={currentUserRegistration}
        isOrganizer={isOrganizer}
      />

      {/* Free badge */}
      {isFree && (
        <div className="max-w-md mx-auto text-center">
          <Badge className="bg-primary text-white text-lg px-6 py-2 font-black uppercase tracking-wider">
            🎉 GRATUIT — Inscription libre
          </Badge>
        </div>
      )}

      {/* QR code only for registered users who haven't paid */}
      {showQR && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 flex flex-col items-center">
            <Typography variant="h4" className="font-black italic uppercase tracking-tighter mb-2">
              Paiement d&apos;inscription
            </Typography>
            <Typography variant="caption1" theme="muted" className="mb-4 text-center">
              Scannez pour régler {edition.entryFee} {edition.prizeCurrency || "GTC"}
            </Typography>
            <TransactionQRCode
              data={encodeTransactionQR({
                t: "TOURNAMENT_PARTICIPATION",
                id: edition.id,
                a: entryFee,
                m: { tournamentId, editionNumber: edition.editionNumber }
              })}
              label={edition.name || `Édition #${edition.editionNumber}`}
              className="shadow-none border-none p-0 bg-transparent"
            />
          </CardContent>
        </Card>
      )}

      {/* Paid confirmation */}
      {!isFree && isRegistered && hasPaid && (
        <div className="max-w-md mx-auto text-center">
          <Badge className="bg-primary text-white text-sm px-4 py-1.5">
            ✅ Paiement confirmé
          </Badge>
        </div>
      )}
    </div>
  );
}
