// @/components/pages/tournaments/edition-detail/create-match-dialog.tsx
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
import { Loader2, Plus, Swords, AlertCircle, Users, Info } from "lucide-react";
import { createMatch } from "@/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateMatchDialogProps {
  editionId: string;
  phaseId: string;
  phaseType?: string;
  groupId: string | null;
  bracketNodeId: string | null;
  participants: Array<{
    registrationId: string;
    displayName: string;
    teamName?: string;
    isQualified?: boolean;
  }>;
  defaultRound?: number;
  defaultMatchNumber?: number;
  maxMatches?: number;
  currentMatchesCount?: number;
  inheritedConfig?: {
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5" | "HOME_AWAY";
    generateMatches?: boolean;
    pointsPerWin?: number;
    pointsPerDraw?: number;
    pointsPerLoss?: number;
  };
}

export function CreateMatchDialog({
  editionId,
  phaseId,
  phaseType = "GROUP_STAGE",
  groupId,
  bracketNodeId,
  participants,
  defaultRound = 1,
  defaultMatchNumber = 1,
  maxMatches = 100,
  currentMatchesCount = 0,
  inheritedConfig,
}: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [matchFormat, setMatchFormat] = useState<"BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5" | "HOME_AWAY">(
    inheritedConfig?.matchFormat || "BEST_OF_1"
  );
  const [generateScoreInputs, setGenerateScoreInputs] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const router = useRouter();

  const isAtCapacity = currentMatchesCount >= maxMatches;
  const remainingSlots = maxMatches - currentMatchesCount;

  useEffect(() => {
    if (open) {
      if (isAtCapacity) {
        setCapacityError(`Limite de matchs atteinte (${currentMatchesCount}/${maxMatches})`);
      } else {
        setCapacityError(null);
      }
    }
  }, [open, isAtCapacity, currentMatchesCount, maxMatches]);

  const getParticipantDisplay = (participant: typeof participants[0]) => {
    return participant.teamName 
      ? `${participant.displayName} (${participant.teamName})`
      : participant.displayName;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (capacityError) {
      toast.error("Action impossible: " + capacityError);
      return;
    }
    
    if (!p1 || !p2) {
      toast.error("Veuillez sélectionner deux participants.");
      return;
    }
    
    if (p1 === p2) {
      toast.error("Un participant ne peut pas jouer contre lui-même.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const round = Number(formData.get("round") || defaultRound);
    const matchNumber = Number(formData.get("matchNumber") || defaultMatchNumber);
    const scheduledTime = formData.get("scheduledTime") ? new Date(formData.get("scheduledTime") as string) : undefined;
    const isDoubleMatch = formData.get("isDoubleMatch") === "on";

    try {
      const matchesToCreate = isDoubleMatch ? 2 : 1;
      
      for (let i = 0; i < matchesToCreate; i++) {
        await createMatch({
          editionId,
          phaseId,
          groupId: groupId as any,
          bracketNodeId: bracketNodeId as any,
          round: isDoubleMatch && i === 1 ? round + 1 : round,
          matchNumber: matchNumber + i,
          participant1RegistrationId: isDoubleMatch && i === 1 ? p2 : p1,
          participant2RegistrationId: isDoubleMatch && i === 1 ? p1 : p2,
          scheduledTime,
          status: "PENDING",
          metadata: { 
            format: matchFormat,
            leg: i + 1,
            totalLegs: matchesToCreate,
          },
        } as any);
      }

      toast.success(`${matchesToCreate} match(s) créé(s) avec succès`);
      setOpen(false);
      setP1("");
      setP2("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const getMatchCountOptions = () => {
    if (phaseType === "ELIMINATION") {
      return [
        { value: "1", label: "Match unique" },
        { value: "3", label: "BO3 (meilleur des 3)" },
        { value: "5", label: "BO5 (meilleur des 5)" },
      ];
    }
    return [
      { value: "1", label: "Match unique" },
      { value: "2", label: "Aller-Retour" },
    ];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="gap-2" 
          disabled={isAtCapacity || participants.length < 2}
        >
          <Plus className="h-4 w-4" /> 
          Créer un match
          {isAtCapacity && (
            <Badge variant="destructive" className="ml-1 text-[8px] h-4">
              Limite
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Nouveau match
          </DialogTitle>
          <DialogDescription>
            Créez une confrontation entre deux participants.
          </DialogDescription>
        </DialogHeader>

        {/* Configuration héritée */}
        {inheritedConfig && Object.keys(inheritedConfig).length > 0 && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase mb-2">
              <Info className="h-3 w-3" /> Configuration héritée
            </div>
            <div className="flex flex-wrap gap-1">
              {inheritedConfig.matchFormat && (
                <Badge variant="secondary" className="text-[9px]">
                  Format: {inheritedConfig.matchFormat}
                </Badge>
              )}
              {inheritedConfig.pointsPerWin !== undefined && (
                <Badge variant="secondary" className="text-[9px]">
                  Points: V{inheritedConfig.pointsPerWin}/N{inheritedConfig.pointsPerDraw}/D{inheritedConfig.pointsPerLoss}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {capacityError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{capacityError}</span>
          </div>
        )}
        
        {!isAtCapacity && remainingSlots <= 10 && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            Plus que {remainingSlots} match(s) disponible(s)
          </div>
        )}
        
        {participants.length < 2 && (
          <div className="p-3 bg-muted rounded-lg flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            <span>Ajoutez d'abord des participants à ce groupe/bracket.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p1">Joueur 1</Label>
              <Select value={p1} onValueChange={setP1} disabled={participants.length < 2}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.registrationId} value={p.registrationId}>
                      {getParticipantDisplay(p)}
                      {p.isQualified && " (✓ qualifié)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2">Joueur 2</Label>
              <Select value={p2} onValueChange={setP2} disabled={participants.length < 2}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.registrationId} value={p.registrationId}>
                      {getParticipantDisplay(p)}
                      {p.isQualified && " (✓ qualifié)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="round">Round</Label>
              <Input
                id="round"
                name="round"
                type="number"
                min={1}
                defaultValue={defaultRound}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matchNumber">Match #</Label>
              <Input
                id="matchNumber"
                name="matchNumber"
                type="number"
                min={1}
                defaultValue={currentMatchesCount + 1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledTime">Date & Heure (Optionnel)</Label>
            <Input id="scheduledTime" name="scheduledTime" type="datetime-local" />
          </div>

          <div className="space-y-3 p-3 rounded-lg bg-muted/30">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Configuration du match
            </Label>
            
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Format</Label>
              <Select value={matchFormat} onValueChange={(v: any) => setMatchFormat(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEST_OF_1">BO1 (un match)</SelectItem>
                  <SelectItem value="BEST_OF_3">BO3 (meilleur des 3)</SelectItem>
                  <SelectItem value="BEST_OF_5">BO5 (meilleur des 5)</SelectItem>
                  {phaseType !== "ELIMINATION" && (
                    <SelectItem value="HOME_AWAY">Aller-Retour</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="double-match"
                name="isDoubleMatch"
                checked={generateScoreInputs}
                onCheckedChange={(v) => setGenerateScoreInputs(!!v)}
              />
              <Label htmlFor="double-match" className="text-xs cursor-pointer">
                Match aller-retour (deux confrontations)
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !!capacityError || participants.length < 2 || !p1 || !p2 || p1 === p2} 
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              Créer le match
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}