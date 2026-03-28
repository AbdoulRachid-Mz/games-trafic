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
  LayoutGrid
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBracketNode, deleteBracketNode } from "@/actions/phases";

interface GroupNodesOrganizeClientProps {
  groupId: string;
  phaseId: string;
  existingNodes: any[];
}

export function GroupNodesOrganizeClient({
  groupId,
  phaseId,
  existingNodes,
}: GroupNodesOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nodePrefix, setNodePrefix] = useState("N");
  const [nodeCount, setNodeCount] = useState("4");
  const [startRound, setStartRound] = useState("1");

  const handleGenerateNodes = () => {
    startTransition(async () => {
      try {
        const count = parseInt(nodeCount);
        const round = parseInt(startRound);
        for (let i = 0; i < count; i++) {
          await createBracketNode({
            phaseId,
            groupId,
            nodeCode: `${nodePrefix}${i + 1}`,
            round,
            matchNumber: i + 1,
            bracketType: "UPPER",
            order: i + 1,
          } as any);
        }
        toast.success(`${count} nœuds générés pour ce groupe.`);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la génération des nœuds.");
      }
    });
  };

  const handleDeleteAllNodes = () => {
    startTransition(async () => {
      try {
        for (const n of existingNodes) {
          await deleteBracketNode(n.id);
        }
        toast.success("Tous les nœuds du groupe ont été supprimés.");
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la suppression.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-none shadow-md">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" /> Configuration des Nœuds
          </CardTitle>
          <CardDescription className="text-xs">
            Générez une structure de bracket pour ce groupe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Préfixe du code</label>
            <input 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" 
              value={nodePrefix}
              onChange={(e) => setNodePrefix(e.target.value)}
              placeholder="ex: QF, SF, G1-N"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre</label>
              <input 
                type="number"
                min="1"
                max="32"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" 
                value={nodeCount}
                onChange={(e) => setNodeCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Round de départ</label>
              <input 
                type="number"
                min="1"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" 
                value={startRound}
                onChange={(e) => setStartRound(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button 
            className="w-full gap-2 font-bold" 
            onClick={handleGenerateNodes}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Générer les Nœuds
          </Button>
          {existingNodes.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/5" 
              onClick={handleDeleteAllNodes}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
              Tout supprimer
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="lg:col-span-2 border-none shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" /> Nœuds Existants ({existingNodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto max-h-[600px]">
          {existingNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <RefreshCcw className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Aucun nœud configuré</p>
            </div>
          ) : (
            <div className="divide-y">
              {existingNodes.sort((a,b) => (a.order || 0) - (b.order || 0)).map((n) => (
                <div key={n.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                      {n.nodeCode}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{n.nodeCode || n.id.slice(0,8)}</span>
                      <span className="text-[10px] text-muted-foreground">Round {n.round} • Match #{n.matchNumber}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                       await deleteBracketNode(n.id);
                       router.refresh();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
