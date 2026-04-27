"use client";

import React, { useEffect, useState, useTransition } from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trophy,
  ArrowRight,
  XCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  Crown,
  Users,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  markBracketNodeCompleteAction,
  markGroupCompleteAction,
  markPhaseCompleteAction,
  organizeNextPhaseAction,
  getQualifiedParticipantsPreviewAction,
  getPhaseContextAction,
  getPhaseGroupById,
  getPhaseGroups,
  generateMatchesAction,
} from "@/actions/phases";
import { designateEditionWinnerAction } from "@/actions/editions";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { fireConfettiPreset } from "@/utils/confetti";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Types pour les étapes
type Step = "CONFIG" | "QUALIFIERS" | "WINNER" | "CONFIRM";

interface MarkCompleteDialogProps {
  type: "PHASE" | "GROUP" | "BRACKET_NODE";
  id: string;
  name: string;
  onComplete?: () => void;
  asFormOnly?: boolean;
  editionConfig?: {
    competitionMode?: "AUTO" | "MANUAL";
    competitionType?: string;
  };
  phaseId?: string;
}

export function MarkCompleteDialog({
  type,
  id,
  name,
  onComplete,
  asFormOnly = false,
  editionConfig = {},
  phaseId: propPhaseId,
}: MarkCompleteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(asFormOnly);
  const [isProcessing, startTransition] = useTransition();
  const [pendingEntities, setPendingEntities] = useState<
    Array<{ type: string; id: string; label: string; reason: string }>
  >([]);

  // État pour les étapes
  const [currentStep, setCurrentStep] = useState<Step>("CONFIG");
  const [stepsCompleted, setStepsCompleted] = useState<Set<Step>>(new Set());

  // Configuration
  const [generateMatches, setGenerateMatches] = useState(true);
  const [generateNodes, setGenerateNodes] = useState(true);
  const [isHomeAway, setIsHomeAway] = useState(false);
  const [matchFormat, setMatchFormat] = useState<
    "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5"
  >("BEST_OF_1");
  const [seedMethod, setSeedMethod] = useState<"RANDOM" | "ORDERED">("RANDOM");

  // Preview et sélection des qualifiés
  const [qualifiedPreview, setQualifiedPreview] = useState<
    Array<{
      id: string;
      name: string;
      groupId: string;
      position?: number | null;
      image?: string;
      email?: string;
      phone?: string;
      isQualified?: boolean;
    }>
  >([]);
  const [othersPreview, setOthersPreview] = useState<
    Array<{
      id: string;
      name: string;
      groupId: string;
      position?: number | null;
      image?: string;
      email?: string;
      phone?: string;
      isQualified?: boolean;
    }>
  >([]);
  const [selectedQualifiedIds, setSelectedQualifiedIds] = useState<string[]>(
    [],
  );
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [skipWinnerSelection, setSkipWinnerSelection] = useState(false);

  // Infos groupe
  const [group, setGroup] = useState<any>(null);
  const [phaseIdForGroup, setPhaseIdForGroup] = useState<string | null>(null);

  const routerHook = useRouter();

  // Contexte phase
  const { data: phaseContext, isLoading: isLoadingContext } = useQuery({
    queryKey: ["phase-context", id],
    queryFn: () => getPhaseContextAction(id),
    enabled: type === "PHASE" && !!id && isOpen,
    staleTime: 1000 * 30,
  });

  const actualPhaseType =
    type === "PHASE"
      ? phaseContext?.phaseType
      : group?.phase?.phaseType ||
        (type === "GROUP" && group?.groupType === "ELIMINATION_ROUND"
          ? "ELIMINATION"
          : null);

  const isEliminationPhase =
    actualPhaseType === "ELIMINATION" || actualPhaseType === "KNOCKOUT";
  const isGroupPhase =
    actualPhaseType === "GROUP_STAGE" || actualPhaseType === "ROUND_ROBIN";

  const isFinalPhase = phaseContext?.isFinalPhase ?? false;
  const totalPhasesInEdition = phaseContext?.totalPhasesInEdition ?? 1;
  const currentPhaseOrder = phaseContext?.currentPhaseOrder ?? 0;

  const isAutoMode = editionConfig.competitionMode === "AUTO";

  // Chargement des infos du groupe
  useEffect(() => {
    if (type === "GROUP" && isOpen) {
      const loadGroup = async () => {
        try {
          const groupData = await getPhaseGroupById(id, {
            populate: ["phase"],
          });
          setGroup(groupData);
          setPhaseIdForGroup(groupData?.phaseId || null);
        } catch (error) {
          console.error("Error loading group:", error);
        }
      };
      loadGroup();
    }
  }, [type, id, isOpen]);

  useEffect(() => {
    if (asFormOnly) {
      handleCheck();
    }
  }, [asFormOnly]);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const { checkPendingEntitiesAction } = await import("@/actions/phases");
      const result = await checkPendingEntitiesAction(type, id);
      if (result.success) {
        setPendingEntities(result.pendingEntities);
        if (!asFormOnly) {
          setIsOpen(true);
          // Réinitialiser les étapes
          setCurrentStep("CONFIG");
          setStepsCompleted(new Set());
          setSkipWinnerSelection(false);
          setSelectedWinnerId(null);
        }
      } else {
        toast.error("Erreur lors de la vérification");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsChecking(false);
    }
  };

  const loadQualifiedPreview = async () => {
    if (type !== "PHASE") return;

    try {
      const res = await getQualifiedParticipantsPreviewAction(id);
      if (res.success) {
        if (res.qualified) {
          setQualifiedPreview(res.qualified);
          setSelectedQualifiedIds(res.qualified.map((q: any) => q.id));
        }
        if (res.others) {
          setOthersPreview(res.others);
        }
      }
    } catch (err) {
      console.error("Failed to load qualified preview:", err);
    }
  };

  useEffect(() => {
    if (isOpen && type === "PHASE") {
      loadQualifiedPreview();
    }
  }, [isOpen, type, id]);

  const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

  // Navigation entre étapes
  const goToNextStep = () => {
    if (currentStep === "CONFIG") {
      if (type === "PHASE" && isGroupPhase && !isFinalPhase) {
        setCurrentStep("QUALIFIERS");
      } else if (type === "PHASE" && isFinalPhase) {
        setCurrentStep("WINNER");
      } else {
        setCurrentStep("CONFIRM");
      }
    } else if (currentStep === "QUALIFIERS") {
      // Validation du nombre de qualifiés si c'est pour une phase élimination
      if (isPowerOfTwo(selectedQualifiedIds.length)) {
        setCurrentStep("CONFIRM");
      } else {
        toast.error(
          `Le nombre de qualifiés (${selectedQualifiedIds.length}) doit être une puissance de 2 (2, 4, 8, 16, 32...) pour générer un arbre d'élimination.`,
        );
      }
    } else if (currentStep === "WINNER") {
      setCurrentStep("CONFIRM");
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === "QUALIFIERS") {
      setCurrentStep("CONFIG");
    } else if (currentStep === "CONFIRM") {
      if (type === "PHASE" && isGroupPhase && !isFinalPhase) {
        setCurrentStep("QUALIFIERS");
      } else if (type === "PHASE" && isFinalPhase) {
        setCurrentStep("WINNER");
      } else {
        setCurrentStep("CONFIG");
      }
    } else if (currentStep === "WINNER") {
      setCurrentStep("CONFIG");
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "CONFIG":
        return "Configuration";
      case "QUALIFIERS":
        return "Sélection des qualifiés";
      case "WINNER":
        return "Désignation du vainqueur";
      case "CONFIRM":
        return "Confirmation";
      default:
        return "Clôture";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "CONFIG":
        return "Paramétrez l'organisation de la suite";
      case "QUALIFIERS":
        return "Sélectionnez les participants qui accèdent à la phase suivante";
      case "WINNER":
        return "Désignez le champion final (optionnel)";
      case "CONFIRM":
        return "Vérifiez les informations avant de valider";
      default:
        return "";
    }
  };

  const handleComplete = () => {
    startTransition(async () => {
      try {
        let markResult: any;

        if (type === "GROUP") {
          markResult = await markGroupCompleteAction(id, {
            seedingMethod: seedMethod === "ORDERED" ? "SEQUENTIAL" : seedMethod,
            isHomeAway: isHomeAway,
            matchFormat: matchFormat,
          });
        } else if (type === "PHASE") {
          markResult = await markPhaseCompleteAction(id);
        } else if (type === "BRACKET_NODE") {
          markResult = await markBracketNodeCompleteAction(id);
        }

        if (!markResult?.success) {
          toast.error(markResult?.error || "Erreur lors de la clôture");
          return;
        }

        toast.success(`${name} marqué comme terminé avec succès !`);

        // Organisation de la phase suivante
        if (type === "PHASE" && phaseContext?.nextPhaseId && !isFinalPhase) {
          const organizeResult = await organizeNextPhaseAction(
            phaseContext.nextPhaseId,
            {
              generateNodes: isAutoMode ? true : generateNodes,
              generateMatches: isAutoMode ? true : generateMatches,
              seedMethod,
              isHomeAway,
              matchFormat,
              force: true,
              customQualifiedIds: selectedQualifiedIds,
            },
          );

          if (organizeResult.success) {
            toast.success(
              `Phase "${phaseContext.nextPhaseName}" organisée avec succès !`,
            );
          } else {
            toast.warning(
              `Phase terminée mais erreur lors de l'organisation: ${organizeResult.error}`,
            );
          }
        }

        // Désignation du vainqueur (si non sauté)
        if (
          type === "PHASE" &&
          isFinalPhase &&
          !skipWinnerSelection &&
          selectedWinnerId
        ) {
          const winner = qualifiedPreview.find(
            (p) => p.id === selectedWinnerId,
          );
          if (winner) {
            const winnerMetadata = {
              id: winner.id,
              username: winner.name,
              image: winner.image,
              email: winner.email,
              phone: winner.phone,
            };
            await designateEditionWinnerAction(
              phaseContext?.editionId || id,
              winner.id,
              winnerMetadata,
            );
            fireConfettiPreset("success");
            toast.success(`Félicitations au vainqueur : ${winner.name} !`);
          }
        }

        setIsOpen(false);
        routerHook.refresh();
        if (onComplete) onComplete();

        if (asFormOnly) {
          routerHook.back();
        }
      } catch (error) {
        console.error("Complete error:", error);
        toast.error("Une erreur est survenue");
      }
    });
  };

  const handleClose = () => {
    if (!isProcessing) {
      setIsOpen(false);
      if (asFormOnly) {
        routerHook.back();
      }
    }
  };

  const typeLabel =
    type === "PHASE" ? "la phase" : type === "GROUP" ? "le groupe" : "le nœud";
  const isBlocked = pendingEntities.length > 0;

  const showConfig =
    (type === "PHASE" && !isFinalPhase && !isBlocked && !isChecking) ||
    (type === "GROUP" &&
      isEliminationPhase &&
      !isBlocked &&
      !isChecking &&
      group &&
      !group.isCompleted);

  const isLoading =
    isChecking || (type === "PHASE" && isLoadingContext && isOpen);

  // Rendu du contenu selon l'étape
  const renderStepContent = () => {
    switch (currentStep) {
      case "CONFIG":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Toutes les entités de <strong>{name}</strong> sont terminées.
              </p>
            </div>

            {showConfig && (
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-bold">
                      {type === "PHASE"
                        ? "Configuration de la phase suivante"
                        : "Configuration du prochain round"}
                    </Label>
                  </div>
                  {isAutoMode && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-primary/5 text-primary border-primary/20"
                    >
                      Mode Auto
                    </Badge>
                  )}
                </div>

                {!isAutoMode ? (
                  <>
                    {isEliminationPhase && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">
                          Format des matchs
                        </Label>
                        <RadioGroup
                          value={matchFormat}
                          onValueChange={(v) => setMatchFormat(v as any)}
                          className="flex flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="BEST_OF_1" id="bo1" />
                            <Label
                              htmlFor="bo1"
                              className="text-xs cursor-pointer"
                            >
                              BO1
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="BEST_OF_3" id="bo3" />
                            <Label
                              htmlFor="bo3"
                              className="text-xs cursor-pointer"
                            >
                              BO3
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="BEST_OF_5" id="bo5" />
                            <Label
                              htmlFor="bo5"
                              className="text-xs cursor-pointer"
                            >
                              BO5
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="home-away"
                        className="text-xs cursor-pointer"
                      >
                        Aller-Retour
                      </Label>
                      <Checkbox
                        id="home-away"
                        checked={isHomeAway}
                        onCheckedChange={(v) => setIsHomeAway(!!v)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        Ordre des participants
                      </Label>
                      <Select
                        value={seedMethod}
                        onValueChange={(v) => setSeedMethod(v as any)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RANDOM">Aléatoire</SelectItem>
                          <SelectItem value="ORDERED">
                            Ordre d&apos;inscription
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground italic">
                      {type === "PHASE"
                        ? "Les paramètres de la phase suivante sont gérés automatiquement."
                        : "Les paramètres du prochain round sont gérés automatiquement."}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">
                      Niveaux de génération
                    </Label>
                  </div>
                  <div className="space-y-2 pl-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="gen-nodes"
                        className="text-xs cursor-pointer"
                      >
                        Créer les brackets / nœuds
                      </Label>
                      <Checkbox
                        id="gen-nodes"
                        checked={generateNodes}
                        onCheckedChange={(v) => {
                          setGenerateNodes(!!v);
                          if (!v) setGenerateMatches(false);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <Label
                        htmlFor="gen-matches"
                        className={`text-xs cursor-pointer ${!generateNodes ? "opacity-50" : ""}`}
                      >
                        Générer les matchs
                      </Label>
                      <Checkbox
                        id="gen-matches"
                        checked={generateMatches && generateNodes}
                        disabled={!generateNodes}
                        onCheckedChange={(v) => setGenerateMatches(!!v)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-2 rounded-lg text-[10px] space-y-1">
                  <p className="font-medium text-primary">📋 Récapitulatif</p>
                  {isAutoMode ? (
                    <p className="italic underline underline-offset-2">
                      Configuration automatique activée
                    </p>
                  ) : (
                    <>
                      <p>
                        • Format:{" "}
                        {matchFormat === "BEST_OF_1"
                          ? "BO1"
                          : matchFormat === "BEST_OF_3"
                            ? "BO3"
                            : "BO5"}
                      </p>
                      <p>• {isHomeAway ? "Aller-Retour" : "Aller simple"}</p>
                      <p>
                        •{" "}
                        {seedMethod === "RANDOM"
                          ? "Tirage aléatoire"
                          : "Ordre séquentiel"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {isFinalPhase && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-xs flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  {totalPhasesInEdition === 1
                    ? "C'est l'unique phase du tournoi. La clôture de cette phase finalisera l'édition."
                    : `C'est la phase finale (${currentPhaseOrder + 1}/${totalPhasesInEdition}).`}
                </p>
              </div>
            )}
          </div>
        );

      case "QUALIFIERS":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <Label className="text-sm font-bold">
                Sélection des participants qualifiés
              </Label>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Qualifiés d&apos;office
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-green-50 text-green-700"
                  >
                    {qualifiedPreview.length} participants
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden bg-background max-h-[250px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-2 text-left w-10">Qual.</th>
                        <th className="p-2 text-left">Participant</th>
                        <th className="p-2 text-left">Pos.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qualifiedPreview.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-0 hover:bg-muted/30"
                        >
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={selectedQualifiedIds.includes(p.id)}
                              onCheckedChange={(checked) => {
                                setSelectedQualifiedIds((prev) =>
                                  checked
                                    ? [...prev, p.id]
                                    : prev.filter((id) => id !== p.id),
                                );
                              }}
                            />
                          </td>
                          <td className="p-2 font-medium flex items-center gap-2">
                            {p.image && (
                              <Image
                                src={p.image}
                                width={16}
                                height={16}
                                alt={p.name}
                                className="h-4 w-4 rounded-full border shadow-sm"
                              />
                            )}
                            {p.name}
                          </td>
                          <td className="p-2 text-muted-foreground font-mono">
                            #{p.position || "?"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Repêchage (Non qualifiés)
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-amber-50 text-amber-700"
                  >
                    {othersPreview.length} disponibles
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden bg-background/50 max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="p-2 text-left w-10">Qual.</th>
                        <th className="p-2 text-left">Participant</th>
                        <th className="p-2 text-left">Pos.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {othersPreview.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-0 hover:bg-muted/30 opacity-80 hover:opacity-100"
                        >
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={selectedQualifiedIds.includes(p.id)}
                              onCheckedChange={(checked) => {
                                setSelectedQualifiedIds((prev) =>
                                  checked
                                    ? [...prev, p.id]
                                    : prev.filter((id) => id !== p.id),
                                );
                              }}
                            />
                          </td>
                          <td className="p-2 text-muted-foreground italic flex items-center gap-2">
                            {p.image && (
                              <Image
                                src={p.image}
                                width={16}
                                height={16}
                                alt={p.name}
                                className="h-4 w-4 rounded-full border shadow-sm grayscale"
                              />
                            )}
                            {p.name}
                          </td>
                          <td className="p-2 text-muted-foreground font-mono">
                            #{p.position || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg flex items-start gap-3 border ${
                isPowerOfTwo(selectedQualifiedIds.length)
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {isPowerOfTwo(selectedQualifiedIds.length) ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-bold">
                  Total sélectionnés : {selectedQualifiedIds.length}
                </p>
                {!isPowerOfTwo(selectedQualifiedIds.length) && (
                  <p>
                    Le nombre doit être une puissance de 2 (2, 4, 8, 16...) pour
                    la phase élimination.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "WINNER":
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
                <Trophy className="h-20 w-20 text-yellow-500 relative animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Désignation du Champion
                </h3>
                <p className="text-sm text-muted-foreground">
                  Confirmez le vainqueur final de cette édition (optionnel).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-xs font-medium">
                  Passer la sélection du vainqueur
                </Label>
              </div>
              <Checkbox
                checked={skipWinnerSelection}
                onCheckedChange={(v) => {
                  setSkipWinnerSelection(!!v);
                  if (v) setSelectedWinnerId(null);
                }}
              />
            </div>

            {!skipWinnerSelection && (
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Sélectionnez le vainqueur
                </Label>
                <RadioGroup
                  value={selectedWinnerId || ""}
                  onValueChange={setSelectedWinnerId}
                  className="grid grid-cols-1 gap-2"
                >
                  {qualifiedPreview.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group",
                        selectedWinnerId === p.id
                          ? "border-yellow-500 bg-yellow-500/5 shadow-lg shadow-yellow-500/10"
                          : "border-muted hover:border-muted-foreground/30 hover:bg-muted/30",
                      )}
                      onClick={() => setSelectedWinnerId(p.id)}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value={p.id}
                          id={p.id}
                          className="sr-only"
                        />
                        <div className="h-10 w-10 relative rounded-full bg-muted overflow-hidden border-2 border-background">
                          {p.image ? (
                            <Image
                              src={p.image}
                              fill
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                              {p.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {p.position === 1
                              ? "Premier (Suggéré)"
                              : `Position #${p.position}`}
                          </p>
                        </div>
                      </div>
                      {selectedWinnerId === p.id && (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900/80 space-y-1">
                <p className="font-bold">Information</p>
                <p>
                  Vous pouvez désigner le vainqueur maintenant ou le faire plus
                  tard depuis le dashboard. L&apos;édition ne sera pas marquée
                  comme terminée tant qu&apos;un vainqueur n&apos;est pas
                  désigné.
                </p>
              </div>
            </div>
          </div>
        );

      case "CONFIRM":
        return (
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
              <p className="text-sm font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Récapitulatif de la clôture
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                  <strong>{name}</strong> sera marqué comme terminé
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                  Les participants seront qualifiés selon la configuration
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                  Les statistiques seront définitivement mises à jour
                </li>
                {type === "PHASE" &&
                  !isFinalPhase &&
                  phaseContext?.nextPhaseId && (
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
                      La phase suivante sera organisée avec{" "}
                      {selectedQualifiedIds.length} participant(s)
                    </li>
                  )}
                {type === "PHASE" &&
                  isFinalPhase &&
                  !skipWinnerSelection &&
                  selectedWinnerId && (
                    <li className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-yellow-500" />
                      Vainqueur désigné :{" "}
                      {
                        qualifiedPreview.find((p) => p.id === selectedWinnerId)
                          ?.name
                      }
                    </li>
                  )}
                {type === "PHASE" && isFinalPhase && skipWinnerSelection && (
                  <li className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-amber-500" />
                    Vainqueur non désigné (pourra être fait plus tard)
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Cette action est irréversible.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Indicateur d'étape
  const renderStepIndicator = () => {
    const steps: Step[] = ["CONFIG"];
    if (type === "PHASE" && isGroupPhase && !isFinalPhase) {
      steps.push("QUALIFIERS");
    }
    if (type === "PHASE" && isFinalPhase) {
      steps.push("WINNER");
    }
    steps.push("CONFIRM");

    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                idx <= currentIndex
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-all",
                  idx < currentIndex ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const isNextDisabled = () => {
    if (currentStep === "QUALIFIERS") {
      return !isPowerOfTwo(selectedQualifiedIds.length);
    }
    return false;
  };

  const content = (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3 sticky top-0 bg-background pb-2">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isBlocked
              ? "bg-amber-100 dark:bg-amber-900/30"
              : "bg-green-100 dark:bg-green-900/30"
          }`}
        >
          {isBlocked ? (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            {isBlocked ? "Action requise" : getStepTitle()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getStepDescription()}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isBlocked ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Impossible de clôturer {typeLabel}. Les entités suivantes doivent
            être terminées :
          </p>
          <div className="space-y-2 bg-destructive/5 p-3 rounded-lg border border-destructive/20 max-h-[300px] overflow-y-auto">
            {pendingEntities.map((entity, i) => (
              <div key={i} className="text-xs flex items-start gap-2">
                <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">
                    {entity.label}
                  </span>
                  <span className="text-destructive"> - {entity.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {renderStepIndicator()}
          {renderStepContent()}
        </>
      )}

      {/* Boutons */}
      <div className="flex justify-between gap-2 pt-2 sticky bottom-0 bg-background border-t pt-4">
        <div>
          {currentStep !== "CONFIG" && !isBlocked && !isLoading && (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isProcessing}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={handleClose}
          >
            Annuler
          </Button>
          {!isBlocked && !isLoading && currentStep !== "CONFIRM" && (
            <Button
              onClick={goToNextStep}
              disabled={isProcessing || isNextDisabled()}
              className="font-bold"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {!isBlocked && !isLoading && currentStep === "CONFIRM" && (
            <Button
              onClick={handleComplete}
              disabled={isProcessing || isLoadingContext}
              className="font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Confirmer la clôture
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (asFormOnly) {
    return content;
  }

  return (
    <>
      <Button
        onClick={handleCheck}
        disabled={isChecking || isProcessing}
        variant="outline"
        className="gap-2 border-green-600/30 text-green-600 hover:bg-green-50"
      >
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Marquer complet
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-2xl">{content}</AlertDialogContent>
      </AlertDialog>
    </>
  );
}
