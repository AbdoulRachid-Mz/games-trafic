// @/components/pages/tournaments/edition-detail/group-nodes-organize-client.tsx
"use client";

import { useState, useTransition, useCallback, useMemo, useEffect } from "react";
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
  Trash2,
  Loader2,
  Settings2,
  GitBranch,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Calendar,
  Trophy,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkCreateBracketNodes, deleteBracketNode, generateMatchesAction, getStructurePreviewAction } from "@/actions/phases";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface GroupNodesOrganizeClientProps {
  tournamentId: string;
  editionId: string;
  groupId: string;
  phaseId: string;
  phaseType: string;
  existingNodes: any[];
  groupParticipants: any[];
  allRegistrations: any[];
  groupConfig?: any;
  phaseConfig?: any;
  editionConfig: {
    competitionType?: string;
    competitionMode?: "AUTO" | "MANUAL";
    [key: string]: any;
  };
}

type MatchFormat = "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";
type NodeType = "ROUND_ROBIN" | "ELIMINATION" | "SWISS";

type DraftNode = {
  id: string;
  nodeCode: string;
  round: number;
  matchNumber: number;
  bracketType: "UPPER" | "LOWER";
  order: number;
  participants: string[];
  nodeType: NodeType;
  config: {
    generateMatches: boolean;
    matchesCount: number;
    matchFormat: MatchFormat;
    roundsCount?: number;
    participantsPerNode?: number;
  };
};

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function GroupNodesOrganizeClient({
  tournamentId,
  editionId,
  groupId,
  phaseId,
  phaseType,
  existingNodes,
  groupParticipants,
  allRegistrations,
  groupConfig,
  phaseConfig,
  editionConfig,
}: GroupNodesOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAutoMode = editionConfig.competitionMode === "AUTO";
  const [draftNodes, setDraftNodes] = useState<DraftNode[]>([]);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"draft" | "existing">("draft");

  // Héritage de la configuration parente
  const inheritedConfig = useMemo(() => ({
    nodeType: (groupConfig?.nodesType || phaseConfig?.nodesType || "ROUND_ROBIN") as NodeType,
    matchFormat: (groupConfig?.matchFormat || phaseConfig?.matchFormat || "BEST_OF_1") as MatchFormat,
    roundsCount: groupConfig?.roundsCount || phaseConfig?.roundsCount || 5,
    generateMatches: groupConfig?.generateMatches !== false && phaseConfig?.generateMatches !== false,
    participantsPerNode: groupConfig?.participantsPerNode || phaseConfig?.participantsPerNode || 2,
  }), [groupConfig, phaseConfig]);

  const [nodeType, setNodeType] = useState<NodeType>(inheritedConfig.nodeType);
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(inheritedConfig.matchFormat);
  const [roundsCount, setRoundsCount] = useState(inheritedConfig.roundsCount);
  const [generateMatches, setGenerateMatches] = useState(inheritedConfig.generateMatches);
  const [participantsPerNode, setParticipantsPerNode] = useState(inheritedConfig.participantsPerNode);

  const [serverPreview, setServerPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Mettre à jour le preview via le serveur
  useEffect(() => {
    const updatePreview = async () => {
      if (groupParticipants.length === 0) return;
      
      setIsPreviewLoading(true);
      try {
        const config = {
          nodesType: nodeType,
          roundsCount,
          generateMatches,
          isHomeAway: !!groupConfig?.isHomeAway,
          groupsCount: 1,
        };

        const previewData = await getStructurePreviewAction(
          editionId,
          [{
            name: "Groupe Actuel",
            phaseType: phaseType as any,
            order: 0,
            config
          }],
          groupParticipants.map(p => p.registrationId)
        );
        
        setServerPreview(previewData?.phases?.[0]?.groups?.[0] || null);
      } catch (error) {
        console.error("Preview error:", error);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(updatePreview, 500);
    return () => clearTimeout(timer);
  }, [nodeType, roundsCount, generateMatches, editionId, groupId, phaseType, groupParticipants, groupConfig]);

  const getName = (id: string | null | undefined) => {
    if (!id) return "À déterminer";
    const reg = allRegistrations.find(r => r.id === id);
    return reg?.member?.displayName || reg?.member?.user?.username || reg?.member?.team?.name || "Joueur";
  };

  const getAvailableParticipants = () => {
    const assignedIds = new Set(draftNodes.flatMap(n => n.participants));
    return groupParticipants.filter(gp => !assignedIds.has(gp.registrationId));
  };

  const handleAutoGenerateNodes = () => {
    const participantIds = groupParticipants.map(p => p.registrationId).filter(Boolean);
    const shuffled = [...participantIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newDrafts: DraftNode[] = [];
    
    if (nodeType === "ROUND_ROBIN") {
      // Créer un nœud par journée
      const rounds = participantIds.length - 1;
      for (let r = 1; r <= rounds; r++) {
        newDrafts.push({
          id: generateTempId(),
          nodeCode: `J${r}`,
          round: r,
          matchNumber: r,
          bracketType: "UPPER",
          order: r,
          participants: [],
          nodeType: "ROUND_ROBIN",
          config: {
            generateMatches,
            matchesCount: Math.floor(participantIds.length / 2),
            matchFormat,
          },
        });
      }
    } 
    else if (nodeType === "ELIMINATION") {
      // Créer un nœud par match
      const totalMatches = participantIds.length - 1;
      let matchCounter = 1;
      let currentRound = 1;
      let matchesThisRound = Math.pow(2, Math.ceil(Math.log2(participantIds.length)) - 1);
      
      while (matchCounter <= totalMatches) {
        for (let m = 0; m < matchesThisRound && matchCounter <= totalMatches; m++) {
          const p1 = shuffled[(matchCounter - 1) * 2] || "";
          const p2 = shuffled[(matchCounter - 1) * 2 + 1] || "";
          newDrafts.push({
            id: generateTempId(),
            nodeCode: `R${currentRound}M${m + 1}`,
            round: currentRound,
            matchNumber: matchCounter,
            bracketType: "UPPER",
            order: matchCounter,
            participants: [p1, p2].filter(Boolean),
            nodeType: "ELIMINATION",
            config: {
              generateMatches,
              matchesCount: 1,
              matchFormat,
            },
          });
          matchCounter++;
        }
        currentRound++;
        matchesThisRound = Math.ceil(matchesThisRound / 2);
      }
    }
    else if (nodeType === "SWISS") {
      for (let r = 1; r <= roundsCount; r++) {
        newDrafts.push({
          id: generateTempId(),
          nodeCode: `R${r}`,
          round: r,
          matchNumber: r,
          bracketType: "UPPER",
          order: r,
          participants: [],
          nodeType: "SWISS",
          config: {
            generateMatches,
            matchesCount: Math.floor(participantIds.length / 2),
            matchFormat,
            roundsCount,
          },
        });
      }
    }

    setDraftNodes(newDrafts);
    toast.success(`${newDrafts.length} nœud(s) généré(s)`);
  };

  const handleDistributeParticipants = () => {
    const availableParticipants = getAvailableParticipants().map(p => p.registrationId);
    const shuffled = [...availableParticipants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setDraftNodes(prev => prev.map((node, idx) => {
      if (node.nodeType === "ELIMINATION") {
        // 2 participants par nœud pour élimination
        const p1 = shuffled[idx * 2] || "";
        const p2 = shuffled[idx * 2 + 1] || "";
        return { ...node, participants: [p1, p2].filter(Boolean) };
      } else {
        // Distribution cyclique pour round robin / swiss
        const nodeCount = prev.length;
        const participantsForNode = shuffled.filter((_, i) => i % nodeCount === idx);
        return { ...node, participants: participantsForNode };
      }
    }));
    
    toast.success("Participants distribués");
  };

  const handleAddDraftNode = () => {
    const newNode: DraftNode = {
      id: generateTempId(),
      nodeCode: `N${draftNodes.length + existingNodes.length + 1}`,
      round: 1,
      matchNumber: draftNodes.length + existingNodes.length + 1,
      bracketType: "UPPER",
      order: draftNodes.length + existingNodes.length + 1,
      participants: [],
      nodeType,
      config: {
        generateMatches,
        matchesCount: nodeType === "ROUND_ROBIN" ? (serverPreview?.matchesCount || 1) / (serverPreview?.rounds || 1) : 1,
        matchFormat,
        roundsCount: nodeType === "SWISS" ? roundsCount : undefined,
      },
    };
    setDraftNodes([...draftNodes, newNode]);
    toast.success("Nœud ajouté au draft");
  };

  const handleRemoveDraftNode = (index: number) => {
    setDraftNodes(draftNodes.filter((_, i) => i !== index));
  };

  const handleUpdateDraftNode = (index: number, updates: Partial<DraftNode>) => {
    setDraftNodes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleAssignParticipant = (nodeIndex: number, registrationId: string) => {
    setDraftNodes(prev => {
      const updated = [...prev];
      if (!updated[nodeIndex].participants.includes(registrationId)) {
        updated[nodeIndex].participants = [...updated[nodeIndex].participants, registrationId];
      }
      return updated;
    });
  };

  const handleRemoveParticipant = (nodeIndex: number, registrationId: string) => {
    setDraftNodes(prev => {
      const updated = [...prev];
      updated[nodeIndex].participants = updated[nodeIndex].participants.filter(id => id !== registrationId);
      return updated;
    });
  };

  const handleSaveNodes = () => {
    if (draftNodes.length === 0) return;

    startTransition(async () => {
      try {
        const nodesToCreate = draftNodes.map(n => ({
          phaseId,
          groupId,
          nodeCode: n.nodeCode,
          round: n.round,
          matchNumber: n.matchNumber,
          bracketType: n.bracketType,
          order: n.order,
          nodeType: "MATCH",
          metadata: {
            participants: n.participants,
            name: n.nodeCode,
            generateMatches: n.config.generateMatches,
            matchesCount: n.config.matchesCount,
            format: n.config.matchFormat,
            nodeType: n.nodeType,
            roundsCount: n.config.roundsCount,
          },
        }));

        await bulkCreateBracketNodes(nodesToCreate as any);
        
        toast.success(`${draftNodes.length} nœud(s) créé(s) avec succès.`);
        setDraftNodes([]);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la création des nœuds.");
      }
    });
  };

  const handleGenerateMatchesForNode = async (nodeId: string) => {
    startTransition(async () => {
      try {
        const result = await generateMatchesAction("NODE", nodeId);
        if (result.success) {
          toast.success("Matchs générés avec succès");
          router.refresh();
        } else {
          toast.error(result.error || "Erreur lors de la génération");
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la génération des matchs");
      }
    });
  };

  const handleDeleteExistingNode = async (id: string) => {
    try {
      await deleteBracketNode(id);
      toast.success("Nœud supprimé");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const isParticipantAssigned = (registrationId: string) => {
    return draftNodes.some(n => n.participants.includes(registrationId));
  };

  const getRoundLabel = (round: number, totalRounds: number, nodeType: NodeType): string => {
    if (nodeType === "ELIMINATION") {
      const distanceToFinal = totalRounds - round;
      if (distanceToFinal === 0) return "Finale";
      if (distanceToFinal === 1) return "Demi-finale";
      if (distanceToFinal === 2) return "Quart de finale";
      if (distanceToFinal === 3) return "Huitième de finale";
      return `${Math.pow(2, distanceToFinal + 1)}ème de finale`;
    }
    if (nodeType === "SWISS") return `Round ${round}`;
    return `Journée ${round}`;
  };

  return (
    <div className="space-y-6">
      {/* Mode Auto Warning */}
      {isAutoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start shadow-sm">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="space-y-1">
             <h4 className="font-bold text-amber-900 text-sm">Mode Assistant Actif</h4>
             <p className="text-amber-800 text-xs leading-relaxed">
               L'édition est en mode Auto. La modification manuelle des nœuds de bracket peut briser la logique de qualification automatique. 
               Il est recommandé de basculer en <strong>Mode Manuel</strong> si vous souhaitez organiser ce groupe différemment de ce qui a été prévu par l'Assistant.
             </p>
          </div>
        </div>
      )}

      {/* Bandeau de configuration héritée */}
      {(groupConfig?.nodesType || phaseConfig?.nodesType) && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Configuration héritée</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {groupConfig?.nodesType && <Badge variant="secondary">Type: {groupConfig.nodesType}</Badge>}
            {phaseConfig?.nodesType && !groupConfig?.nodesType && <Badge variant="secondary">Phase: {phaseConfig.nodesType}</Badge>}
            {groupConfig?.matchFormat && <Badge variant="secondary">Format: {groupConfig.matchFormat}</Badge>}
            {groupConfig?.roundsCount && <Badge variant="secondary">{groupConfig.roundsCount} rounds</Badge>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Colonne gauche: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/10 shadow-lg sticky top-24">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> Configuration
              </CardTitle>
              <CardDescription className="text-xs">
                Paramètres pour la génération des nœuds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {isAutoMode ? (
                 <div className="space-y-4">
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
                    <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5" /> Configuration Automatique
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Ce groupe est géré par l'Assistant. Les paramètres (Format, Nœuds) sont prédéfinis.
                    </p>
                  </div>
                  <div className="space-y-1.5 opacity-70 cursor-not-allowed">
                     <Label className="text-[10px] font-bold uppercase text-muted-foreground">Type de nœuds</Label>
                     <Badge variant="outline" className="text-[10px] w-full justify-start">{nodeType}</Badge>
                  </div>
                  <div className="space-y-1.5 opacity-70 cursor-not-allowed">
                     <Label className="text-[10px] font-bold uppercase text-muted-foreground">Format Match</Label>
                     <Badge variant="outline" className="text-[10px] w-full justify-start">{matchFormat}</Badge>
                  </div>
                </div>
              ) : (
                <>
                  {/* Type de nœuds */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Type d'organisation
                    </Label>
                    <Select value={nodeType} onValueChange={(v: any) => setNodeType(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUND_ROBIN">Round Robin (Journées)</SelectItem>
                        <SelectItem value="ELIMINATION">Élimination directe</SelectItem>
                        <SelectItem value="SWISS">Système Suisse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Format des matchs */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Format des matchs
                    </Label>
                    <Select value={matchFormat} onValueChange={(v: any) => setMatchFormat(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEST_OF_1">BO1 (un match)</SelectItem>
                        <SelectItem value="BEST_OF_3">BO3 (au meilleur des 3)</SelectItem>
                        <SelectItem value="BEST_OF_5">BO5 (au meilleur des 5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rounds pour Swiss */}
                  {nodeType === "SWISS" && (
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Nombre de rounds
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[roundsCount]}
                          onValueChange={(v) => setRoundsCount(v[0])}
                          min={3}
                          max={11}
                          step={2}
                          className="flex-1"
                        />
                        <span className="w-12 text-center font-bold text-sm">{roundsCount}</span>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="gen-matches"
                      checked={generateMatches}
                      onCheckedChange={(v) => setGenerateMatches(!!v)}
                    />
                    <Label htmlFor="gen-matches" className="text-xs font-medium cursor-pointer">
                      Générer les matches immédiatement
                    </Label>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/30 flex flex-col gap-2">
              {isAutoMode ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full gap-2 font-bold"
                      disabled={isPending || groupParticipants.length === 0}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                      Générer la structure
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" /> Action Déconseillée
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        D'après le mode Auto, l'Assistant gère déjà la structure optimale. 
                        Toute régénération manuelle pourrait altérer les données de qualification.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAutoGenerateNodes}>Continuer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  className="w-full gap-2 font-bold"
                  onClick={handleAutoGenerateNodes}
                  disabled={isPending || groupParticipants.length === 0}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Générer la structure
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddDraftNode}
                  disabled={isPending}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" /> Ajouter nœud
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDistributeParticipants}
                  disabled={isPending || draftNodes.length === 0}
                  className="gap-1"
                >
                  <Users className="h-3 w-3" /> Distribuer
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Structure optimale
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {isPreviewLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : serverPreview ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Participants:</span>
                    <span className="font-bold">{groupParticipants.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Matchs:</span>
                    <span className="font-bold text-primary">{serverPreview.matchesCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rounds/Journées:</span>
                    <span className="font-bold">{serverPreview.rounds || 1}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Aucun aperçu disponible</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite: Draft des nœuds */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-xl">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <CardHeader className="border-b pb-0">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" /> Nœuds / Rencontres
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {draftNodes.length} en draft
                  </Badge>
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
                      <GitBranch className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">Aucun nœud dans le draft</p>
                      <p className="text-xs">Générez automatiquement ou ajoutez manuellement</p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {draftNodes.map((node, idx) => (
                        <NodeDraftCard
                          key={node.id}
                          node={node}
                          index={idx}
                          totalNodes={draftNodes.length}
                          nodeType={nodeType}
                          isExpanded={expandedNode === node.id}
                          onToggleExpand={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                          onUpdate={(updates: any) => handleUpdateDraftNode(idx, updates)}
                          onRemove={() => handleRemoveDraftNode(idx)}
                          onAssignParticipant={(regId: string) => handleAssignParticipant(idx, regId)}
                          onRemoveParticipant={(regId: string) => handleRemoveParticipant(idx, regId)}
                          availableParticipants={getAvailableParticipants()}
                          allParticipants={groupParticipants}
                          allRegistrations={allRegistrations}
                          getName={getName}
                          isParticipantAssigned={isParticipantAssigned}
                          matchFormat={matchFormat}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="existing" className="m-0 focus-visible:ring-0">
                  {existingNodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                      <GitBranch className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">Aucun nœud existant</p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {existingNodes.sort((a, b) => (a.order || 0) - (b.order || 0)).map((node) => {
                        const metadata = node.metadata as any;
                        const nodeParticipants = metadata?.participants || [];
                        return (
                          <div key={node.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                  {node.nodeCode || node.id.slice(0, 4)}
                                </div>
                                <div>
                                  <div className="font-bold text-sm">{node.nodeCode || "Nœud"}</div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>Round {node.round || 1}</span>
                                    <span>•</span>
                                    <span>{nodeParticipants.length} participants</span>
                                    {metadata?.format && <Badge variant="outline" className="text-[8px]">{metadata.format}</Badge>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => handleGenerateMatchesForNode(node.id)}
                                  disabled={isPending}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Générer matchs
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                                  <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${node.id}`}>
                                    Gérer
                                  </Link>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteExistingNode(node.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Bouton flottant de sauvegarde */}
          {draftNodes.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50">
              {isAutoMode ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="lg"
                      className="h-12 px-6 rounded-full shadow-2xl gap-2 font-bold"
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Sauvegarder {draftNodes.length} nœud(s)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" /> Sauvegarde Manuelle Déconseillée
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        L'Assistant gère actuellement cette édition. Ajouter manuellement ces nœuds peut impacter les résultats automatiques.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSaveNodes}>
                        Confirmer la sauvegarde
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  size="lg"
                  className="h-12 px-6 rounded-full shadow-2xl gap-2 font-bold"
                  onClick={handleSaveNodes}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Sauvegarder {draftNodes.length} nœud(s)
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour la carte de nœud en draft
function NodeDraftCard({
  node,
  index,
  totalNodes,
  nodeType,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAssignParticipant,
  onRemoveParticipant,
  availableParticipants,
  allParticipants,
  allRegistrations,
  getName,
  isParticipantAssigned,
  matchFormat,
}: any) {
  const getRoundLabelLocal = () => {
    if (nodeType === "ELIMINATION") {
      const distanceToFinal = totalNodes - index;
      if (distanceToFinal === 0) return "Finale";
      if (distanceToFinal === 1) return "Demi-finale";
      if (distanceToFinal === 2) return "Quart de finale";
      return `${Math.pow(2, distanceToFinal + 1)}ème`;
    }
    if (nodeType === "SWISS") return `Round ${node.round}`;
    return `Journée ${node.round}`;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className={cn(
        "transition-all",
        isExpanded ? "bg-primary/5" : "hover:bg-muted/30"
      )}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {node.nodeCode}
              </div>
              <div>
                <div className="font-medium text-sm">{getRoundLabelLocal()}</div>
                <div className="text-[10px] text-muted-foreground">
                  {node.participants.length} participant(s)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={node.config.generateMatches ? "default" : "outline"} className="text-[9px]">
                {node.config.matchFormat || matchFormat}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 border-t space-y-3">
            {/* Participants assignés */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Participants
              </Label>
              <div className="flex flex-wrap gap-2">
                {node.participants.map((regId: string) => (
                  <Badge key={regId} variant="secondary" className="gap-1 pr-1 h-7 text-xs">
                    {getName(regId)}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive rounded-full"
                      onClick={() => onRemoveParticipant(regId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                <select
                  className="h-7 text-xs bg-primary/10 border-none rounded-full px-3 font-bold text-primary outline-none focus:ring-1 focus:ring-primary"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssignParticipant(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">+ Ajouter</option>
                  {availableParticipants.map((p: any) => (
                    <option key={p.registrationId} value={p.registrationId}>
                      {getName(p.registrationId)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configuration du nœud */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">Code</Label>
                <Input
                  className="h-7 text-xs"
                  value={node.nodeCode}
                  onChange={(e) => onUpdate({ nodeCode: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Round</Label>
                <Input
                  type="number"
                  className="h-7 text-xs"
                  value={node.round}
                  onChange={(e) => onUpdate({ round: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`gen-matches-${node.id}`}
                checked={node.config.generateMatches}
                onCheckedChange={(v) => onUpdate({ config: { ...node.config, generateMatches: !!v } })}
              />
              <Label htmlFor={`gen-matches-${node.id}`} className="text-xs cursor-pointer">
                Générer les matches automatiquement
              </Label>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
