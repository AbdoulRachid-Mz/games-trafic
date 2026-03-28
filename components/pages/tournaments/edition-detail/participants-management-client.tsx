"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { User as UserIcon, Phone, MessageCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipantRowActions } from "@/components/pages/tournaments/edition-detail/participant-row-actions";
import { AddParticipantDialog } from "@/components/pages/tournaments/edition-detail/add-participant-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { deleteEditionRegistrationAction, addEditionParticipantAction } from "@/actions/editions";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

export function ParticipantsManagementClient({
  editionId,
  tournamentId,
  participants,
  unregisteredMembers,
}: {
  editionId: string;
  tournamentId: string;
  participants: any[];
  unregisteredMembers: any[];
}) {
  const router = useRouter();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedUnregistered, setSelectedUnregistered] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Bulk Actions
  const handleBulkAdd = async () => {
    if (selectedUnregistered.length === 0) return;
    setIsAdding(true);
    try {
      for (const id of selectedUnregistered) {
        const member = unregisteredMembers.find(m => m.member.id === id);
        if (member) {
          await addEditionParticipantAction({
            editionId,
            tournamentId,
            userId: member.member.userId,
            displayName: member.member.displayName,
          });
        }
      }
      toast.success(`${selectedUnregistered.length} membre(s) ajouté(s) à l'édition.`);
      setSelectedUnregistered([]);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedParticipants.length === 0) return;
    setIsDeleting(true);
    try {
      for (const id of selectedParticipants) {
        await deleteEditionRegistrationAction(id);
      }
      toast.success(`${selectedParticipants.length} participant(s) retiré(s).`);
      setSelectedParticipants([]);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du retrait d'un ou plusieurs participants. Vérifiez s'ils sont engagés dans des matchs.");
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SECTION 1: PARTICIPANTS DE L'ÉDITION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-5 px-6">
          <div>
            <CardTitle className="text-lg">Participants Actuels ({participants.length})</CardTitle>
            <CardDescription>Joueurs inscrits et actifs dans cette édition.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedParticipants.length > 0 && (
              <ConfirmationDialog
                title="Retirer les participants"
                description={`Êtes-vous sûr de vouloir retirer les ${selectedParticipants.length} participant(s) sélectionné(s) ? S'ils ont des matchs ou font partie de groupes, l'action sera bloquée.`}
                onConfirm={handleBulkRemove}
              >
                 <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Retirer ({selectedParticipants.length})
                 </Button>
              </ConfirmationDialog>
            )}
            <AddParticipantDialog editionId={editionId} tournamentId={tournamentId} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px] px-6">
                  <Checkbox 
                    checked={selectedParticipants.length === participants.length && participants.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedParticipants(participants.map(p => p.id));
                      else setSelectedParticipants([]);
                    }}
                  />
                </TableHead>
                <TableHead>Joueur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
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
                  <TableRow key={reg.id} className="hover:bg-muted/20">
                    <TableCell className="px-6">
                       <Checkbox 
                         checked={selectedParticipants.includes(reg.id)}
                         onCheckedChange={(c) => {
                           if (c) setSelectedParticipants(prev => [...prev, reg.id]);
                           else setSelectedParticipants(prev => prev.filter(i => i !== reg.id));
                         }}
                       />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={reg.member.user?.profileImage || ""} />
                          <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">
                            {reg.member.displayName || reg.member.user?.username || "Joueur"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reg.status === "REGISTERED" ? "secondary" : "default"}>
                        {reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reg.feePaid ? "outline" : "destructive"} className={reg.feePaid ? "border-green-600 text-green-600" : ""}>
                         {reg.feePaid ? "Payé" : "Impayé"}
                      </Badge>
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
        </CardContent>
      </Card>

      {/* SECTION 2: MEMBRES NON INSCRITS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-5 px-6">
          <div>
            <CardTitle className="text-lg">Membres du Tournoi Non Inscrits ({unregisteredMembers.length})</CardTitle>
            <CardDescription>Joueurs présents dans le tournoi global mais pas dans cette édition.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             {selectedUnregistered.length > 0 && (
                 <Button onClick={handleBulkAdd} size="sm" disabled={isAdding}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter à l'édition ({selectedUnregistered.length})
                 </Button>
             )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px] px-6">
                  <Checkbox 
                    checked={selectedUnregistered.length === unregisteredMembers.length && unregisteredMembers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedUnregistered(unregisteredMembers.map(m => m.member.id));
                      else setSelectedUnregistered([]);
                    }}
                  />
                </TableHead>
                <TableHead>Joueur</TableHead>
                <TableHead>Contact / Email</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unregisteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    Tous les membres du tournoi sont déjà dans cette édition.
                  </TableCell>
                </TableRow>
              ) : (
                unregisteredMembers.map((row) => (
                  <TableRow key={row.member.id} className="hover:bg-muted/20">
                    <TableCell className="px-6">
                       <Checkbox 
                         checked={selectedUnregistered.includes(row.member.id)}
                         onCheckedChange={(c) => {
                           if (c) setSelectedUnregistered(prev => [...prev, row.member.id]);
                           else setSelectedUnregistered(prev => prev.filter(i => i !== row.member.id));
                         }}
                       />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={row.user?.profileImage || ""} />
                          <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">
                            {row.member.displayName || row.user?.username || "Joueur"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                       {row.member.contactEmail || "Non renseigné"}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        onClick={async () => {
                          try {
                            await addEditionParticipantAction({
                              editionId,
                              tournamentId,
                              userId: row.member.userId,
                              displayName: row.member.displayName,
                            });
                            toast.success(`${row.member.displayName} ajouté.`);
                            router.refresh();
                          } catch (e: any) {
                            toast.error(e.message || "Erreur lors de l'ajout.");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Inscrire
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
