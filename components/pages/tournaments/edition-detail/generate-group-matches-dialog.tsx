"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Swords, AlertCircle, Users, RefreshCw } from "lucide-react";
import { createMatch } from "@/actions/tournaments";
import { 
  generateMatchesAction,
  getBracketNodes,
  getPhaseGroupParticipants,
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
    /** Groupe-journée RR refondu : les brackets sont définis par la config */
    isMatchday?: boolean;
    /** Nombre de confrontations prévu dans config du groupe */
    fixturesCount?: number;
  };
  asFormOnly?: boolean;
}

export function GenerateGroupMatchesDialog({
  groupId,
  editionId,
  phaseId,
  maxMatches = 100,
  existingMatchesCount = 0,
  groupConfig,
  asFormOnly = false,
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

  // Calculations moved to server-side preview if needed, but for this dialog we keep simple estimates

  // Vérifier la faisabilité
  useEffect(() => {
    if (open || asFormOnly) {
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

          // Simple estimate for display
          const expected = (count * (count - 1)) / 2;
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
      const res = await generateMatchesAction("GROUP", groupId, {
        isHomeAway: format === "HOME_AWAY",
        seedingMethod: shuffleParticipants ? "RANDOM" : "SEQUENTIAL",
        clearExisting: hasMatches // Si des matchs existent déjà, on les écrase (régénération)
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Matchs générés avec succès.");
      
      if (!asFormOnly) {
        setOpen(false);
      } else {
        router.back();
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const isGenerationPossible = participantsCount >= 2;
  const isDisabled = !isGenerationPossible || loading;
  const hasMatches = existingMatchesCount > 0;

  const formContent = (
    <form onSubmit={handleGenerate} className={cn("space-y-6", !asFormOnly && "pt-4")}>
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
              {groupConfig?.isMatchday ? (
                /* Groupe-journée : les confrontations proviennent de la config
                   du groupe, pas du choix utilisateur. */
                <p className="text-xs text-muted-foreground italic">
                  Confrontations de la journée : auto
                  {typeof groupConfig.fixturesCount === "number"
                    ? ` (config.fixturesCount : ${groupConfig.fixturesCount})`
                    : " (config.fixturesCount)"}
                </p>
              ) : (
                <>
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
                </>
              )}
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

      <div className="flex gap-2 sm:gap-0 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={() => asFormOnly ? router.back() : setOpen(false)} disabled={loading} className="mr-2">
          Annuler
        </Button>
        <Button type="submit" disabled={isDisabled} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
          {loading ? "Génération..." : "Générer maintenant"}
        </Button>
      </div>
    </form>
  );

  if (asFormOnly) {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasMatches ? "ghost" : "outline"} 
          className={cn("gap-2", hasMatches ? "text-muted-foreground text-xs h-8" : "border-primary/20 bg-primary/5 text-primary")} 
          disabled={!isGenerationPossible}
        >
          {hasMatches ? (
            <><RefreshCw className="h-3.5 w-3.5" /> Régénérer ({existingMatchesCount} matches)</>
          ) : (
            <><Swords className="h-4 w-4" /> Générer les matchs</>
          )}
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

        {formContent}
      </DialogContent>
    </Dialog>
  );
}
