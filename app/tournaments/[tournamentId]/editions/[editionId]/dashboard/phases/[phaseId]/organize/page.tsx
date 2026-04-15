// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/phases/[phaseId]/organize/page.tsx
import { db } from "@/lib/db";
import { eq, and, exists } from "drizzle-orm";
import { tournamentPhases, phaseGroups, phaseGroupParticipants, editionRegistrations } from "@/database/schema";
import { PhaseOrganizeClient } from "@/components/pages/tournaments/edition-detail/phase-organize-client";
import { Typography } from "@/components/ui/typography";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    phaseId: string;
  }>;
}

export default async function PhaseOrganizePage({ params }: PageProps) {
  const { tournamentId, editionId, phaseId } = await params;

  // 1. Fetch Phase
  const phase = await db.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
  });

  if (!phase) notFound();

  // 2. Determine Participant Source and Fetch Source Participants
  const phaseConfig = (phase.config as any) || {};
  const source = phaseConfig.participantSource || 'EDITION';
  let sourceParticipants: any[] = [];

  if (source.startsWith('PHASE_')) {
    const sourcePhaseId = source.replace('PHASE_', '');
    sourceParticipants = await db.query.phaseGroupParticipants.findMany({
      where: and(
        exists(
          db.select().from(phaseGroups)
            .where(and(
              eq(phaseGroups.id, phaseGroupParticipants.groupId),
              eq(phaseGroups.phaseId, sourcePhaseId)
            ))
        ),
        eq(phaseGroupParticipants.qualified, true)
      ),
      with: {
        registration: {
          with: {
            member: {
              with: {
                user: true,
                team: true,
              },
            },
          },
        },
      },
    });
  } else {
    sourceParticipants = await db.query.editionRegistrations.findMany({
      where: and(
        eq(editionRegistrations.editionId, editionId),
        eq(editionRegistrations.status, 'REGISTERED')
      ),
      with: {
        member: {
          with: {
            user: true,
            team: true,
          },
        },
      },
    });
  }

  // 3. Fetch Existing Structure
  const existingGroups = await db.query.phaseGroups.findMany({
    where: and(eq(phaseGroups.phaseId, phaseId), eq(phaseGroups.isDeleted, false)),
    orderBy: (groups, { asc }) => [asc(groups.order)],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Typography variant="h2" weight="bold" className="tracking-tight">
          Organiser la Phase
        </Typography>
        <Typography variant="body-sm" theme="muted">
          Structurez les groupes et répartissez les participants pour {phase.name}.
        </Typography>
      </div>

      <PhaseOrganizeClient
        tournamentId={tournamentId}
        editionId={editionId}
        phaseId={phaseId}
        phaseName={phase.name}
        phaseType={phase.phaseType || "GROUP_STAGE"}
        phaseConfig={phaseConfig}
        sourceParticipants={sourceParticipants}
        existingGroups={existingGroups}
      />
    </div>
  );
}