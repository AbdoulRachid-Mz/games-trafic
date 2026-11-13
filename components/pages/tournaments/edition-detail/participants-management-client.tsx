"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { User as UserIcon, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipantRowActions } from "@/components/pages/tournaments/edition-detail/participant-row-actions";
import { AddParticipantForm } from "@/components/pages/tournaments/edition-detail/add-participant-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { deleteEditionRegistrationAction, addEditionParticipantAction } from "@/actions/editions";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Search, FileText, FileSpreadsheet, Settings2 } from "lucide-react";
import { getEditionParticipantsDocument } from "@/actions/documents";
import { downloadDocument } from "@/lib/documents/engine";
import type { DocumentFormat } from "@/lib/documents/types";
import { DynamicActionMenu, MenuItemAction } from "@/components/shared/dynamic-action-menu";
import Link from "next/link";

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
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredParticipants = participants.filter(p => {
    const name = (p.member.displayName || p.member.user?.username || "").toLowerCase();
    const team = (p.member.team?.name || "").toLowerCase();
    return name.includes(search.toLowerCase()) || team.includes(search.toLowerCase());
  });

  // Export serveur : données, mise en page et autorisations côté serveur.
  const handleExport = async (format: DocumentFormat) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await getEditionParticipantsDocument(editionId);
      if (!result.success || !result.document) {
        toast.error(result.error || "Erreur lors de l'export");
        return;
      }
      await downloadDocument(result.document, format);
      const count = result.document.meta.totalRecords ?? 0;
      toast.success(`Export ${format.toUpperCase()} réussi`, {
        description: `${count} participant(s) exporté(s)`,
      });
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

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

  const menuActions: MenuItemAction[] = [
    {
      id: "add-participant",
      paramKey: "action",
      paramValue: "add",
      label: "Ajouter un participant",
      icon: Plus,
      variant: "default",
      overlayType: "dialog",
      renderContent: <AddParticipantForm editionId={editionId} tournamentId={tournamentId} />
    },
    {
      id: "organize-bulk",
      paramKey: "action",
      paramValue: "organize",
      label: "Organiser en masse",
      icon: Settings2,
      variant: "outline",
      href: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/participants/organize`
    },
    {
      id: "export-pdf",
      paramKey: "action",
      paramValue: "export_pdf",
      label: "Exporter en PDF",
      icon: FileText,
      variant: "outline",
      onClick: () => void handleExport("pdf")
    },
    {
      id: "export-csv",
      paramKey: "action",
      paramValue: "export_csv",
      label: "Exporter en CSV",
      icon: FileSpreadsheet,
      variant: "outline",
      onClick: () => void handleExport("csv")
    }
  ];

  if (selectedParticipants.length > 0) {
    menuActions.push({
      id: "bulk-remove",
      paramKey: "action",
      paramValue: "bulk_remove",
      label: `Retirer (${selectedParticipants.length})`,
      icon: Trash2,
      variant: "destructive",
      onClick: () => {
        if (confirm(`Voulez-vous retirer les ${selectedParticipants.length} participant(s) sélectionné(s) ?`)) {
          handleBulkRemove();
        }
      }
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DynamicActionMenu actions={menuActions} floatingPosition="bottom-6 right-6" />
      {/* SECTION 1: PARTICIPANTS DE L'ÉDITION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-5 px-6">
          <div>
            <CardTitle className="text-lg">Participants Actuels ({participants.length})</CardTitle>
            <CardDescription>Joueurs inscrits et actifs dans cette édition.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un joueur ou équipe..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="hidden md:table min-w-[720px]">
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
                <TableHead>Équipe</TableHead>
                <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Aucun participant trouvé pour cette recherche.
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((reg) => (
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
                       <div className="flex items-center gap-2 text-sm">
                         <span className="max-w-[120px] truncate">
                           {reg.member.team?.name || "Solo"}
                         </span>
                       </div>
                    </TableCell>
                     <TableCell className="hidden sm:table-cell">
                       <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
                         <Phone className="h-3 w-3" />
                         {reg.member.contactPhone || reg.member.user?.phoneNumber || "N/A"}
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

          {/* Vue cartes pour petits écrans */}
          <div className="md:hidden space-y-3 p-3">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun participant trouvé pour cette recherche.
              </div>
            ) : (
              filteredParticipants.map((reg) => (
                <Card key={reg.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm shrink-0">
                      <AvatarImage src={reg.member.user?.profileImage || ""} />
                      <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate">
                        {reg.member.displayName || reg.member.user?.username || "Joueur"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {reg.member.team?.name || "Solo"}
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedParticipants.includes(reg.id)}
                      onCheckedChange={(c) => {
                        if (c) setSelectedParticipants((prev) => [...prev, reg.id]);
                        else setSelectedParticipants((prev) => prev.filter((i) => i !== reg.id));
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={reg.status === "REGISTERED" ? "secondary" : "default"}>
                      {reg.status}
                    </Badge>
                    <Badge variant={reg.feePaid ? "outline" : "destructive"} className={reg.feePaid ? "border-green-600 text-green-600" : ""}>
                      {reg.feePaid ? "Payé" : "Impayé"}
                    </Badge>
                    <span className="text-muted-foreground font-mono">
                      {reg.member.contactPhone || reg.member.user?.phoneNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <ParticipantRowActions
                      registrationId={reg.id}
                      checkedIn={reg.checkedIn || false}
                      feePaid={reg.feePaid || false}
                      status={reg.status || "REGISTERED"}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
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
        <CardContent className="p-0 overflow-x-auto">
          <Table className="hidden md:table min-w-[500px]">
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
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
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

          {/* Vue cartes mobile pour membres non inscrits */}
          <div className="md:hidden space-y-3 p-3">
            {unregisteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Tous les membres du tournoi sont déjà dans cette édition.
              </div>
            ) : (
              unregisteredMembers.map((row) => (
                <Card key={row.member.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm shrink-0">
                      <AvatarImage src={row.user?.profileImage || ""} />
                      <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate">
                        {row.member.displayName || row.user?.username || "Joueur"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {row.member.contactEmail || "Non renseigné"}
                      </div>
                    </div>
                    <Checkbox 
                      checked={selectedUnregistered.includes(row.member.id)}
                      onCheckedChange={(c) => {
                        if (c) setSelectedUnregistered(prev => [...prev, row.member.id]);
                        else setSelectedUnregistered(prev => prev.filter(i => i !== row.member.id));
                      }}
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-primary hover:text-primary hover:bg-primary/10 text-xs font-bold"
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
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Inscrire
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
