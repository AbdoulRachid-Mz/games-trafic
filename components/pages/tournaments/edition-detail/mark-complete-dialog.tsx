"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2, Trophy, ArrowRight, XCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { 
  markBracketNodeCompleteAction,
  markGroupCompleteAction,
  markPhaseCompleteAction,
  organizeNextPhaseAction,
  getQualifiedParticipantsPreviewAction,
} from "@/actions/phases";
import { designateEditionWinnerAction } from "@/actions/editions";
// import { triggerConfetti } from "@/utils/confetti";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { fireConfettiPreset } from "@/utils/confetti";

interface MarkCompleteDialogProps {
  type: 'PHASE' | 'GROUP' | 'BRACKET_NODE';
  id: string;
  name: string;
  onComplete?: () => void;
  asFormOnly?: boolean;
  // Pour les brackets nodes, on peut passer des infos supplémentaires
  isLastPhase?: boolean;
  phaseType?: string;
  editionType?: string;
}

export function MarkCompleteDialog({ 
  type, 
  id, 
  name, 
  onComplete, 
  asFormOnly = false,
  isLastPhase = false,
  phaseType = "",
  editionType = "",
}: MarkCompleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(asFormOnly);
  const [isProcessing, startTransition] = useTransition();
  const [pendingEntities, setPendingEntities] = useState<Array<{ type: string; id: string; label: string; reason: string }>>([]);
  
  const [generateMatches, setGenerateMatches] = useState(true);
  const [generateNodes, setGenerateNodes] = useState(true);
  const [isHomeAway, setIsHomeAway] = useState(false);
  const [matchFormat, setMatchFormat] = useState<'BEST_OF_1' | 'BEST_OF_3' | 'BEST_OF_5'>('BEST_OF_1');
  const [seedMethod, setSeedMethod] = useState<'RANDOM' | 'ORDERED'>('RANDOM');
  
  // Preview et sélection des qualifiés
  const [qualifiedPreview, setQualifiedPreview] = useState<Array<{ id: string; name: string; groupId: string; position?: number | null }>>([]);
  const [selectedQualifiedIds, setSelectedQualifiedIds] = useState<string[]>([]);
  const [showPreviewStep, setShowPreviewStep] = useState(false);

  const router = useRouter();
  
  // Vérifier si c'est une phase finale (plus de phase après)
  const isFinalPhase = type === 'PHASE' && isLastPhase;
  const isEliminationPhase = phaseType === "ELIMINATION" || phaseType === "KNOCKOUT";
  const isGroupPhase = phaseType === "GROUP_STAGE" || phaseType === "ROUND_ROBIN";
  
  const isAutoMode = editionType === "CHAMPIONS";
  
  useEffect(() => {
    if (asFormOnly) {
      handleCheck();
    }
  }, [asFormOnly]);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      // Pour les brackets nodes ou autres, le type doit exister dans checkPendingEntitiesAction
      // Mais comme il a pu être retiré lors d'une refactorisation temporelle, je m'assure qu'on lance la fonction si elle existe
      const { checkPendingEntitiesAction } = await import("@/actions/phases");
      const result = await checkPendingEntitiesAction(type, id);
      if (result.success) {
        setPendingEntities(result.pendingEntities);
        if (!asFormOnly) {
          setIsOpen(true);
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
    if (type !== 'PHASE' || isFinalPhase) return;
    
    try {
      const res = await getQualifiedParticipantsPreviewAction(id);
      if (res.success && res.qualified) {
        setQualifiedPreview(res.qualified);
        setSelectedQualifiedIds(res.qualified.map(q => q.id));
      }
    } catch (err) {
      console.error("Failed to load qualified preview:", err);
    }
  };

  useEffect(() => {
    if (isOpen && type === 'PHASE' && !isFinalPhase && isGroupPhase) {
      loadQualifiedPreview();
    }
  }, [isOpen, type, isFinalPhase, isGroupPhase]);

  const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

  const handleComplete = () => {
    // Si on est sur une phase de groupes et qu'on va vers une phase éliminatoire, on propose la preview
    if (type === 'PHASE' && isGroupPhase && !isFinalPhase && !showPreviewStep) {
      setShowPreviewStep(true);
      return;
    }

    // Validation Power of 2 si on va vers une élimination directe
    if (showPreviewStep && !isPowerOfTwo(selectedQualifiedIds.length)) {
      toast.error(`Le nombre de qualifiés (${selectedQualifiedIds.length}) doit être une puissance de 2 (2, 4, 8, 16, 32...) pour générer un arbre d'élimination.`);
      return;
    }

    startTransition(async () => {
      try {
        let markResult: any;
        
        if (type === 'GROUP') {
          markResult = await markGroupCompleteAction(id);
        } else if (type === 'PHASE') {
          markResult = await markPhaseCompleteAction(id);
        } else if (type === 'BRACKET_NODE') {
          markResult = await markBracketNodeCompleteAction(id);
        }

        if (!markResult?.success) {
          toast.error(markResult?.error || "Erreur lors de la clôture");
          return;
        }

        toast.success(`${name} marqué comme terminé avec succès !`);

        // Pour les phases NON finales, organiser la phase suivante
        if (type === 'PHASE' && markResult.nextPhaseId && !isFinalPhase) {
          // En mode auto, on force la génération compète si non spécifié autrement
          const organizeResult = await organizeNextPhaseAction(markResult.nextPhaseId, {
            generateNodes: isAutoMode ? true : generateNodes,
            generateMatches: isAutoMode ? true : generateMatches,
            seedMethod,
            isHomeAway,
            matchFormat,
            force: true,
            customQualifiedIds: selectedQualifiedIds,
          });
          
          if (organizeResult.success) {
            toast.success(`Phase "${markResult.nextPhaseName}" organisée avec succès !`);
          } else {
            toast.warning(`Phase terminée mais erreur lors de l'organisation: ${organizeResult.error}`);
          }
        }

        // Pour les phases FINALES, désigner le vainqueur et fêter ça !
        if (type === 'PHASE' && isFinalPhase) {
          try {
            // Dans la phase finale, on cherche le participant à la position 1
            const previewRes = await getQualifiedParticipantsPreviewAction(id);
            if (previewRes.success && previewRes.qualified && previewRes.qualified.length > 0) {
              // Le premier de la liste (trié par position) est notre gagnant
              const winner = previewRes.qualified[0];
              
              const winnerMetadata = {
                id: winner.id,
                username: winner.name,
                image: winner.image,
                email: winner.email,
                phone: winner.phone,
              };

              await designateEditionWinnerAction(markResult.editionId || id, winner.id, winnerMetadata);
              
              // Celebration!
              fireConfettiPreset("success");
              toast.success(`Félicitations au vainqueur : ${winner.name} !`, {
                icon: <Trophy className="h-4 w-4 text-yellow-500" />,
                duration: 10000,
              });
            }
          } catch (winnerErr) {
            console.error("Error designating winner:", winnerErr);
          }
        }

        setIsOpen(false);
        router.refresh();
        if (onComplete) onComplete();
        
        if (asFormOnly) {
          router.back();
        }
        
      } catch (error) {
        toast.error("Une erreur est survenue");
      }
    });
  };

  const handleClose = () => {
    if (!isProcessing) {
      setIsOpen(false);
      if (asFormOnly) {
        router.back();
      }
    }
  };

  const typeLabel = type === 'PHASE' ? 'la phase' : type === 'GROUP' ? 'le groupe' : 'le nœud';
  const isBlocked = pendingEntities.length > 0;
  const showPhaseConfig = type === 'PHASE' && !isFinalPhase && !isBlocked && !isChecking;

  const content = (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3 sticky top-0 bg-background pb-2">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          isBlocked ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'
        }`}>
          {isBlocked ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {isBlocked ? "Action requise" : isFinalPhase ? "Clôture de la phase finale" : "Clôture et organisation"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {showPreviewStep ? "Validation des participants qualifiés" : `${typeLabel} `}
            <strong className="font-mono text-foreground">{name}</strong>
          </p>
        </div>
      </div>

      {isChecking ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isBlocked ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Impossible de clôturer {typeLabel}. Les entités suivantes doivent être terminées :
          </p>
          <div className="space-y-2 bg-destructive/5 p-3 rounded-lg border border-destructive/20 max-h-[300px] overflow-y-auto">
            {pendingEntities.map((entity, i) => (
              <div key={i} className="text-xs flex items-start gap-2 text-muted-foreground">
                <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{entity.label}</span>
                  <span className="text-destructive"> - {entity.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Preview des qualifiés */}
          {showPreviewStep && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <Label className="text-sm font-bold">Sélection des participants qualifiés</Label>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
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
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2 text-center">
                          <Checkbox 
                            checked={selectedQualifiedIds.includes(p.id)}
                            onCheckedChange={(checked) => {
                              setSelectedQualifiedIds(prev => 
                                checked 
                                  ? [...prev, p.id] 
                                  : prev.filter(id => id !== p.id)
                              );
                            }}
                          />
                        </td>
                        <td className="p-2 font-medium">{p.name}</td>
                        <td className="p-2 text-muted-foreground">#{p.position || '?'}</td>
                      </tr>
                    ))}
                    {qualifiedPreview.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-muted-foreground italic">
                          Calcul des qualifiés en cours...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={`p-3 rounded-lg flex items-start gap-3 border ${
                isPowerOfTwo(selectedQualifiedIds.length) 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {isPowerOfTwo(selectedQualifiedIds.length) ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <p className="font-bold">Total sélectionnés : {selectedQualifiedIds.length}</p>
                  {!isPowerOfTwo(selectedQualifiedIds.length) && (
                    <p>Le nombre doit être une puissance de 2 (2, 4, 8, 16...) pour la phase finale.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!showPreviewStep && (
            <>
              {/* Message principal */}
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  Toutes les entités de <strong>{name}</strong> sont terminées.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                    Les participants seront qualifiés selon la configuration.
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                    Les statistiques seront définitivement mises à jour.
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                    Les sous-entités seront verrouillées.
                  </li>
                </ul>
              </div>

              {/* Configuration de la phase suivante (uniquement pour les phases NON finales) */}
              {showPhaseConfig && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-bold">Configuration de la phase suivante</Label>
                    </div>
                    {isAutoMode && (
                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                        Mode Auto (Champions)
                      </Badge>
                    )}
                  </div>

                  {!isAutoMode ? (
                    <>
                      {/* Format des matchs (pour élimination) */}
                      {isEliminationPhase && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Format des matchs</Label>
                          <RadioGroup
                            value={matchFormat}
                            onValueChange={(v) => setMatchFormat(v as any)}
                            className="flex flex-wrap gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="BEST_OF_1" id="bo1" />
                              <Label htmlFor="bo1" className="text-xs cursor-pointer">BO1</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="BEST_OF_3" id="bo3" />
                              <Label htmlFor="bo3" className="text-xs cursor-pointer">BO3</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="BEST_OF_5" id="bo5" />
                              <Label htmlFor="bo5" className="text-xs cursor-pointer">BO5</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}

                      {/* Aller-Retour */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="home-away" className="text-xs cursor-pointer">
                          Aller-Retour
                        </Label>
                        <Checkbox
                          id="home-away"
                          checked={isHomeAway}
                          onCheckedChange={(v) => setIsHomeAway(!!v)}
                        />
                      </div>

                      {/* Méthode de seed */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Ordre des participants</Label>
                        <Select value={seedMethod} onValueChange={(v) => setSeedMethod(v as any)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RANDOM">Aléatoire</SelectItem>
                            <SelectItem value="ORDERED">Ordre d&apos;inscription</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground italic">
                        Les paramètres de la phase suivante (Aller-Retour, Format, Seed) sont gérés automatiquement selon le mode Champions.
                      </p>
                    </div>
                  )}

                  {/* Niveaux de génération - Toujours visibles mais avec warning en mode auto */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Niveaux de génération</Label>
                      {isAutoMode && (
                        <div className="flex items-center gap-1 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Attention (Auto)</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 pl-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gen-nodes" className="text-xs cursor-pointer">
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
                        <Label htmlFor="gen-matches" className={`text-xs cursor-pointer ${!generateNodes ? "opacity-50" : ""}`}>
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
                      <p className="italic underline underline-offset-2">Configuration automatique activée</p>
                    ) : (
                      <>
                        <p>• Format: {matchFormat === "BEST_OF_1" ? "BO1" : matchFormat === "BEST_OF_3" ? "BO3" : "BO5"}</p>
                        <p>• {isHomeAway ? "Aller-Retour" : "Aller simple"}</p>
                        <p>• {seedMethod === "RANDOM" ? "Tirage aléatoire" : "Ordre séquentiel"}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Message pour phase finale */}
              {isFinalPhase && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-xs flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    C&apos;est la phase finale du tournoi. Aucune phase suivante ne sera organisée.
                  </p>
                </div>
              )}

              {/* Avertissement */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Cette action est irréversible.
                </p>
              </div>
            </>
          )}
        </>
      )}

      {/* Boutons */}
      <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background">
        <Button variant="outline" disabled={isProcessing} onClick={() => {
          if (showPreviewStep) setShowPreviewStep(false);
          else handleClose();
        }}>
          {showPreviewStep ? "Retour" : "Annuler"}
        </Button>
        {!isBlocked && !isChecking && (
          <Button
            onClick={handleComplete}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trophy className="h-4 w-4 mr-2" />
            )}
            {showPreviewStep 
              ? "Valider et Générer la suite" 
              : isFinalPhase ? "Clôturer la phase finale" : "Clôturer et organiser la suite"}
          </Button>
        )}
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
        className="gap-2 border-green-600/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
      >
        {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Marquer complet
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-lg">
          {content}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}