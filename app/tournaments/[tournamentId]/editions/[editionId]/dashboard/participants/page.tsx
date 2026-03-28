import { Card, CardContent } from "@/components/ui/card";
import { getEditionRegistrations } from "@/actions/tournaments";
import {
  EditionRegistration,
  TournamentMember,
  User as UserType,
  Team,
} from "@/database/schema";
import { ParticipantsManagementClient } from "@/components/pages/tournaments/edition-detail/participants-management-client";
import { StatsCarousel } from "@/components/shared/stats-carousel";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

type RegistrationWithMember = EditionRegistration & {
  member: TournamentMember & {
    user: UserType | null;
    team: Team | null;
  };
};

export default async function DashboardParticipantsPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;

  const [registrationsResponse, unregisteredResponse] = await Promise.all([
    getEditionRegistrations({
      filters: { editionId },
      pagination: { limit: 100, page: 1 },
      options: {
        sortBy: "registeredAt",
        sortOrder: "desc",
        populate: ["member", "member.user", "member.team"],
      },
    }),
    import("@/actions/tournaments").then((m) =>
      m.getTournamentMembersNotInEdition(tournamentId, editionId, {
        pagination: { limit: 100, page: 1 },
      })
    ),
  ]);

  const participants = registrationsResponse.data as RegistrationWithMember[];
  const unregisteredMembers = unregisteredResponse.data;

  // Stats
  const total = participants.length;
  const checkedIn = participants.filter((p) => p.checkedIn).length;
  const paid = participants.filter((p) => p.feePaid).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats */}
      <StatsCarousel
        data={[
          {
            value: total,
            title: "Total Inscrits",
            className: "bg-muted/30 border-none shadow-none",
          },
          {
            value: checkedIn,
            title: "Checked-in",
            className: "bg-green-500/5 border-none shadow-none",
            variant: "secondary",
          },
          {
            value: paid,
            title: "Payés",
            className: "bg-blue-500/5 border-none shadow-none",
            variant: "success",
          },
        ]}
        itemsPerView={{ mobile: 1, md: 2, lg: 3 }}
        gap={16}
      />

      <ParticipantsManagementClient 
        editionId={editionId} 
        tournamentId={tournamentId}
        participants={participants}
        unregisteredMembers={unregisteredMembers}
      />
    </div>
  );
}
