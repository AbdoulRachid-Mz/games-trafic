// components/matches/my-matches-section.tsx
"use client";

import { useMyMatches } from "@/hooks/use-match-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyMatchesSectionProps {
  editionId: string;
  userId: string;
}

export function MyMatchesSection({ editionId, userId }: MyMatchesSectionProps) {
  const { data, isLoading } = useMyMatches(editionId, userId);
  
  if (isLoading) return <div>Chargement...</div>;
  if (!data?.myMatches.length) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Swords className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">🔥 Mes matches</h3>
        <Badge variant="secondary">{data.myMatches.length}</Badge>
      </div>
      
      <div className="grid gap-3">
        {data.myMatches.map((match: any) => (
          <Card key={match.id} className={cn("border-primary/30 bg-primary/5")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Participant 1 */}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      {match.participant1?.member?.user?.profileImage ? (
                        <img src={match.participant1.member.user.profileImage} className="h-8 w-8 rounded-full" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-medium">
                      {match.participant1?.member?.displayName || 
                       match.participant1?.member?.user?.username || "Joueur"}
                    </span>
                    {match.participant1?.member?.userId === userId && (
                      <Badge variant="default" className="h-5 text-[10px]">YOU</Badge>
                    )}
                  </div>
                  
                  <span className="text-muted-foreground font-bold">VS</span>
                  
                  {/* Participant 2 */}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      {match.participant2?.member?.user?.profileImage ? (
                        <img src={match.participant2.member.user.profileImage} className="h-8 w-8 rounded-full" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-medium">
                      {match.participant2?.member?.displayName || 
                       match.participant2?.member?.user?.username || "Joueur"}
                    </span>
                    {match.participant2?.member?.userId === userId && (
                      <Badge variant="default" className="h-5 text-[10px]">YOU</Badge>
                    )}
                  </div>
                </div>
                
                <Badge variant={match.status === "COMPLETED" ? "default" : "outline"}>
                  {match.status === "COMPLETED" ? "Terminé" : "À venir"}
                </Badge>
              </div>
              
              {match.score1 !== null && match.score2 !== null && (
                <div className="mt-3 text-center">
                  <span className="text-xl font-bold">{match.score1}</span>
                  <span className="mx-2 text-muted-foreground">-</span>
                  <span className="text-xl font-bold">{match.score2}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}