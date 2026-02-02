import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreVertical, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEditionRegistrations } from "@/actions/tournaments";
import {
  EditionRegistration,
  TournamentMember,
  User as UserType,
  Team,
} from "@/database/schema";

interface DashboardParticipantsPageProps {
  params: {
    tournamentId: string;
    editionId: string;
  };
}

type RegistrationWithMember = EditionRegistration & {
  member: TournamentMember & {
    user: UserType | null;
    team: Team | null;
  };
};

export default async function DashboardParticipantsPage({
  params,
}: DashboardParticipantsPageProps) {
  const { editionId } = params;

  const registrationsResponse = await getEditionRegistrations({
    filters: { editionId },
    pagination: { limit: 100, page: 1 },
    options: {
      sortBy: "registeredAt",
      sortOrder: "desc",
      populate: ["member", "member.user", "member.team"],
    },
  });

  const participants = registrationsResponse.data as RegistrationWithMember[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Joueur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Aucun participant pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              participants.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage
                        src={reg.member.user?.profileImage || ""}
                        alt={reg.member.displayName || ""}
                      />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">
                        {reg.member.displayName ||
                          reg.member.user?.username ||
                          "Joueur"}
                      </span>
                      {reg.member.user?.username && (
                        <span className="text-xs text-muted-foreground">
                          @{reg.member.user.username}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        reg.status === "REGISTERED"
                          ? "default"
                          : reg.status === "PARTICIPATED"
                          ? "secondary"
                          : "outline"
                      }
                      className="font-normal"
                    >
                      {reg.status === "REGISTERED"
                        ? "Inscrit"
                        : reg.status === "PARTICIPATED"
                        ? "Confirmé"
                        : reg.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={reg.feePaid ? "outline" : "destructive"}
                      className={
                        reg.feePaid
                          ? "text-green-600 border-green-600 bg-green-50/50"
                          : ""
                      }
                    >
                      {reg.feePaid ? "Payé" : "Impayé"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {reg.registeredAt ? (
                      format(new Date(reg.registeredAt), "d MMM yyyy", {
                        locale: fr,
                      })
                    ) : (
                      <span className="italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
