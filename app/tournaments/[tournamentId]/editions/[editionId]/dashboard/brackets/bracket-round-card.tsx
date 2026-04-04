// Composant Client pour la carte d'un round
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Hash, Swords } from "lucide-react";
import { PhaseFilter } from "../groups/phase-filter";

export function BracketRoundCard({ 
  roundNumber, 
  roundName, 
  nodeCount, 
  matchesCount,
  tournamentId,
  editionId,
  phaseId
}: { 
  roundNumber: number;
  roundName: string;
  nodeCount: number;
  matchesCount: number;
  tournamentId: string;
  editionId: string;
  phaseId: string;
}) {
  return (
    <Card className="bg-muted/10 border-muted-foreground/10 hover:bg-muted/20 transition-all hover:border-primary/30 cursor-pointer group">
      <CardHeader className="py-3 bg-muted/20 rounded-t-xl">
        <div className="flex items-center justify-between">
          <Typography variant="body-sm" weight="bold" className="uppercase tracking-wider text-primary">
            {roundName}
          </Typography>
          <Badge variant="outline" className="text-[10px] font-mono">Round {roundNumber}</Badge>
        </div>
      </CardHeader>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span>Nœuds</span>
          </div>
          <span className="font-mono font-bold">{nodeCount}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Swords className="h-3 w-3" />
            <span>Matchs</span>
          </div>
          <span className="font-mono font-bold">{matchesCount}</span>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full h-7 mt-2 text-[10px] gap-1 group-hover:bg-primary/10"
          asChild
        >
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}?round=${roundNumber}`}>
            Voir les matchs
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}