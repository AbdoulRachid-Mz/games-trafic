"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Swords, AlertCircle, Users, RefreshCw } from "lucide-react";
import { createMatch } from "@/actions/tournaments";
import { 
  getPhaseGroupParticipants, 
  getMatches, 
  getBracketNodes, 
  createBracketNode, 
  generateBracketMatches,
  getTournamentPhaseById 
} from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PhaseGroupParticipant, Match, BracketNode, TournamentPhase } from "@/database/schema";
import { GitBranch, Hash } from "lucide-react";

interface GenerateGroupMatchesDialogProps {
  groupId: string;
  editionId: string;
  phaseId: string;
  /** Nombre maximum de matchs autorisés pour ce groupe */
  maxMatches?: number;
  /** Mode round-robin déjà partiellement généré ? */
  existingMatchesCount?: number;
  /** Config du groupe (nombre de participants max, etc.) */
  groupConfig?: {
    maxParticipants?: number;
    matchesPerParticipant?: number;
  };
}

export function GenerateGroupMatchesDialog({
  groupId,
  editionId,
  phaseId,
  maxMatches = 100,
  existingMatchesCount = 0,
  groupConfig,
}: GenerateGroupMatchesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [expectedMatchesCount, setExpectedMatchesCount] = useState(0);
  const [bracketNodesList, setBracketNodesList] = useState<BracketNode[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [nodesToCreate, setNodesToCreate] = useState(1);
  const [phaseType, setPhaseType] = useState<string>("");
  const router = useRouter();

  // Calculer le nombre de matchs attendus selon le format
  const calculateExpectedMatches = (participants: number, format: string) => {
    if (format === "SINGLE") {
      return (participants * (participants - 1)) / 2;
    } else if (format === "HOME_AWAY") {
      return participants * (participants - 1);
    }
    return 0;
  };

  // Vérifier la faisabilité à l'ouverture
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [ptsRes, nodesRes, phaseRes] = await Promise.all([
            getPhaseGroupParticipants({
              filters: { groupId },
              pagination: { page: 1, limit: 500 },
            }),
            getBracketNodes({
              filters: { groupId },
              pagination: { page: 1, limit: 100 },
            }),
            getTournamentPhaseById(phaseId)
          ]);

          const participants = ptsRes.data as PhaseGroupParticipant[];
          const count = participants.length;
          setParticipantsCount(count);

          const nodes = nodesRes.data as BracketNode[];
          setBracketNodesList(nodes);
          setSelectedNodeIds(nodes.map(n => n.id));
          
          if (phaseRes) {
            setPhaseType(phaseRes.phaseType || "");
          }

          // Calculer pour le format SINGLE par défaut
          const expected = calculateExpectedMatches(count, "SINGLE");
          setExpectedMatchesCount(expected);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [open, groupId, phaseId]);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const format = (formData.get("format") as string) || "SINGLE";
    const shuffleParticipants = formData.get("shuffle") === "on";

    try {
      // 1. Fetch participants
      const list = await getPhaseGroupParticipants({
        filters: { groupId },
        pagination: { page: 1, limit: 500 },
      });
      const items = list.data as PhaseGroupParticipant[];
      let regIds = items
        .map((p) => p.registrationId)
        .filter(Boolean) as string[];

      if (regIds.length < 2) {
        throw new Error("Pas assez de participants dans le groupe (minimum 2).");
      }

      if (shuffleParticipants) {
        regIds = [...regIds].sort(() => Math.random() - 0.5);
      }

      let nodesToProcess: BracketNode[] = [];

      // 2. Handle Bracket Nodes
      if (bracketNodesList.length === 0) {
        // Create new nodes if requested
        const nodeCount = nodesToCreate;
        const participantsPerNode = Math.ceil(regIds.length / nodeCount);
        
        for (let i = 0; i < nodeCount; i++) {
          const nodeParticipants = regIds.slice(i * participantsPerNode, (i + 1) * participantsPerNode);
          if (nodeParticipants.length < 2) continue;

          const nodeName = phaseType === "ROUND_ROBIN" ? `Jour ${i + 1}` : `Bracket ${String.fromCharCode(65 + i)}`;
          const newNode = await createBracketNode({
            phaseId,
            groupId,
            nodeCode: `${groupId.slice(0, 4)}-${i + 1}`,
            round: i + 1,
            order: i,
            metadata: { 
              participants: nodeParticipants,
              name: nodeName
            }
          } as any);
          nodesToProcess.push(newNode);
        }
      } else {
        // Use selected nodes
        nodesToProcess = bracketNodesList.filter(n => selectedNodeIds.includes(n.id));
      }

      if (nodesToProcess.length === 0) {
        throw new Error("Aucun bracket sélectionné ou créé pour la génération.");
      }

      // 3. Generate matches for each node
      let totalCreated = 0;
      for (const node of nodesToProcess) {
        const res = await generateBracketMatches(node.id, { 
          returnType: format === "HOME_AWAY" ? "double" : "single",
          forceRecreate: false 
        });
        totalCreated += res.count;
      }

      toast.success(`${totalCreated} match(s) généré(s) à travers ${nodesToProcess.length} bracket(s).`);
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const isGenerationPossible = participantsCount >= 2;
  const isDisabled = !isGenerationPossible || loading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!isGenerationPossible}>
          <RefreshCw className="h-4 w-4" /> Générer matches (Brackets)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Génération via Brackets
          </DialogTitle>
          <DialogDescription>
            Les matches seront créés et répartis dans les brackets du groupe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerate} className="space-y-6 pt-4">
          {/* Participants Info */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Participants disponibles</span>
            </div>
            <Badge variant="secondary">{participantsCount}</Badge>
          </div>

          {/* Bracket Selection/Creation */}
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2">
              <GitBranch className="h-4 w-4" /> Configuration des Brackets
            </Label>
            
            {bracketNodesList.length > 0 ? (
              <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Sélectionner les brackets</p>
                {bracketNodesList.map(node => (
                  <div key={node.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`node-${node.id}`} 
                      checked={selectedNodeIds.includes(node.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedNodeIds([...selectedNodeIds, node.id]);
                        else setSelectedNodeIds(selectedNodeIds.filter(id => id !== node.id));
                      }}
                    />
                    <label htmlFor={`node-${node.id}`} className="text-sm cursor-pointer">
                      {(node.metadata as any)?.name || `Bracket #${node.nodeCode || node.id.slice(0, 4)}`}
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        ({((node.metadata as any)?.participants || []).length} pts)
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-lg bg-primary/5 space-y-3">
                <p className="text-xs text-center text-muted-foreground">
                  Aucun bracket n'existe pour ce groupe. Ils seront créés automatiquement.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="node-count" className="text-xs">Nombre de brackets (Journées/Sous-groupes)</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      id="node-count" 
                      type="number" 
                      min={1} 
                      max={Math.floor(participantsCount / 2)}
                      value={nodesToCreate}
                      onChange={(e) => setNodesToCreate(parseInt(e.target.value) || 1)}
                      className="h-8 w-20"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      ~{Math.ceil(participantsCount / nodesToCreate)} participants par bracket
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                name="format"
                defaultValue="SINGLE"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="SINGLE">Round-robin</option>
                <option value="HOME_AWAY">Aller-retour</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="shuffle" name="shuffle" defaultChecked />
                <Label htmlFor="shuffle" className="text-xs font-normal cursor-pointer">
                  Mélanger aléatoirement
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isDisabled} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              {loading ? "Génération..." : "Générer maintenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
