"use client";

import React, { useState, useTransition } from "react";
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
  Plus, 
  Swords, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Settings2,
  Trophy,
  X,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkCreateMatches, deleteMatch } from "@/actions/phases";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface BracketNodeMatchesOrganizeClientProps {
  node: any;
  editionId: string;
  tournamentId: string;
  allRegistrations: any[];
  groupParticipants: any[];
  existingMatches: any[];
}

type DraftMatch = {
  participant1RegistrationId: string;
  participant2RegistrationId: string;
  format: string;
  leg: number;
};

export function BracketNodeMatchesOrganizeClient({
  node,
  editionId,
  tournamentId,
  allRegistrations,
  groupParticipants,
  existingMatches,
}: BracketNodeMatchesOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Selection state
  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");
  const [matchCount, setMatchCount] = useState<string>("1");
  const [format, setFormat] = useState<string>("BEST_OF_1");

  // Draft state
  const [draftMatches, setDraftMatches] = useState<DraftMatch[]>([]);

  const getName = (id: string) => {
    const reg = allRegistrations.find(r => r.id === id);
    return reg?.member?.displayName || reg?.member?.user?.username || "Joueur";
  };

  const handleAddToDraft = () => {
    if (!p1 || !p2) {
      toast.error("Veuillez sélectionner deux participants.");
      return;
    }
    if (p1 === p2) {
      toast.error("Les participants doivent être différents.");
      return;
    }

    const count = parseInt(matchCount);
    const newDrafts: DraftMatch[] = [];
    for (let i = 0; i < count; i++) {
       newDrafts.push({
         participant1RegistrationId: p1,
         participant2RegistrationId: p2,
         format,
         leg: i + 1,
       });
    }
    setDraftMatches([...draftMatches, ...newDrafts]);
    toast.success(`${count} match(s) ajouté(s) au draft.`);
  };

  const handleSaveDrafts = () => {
    if (draftMatches.length === 0) return;

    startTransition(async () => {
      try {
        await bulkCreateMatches(
          draftMatches.map((m, idx) => ({
            ...m,
            editionId,
            phaseId: node.phaseId,
            groupId: node.groupId,
            bracketNodeId: node.id,
            round: node.round || 1,
            matchNumber: node.matchNumber || 1,
            matchCode: `${node.nodeCode || "BR"}-M${existingMatches.length + idx + 1}`,
            status: "PENDING",
            metadata: { format: m.format, leg: m.leg },
          } as any))
        );
        toast.success(`${draftMatches.length} matchs sauvegardés.`);
        setDraftMatches([]);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la sauvegarde bulk.");
      }
    });
  };

  const handleRemoveDraft = (idx: number) => {
    setDraftMatches(draftMatches.filter((_, i) => i !== idx));
  };

  const handleDeleteExisting = async (id: string) => {
    try {
      await deleteMatch(id);
      toast.success("Match supprimé.");
      router.refresh();
    } catch (e) {
      toast.error("Erreur suppression.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Column */}
      <Card className="lg:col-span-1 border-primary/10 shadow-lg h-fit sticky top-6">
        <CardHeader className="bg-primary/5 pb-4 rounded-t-xl">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" /> Configurateur de Matchs
          </CardTitle>
          <CardDescription className="text-xs">
            Sélectionnez les duellistes pour ce nœud de bracket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Joueur 1</label>
              <Select value={p1} onValueChange={setP1}>
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Choisir P1" />
                </SelectTrigger>
                <SelectContent>
                  {groupParticipants.map(pg => (
                    <SelectItem key={pg.registrationId} value={pg.registrationId}>
                      {getName(pg.registrationId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
               <div className="bg-background border rounded-full p-2 shadow-sm text-muted-foreground">
                  <Swords className="h-3 w-3" />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Joueur 2</label>
              <Select value={p2} onValueChange={setP2}>
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Choisir P2" />
                </SelectTrigger>
                <SelectContent>
                  {groupParticipants.map(pg => (
                    <SelectItem key={pg.registrationId} value={pg.registrationId}>
                      {getName(pg.registrationId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Matchs</label>
              <Select value={matchCount} onValueChange={setMatchCount}>
                <SelectTrigger className="h-10 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Single</SelectItem>
                  <SelectItem value="2">Aller/Ret</SelectItem>
                  <SelectItem value="3">BO3</SelectItem>
                  <SelectItem value="5">BO5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Série</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-10 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEST_OF_1">Standard</SelectItem>
                  <SelectItem value="HOME_AWAY">H/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            variant="secondary"
            className="w-full gap-2 font-bold h-11" 
            onClick={handleAddToDraft}
          >
            <Plus className="h-4 w-4" /> Ajouter au Draft
          </Button>
        </CardContent>
        <CardFooter className="pt-4 border-t bg-muted/30 rounded-b-xl">
          <Button 
            className="w-full gap-2 font-bold h-12 shadow-md shadow-primary/20" 
            onClick={handleSaveDrafts}
            disabled={isPending || draftMatches.length === 0}
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            {isPending ? "Sauvegarde..." : `Sauvegarder ${draftMatches.length} Matchs`}
          </Button>
        </CardFooter>
      </Card>

      {/* List Column */}
      <Card className="lg:col-span-2 border-none shadow-xl flex flex-col overflow-hidden">
        <Tabs defaultValue="draft" className="w-full flex flex-col h-full">
          <CardHeader className="border-b pb-0 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Swords className="h-4 w-4 text-primary" /> Organisation du Nœud
              </CardTitle>
            </div>
            <TabsList className="bg-transparent gap-6 p-0 h-10 justify-start">
              <TabsTrigger value="draft" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2 font-bold text-xs">
                Draft <Badge variant="secondary" className="h-5 min-w-5 px-1">{draftMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="existing" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2 font-bold text-xs">
                Existants <Badge variant="outline" className="h-5 min-w-5 px-1">{existingMatches.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <TabsContent value="draft" className="m-0 focus-visible:ring-0 h-full overflow-y-auto">
              {draftMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-30">
                  <Clock className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">Draft de matchs vide</p>
                </div>
              ) : (
                <div className="divide-y">
                  {draftMatches.map((m, i) => (
                    <div key={i} className="p-4 hover:bg-primary/5 transition-colors flex items-center justify-between group animate-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                          #{i + 1}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">{getName(m.participant1RegistrationId)}</span>
                            <span className="text-[10px] font-black text-muted-foreground opacity-50">VS</span>
                            <span className="text-sm font-bold">{getName(m.participant2RegistrationId)}</span>
                          </div>
                          <div className="flex gap-2 mt-1">
                             <Badge variant="outline" className="h-4 text-[9px] border-primary/20">{m.format}</Badge>
                             {m.leg > 1 && <Badge variant="secondary" className="h-4 text-[9px]">Match #{m.leg}</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveDraft(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="existing" className="m-0 focus-visible:ring-0 h-full overflow-y-auto">
              {existingMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-30">
                  <RefreshCw className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">Aucun match permanent</p>
                </div>
              ) : (
                <div className="divide-y">
                  {existingMatches.map((m, idx) => (
                    <div key={m.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs shrink-0 ring-1 ring-border">
                          #{idx + 1}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">{getName(m.participant1RegistrationId)}</span>
                            <span className="text-[10px] font-black text-muted-foreground opacity-50">VS</span>
                            <span className="text-sm font-bold">{getName(m.participant2RegistrationId)}</span>
                          </div>
                          <div className="flex gap-2 mt-1">
                             <Badge variant="outline" className="h-4 text-[9px]">{m.metadata?.format || "BO1"}</Badge>
                             <Badge variant="outline" className={cn("h-4 text-[9px]", m.status === 'COMPLETED' ? "bg-green-500/10 text-green-600 border-none" : "text-amber-600 border-amber-500/20")}>
                                {m.status === 'COMPLETED' ? "Terminé" : "En attente"}
                             </Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteExisting(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
          <CardFooter className="border-t bg-muted/5 p-4 shrink-0">
             <div className="flex items-center gap-3 text-xs text-muted-foreground italic">
                <Trophy className="h-4 w-4 text-primary" />
                <span>Le vainqueur de cette série progressera dans l'arbre principal.</span>
             </div>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
}
