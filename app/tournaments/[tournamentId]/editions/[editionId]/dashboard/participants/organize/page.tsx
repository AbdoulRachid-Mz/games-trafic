import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { tournamentEditions, editionRegistrations } from "@/database/schema";
import { ParticipantsOrganizeClient } from "@/components/pages/tournaments/edition-detail/participants-organize-client";
import { Typography } from "@/components/ui/typography";
import { notFound } from "next/navigation";
import { getEditionRegistrations } from "@/actions/tournaments";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function ParticipantsOrganizePage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;

  // 1. Fetch Edition
  const edition = await db.query.tournamentEditions.findFirst({
    where: eq(tournamentEditions.id, editionId),
  });

  if (!edition) notFound();

  // 2. Fetch Registrations (Participants)
  const registrationsResponse = await getEditionRegistrations({
    filters: { editionId },
    pagination: { limit: 500, page: 1 },
    options: {
      populate: ["member", "member.user", "member.team"],
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Typography variant="h2" weight="bold" className="tracking-tight">
          Organisation des Participants
        </Typography>
        <Typography variant="body-sm" theme="muted">
          Gérez les participants, générez des guests et liez-les à des utilisateurs réels.
        </Typography>
      </div>

      <ParticipantsOrganizeClient
        tournamentId={tournamentId}
        editionId={editionId}
        participants={registrationsResponse.data}
      />
    </div>
  );
}
