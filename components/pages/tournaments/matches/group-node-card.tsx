import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, Swords, Users } from "lucide-react";
import { useState } from "react";
import { MiniMatchCard } from "./mini-match-card";

export function GroupNodeCard({
  node,
  matchesByNode,
  currentUserId,
  isAdmin,
  onUpdate,
  phase,
}: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nodeMatches = matchesByNode.get(node.id) || [];
  const metadata = node.metadata || {};
  const participants = metadata.participants || [];
  const nodeName = metadata.name || node.nodeCode || "Groupe";
  const { isMobile } = useScreenSize();

  // Grouper par round
  const roundsMap = new Map<number, any[]>();
  for (const m of nodeMatches) {
    const r = m.round || 1;
    const arr = roundsMap.get(r) || [];
    arr.push(m);
    roundsMap.set(r, arr);
  }
  const sortedRounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border rounded-xl overflow-hidden bg-card/50 hover:shadow-md transition-all">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-muted/30">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm md:text-base">
                {node.nodeCode?.charAt(0) || "G"}
              </div>
              <div>
                <div className="font-bold text-sm md:text-base">{nodeName}</div>
                <div className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {participants.length} part.
                  </span>
                  <span className="flex items-center gap-1">
                    <Swords className="h-2.5 w-2.5" />
                    {nodeMatches.length} matchs
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {sortedRounds.length} round{sortedRounds.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform text-muted-foreground",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-3 md:p-4 pt-0 border-t space-y-3 md:space-y-4">
            {sortedRounds.length > 0 ? (
              sortedRounds.map(([roundNum, roundMatches]) => (
                <div key={roundNum} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] md:text-[9px] font-bold">
                      {roundNum}
                    </div>
                    <span className="text-[9px] md:text-[10px] font-medium uppercase text-muted-foreground">
                      {phase?.phaseType === "ROUND_ROBIN"
                        ? `Journée ${roundNum}`
                        : `Round ${roundNum}`}
                    </span>
                    <Badge variant="outline" className="text-[7px] md:text-[8px] h-4">
                      {roundMatches.length} match{roundMatches.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 md:gap-2 pl-3 md:pl-6">
                    {roundMatches.map((match: any) => (
                      <MiniMatchCard
                        key={match.id}
                        match={match}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        onUpdate={onUpdate}
                        compact={isMobile}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-[10px] md:text-xs">
                Aucun match programmé
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}