// @/components/pages/tournaments/edition-detail/bracket-node-matches-organize-client.tsx
"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkCreateMatches, deleteMatch, generateBracketMatches, updateMatch } from "@/actions/phases";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BracketNodeMatchesOrganizeClientProps {
  node: any;
  editionId: string;
  tournamentId: string;
  allRegistrations: any[];
  groupParticipants: any[];
  existingMatches: any[];
}

type MatchFormat = "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5" | "HOME_AWAY";

type DraftMatch = {
  id: string;
  participant1RegistrationId: string;
  participant2RegistrationId: string;
  format: MatchFormat;
  leg: number;
  round: number;
  matchNumber: number;
  scheduledTime?: Date;
};

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"draft" | "existing">("draft");

  // Récupération de la configuration héritée
  const nodeMetadata = node.metadata as any || {};
  const inheritedFormat = nodeMetadata.format || "BEST_OF_1";
  const inheritedParticipants = nodeMetadata.participants || [];
  
  const [draftMatches, setDraftMatches] = useState<DraftMatch[]>([]);
  
  // État pour le formulaire d'ajout
  const [p1, setP1] = useState<string>(inheritedParticipants[0] || "");
  const [p2, setP2] = useState<string>(inheritedParticipants[1] || "");
  const [matchCount, setMatchCount] = useState<string>("1");
  const [format, setFormat] = useState<MatchFormat>(inheritedFormat);
  const [round, setRound] = useState<number>(node.round || 1);
  const [scheduledTime, setScheduledTime] = useState<string>("");

  const hasNodeParticipants = inheritedParticipants.length >= 2;
  const totalParticipants = groupParticipants.length;

  const getName = (id: string | null | undefined) => {
    if (!id) return "À déterminer";
    const reg = allRegistrations.find((r) => r.id === id);
    return (
      reg?.member?.displayName ||
      reg?.member?.user?.username ||
      reg?.member?.team?.name ||
      "Joueur"
    );
  };

  const getParticipantStatus = (id: string) => {
    if (inheritedParticipants.includes(id)) return "bracket";
    const hasMatches = existingMatches.some(
      m => m.participant1RegistrationId === id || m.participant2RegistrationId === id
    );
    if (hasMatches) return "scheduled";
    return "available";
  };

  const handleAutoFill = () => {
    if (inheritedParticipants.length >= 2) {
      setP1(inheritedParticipants[0]);
      setP2(inheritedParticipants[1]);
      toast.success("Participants du bracket pré-remplis.");
    } else {
      toast.error("Pas assez de participants assignés à ce bracket.");
    }
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
    const startMatchNumber = existingMatches.length + draftMatches.length + 1;
    
    const newDrafts: DraftMatch[] = [];
    for (let i = 0; i < count; i++) {
      newDrafts.push({
        id: generateTempId(),
        participant1RegistrationId: p1,
        participant2RegistrationId: p2,
        format,
        leg: i + 1,
        round,
        matchNumber: startMatchNumber + i,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      });
    }
    setDraftMatches([...draftMatches, ...newDrafts]);
    toast.success(`${count} match(s) ajouté(s) au draft.`);
  };

  const handleGenerateAllMatches = () => {
    if (inheritedParticipants.length < 2) {
      toast.error("Ce bracket n'a pas assez de participants pour générer des matchs.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await generateBracketMatches(node.id, { forceRecreate: false });
        if (result.success) {
          toast.success(`${result.count} match(s) généré(s) automatiquement.`);
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la génération des matchs.");
      }
    });
  };

  const handleSaveDrafts = () => {
    if (draftMatches.length === 0) return;

    startTransition(async () => {
      try {
        await bulkCreateMatches(
          draftMatches.map((m, idx) => ({
            editionId,
            phaseId: node.phaseId,
            groupId: node.groupId,
            bracketNodeId: node.id,
            round: m.round,
            matchNumber: m.matchNumber,
            participant1RegistrationId: m.participant1RegistrationId,
            participant2RegistrationId: m.participant2RegistrationId,
            matchCode: `${node.nodeCode || "BR"}-M${existingMatches.length + idx + 1}`,
            status: "PENDING",
            scheduledTime: m.scheduledTime,
            metadata: { format: m.format, leg: m.leg },
          }) as any),
        );
        toast.success(`${draftMatches.length} matchs sauvegardés.`);
        setDraftMatches([]);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la sauvegarde bulk.");
      }
    });
  };

  const handleRemoveDraft = (id: string) => {
    setDraftMatches(draftMatches.filter(m => m.id !== id));
  };

  const handleUpdateDraft = (id: string, updates: Partial<DraftMatch>) => {
    setDraftMatches(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
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

  const handleUpdateScore = async (matchId: string, score1: number, score2: number) => {
    startTransition(async () => {
      try {
        const winnerId = score1 > score2 ? 
          (await getMatchParticipants(matchId)).participant1 : 
          (await getMatchParticipants(matchId)).participant2;
        
        await updateMatch(matchId, {
          score1,
          score2,
          winnerRegistrationId: winnerId,
          status: "COMPLETED",
          confirmedByAdmin: true,
        });
        toast.success("Score mis à jour");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la mise à jour du score");
      }
    });
  };

  const getMatchParticipants = async (matchId: string) => {
    const match = existingMatches.find(m => m.id === matchId);
    return {
      participant1: match?.participant1RegistrationId,
      participant2: match?.participant2RegistrationId,
    };
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const completed = existingMatches.filter(m => m.status === "COMPLETED").length;
    const pending = existingMatches.filter(m => m.status === "PENDING").length;
    const inProgress = existingMatches.filter(m => m.status === "IN_PROGRESS").length;
    return { completed, pending, inProgress, total: existingMatches.length };
  }, [existingMatches]);

  return (
    <div className="space-y-6">
      {/* Bandeau de configuration héritée */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Configuration du bracket</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">Format: {inheritedFormat}</Badge>
          <Badge variant="secondary">{inheritedParticipants.length} participant(s)</Badge>
          {nodeMetadata.generateMatches !== false && <Badge variant="secondary">Génération auto ✓</Badge>}
        </div>
      </div>

      {/* Alertes */}
      {hasNodeParticipants ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-700">Participants Assignés</p>
            <p className="text-xs text-emerald-600/80">
              Ce bracket a déjà {inheritedParticipants.length} participants assignés.
              Vous pouvez générer automatiquement tous les matchs ou les créer manuellement.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
              onClick={handleAutoFill}
            >
              <RefreshCw className="h-3 w-3" /> Auto-remplir
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleGenerateAllMatches}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Swords className="h-3 w-3" />}
              Générer tous les matchs
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">Aucun participant assigné</p>
            <p className="text-xs text-amber-600/80">
              Aucun participant n'est assigné à ce bracket. Vous devez les
              sélectionner manuellement parmi les participants du groupe.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de configuration */}
        <Card className="lg:col-span-1 border-primary/10 shadow-lg h-fit sticky top-6">
          <CardHeader className="bg-primary/5 pb-4 rounded-t-xl">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> Configurateur de Matchs
            </CardTitle>
            <CardDescription className="text-xs">
              Sélectionnez les duellistes et configurez la série
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {/* Sélection des participants */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Joueur 1
                </Label>
                <Select value={p1} onValueChange={setP1}>
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Choisir P1" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupParticipants.map((pg: any) => {
                      const status = getParticipantStatus(pg.registrationId);
                      return (
                        <SelectItem key={pg.registrationId} value={pg.registrationId}>
                          <div className="flex items-center gap-2">
                            {getName(pg.registrationId)}
                            {status === "bracket" && (
                              <Badge variant="secondary" className="h-3.5 text-[8px] bg-emerald-500/10 text-emerald-600 border-none">
                                Bracket
                              </Badge>
                            )}
                            {status === "scheduled" && (
                              <Badge variant="outline" className="h-3.5 text-[8px]">
                                Programmé
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-background border rounded-full p-2 shadow-sm text-muted-foreground">
                  <Swords className="h-3 w-3" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Joueur 2
                </Label>
                <Select value={p2} onValueChange={setP2}>
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Choisir P2" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupParticipants.map((pg: any) => {
                      const status = getParticipantStatus(pg.registrationId);
                      return (
                        <SelectItem key={pg.registrationId} value={pg.registrationId}>
                          <div className="flex items-center gap-2">
                            {getName(pg.registrationId)}
                            {status === "bracket" && (
                              <Badge variant="secondary" className="h-3.5 text-[8px] bg-emerald-500/10 text-emerald-600 border-none">
                                Bracket
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Configuration de la série */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Série
                </Label>
                <Select value={matchCount} onValueChange={setMatchCount}>
                  <SelectTrigger className="h-10 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Match unique</SelectItem>
                    <SelectItem value="2">Aller/Retour</SelectItem>
                    <SelectItem value="3">BO3</SelectItem>
                    <SelectItem value="5">BO5</SelectItem>
                    <SelectItem value="7">BO7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Format
                </Label>
                <Select value={format} onValueChange={(v: MatchFormat) => setFormat(v)}>
                  <SelectTrigger className="h-10 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEST_OF_1">Standard (BO1)</SelectItem>
                    <SelectItem value="BEST_OF_3">Meilleur des 3 (BO3)</SelectItem>
                    <SelectItem value="BEST_OF_5">Meilleur des 5 (BO5)</SelectItem>
                    <SelectItem value="HOME_AWAY">Aller-Retour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Round et date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Round
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={round}
                  onChange={(e) => setRound(parseInt(e.target.value) || 1)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Date planifiée
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full gap-2 font-bold h-11"
              onClick={handleAddToDraft}
              disabled={!p1 || !p2 || p1 === p2}
            >
              <Plus className="h-4 w-4" /> Ajouter au Draft
            </Button>
          </CardContent>
          <CardFooter className="pt-4 border-t bg-muted/30 rounded-b-xl flex flex-col gap-2">
            <Button
              className="w-full gap-2 font-bold h-12 shadow-md shadow-primary/20"
              onClick={handleSaveDrafts}
              disabled={isPending || draftMatches.length === 0}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {isPending
                ? "Sauvegarde..."
                : `Sauvegarder ${draftMatches.length} Matchs`}
            </Button>
            {stats.total > 0 && (
              <div className="flex justify-between w-full text-[10px] text-muted-foreground pt-2">
                <span>✓ {stats.completed} terminés</span>
                <span>⏳ {stats.inProgress} en cours</span>
                <span>📅 {stats.pending} programmés</span>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Colonne de liste */}
        <Card className="lg:col-span-2 border-none shadow-xl flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex flex-col h-full">
            <CardHeader className="border-b pb-0 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Swords className="h-4 w-4 text-primary" /> Matchs du Nœud
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {stats.total} matchs existants
                </Badge>
              </div>
              <TabsList className="bg-transparent gap-6 p-0 h-10 justify-start">
                <TabsTrigger
                  value="draft"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2 font-bold text-xs"
                >
                  Draft{" "}
                  <Badge variant="secondary" className="h-5 min-w-5 px-1">
                    {draftMatches.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="existing"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2 font-bold text-xs"
                >
                  Existants{" "}
                  <Badge variant="outline" className="h-5 min-w-5 px-1">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="draft" className="m-0 focus-visible:ring-0">
                {draftMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                    <Plus className="h-12 w-12 mb-3" />
                    <p className="text-sm font-medium">Le draft est vide</p>
                    <p className="text-xs">Ajoutez des matchs depuis le configurateur</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {draftMatches.map((m, idx) => (
                      <DraftMatchCard
                        key={m.id}
                        match={m}
                        index={idx}
                        getName={getName}
                        onUpdate={(updates: any) => handleUpdateDraft(m.id, updates)}
                        onRemove={() => handleRemoveDraft(m.id)}
                        participants={groupParticipants}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="existing" className="m-0 focus-visible:ring-0">
                {existingMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                    <Swords className="h-12 w-12 mb-3" />
                    <p className="text-sm font-medium">Aucun match existant</p>
                    <p className="text-xs">Générez des matchs ou ajoutez-en manuellement</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {existingMatches.map((match) => (
                      <ExistingMatchCard
                        key={match.id}
                        match={match}
                        getName={getName}
                        onDelete={() => handleDeleteExisting(match.id)}
                        onUpdateScore={(score1: number, score2: number) => handleUpdateScore(match.id, score1, score2)}
                        isPending={isPending}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

// Composant pour une carte de match en draft
function DraftMatchCard({ match, index, getName, onUpdate, onRemove, participants }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={cn(
        "p-4 hover:bg-primary/5 transition-colors",
        isExpanded && "bg-primary/5"
      )}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                {index + 1}
              </div>
              <div>
                <div className="font-medium text-sm">
                  {getName(match.participant1RegistrationId)} vs {getName(match.participant2RegistrationId)}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Leg {match.leg}/{match.format === "BEST_OF_5" ? 5 : match.format === "BEST_OF_3" ? 3 : 1}</span>
                  <span>•</span>
                  <span>Round {match.round}</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-[8px]">{match.format}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-4 pl-11 space-y-3 border-t mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">Round</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={match.round}
                  onChange={(e) => onUpdate({ round: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Match #</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={match.matchNumber}
                  onChange={(e) => onUpdate({ matchNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Format</Label>
              <Select value={match.format} onValueChange={(v: any) => onUpdate({ format: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEST_OF_1">BO1</SelectItem>
                  <SelectItem value="BEST_OF_3">BO3</SelectItem>
                  <SelectItem value="BEST_OF_5">BO5</SelectItem>
                  <SelectItem value="HOME_AWAY">Aller-Retour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Composant pour une carte de match existant
function ExistingMatchCard({ match, getName, onDelete, onUpdateScore, isPending }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [score1, setScore1] = useState(match.score1 || "");
  const [score2, setScore2] = useState(match.score2 || "");

  const getStatusBadge = () => {
    switch (match.status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-none">Terminé</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500/10 text-blue-600 border-none">En cours</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-amber-500/10 text-amber-600 border-none">En attente</Badge>;
      default:
        return <Badge variant="outline">Programmé</Badge>;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={cn(
        "p-4 hover:bg-muted/30 transition-colors",
        isExpanded && "bg-muted/30"
      )}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs ring-1 ring-border">
                {match.matchNumber}
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-2">
                  {getName(match.participant1RegistrationId)} vs {getName(match.participant2RegistrationId)}
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {match.score1 !== null && match.score2 !== null ? (
                    <span className="font-mono font-bold">Score: {match.score1} - {match.score2}</span>
                  ) : (
                    <span>Non joué</span>
                  )}
                  {match.winnerRegistrationId && (
                    <span>• Vainqueur: {getName(match.winnerRegistrationId)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-4 pl-14 space-y-3 border-t mt-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Score Joueur 1</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-lg font-bold text-center"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Score Joueur 2</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-lg font-bold text-center"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onUpdateScore(parseInt(score1) || 0, parseInt(score2) || 0)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                Valider le score
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}