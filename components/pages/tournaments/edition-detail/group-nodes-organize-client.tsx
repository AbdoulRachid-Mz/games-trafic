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
  Trash2, 
  Loader2, 
  Settings2,
  GitBranch,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkCreateBracketNodes, deleteBracketNode } from "@/actions/phases";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface GroupNodesOrganizeClientProps {
  groupId: string;
  phaseId: string;
  existingNodes: any[];
}

type DraftNode = {
  nodeCode: string;
  round: number;
  matchNumber: number;
  bracketType: "UPPER" | "LOWER";
  order: number;
};

export function GroupNodesOrganizeClient({
  groupId,
  phaseId,
  existingNodes,
}: GroupNodesOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftNodes, setDraftNodes] = useState<DraftNode[]>([]);
  
  // Auto-generation parameters
  const [nodePrefix, setNodePrefix] = useState("N");
  const [nodeCount, setNodeCount] = useState("4");
  const [startRound, setStartRound] = useState("1");

  const handleAddToDraft = () => {
    const count = parseInt(nodeCount) || 1;
    const round = parseInt(startRound) || 1;
    const startIndex = draftNodes.length + existingNodes.length;

    const newDrafts: DraftNode[] = [];
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      newDrafts.push({
        nodeCode: `${nodePrefix}${idx + 1}`,
        round,
        matchNumber: idx + 1,
        bracketType: "UPPER",
        order: idx + 1,
      });
    }
    setDraftNodes([...draftNodes, ...newDrafts]);
    toast.success(`${count} nœud(s) ajouté(s) au draft.`);
  };

  const handleRemoveDraft = (idx: number) => {
    setDraftNodes(draftNodes.filter((_, i) => i !== idx));
  };

  const handleSaveNodes = () => {
    if (draftNodes.length === 0) return;

    startTransition(async () => {
      try {
        await bulkCreateBracketNodes(
          draftNodes.map(n => ({
            ...n,
            phaseId,
            groupId,
          } as any))
        );
        toast.success(`${draftNodes.length} nœuds créés avec succès.`);
        setDraftNodes([]);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la création groupée des nœuds.");
      }
    });
  };

  const handleDeleteExisting = async (id: string) => {
    try {
      await deleteBracketNode(id);
      toast.success("Nœud supprimé.");
      router.refresh();
    } catch (error) {
      toast.error("Erreur suppression.");
    }
  };

  const isDuplicate = (code: string) => {
     const inExisting = existingNodes.some(n => n.nodeCode === code);
     const inDraft = draftNodes.filter(n => n.nodeCode === code).length > 1;
     return inExisting || inDraft;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Column */}
      <Card className="lg:col-span-1 border-primary/10 shadow-lg h-fit sticky top-6">
        <CardHeader className="bg-primary/5 pb-4 rounded-t-xl">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" /> Configuration Batch
          </CardTitle>
          <CardDescription className="text-xs">
            Préparez plusieurs nœuds avant de les sauvegarder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Préfixe</label>
            <input 
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
              value={nodePrefix}
              onChange={(e) => setNodePrefix(e.target.value)}
              placeholder="ex: QF, SF"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Quantité</label>
              <input 
                type="number"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                value={nodeCount}
                onChange={(e) => setNodeCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Round</label>
              <input 
                type="number"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                value={startRound}
                onChange={(e) => setStartRound(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            variant="secondary"
            className="w-full gap-2 font-bold" 
            onClick={handleAddToDraft}
          >
            <Plus className="h-4 w-4" /> Ajouter au Draft
          </Button>
        </CardContent>
        <CardFooter className="pt-4 border-t bg-muted/30 rounded-b-xl">
          <Button 
            className="w-full gap-2 font-bold shadow-md shadow-primary/20" 
            onClick={handleSaveNodes}
            disabled={isPending || draftNodes.length === 0}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? "Sauvegarde..." : `Sauvegarder ${draftNodes.length} nœuds`}
          </Button>
        </CardFooter>
      </Card>

      {/* List Column */}
      <Card className="lg:col-span-2 border-none shadow-xl">
        <Tabs defaultValue="draft" className="w-full">
          <CardHeader className="border-b pb-0">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <GitBranch className="h-4 w-4 text-primary" /> Gestion des Nœuds
              </CardTitle>
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
                  <Plus className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">Le draft est vide</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {draftNodes.map((n, i) => (
                    <div key={i} className="p-4 hover:bg-primary/5 transition-colors flex items-center justify-between animate-in fade-in slide-in-from-right-2 duration-200">
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                          {n.nodeCode}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold">{n.nodeCode}</span>
                             {isDuplicate(n.nodeCode) && (
                               <Badge variant="destructive" className="h-4 text-[8px] px-1 font-bold">DOUBLON</Badge>
                             )}
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-mono">Round {n.round} • Match #{n.matchNumber}</span>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveDraft(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="existing" className="m-0 focus-visible:ring-0">
               {existingNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                  <RefreshCcw className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">Aucun nœud permanent</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {existingNodes.sort((a,b) => (a.order || 0) - (b.order || 0)).map((n) => (
                    <div key={n.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs ring-1 ring-border">
                          {n.nodeCode}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{n.nodeCode}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {n.id.slice(0,8)}</span>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteExisting(n.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
