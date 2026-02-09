import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditionPageContent } from "@/components/pages/tournaments/edition-detail/edition-page-content";
import {
  Tournament,
  TournamentEdition,
  TournamentMember,
} from "@/database/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { getTournamentById, getTournamentEditionById, getTournamentMembers, getTournamentPhases } from "@/actions/tournaments";

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

  // Déstructurer l'édition avec relations
  const { registrations, ...edition } = editionWithRelations;

  // 1. Phases
  const phasesResponse = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });

  // 2. Vérifier si l'utilisateur est membre du tournoi
  let currentUserMember: TournamentMember | undefined;
  let currentUserRegistration: any = undefined;

  if (user) {
    // Vérifier si l'utilisateur est membre du tournoi
    const memberResponse = await getTournamentMembers({
      filters: { tournamentId, userId: user.id },
      pagination: { limit: 1, page: 1 },
    });

    const member = memberResponse.data[0];
    if (member) {
      currentUserMember = member;

      // Vérifier si ce membre est déjà inscrit à cette édition
      const existingRegistration = registrations?.find(
        (reg) => reg.memberId === member.id
      );
      if (existingRegistration) {
        currentUserRegistration = existingRegistration;
      }
    }
  }

  return (
    <EditionPageContent
      tournament={tournament}
      edition={edition}
      phases={phasesResponse.data}
      currentUserMember={currentUserMember}
      currentUserRegistration={currentUserRegistration}
    />
  );
}