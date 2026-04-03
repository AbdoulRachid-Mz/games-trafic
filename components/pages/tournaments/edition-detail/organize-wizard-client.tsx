// @/components/pages/tournaments/edition-detail/organize-wizard-client.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  RefreshCw,
  Play,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  ListOrdered,
  MoveRight,
  LayoutGrid,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { organizeEditionStructure } from "@/actions/phases";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type DraftPhase = {
  name: string;
  phaseType: "GROUP_STAGE" | "ELIMINATION";
  order: number;
};

export function OrganizeWizardClient({
  editionId,
  tournamentId,
  edition,
}: {
  editionId: string;
  tournamentId: string;
  edition: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("AUTO");

  // Draft State for Manual Mode
  const [draftPhases, setDraftPhases] = useState<DraftPhase[]>([
    { name: "Phase 1: Groupes", phaseType: "GROUP_STAGE", order: 0 },
    { name: "Phase 2: Élimination", phaseType: "ELIMINATION", order: 1 },
  ]);

  // Magic Flow State for Auto Mode
  const [autoConfig, setAutoConfig] = useState({
    includeGroups: true,
    includeQuarterFinals: true,
    includeSemiFinals: true,
    includeFinal: true,
  });




  const [participantStrategy, setParticipantStrategy] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>(
    edition?.registrations?.map((r: any) => r.id) || [],
  );

  // Auto-init state
  const [autoInit, setAutoInit] = useState(true);
  const [groupsSize, setGroupsSize] = useState(4);

  const maxParticipants = edition?.maxParticipants || 0;
  const currentParticipantsCount = selectedRegIds.length;
  const isOverLimit = maxParticipants > 0 && currentParticipantsCount > maxParticipants;

  const existingPhasesCount = edition?.phases?.length || 0;
  const hasExistingPhases = existingPhasesCount > 0;

  const handleAddDraftPhase = () => {
    const newOrder = draftPhases.length;
    setDraftPhases([
      ...draftPhases,
      {
        name: `Phase ${newOrder + 1}`,
        phaseType: "ELIMINATION",
        order: newOrder,
      },
    ]);
  };

  const handleRemoveDraftPhase = (index: number) => {
    const updated = draftPhases
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, order: i }));
    setDraftPhases(updated);
  };

  const handleUpdateDraftPhase = (index: number, updates: Partial<DraftPhase>) => {
    const updated = [...draftPhases];
    updated[index] = { ...updated[index], ...updates };
    setDraftPhases(updated);
  };

  const handleSaveOrganize = () => {
    let phasesToCreate: DraftPhase[] = [];

    if (mode === "AUTO") {
      if (autoConfig.includeGroups) {
        phasesToCreate.push({ name: "Phase de groupes", phaseType: "GROUP_STAGE", order: phasesToCreate.length });
      }
      if (autoConfig.includeQuarterFinals) {
        phasesToCreate.push({ name: "Quarts de finale", phaseType: "ELIMINATION", order: phasesToCreate.length });
      }
      if (autoConfig.includeSemiFinals) {
        phasesToCreate.push({ name: "Demi-finales", phaseType: "ELIMINATION", order: phasesToCreate.length });
      }
      if (autoConfig.includeFinal) {
        phasesToCreate.push({ name: "Finale", phaseType: "ELIMINATION", order: phasesToCreate.length });
      }
    } else {
      phasesToCreate = draftPhases;
    }

    if (phasesToCreate.length === 0) {
      toast.error("Veuillez configurer au moins une phase.");
      return;
    }

    startTransition(async () => {
      try {
        await organizeEditionStructure(
          editionId,
          phasesToCreate.map((p, idx) => ({
            ...p,
            order: idx + existingPhasesCount,
            isActive: idx === 0 && !hasExistingPhases,
            isCompleted: false,
            isHidden: false,
            isDeleted: false,
          })),
          selectedRegIds,
          {
            autoInitializeFirstPhase: autoInit,
            groupsSize: groupsSize
          }
        );

        toast.success("Structure et participants configurés avec succès !");
        
        setTimeout(() => {
          router.push(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`);
          router.refresh();
        }, 1000);
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'organisation.");
      }
    });
  };

  const getName = (reg: any) =>
    reg.member?.displayName || reg.member?.user?.username || "Joueur";

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Organisateur d'Édition</h2>
          <p className="text-muted-foreground text-sm">
            Configurez la hiérarchie des phases et les participants de départ.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg self-start">
          <Button
            variant={mode === "AUTO" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("AUTO")}
            className="gap-2"
          >
            <Zap className="h-4 w-4" /> Magique
          </Button>
          <Button
            variant={mode === "MANUAL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("MANUAL")}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" /> Manuel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Step 1: Structure */}
        <Card className="relative overflow-hidden border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5">
          {hasExistingPhases && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
              <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Structure Existante</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Votre édition contient déjà {existingPhasesCount} phase(s). Le générateur est en mode "Ajout".
              </p>
               <Button
                variant="outline"
                onClick={() => setMode("MANUAL")}
              >
                Continuer en Mode Manuel
              </Button>
            </div>
          )}

          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings2 className="w-6 h-6 text-primary" /> 1. Configuration des Phases
            </CardTitle>
            <CardDescription>
              {mode === "AUTO" 
                ? "Utilisez des modèles prédéfinis pour aller plus vite." 
                : "Construisez votre séquence de phases sur mesure (Draft)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "AUTO" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3">
                    <Label className="font-bold text-xs uppercase tracking-wider text-primary">Modèle Classique</Label>
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center space-x-3">
                        <Checkbox id="groups" checked={autoConfig.includeGroups} onCheckedChange={(v) => setAutoConfig({ ...autoConfig, includeGroups: !!v })} />
                        <Label htmlFor="groups" className="text-sm font-medium cursor-pointer">Groupes</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="qf" checked={autoConfig.includeQuarterFinals} onCheckedChange={(v) => setAutoConfig({ ...autoConfig, includeQuarterFinals: !!v })} />
                        <Label htmlFor="qf" className="text-sm font-medium cursor-pointer">Quarts</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="sf" checked={autoConfig.includeSemiFinals} onCheckedChange={(v) => setAutoConfig({ ...autoConfig, includeSemiFinals: !!v })} />
                        <Label htmlFor="sf" className="text-sm font-medium cursor-pointer">Demies</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="f" checked={autoConfig.includeFinal} onCheckedChange={(v) => setAutoConfig({ ...autoConfig, includeFinal: !!v })} />
                        <Label htmlFor="f" className="text-sm font-medium cursor-pointer">Finale</Label>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-card/50 flex flex-col items-center justify-center text-center opacity-50">
                    <LayoutGrid className="h-8 w-8 mb-2" />
                    <p className="text-xs font-bold uppercase">Plus de modèles</p>
                    <p className="text-[10px]">Bientôt disponible</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs uppercase tracking-wider text-primary">Séquence Draft</Label>
                  <Button size="xs" variant="outline" onClick={handleAddDraftPhase} className="h-7 gap-1">
                    <Plus className="h-3 w-3" /> Ajouter
                  </Button>
                </div>
                <div className="space-y-3">
                  {draftPhases.map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-card p-3 rounded-lg border border-primary/10 group animate-in slide-in-from-left-2 duration-200">
                      <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <input 
                        className="bg-transparent border-none focus:ring-0 text-sm font-semibold flex-1 min-w-0"
                        value={phase.name}
                        onChange={(e) => handleUpdateDraftPhase(idx, { name: e.target.value })}
                        placeholder="Nom de la phase"
                      />
                      <select 
                        className="text-[10px] bg-muted border-none rounded px-2 h-6 font-bold"
                        value={phase.phaseType}
                        onChange={(e) => handleUpdateDraftPhase(idx, { phaseType: e.target.value as any })}
                      >
                        <option value="GROUP_STAGE">POULES</option>
                        <option value="ELIMINATION">BRACKET</option>
                      </select>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveDraftPhase(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {draftPhases.length === 0 && (
                    <div className="py-6 text-center border-dashed border-2 rounded-xl text-muted-foreground text-xs">
                      Aucune phase dans le draft. Cliquez sur ajouter.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                 <Label className="font-bold text-xs uppercase tracking-wider text-primary">Stratégie Participants</Label>
                 <div className="flex items-center gap-2">
                    {maxParticipants > 0 && (
                      <Badge variant={isOverLimit ? "destructive" : "outline"} className="text-[10px]">
                        Capacité: {currentParticipantsCount}/{maxParticipants}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">{currentParticipantsCount} sélectionnés</Badge>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={participantStrategy === "ALL" ? "default" : "outline"}
                  size="sm"
                  className="justify-start gap-2 h-10"
                  onClick={() => {
                    setParticipantStrategy("ALL");
                    setSelectedRegIds(edition?.registrations?.map((r: any) => r.id) || []);
                  }}
                >
                  <Users className="h-4 w-4" /> Tous
                </Button>
                <Button
                  variant={participantStrategy === "SELECTED" ? "default" : "outline"}
                  size="sm"
                  className="justify-start gap-2 h-10"
                  onClick={() => setParticipantStrategy("SELECTED")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Manuel
                </Button>
              </div>

              {/* Propagation Options */}
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="autoInit" 
                      checked={autoInit} 
                      onCheckedChange={(v) => setAutoInit(!!v)} 
                    />
                    <Label htmlFor="autoInit" className="text-xs font-bold cursor-pointer">
                      Initialiser la Phase 1
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-[10px] max-w-[200px]">
                            Crée automatiquement les groupes et assigne les participants sélectionnés à la première phase.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {autoInit && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">Taille Groupes</Label>
                    <input 
                      type="number"
                      min={2}
                      max={64}
                      className="bg-background border rounded px-2 h-6 w-16 text-xs text-center font-bold"
                      value={groupsSize}
                      onChange={(e) => setGroupsSize(parseInt(e.target.value) || 4)}
                    />
                  </div>
                )}
              </div>
            </div>

            <Button
              className={cn(
                "w-full h-14 text-lg font-bold shadow-lg gap-3",
                isOverLimit ? "bg-destructive hover:bg-destructive" : "shadow-primary/20"
              )}
              disabled={isPending || (mode === "MANUAL" && draftPhases.length === 0) || isOverLimit}
              onClick={handleSaveOrganize}
            >
              {isPending ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : isOverLimit ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
              {isPending 
                ? "Actions en cours..." 
                : isOverLimit 
                  ? "Limite dépassée" 
                  : "Sauvegarder & Déployer"}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Selection */}
        <Card className="border-none shadow-xl bg-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> 2. Participants ({edition?.registrations?.length || 0})
            </CardTitle>
            <CardDescription className="text-xs">
              {participantStrategy === "ALL"
                ? "Tous les inscrits sont inclus."
                : "Sélectionnez les membres pour cette structure."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="max-h-[550px] overflow-y-auto">
              {edition?.registrations?.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground italic text-sm">
                  Aucun participant inscrit.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border/50">
                    {edition?.registrations?.map((reg: any) => (
                      <tr
                        key={reg.id}
                        className="hover:bg-primary/5 transition-colors group"
                      >
                        <td className="p-4 w-12">
                          <Checkbox
                            checked={selectedRegIds.includes(reg.id)}
                            disabled={participantStrategy === "ALL" || isPending}
                            onCheckedChange={(v) => {
                              if (v)
                                setSelectedRegIds([...selectedRegIds, reg.id]);
                              else
                                setSelectedRegIds(
                                  selectedRegIds.filter((id) => id !== reg.id),
                                );
                            }}
                            className="h-5 w-5"
                          />
                        </td>
                        <td className="p-4">
                          <div className={cn("font-bold text-sm", !selectedRegIds.includes(reg.id) && "text-muted-foreground/50")}>
                            {getName(reg)}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="bg-muted px-1.5 py-0.5 rounded uppercase font-mono tracking-tighter">
                              ID: {reg.id.slice(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {selectedRegIds.includes(reg.id) ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] ring-1 ring-emerald-500/20">
                              INCLUS
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground text-[10px] opacity-40 border-dashed"
                            >
                              EXCLU
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-4 rounded-xl text-primary text-sm shadow-sm group">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <ListOrdered className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold flex items-center gap-1.5">
            Validation de la Hiérarchie <MoveRight className="h-3 w-3" /> Participants
          </p>
          <p className="text-xs opacity-80 leading-relaxed">
            Les participants sélectionnés ici seront propagés aux groupes de la Phase 1. 
            Les phases suivantes (Bracket) dépendront des résultats des phases précédentes.
          </p>
        </div>
      </div>
    </div>
  );
}
