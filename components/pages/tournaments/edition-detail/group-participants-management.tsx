"use client";

import React, { useState, useTransition } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Loader2, 
  ArrowRightLeft,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  createPhaseGroupParticipant, 
  deletePhaseGroupParticipant 
} from "@/actions/phases";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

interface GroupParticipantsManagementProps {
  groupId: string;
  editionId: string;
  allEditionRegistrations: any[];
  groupParticipants: any[];
}

export function GroupParticipantsManagement({
  groupId,
  editionId,
  allEditionRegistrations,
  groupParticipants,
}: GroupParticipantsManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  
  // IDs of participants already in the group
  const groupParticipantRegIds = groupParticipants.map(p => p.registrationId);
  
  // Filter registered edition participants NOT in the group
  const availableParticipants = allEditionRegistrations.filter(
    reg => !groupParticipantRegIds.includes(reg.id) &&
    (reg.member?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     reg.member?.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedInGroup, setSelectedInGroup] = useState<string[]>([]);

  const handleAddSelected = () => {
    startTransition(async () => {
      try {
        for (const regId of selectedAvailable) {
          await createPhaseGroupParticipant({ groupId, registrationId: regId } as any);
        }
        toast.success(`${selectedAvailable.length} participant(s) ajouté(s) au groupe.`);
        setSelectedAvailable([]);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de l'ajout des participants.");
      }
    });
  };

  const handleRemoveSelected = () => {
    startTransition(async () => {
      try {
        for (const participantId of selectedInGroup) {
          await deletePhaseGroupParticipant(participantId);
        }
        toast.success(`${selectedInGroup.length} participant(s) retiré(s) du groupe.`);
        setSelectedInGroup([]);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors du retrait des participants.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* List 1: Available in Edition */}
      <Card className="border-none shadow-md overflow-hidden bg-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Disponibles dans l'Édition
              </CardTitle>
              <CardDescription className="text-[10px]">
                Inscrits à l'édition mais pas encore dans ce groupe.
              </CardDescription>
            </div>
            {selectedAvailable.length > 0 && (
              <Button 
                size="sm" 
                onClick={handleAddSelected} 
                disabled={isPending}
                className="h-8 gap-1.5 animate-in slide-in-from-right-4 duration-300"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Ajouter ({selectedAvailable.length})
              </Button>
            )}
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un participant..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableBody>
                {availableParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center py-10 text-muted-foreground text-xs italic">
                      Aucun participant disponible trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  availableParticipants.map((reg) => (
                    <TableRow key={reg.id} className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="w-10 pl-4">
                        <Checkbox 
                          checked={selectedAvailable.includes(reg.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedAvailable([...selectedAvailable, reg.id]);
                            else setSelectedAvailable(selectedAvailable.filter(id => id !== reg.id));
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border">
                            <AvatarImage src={reg.member?.user?.profileImage || ""} />
                            <AvatarFallback className="text-[10px]">{reg.member?.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold leading-tight">
                              {reg.member?.displayName || reg.member?.user?.username || "Joueur"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {reg.member?.team?.name || "Individuel"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedAvailable([reg.id]);
                            handleAddSelected();
                          }}
                        >
                          <UserPlus className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* List 2: Members in Group */}
      <Card className="border-none shadow-md overflow-hidden bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Membres du Groupe ({groupParticipants.length})
              </CardTitle>
              <CardDescription className="text-[10px]">
                Participants actuellement assignés à ce groupe.
              </CardDescription>
            </div>
            {selectedInGroup.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleRemoveSelected} 
                disabled={isPending}
                className="h-8 gap-1.5 animate-in slide-in-from-left-4 duration-300"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                Retirer ({selectedInGroup.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableBody>
                {groupParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center py-12 text-muted-foreground text-xs italic">
                      Ce groupe est vide. Ajoutez des participants depuis la liste de gauche.
                    </TableCell>
                  </TableRow>
                ) : (
                  groupParticipants.map((p) => {
                    const reg = allEditionRegistrations.find(r => r.id === p.registrationId);
                    return (
                      <TableRow key={p.id} className="hover:bg-destructive/5 transition-colors group">
                        <TableCell className="w-10 pl-4">
                          <Checkbox 
                            checked={selectedInGroup.includes(p.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedInGroup([...selectedInGroup, p.id]);
                              else setSelectedInGroup(selectedInGroup.filter(id => id !== p.id));
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border">
                              <AvatarImage src={reg?.member?.user?.profileImage || ""} />
                              <AvatarFallback className="text-[10px]">{reg?.member?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold leading-tight">
                                {reg?.member?.displayName || reg?.member?.user?.username || "Joueur"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Pos: {p.position || "N/A"} • Pts: {p.points || 0}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedInGroup([p.id]);
                              handleRemoveSelected();
                            }}
                          >
                            <UserMinus className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
