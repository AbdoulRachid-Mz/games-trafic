"use client";

import React, { useState, useTransition } from "react";
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
  Swords, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Settings2,
  Trophy
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createMatch, deleteMatch } from "@/actions/phases";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface BracketNodeMatchesOrganizeClientProps {
  node: any;
  editionId: string;
  tournamentId: string;
  allRegistrations: any[];
  groupParticipants: any[];
  existingMatches: any[];
}

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
  
  const [p1, setP1] = useState<string>(existingMatches[0]?.participant1RegistrationId || "");
  const [p2, setP2] = useState<string>(existingMatches[0]?.participant2RegistrationId || "");
  const [matchCount, setMatchCount] = useState<string>("1");
  const [format, setFormat] = useState<string>("BEST_OF_1");

  const getName = (id: string) => {
    const reg = allRegistrations.find(r => r.id === id);
    return reg?.member?.displayName || reg?.member?.user?.username || reg?.member?.team?.name || "Joueur";
  };

  const handleGenerateMatches = () => {
    if (!p1 || !p2) {
      toast.error("Veuillez sélectionner deux participants.");
      return;
    }
    if (p1 === p2) {
      toast.error("Les participants doivent être différents.");
      return;
    }

    startTransition(async () => {
      try {
        const count = parseInt(matchCount);
        for (let i = 0; i < count; i++) {
          await createMatch({
            editionId,
            phaseId: node.phaseId,
            groupId: node.groupId,
            bracketNodeId: node.id,
            round: node.round || 1,
            matchNumber: node.matchNumber || 1,
            participant1RegistrationId: p1,
            participant2RegistrationId: p2,
            matchCode: `${node.nodeCode || "BR"}-M${i + 1}`,
            metadata: { format, leg: i + 1 },
          } as any);
        }
        toast.success(`${count} match(s) généré(s) pour ce nœud.`);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la génération des matchs.");
      }
    });
  };

  const handleDeleteAllMatches = () => {
    startTransition(async () => {
      try {
        for (const m of existingMatches) {
          await deleteMatch(m.id);
        }
        toast.success("Tous les matchs du nœud ont été supprimés.");
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la suppression.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-none shadow-md">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Configuration Bulk
            </CardTitle>
            <CardDescription className="text-xs">
              Définissez les participants et le nombre de matchs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Participant 1</label>
              <Select value={p1} onValueChange={setP1}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Sélectionner P1" />
                </SelectTrigger>
                <SelectContent>
                  {groupParticipants.length > 0 ? (
                    groupParticipants.map(pg => (
                      <SelectItem key={pg.registrationId} value={pg.registrationId}>
                        {getName(pg.registrationId)}
                      </SelectItem>
                    ))
                  ) : (
                    allRegistrations.map(reg => (
                      <SelectItem key={reg.id} value={reg.id}>
                        {getName(reg.id)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Participant 2</label>
              <Select value={p2} onValueChange={setP2}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Sélectionner P2" />
                </SelectTrigger>
                <SelectContent>
                  {groupParticipants.length > 0 ? (
                    groupParticipants.map(pg => (
                      <SelectItem key={pg.registrationId} value={pg.registrationId}>
                        {getName(pg.registrationId)}
                      </SelectItem>
                    ))
                  ) : (
                    allRegistrations.map(reg => (
                      <SelectItem key={reg.id} value={reg.id}>
                        {getName(reg.id)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nb Matchs</label>
                <Select value={matchCount} onValueChange={setMatchCount}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Nb" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Single)</SelectItem>
                    <SelectItem value="2">2 (Aller-retour)</SelectItem>
                    <SelectItem value="3">3 (BO3)</SelectItem>
                    <SelectItem value="5">5 (BO5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Format</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEST_OF_1">Standard</SelectItem>
                    <SelectItem value="HOME_AWAY">Home/Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button 
              className="w-full gap-2 font-bold" 
              onClick={handleGenerateMatches}
              disabled={isPending || (p1 === p2 && p1 !== "")}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Générer les Matchs
            </Button>
            {existingMatches.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/5" 
                onClick={handleDeleteAllMatches}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
                Tout supprimer
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Preview/Existing Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-none shadow-md h-full flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Swords className="h-4 w-4 text-primary" /> Matchs de ce Nœud ({existingMatches.length})
              </CardTitle>
              {existingMatches.length > 0 && (
                <Badge variant="outline" className="text-[10px] animate-pulse">Configuration Active</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto max-h-[600px]">
            {existingMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Aucun match configuré</p>
                <p className="text-xs">Utilisez le panneau de gauche pour générer les matchs.</p>
              </div>
            ) : (
              <div className="divide-y">
                {existingMatches.map((m, idx) => (
                  <div key={m.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-right min-w-[100px]">{getName(m.participant1RegistrationId)}</span>
                          <span className="text-xs font-black text-muted-foreground">VS</span>
                          <span className="text-sm font-bold min-w-[100px]">{getName(m.participant2RegistrationId)}</span>
                        </div>
                        <div className="flex gap-2 items-center mt-1">
                          <Badge variant="outline" className="text-[9px] h-4 leading-none uppercase tracking-tighter border-primary/20">
                            {m.metadata?.format || "BO1"}
                          </Badge>
                          {m.status === 'COMPLETED' ? (
                            <Badge className="bg-green-500/10 text-green-600 border-none text-[9px] h-4 leading-none">Terminé</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/20 text-[9px] h-4 leading-none">En attente</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-all"
                      onClick={async () => {
                         try {
                           await deleteMatch(m.id);
                           toast.success("Match supprimé");
                           router.refresh();
                         } catch (e) {
                           toast.error("Erreur");
                         }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {existingMatches.length > 0 && (
             <CardFooter className="border-t bg-muted/10 justify-center py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                   <Trophy className="h-3.5 w-3.5" />
                   <span>Le vainqueur de cette série avancera automatiquement au nœud parent.</span>
                </div>
             </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
