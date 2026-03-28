"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePhaseManager } from "@/hooks/use-phase-manager";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

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
  const phaseManager = usePhaseManager(editionId, tournamentId);
  const [loading, setLoading] = useState(false);

  // Magic Flow State
  const [config, setConfig] = useState({
    includeGroups: true,
    includeQuarterFinals: true,
    includeSemiFinals: true,
    includeFinal: true,
    participantStrategy: "ALL" as "ALL" | "SELECTED",
  });

  const [selectedRegIds, setSelectedRegIds] = useState<string[]>(
    edition?.registrations?.map((r: any) => r.id) || [],
  );

  const existingPhases = edition?.phases?.length > 0;

  const handleMagicGeneration = async () => {
    try {
      setLoading(true);

      // 1. Phasing (Group + Brackets)
      await phaseManager.generatePhasesAuto({
        includeGroups: config.includeGroups,
        includeQuarterFinals: config.includeQuarterFinals,
        includeSemiFinals: config.includeSemiFinals,
        includeFinal: config.includeFinal,
      });

      toast.success("Structure globale générée avec succès !");

      setTimeout(() => {
        router.push(
          `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`,
        );
        router.refresh();
      }, 1000);
    } catch (e: any) {
      toast.error(e.message || "Erreur critique de génération");
    } finally {
      setLoading(false);
    }
  };

  const getName = (reg: any) =>
    reg.member?.displayName || reg.member?.user?.username || "Joueur";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Step 1: Structure */}
        <Card className="relative overflow-hidden border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5">
          {existingPhases && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
              <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Structure Existante</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Votre édition contient déjà des phases. Le générateur
                automatique est verrouillé.
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`,
                  )
                }
              >
                Gérer les Phases
              </Button>
            </div>
          )}

          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings2 className="w-6 h-6 text-primary" /> 1. Structure du
              Tournoi
            </CardTitle>
            <CardDescription>
              Définissez les étapes clés de votre compétition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-primary">
                    Phases
                  </Label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="groups"
                      checked={config.includeGroups}
                      onCheckedChange={(v) =>
                        setConfig({ ...config, includeGroups: !!v })
                      }
                    />
                    <Label
                      htmlFor="groups"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Phase de Groupes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="qf"
                      checked={config.includeQuarterFinals}
                      onCheckedChange={(v) =>
                        setConfig({ ...config, includeQuarterFinals: !!v })
                      }
                    />
                    <Label
                      htmlFor="qf"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Quarts de Finale
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="sf"
                      checked={config.includeSemiFinals}
                      onCheckedChange={(v) =>
                        setConfig({ ...config, includeSemiFinals: !!v })
                      }
                    />
                    <Label
                      htmlFor="sf"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Demi-Finales
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="f"
                      checked={config.includeFinal}
                      onCheckedChange={(v) =>
                        setConfig({ ...config, includeFinal: !!v })
                      }
                    />
                    <Label
                      htmlFor="f"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Finale
                    </Label>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3">
                <Label className="font-bold text-xs uppercase tracking-wider text-primary">
                  Participants
                </Label>
                <div className="flex flex-col gap-3 pt-1">
                  <Button
                    variant={
                      config.participantStrategy === "ALL"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="justify-start gap-2 h-10"
                    onClick={() => {
                      setConfig({ ...config, participantStrategy: "ALL" });
                      setSelectedRegIds(
                        edition?.registrations?.map((r: any) => r.id) || [],
                      );
                    }}
                  >
                    <Users className="h-4 w-4" /> Tous (
                    {edition?.registrations?.length || 0})
                  </Button>
                  <Button
                    variant={
                      config.participantStrategy === "SELECTED"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="justify-start gap-2 h-10"
                    onClick={() =>
                      setConfig({ ...config, participantStrategy: "SELECTED" })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> Sélection Manuelle (
                    {selectedRegIds.length})
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                disabled={loading || selectedRegIds.length === 0}
                onClick={handleMagicGeneration}
              >
                {loading ? (
                  <RefreshCw className="w-6 h-6 animate-spin mr-3" />
                ) : (
                  <Play className="w-6 h-6 mr-3" />
                )}
                Lancer la Génération Magique
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-[0.2em]">
                Propulsé par le moteur de tournoi Antigravity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Selection */}
        <Card className="border-none shadow-xl bg-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> 2. Détail des
              Inscriptions ({edition?.registrations?.length || 0})
            </CardTitle>
            <CardDescription className="text-xs">
              {config.participantStrategy === "ALL"
                ? "Tous les inscrits sont inclus par défaut."
                : "Sélectionnez manuellement les participants."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="max-h-[500px] overflow-y-auto">
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
                            disabled={config.participantStrategy === "ALL"}
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
                          <div className="font-bold text-sm">
                            {getName(reg)}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="bg-muted px-1.5 py-0.5 rounded uppercase font-mono tracking-tighter">
                              ID: {reg.id.slice(0, 8)}
                            </span>
                            <span>•</span>
                            <span>{reg.status}</span>
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

      <div className="flex items-start gap-4 bg-primary/5 border border-primary/10 p-5 rounded-2xl text-primary/80 text-sm shadow-inner">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-primary">
            Prochaine étape : Assignation & Seeding
          </p>
          <p className="text-xs leading-relaxed opacity-80">
            Une fois la structure créée, vous pourrez répartir ces{" "}
            {selectedRegIds.length} élus dans les groupes de la première phase
            pour lancer les hostilités.
          </p>
        </div>
      </div>
    </div>
  );
}
