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
  Users,
  LayoutGrid,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { autoGeneratePhaseStructureAction } from "@/actions/phases";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";

interface PhaseOrganizeClientProps {
  tournamentId: string;
  editionId: string;
  phaseId: string;
  phaseName: string;
  sourceParticipants: any[];
  existingGroups: any[];
}

export function PhaseOrganizeClient({
  tournamentId,
  editionId,
  phaseId,
  phaseName,
  sourceParticipants,
  existingGroups,
}: PhaseOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Generation parameters
  const [groupsCount, setGroupsCount] = useState(Math.ceil(sourceParticipants.length / 4) || 1);
  const [participantsPerGroup, setParticipantsPerGroup] = useState(4);
  const [seedingMethod, setSeedingMethod] = useState<'RANDOM' | 'SEQUENTIAL' | 'SNAKE'>('RANDOM');
  const [generateMatches, setGenerateMatches] = useState(true);
  const [groupPrefix, setGroupPrefix] = useState("Groupe");

  const handleAutoGenerate = () => {
    startTransition(async () => {
      try {
        const result = await autoGeneratePhaseStructureAction(phaseId, {
          groupsCount,
          participantsPerGroup,
          seedingMethod,
          generateMatches,
          groupPrefix
        });
        
        if (result.success) {
          toast.success(`${result.groupsCount} groupes générés avec succès.`);
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la génération automatique.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}`} className="hover:text-primary transition-colors">
          {phaseName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Organisation</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Generator Settings */}
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> Auto-Génération
              </CardTitle>
              <CardDescription className="text-xs">
                Configurez la structure de la phase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Préfixe des groupes</label>
                <input 
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" 
                  value={groupPrefix}
                  onChange={(e) => setGroupPrefix(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nb de Groupes</label>
                  <input 
                    type="number"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" 
                    value={groupsCount}
                    onChange={(e) => setGroupsCount(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Part. / Groupe</label>
                  <input 
                    type="number"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" 
                    value={participantsPerGroup}
                    onChange={(e) => setParticipantsPerGroup(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Méthode de Seeding</label>
                <select 
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
                  value={seedingMethod}
                  onChange={(e) => setSeedingMethod(e.target.value as any)}
                >
                  <option value="RANDOM">Aléatoire (Pur)</option>
                  <option value="SEQUENTIAL">Séquentiel</option>
                  <option value="SNAKE">Serpentin (Snake)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="gen-matches"
                  checked={generateMatches}
                  onChange={(e) => setGenerateMatches(e.target.checked)}
                />
                <label htmlFor="gen-matches" className="text-sm font-medium">Générer les matches immédiatement</label>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/30">
              <Button 
                className="w-full gap-2 font-bold" 
                onClick={handleAutoGenerate}
                disabled={isPending || sourceParticipants.length === 0}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Générer la Structure
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4" /> Participants Source
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-black text-primary">{sourceParticipants.length}</div>
              <p className="text-xs text-muted-foreground">Participants disponibles pour cette phase.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Existing Structure Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" /> Structure Actuelle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {existingGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40 border-2 border-dashed rounded-xl">
                  <LayoutGrid className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">Aucun groupe configuré</p>
                  <p className="text-xs">Utilisez l'auto-génération ou créez des groupes manuellement.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {existingGroups.map((group) => (
                    <div key={group.id} className="p-4 border rounded-xl hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{group.name}</span>
                        <Badge variant="outline" className="text-[10px]">ORDRE {group.order}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-medium">
                        <span>{group.participantCount || 0} Participants</span>
                        <span>{group.matchCount || 0} Matches</span>
                      </div>
                      <div className="mt-4">
                        <Button variant="ghost" size="sm" className="w-full text-[10px] h-7 gap-1" asChild>
                          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${group.id}`}>
                            Gérer le groupe <ChevronRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
