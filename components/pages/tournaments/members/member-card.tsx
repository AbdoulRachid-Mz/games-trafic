// components/pages/tournaments/member-card.tsx
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Crown, 
  Sword, 
  Target, 
  Medal, 
  Trophy,
  Eye,
  MessageCircle,
  MoreVertical
} from "lucide-react";
import type { TournamentMember } from "@/database/schema";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: TournamentMember;
  viewMode?: "grid" | "list";
  onView?: () => void;
  onMessage?: () => void;
  isOrganizer?: boolean;
}

export function MemberCard({ 
  member, 
  viewMode = "grid", 
  onView,
  onMessage,
  isOrganizer = false 
}: MemberCardProps) {
  const isGrid = viewMode === "grid";
  
  if (!isGrid) {
    return (
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar || undefined} />
                <AvatarFallback>
                  {member.displayName?.[0] || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Typography variant="body-base" weight="semibold" className="truncate">
                    {member.displayName || "Membre"}
                  </Typography>
                  {member.role === "ORGANIZER" && (
                    <Badge size="sm" className="bg-amber-500">
                      <Crown className="h-3 w-3" />
                    </Badge>
                  )}
                  {member.isCoOrganizer && (
                    <Badge size="sm" className="bg-purple-500">
                      Organisateur
                    </Badge>
                  )}
                </div>
                <Typography variant="caption2" theme="muted" className="truncate">
                  {member.gameTag || "Aucun tag"}
                </Typography>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Typography variant="body-base" weight="bold">
                  {member.rankingPoints || 0}
                </Typography>
                <Typography variant="caption2" theme="muted">
                  Points
                </Typography>
              </div>
              
              <div className="text-center">
                <Typography variant="body-base" weight="bold">
                  {member.totalWins || 0}
                </Typography>
                <Typography variant="caption2" theme="muted">
                  Victoires
                </Typography>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onView}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onMessage}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-md transition-all group">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Avatar avec badge de rôle */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback className="text-lg">
                {member.displayName?.[0] || "M"}
              </AvatarFallback>
            </Avatar>
            {member.role === "ORGANIZER" && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-amber-500 px-2 py-1">
                  <Crown className="h-3 w-3" />
                </Badge>
              </div>
            )}
          </div>
          
          {/* Nom et tag */}
          <div className="space-y-1">
            <Typography variant="body-base" weight="semibold" className="truncate w-full">
              {member.displayName || "Membre"}
            </Typography>
            <Typography variant="caption2" theme="muted" className="truncate w-full">
              {member.gameTag || "Aucun tag"}
            </Typography>
          </div>
          
          {/* Rôle */}
          <Badge variant={member.isCoOrganizer ? "default" : "secondary"} className="gap-1">
            {member.isCoOrganizer ? (
              <>
                <Target className="h-3 w-3" />
                Co-organisateur
              </>
            ) : (
              <>
                <Sword className="h-3 w-3" />
                {member.role || "Participant"}
              </>
            )}
          </Badge>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 w-full pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <Typography variant="body-base" weight="bold">
                  {member.rankingPoints || 0}
                </Typography>
              </div>
              <Typography variant="caption2" theme="muted">
                Points
              </Typography>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Medal className="h-4 w-4 text-green-500" />
                <Typography variant="body-base" weight="bold">
                  {member.totalWins || 0}
                </Typography>
              </div>
              <Typography variant="caption2" theme="muted">
                Victoires
              </Typography>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 w-full pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={onMessage}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}