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
import { User as UserIcon, Phone, MessageCircle, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEditionRegistrations } from "@/actions/tournaments";
import {
  EditionRegistration,
  TournamentMember,
  User as UserType,
  Team,
} from "@/database/schema";
import { AddParticipantDialog } from "@/components/pages/tournaments/edition-detail/add-participant-dialog";
import { ParticipantRowActions } from "@/components/pages/tournaments/edition-detail/participant-row-actions";

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

  // Stats
  const total = participants.length;
  const checkedIn = participants.filter((p) => p.checkedIn).length;
  const paid = participants.filter((p) => p.feePaid).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Total Inscrits</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-none shadow-none">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-green-600">{checkedIn}</div>
            <div className="text-xs font-medium text-green-600/70 uppercase tracking-wider mt-1">Checked-in</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-none shadow-none">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-blue-600">{paid}</div>
            <div className="text-xs font-medium text-blue-600/70 uppercase tracking-wider mt-1">Payés</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-5 px-6">
          <CardTitle className="text-lg">Liste des Participants</CardTitle>
          <AddParticipantDialog editionId={editionId} tournamentId={tournamentId} />
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop: Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-6">Joueur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucun participant pour le moment.
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((reg) => (
                    <TableRow key={reg.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                            <AvatarImage
                              src={reg.member.user?.profileImage || ""}
                              alt={reg.member.displayName || ""}
                            />
                            <AvatarFallback className="bg-muted">
                              <UserIcon className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">
                              {reg.member.displayName || reg.member.user?.username || "Joueur"}
                            </span>
                            {reg.member.gameTag && (
                              <span className="text-xs text-muted-foreground">{reg.member.gameTag}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {reg.member.contactPhone && (
                            <a href={`tel:${reg.member.contactPhone}`} title="Appeler">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {reg.member.contactPhone && (
                            <a
                              href={`https://wa.me/${reg.member.contactPhone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {!reg.member.contactPhone && (
                            <span className="text-xs text-muted-foreground">Pas de contact</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              reg.status === "REGISTERED" ? "secondary"
                                : reg.status === "PARTICIPATED" ? "default"
                                  : "outline"
                            }
                            className="font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5"
                          >
                            {reg.status === "REGISTERED" ? "Inscrit"
                              : reg.status === "PARTICIPATED" ? "Confirmé"
                                : reg.status === "ELIMINATED" ? "Éliminé"
                                  : reg.status}
                          </Badge>
                          {reg.checkedIn && (
                            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 py-0.5">
                              Check-in
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={reg.feePaid ? "outline" : "destructive"}
                          className={reg.feePaid ? "text-green-600 border-green-600 bg-green-50/50 text-[10px] font-semibold" : "text-[10px] font-semibold"}
                        >
                          {reg.feePaid ? "Payé" : "Impayé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {reg.registeredAt
                          ? format(new Date(reg.registeredAt), "d MMM yyyy", { locale: fr })
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <ParticipantRowActions
                          registrationId={reg.id}
                          checkedIn={reg.checkedIn || false}
                          feePaid={reg.feePaid || false}
                          status={reg.status || "REGISTERED"}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-0 divide-y">
            {participants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Aucun participant pour le moment.
              </div>
            ) : (
              participants.map((reg) => (
                <div key={reg.id} className="p-5 space-y-4">
                  {/* Player info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarImage src={reg.member.user?.profileImage || ""} alt="" />
                        <AvatarFallback>
                          <UserIcon className="h-5 w-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="font-bold text-base leading-none mb-1">
                          {reg.member.displayName || reg.member.user?.username || "Joueur"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reg.member.gameTag || (reg.registeredAt ? format(new Date(reg.registeredAt), "d MMM yyyy", { locale: fr }) : "")}
                        </div>
                      </div>
                    </div>
                    {/* Contact icons */}
                    <div className="flex gap-1">
                      {reg.member.contactPhone && (
                        <>
                          <a href={`tel:${reg.member.contactPhone}`}>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-green-600">
                              <Phone className="h-4.5 w-4.5" />
                            </Button>
                          </a>
                          <a href={`https://wa.me/${reg.member.contactPhone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-green-600">
                              <MessageCircle className="h-4.5 w-4.5" />
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={reg.status === "REGISTERED" ? "secondary" : reg.status === "PARTICIPATED" ? "default" : "outline"}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {reg.status === "REGISTERED" ? "Inscrit" : reg.status === "PARTICIPATED" ? "Confirmé" : reg.status}
                    </Badge>
                    <Badge
                      variant={reg.feePaid ? "outline" : "destructive"}
                      className={reg.feePaid ? "text-green-600 border-green-600 bg-green-50 py-0.5 text-[10px] font-bold uppercase" : "text-[10px] font-bold uppercase"}
                    >
                      {reg.feePaid ? "Payé" : "Impayé"}
                    </Badge>
                    {reg.checkedIn && (
                      <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 text-[10px] font-bold uppercase">
                        Checked-in
                      </Badge>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="pt-1">
                    <ParticipantRowActions
                      registrationId={reg.id}
                      checkedIn={reg.checkedIn || false}
                      feePaid={reg.feePaid || false}
                      status={reg.status || "REGISTERED"}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
