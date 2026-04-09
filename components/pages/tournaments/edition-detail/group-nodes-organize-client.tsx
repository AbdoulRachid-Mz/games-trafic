"use client";

import { useState, useTransition } from "react";
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
  Trash2,
  Loader2,
  Settings2,
  GitBranch,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkCreateBracketNodes, deleteBracketNode } from "@/actions/phases";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BracketNodeWithRelations, PhaseGroupParticipantWithRelations } from "@/database/schema";

interface GroupNodesOrganizeClientProps {
  tournamentId: string;
  editionId: string;
  groupId: string;
  phaseId: string;
  existingNodes: BracketNodeWithRelations[];
  groupParticipants: PhaseGroupParticipantWithRelations[];
  allRegistrations: any[];
  groupConfig?: any;
  phaseConfig?: any;
}

type DraftNode = {
  nodeCode: string;
  round: number;
  matchNumber: number;
  bracketType: "UPPER" | "LOWER";
  order: number;
  participants: string[]; // registrationIds
  generateMatches: boolean;
  matchesCount: number;
};

export function GroupNodesOrganizeClient({
  tournamentId,
  editionId,
  groupId,
  phaseId,
  existingNodes,
  groupParticipants,
  allRegistrations,
  groupConfig,
  phaseConfig,
}: GroupNodesOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftNodes, setDraftNodes] = useState<DraftNode[]>([]);
  
  // Auto-generation parameters
  const [nodePrefix, setNodePrefix] = useState("N");
  const [nodeCount, setNodeCount] = useState("4");
  const [startRound, setStartRound] = useState("1");

  const getName = (id: string | null | undefined) => {
    if (!id) return "À déterminer";
    const reg = allRegistrations.find(r => r.id === id);
    return reg?.member?.displayName || reg?.member?.user?.username || reg?.member?.team?.name || "Joueur";
  };

  const getAvailableParticipants = () => {
    const assignedIds = new Set(draftNodes.flatMap(n => n.participants));
    return groupParticipants.filter(gp => !assignedIds.has(gp.registrationId));
  };

  const handleReshuffle = () => {
    const allAssignedParticipants = draftNodes.flatMap(n => n.participants);
    if (allAssignedParticipants.length === 0) {
      toast.error("Aucun participant assigné à mélanger.");
      return;
    }

    const shuffled = [...allAssignedParticipants].sort(() => Math.random() - 0.5);
    let pointer = 0;
    
    const newDrafts = draftNodes.map(node => {
      const count = node.participants.length;
      const participants = shuffled.slice(pointer, pointer + count);
      pointer += count;
      return { ...node, participants };
    });

    setDraftNodes(newDrafts);
    toast.success("Participants remélangés.");
  };

  const handleDistributeRemaining = () => {
    const available = getAvailableParticipants().map(p => p.registrationId);
    if (available.length === 0) {
      toast.info("Tous les participants sont déjà assignés.");
      return;
    }
    if (draftNodes.length === 0) {
      toast.error("Ajoutez d'abord des nœuds au draft.");
      return;
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const newDrafts = [...draftNodes];
    
    shuffled.forEach((regId, idx) => {
      const nodeIdx = idx % newDrafts.length;
      newDrafts[nodeIdx].participants = [...newDrafts[nodeIdx].participants, regId];
    });

    setDraftNodes(newDrafts);
    toast.success(`${available.length} participants distribués.`);
  };

  const handleAutoAssign = () => {
    if (draftNodes.length === 0) {
      toast.error("Ajoutez d'abord des nœuds au draft.");
      return;
    }

    const availableRegIds = groupParticipants
      .map((gp) => gp.registrationId)
      .filter(Boolean);

    // Shuffle available participants if random/seeding
    const isRandom = phaseConfig?.logic === "RANDOM" || groupConfig?.logic === "RANDOM" || true; // Default to true for auto-assign
    const shuffled = isRandom ? [...availableRegIds].sort(() => Math.random() - 0.5) : [...availableRegIds];

    const newDrafts = draftNodes.map((node, i) => {
      // Pick 2 participants for each node if available
      const p1 = shuffled[i * 2] || "";
      const p2 = shuffled[i * 2 + 1] || "";
      return {
        ...node,
        participants: [p1, p2].filter(Boolean),
      };
    });

    setDraftNodes(newDrafts);
    toast.success("Participants assignés (2 par nœud).");
  };

  const handleAddToDraft = () => {
    const count = parseInt(nodeCount) || 1;
    const round = parseInt(startRound) || 1;
    const startIndex = draftNodes.length + existingNodes.length;
    
    const maxPossible = Math.max(1, groupParticipants.length);
    if (count + startIndex > 50) { // Safety limit
       toast.error("Limite de nœuds atteinte pour ce groupe.");
       return;
    }

    const newDrafts: DraftNode[] = [];
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      newDrafts.push({
        nodeCode: `${nodePrefix}${idx + 1}`,
        round,
        matchNumber: idx + 1,
        bracketType: "UPPER",
        order: idx + 1,
        participants: [],
        generateMatches: true,
        matchesCount: 1,
      });
    }
    setDraftNodes([...draftNodes, ...newDrafts]);
    toast.success(`${count} nœud(s) ajouté(s) au draft.`);
  };

  const handleRemoveDraft = (idx: number) => {
    setDraftNodes(draftNodes.filter((_, i) => i !== idx));
  };

  const handleSaveNodes = () => {
    if (draftNodes.length === 0) return;

    startTransition(async () => {
      try {
        await bulkCreateBracketNodes(
          draftNodes.map(n => ({
            ...n,
            phaseId,
            groupId,
            editionId, // Pass editionId for auto match generation
            metadata: {
              participants: n.participants,
              name: n.nodeCode,
              generateMatches: n.generateMatches,
              matchesCount: n.matchesCount,
              format: 'BEST_OF_1'
            },
          } as any))
        );
        toast.success(`${draftNodes.length} nœuds créés avec succès.`);
        setDraftNodes([]);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la création groupée des nœuds.");
      }
    });
  };

  const handleDeleteExisting = async (id: string) => {
    try {
      await deleteBracketNode(id);
      toast.success("Nœud supprimé.");
      router.refresh();
    } catch (error) {
      toast.error("Erreur suppression.");
    }
  };

  const isDuplicate = (code: string) => {
     const inExisting = existingNodes.some(n => n.nodeCode === code);
     const inDraft = draftNodes.filter(n => n.nodeCode === code).length > 1;
     return inExisting || inDraft;
  };

  const isAssigned = (regId: string) => {
    return draftNodes.some(n => n.participants.includes(regId));
  };

  return (
    <div className="space-y-6">
      {/* Alert Config */}
      {(phaseConfig?.logic || groupConfig?.logic) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">Configuration de l'organisation</p>
            <p className="text-xs text-amber-600/80">
              La phase est configurée sur <span className="font-bold">{phaseConfig?.logic || groupConfig?.logic}</span>. 
              { (phaseConfig?.logic === "RANDOM" || groupConfig?.logic === "RANDOM") 
                ? " Les participants seront répartis aléatoirement par défaut." 
                : " Vous pouvez organiser les rencontres manuellement."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Configuration & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/10 shadow-lg h-fit">
            <CardHeader className="bg-primary/5 pb-4 rounded-t-xl">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> Configuration Batch
              </CardTitle>
              <CardDescription className="text-xs">
                Préparez plusieurs nœuds avant de les sauvegarder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Préfixe</label>
                <input 
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                  value={nodePrefix}
                  onChange={(e) => setNodePrefix(e.target.value)}
                  placeholder="ex: QF, SF"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Quantité</label>
                  <input 
                    type="number"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                    value={nodeCount}
                    onChange={(e) => {
                       const val = parseInt(e.target.value);
                       if (val > 50) return;
                       setNodeCount(e.target.value);
                    }}
                    max={50}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Round</label>
                  <input 
                    type="number"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                    value={startRound}
                    onChange={(e) => setStartRound(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  variant="secondary"
                  className="w-full gap-2 font-bold" 
                  onClick={handleAddToDraft}
                >
                  <Plus className="h-4 w-4" /> Ajouter au Draft
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="gap-2 font-bold border-primary/20" 
                    onClick={handleAutoAssign}
                    disabled={draftNodes.length === 0}
                  >
                    <RefreshCcw className="h-4 w-4" /> Auto (2/node)
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-2 font-bold border-primary/20" 
                    onClick={handleDistributeRemaining}
                    disabled={draftNodes.length === 0 || getAvailableParticipants().length === 0}
                  >
                    <Users className="h-4 w-4" /> Distribute All
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/30 rounded-b-xl flex flex-col gap-2">
              <Button 
                variant="outline"
                className="w-full gap-2 font-bold"
                onClick={handleReshuffle}
                disabled={draftNodes.length === 0 || !draftNodes.some(n => n.participants.length > 0)}
              >
                <RefreshCcw className="h-4 w-4" /> Remélanger Draft
              </Button>
              <Button 
                className="w-full gap-2 font-bold shadow-md shadow-primary/20" 
                onClick={handleSaveNodes}
                disabled={isPending || draftNodes.length === 0}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isPending ? "Sauvegarde..." : `Sauvegarder ${draftNodes.length} nœuds`}
              </Button>
            </CardFooter>
          </Card>

          {/* Participants Stand */}
          <Card className="h-fit">
            <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Stand Groupe
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{getAvailableParticipants().length} restants</Badge>
            </CardHeader>
            <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-1.5">
                {groupParticipants.map(gp => {
                  const assigned = isAssigned(gp.registrationId);
                  return (
                    <div 
                      key={gp.registrationId} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border text-xs transition-colors",
                        assigned ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "bg-card border-border/50"
                      )}
                    >
                      <span className="font-medium truncate max-w-[120px]">{getName(gp.registrationId)}</span>
                      {assigned ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List Column */}
        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl">
            <Tabs defaultValue="draft" className="w-full">
              <CardHeader className="border-b pb-0">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" /> Gestion des Nœuds
                  </CardTitle>
                </div>
                <TabsList className="bg-transparent gap-6 p-0 h-10 justify-start">
                  <TabsTrigger value="draft" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2">
                    Draft <Badge variant="secondary" className="h-5 min-w-5 px-1">{draftNodes.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="existing" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2">
                    Existants <Badge variant="outline" className="h-5 min-w-5 px-1">{existingNodes.length}</Badge>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="draft" className="m-0 focus-visible:ring-0">
                  {draftNodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                      <Plus className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">Le draft est vide</p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[800px] overflow-y-auto">
                      {draftNodes.map((n, i) => (
                        <div key={i} className="p-4 hover:bg-primary/5 transition-colors space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                {n.nodeCode}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">{n.nodeCode}</span>
                                  {isDuplicate(n.nodeCode) && (
                                    <Badge variant="destructive" className="h-4 text-[8px] px-1 font-bold">DOUBLON</Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-mono">Round {n.round} • Match #{n.matchNumber}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <input 
                                      type="checkbox" 
                                      id={`gen-${i}`}
                                      className="h-3.5 w-3.5"
                                      checked={n.generateMatches}
                                      onChange={(e) => {
                                        const next = [...draftNodes];
                                        next[i].generateMatches = e.target.checked;
                                        setDraftNodes(next);
                                      }}
                                    />
                                    <label htmlFor={`gen-${i}`} className="text-[10px] font-bold uppercase cursor-pointer">Générer Matchs</label>
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveDraft(i)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>

                          <div className="pl-12 space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {n.participants.map((regId, pIdx) => (
                                <Badge 
                                  key={regId} 
                                  variant="secondary" 
                                  className="gap-1 pr-1 bg-muted/50 border-none h-7 text-[11px]"
                                >
                                  {getName(regId)}
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive rounded-full"
                                    onClick={() => {
                                      const next = [...draftNodes];
                                      next[i].participants = next[i].participants.filter(id => id !== regId);
                                      setDraftNodes(next);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                              <select 
                                className="h-7 text-[10px] bg-primary/10 border-none rounded-full px-2 font-bold text-primary outline-none focus:ring-1 focus:ring-primary"
                                value=""
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  const next = [...draftNodes];
                                  if (next[i].participants.includes(e.target.value)) return;
                                  next[i].participants = [...next[i].participants, e.target.value];
                                  setDraftNodes(next);
                                }}
                              >
                                <option value="">+ Ajouter</option>
                                {groupParticipants
                                  .filter(gp => !isAssigned(gp.registrationId) || n.participants.includes(gp.registrationId))
                                  .map(gp => (
                                    <option key={gp.registrationId} value={gp.registrationId}>
                                      {getName(gp.registrationId)}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="existing" className="m-0 focus-visible:ring-0">
                  {existingNodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                      <RefreshCcw className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">Aucun nœud permanent</p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[800px] overflow-y-auto">
                      {existingNodes.sort((a,b) => (a.order || 0) - (b.order || 0)).map((n) => (
                        <div key={n.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs ring-1 ring-border">
                              {n.nodeCode}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{n.nodeCode}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-mono">ID: {n.id.slice(0,8)}</span>
                                <Badge variant="outline" className="h-4 text-[8px] px-1">{(n.metadata as any)?.participants?.length || 0} pts</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                              <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${n.id}`}>
                                Gérer
                              </Link>
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteExisting(n.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
