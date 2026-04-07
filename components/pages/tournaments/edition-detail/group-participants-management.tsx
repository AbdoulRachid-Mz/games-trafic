"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Loader2, 
  CheckCircle2,
  Save,
  Undo2,
  MoveRight,
  MoveLeft,
  AlertCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  bulkCreatePhaseGroupParticipants, 
  bulkDeletePhaseGroupParticipants 
} from "@/actions/phases";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GroupParticipantsManagementProps {
  groupId: string;
  editionId: string;
  allEditionRegistrations: any[];
  groupParticipants: any[];
  maxParticipants?: number;
}

export function GroupParticipantsManagement({
  groupId,
  editionId,
  allEditionRegistrations,
  groupParticipants,
  maxParticipants = 0,
}: GroupParticipantsManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: 'add' | 'remove', id: string, name: string, regId?: string } | null>(null);
  
  // Draft State
  const [draftAddIds, setDraftAddIds] = useState<Set<string>>(new Set());
  const [draftRemoveIds, setDraftRemoveIds] = useState<Set<string>>(new Set());

  // Derived State
  const currentGroupParticipantIds = useMemo(() => new Set(groupParticipants.map(p => p.registrationId)), [groupParticipants]);
  
  // Participants to show on the left (Available)
  const availableList = useMemo(() => {
    return allEditionRegistrations.filter(reg => {
      const isCurrentlyInGroup = currentGroupParticipantIds.has(reg.id);
      const isDraftAdded = draftAddIds.has(reg.id);
      const isDraftRemoved = groupParticipants.find(p => p.registrationId === reg.id && draftRemoveIds.has(p.id));
      
      // Show if: (Not in group AND not draft added) OR (In group AND draft removed)
      if (isCurrentlyInGroup && !isDraftRemoved) return false;
      if (!isCurrentlyInGroup && isDraftAdded) return false;

      const nameMatch = reg.member?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        reg.member?.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch;
    });
  }, [allEditionRegistrations, currentGroupParticipantIds, draftAddIds, draftRemoveIds, groupParticipants, searchQuery]);

  // Participants to show on the right (Group)
  const groupList = useMemo(() => {
    // Start with current group participants minus draft removals
    const base = groupParticipants.filter(p => !draftRemoveIds.has(p.id))
      .map(p => {
        const reg = allEditionRegistrations.find(r => r.id === p.registrationId);
        return { ...p, reg, isDraft: false };
      });
    
    // Add draft additions
    const added = Array.from(draftAddIds).map(regId => {
      const reg = allEditionRegistrations.find(r => r.id === regId);
      return { id: `draft-${regId}`, registrationId: regId, reg, isDraft: true };
    });

    return [...base, ...added];
  }, [groupParticipants, draftRemoveIds, draftAddIds, allEditionRegistrations]);

  const toggleAdd = (regId: string) => {
    const next = new Set(draftAddIds);
    if (next.has(regId)) next.delete(regId);
    else {
      // Check capacity
      if (maxParticipants > 0 && groupList.length >= maxParticipants) {
        toast.error(`Capacité maximale atteinte (${maxParticipants} participants).`);
        return;
      }
      
      // If it was in draftRemoveIds (indirectly via registrationId), remove it from there
      const p = groupParticipants.find(p => p.registrationId === regId && draftRemoveIds.has(p.id));
      if (p) setDraftRemoveIds(prev => {
        const n = new Set(prev);
        n.delete(p.id);
        return n;
      });
      else next.add(regId);
    }
    setDraftAddIds(next);
  };

  const toggleRemove = (pId: string, regId: string) => {
    if (pId.startsWith('draft-')) {
      setDraftAddIds(prev => {
        const n = new Set(prev);
        n.delete(regId);
        return n;
      });
    } else {
      setDraftRemoveIds(prev => {
        const n = new Set(prev);
        if (n.has(pId)) n.delete(pId);
        else n.add(pId);
        return n;
      });
    }
  };

  const hasChanges = draftAddIds.size > 0 || draftRemoveIds.size > 0;

  const handleSave = () => {
    // Final capacity check
    if (maxParticipants > 0 && groupList.length > maxParticipants) {
        toast.error(`Capacité maximale dépassée (${groupList.length}/${maxParticipants}).`);
        return;
    }

    startTransition(async () => {
      try {
        // 1. Bulk Delete
        if (draftRemoveIds.size > 0) {
          await bulkDeletePhaseGroupParticipants(Array.from(draftRemoveIds));
        }

        // 2. Bulk Create
        if (draftAddIds.size > 0) {
          await bulkCreatePhaseGroupParticipants(
            Array.from(draftAddIds).map(regId => ({
              groupId,
              registrationId: regId,
            } as any))
          );
        }

        toast.success("Modifications enregistrées !");
        setDraftAddIds(new Set());
        setDraftRemoveIds(new Set());
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la mise à jour massive.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrer les participants..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={() => { setDraftAddIds(new Set()); setDraftRemoveIds(new Set()); }} className="text-muted-foreground font-bold">
              <Undo2 className="h-4 w-4 mr-2" /> Annuler
            </Button>
          )}
          <Button 
            disabled={!hasChanges || isPending} 
            onClick={handleSave}
            className={cn("font-bold gap-2 shadow-lg transition-all", hasChanges ? "bg-primary shadow-primary/20" : "")}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-white" />}
            Enregistrer les modifications ({draftAddIds.size + draftRemoveIds.size})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Available List */}
        <Card className="border-none shadow-xl bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Users className="h-4 w-4 text-primary" /> Disponibles ({availableList.length})
              </CardTitle>
              {maxParticipants > 0 && (
                <Badge variant={groupList.length >= maxParticipants ? "destructive" : "outline"} className="text-[10px]">
                   Capacité: {groupList.length}/{maxParticipants}
                </Badge>
              )}
            </div>
            <CardDescription className="text-[10px]">Cliquez sur un participant pour l'ajouter au draft.</CardDescription>
          <CardContent className="p-0 border-t bg-card/50">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableBody>
                  {availableList.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center py-20 text-muted-foreground text-xs italic">Aucun participant disponible</TableCell>
                    </TableRow>
                  ) : (
                    availableList.map((reg) => (
                      <TableRow key={reg.id} className="hover:bg-primary/5 cursor-pointer group" onClick={() => setConfirmAction({ type: 'add', id: reg.id, name: reg.member?.displayName || reg.member?.user?.username || reg.member?.team?.name || "Participant" })}>
                        <TableCell className="py-3 pl-6">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={reg.member?.user?.profileImage || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{reg.member?.displayName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold leading-tight">{reg.member?.displayName || reg.member?.user?.username}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter mt-1">ID: {reg.id.slice(0,8)}</span>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-primary border border-primary/20">
                              <MoveRight className="h-4 w-4" />
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Group List */}
        <Card className="border-none shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
               <CheckCircle2 className="h-4 w-4 text-green-500" /> Membres du Groupe ({groupList.length})
            </CardTitle>
            <CardDescription className="text-[10px]">Les nouveaux membres (draft) apparaissent en couleur.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableBody>
                  {groupList.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center py-20 text-muted-foreground text-xs italic">Groupe vide</TableCell>
                    </TableRow>
                  ) : (
                    groupList.map((p) => (
                      <TableRow key={p.id} className={cn("hover:bg-destructive/5 cursor-pointer group", p.isDraft && "bg-emerald-50/50")} onClick={() => setConfirmAction({ type: 'remove', id: p.id, regId: p.registrationId, name: p.reg?.member?.displayName || p.reg?.member?.user?.username || p.reg?.member?.team?.name || "Participant" })}>
                        <TableCell className="py-3 pl-6">
                           <div className="flex items-center gap-3">
                              <Avatar className={cn("h-10 w-10 border-2 border-background shadow-sm", p.isDraft && "ring-2 ring-emerald-500 ring-offset-2")}>
                                <AvatarImage src={p.reg?.member?.user?.profileImage || ""} />
                                <AvatarFallback className="font-bold">{p.reg?.member?.displayName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold leading-tight">{p.reg?.member?.displayName || p.reg?.member?.user?.username}</span>
                                  {p.isDraft && <Badge className="bg-emerald-500 text-[8px] h-3.5 px-1">NOUVEAU</Badge>}
                                </div>
                                <span className={cn("text-[10px] mt-1 font-mono tracking-tighter", p.isDraft ? "text-emerald-600 font-bold" : "text-muted-foreground")}>
                                  {p.isDraft ? "À AJOUTER" : `Pts: ${p.points || 0} • Pos: ${p.position || "N/A"}`}
                                </span>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-destructive border border-destructive/20">
                              <MoveLeft className="h-4 w-4" />
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.type === 'add' ? "Ajouter au groupe" : "Retirer du groupe"}</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment {confirmAction?.type === 'add' ? "ajouter" : "retirer"} <strong>{confirmAction?.name}</strong> du groupe ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmAction) {
                if (confirmAction.type === 'add') toggleAdd(confirmAction.id);
                else if (confirmAction.type === 'remove') toggleRemove(confirmAction.id, confirmAction.regId!);
              }
              setConfirmAction(null);
            }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
