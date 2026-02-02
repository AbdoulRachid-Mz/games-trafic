import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Users, Crown, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeamWithRelations } from "@/database/schema";

interface TeamCardProps {
  team: TeamWithRelations;
  viewMode?: "grid" | "list";
  userDisplay?: "admin" | "organizer" | "member";
  actions?: {
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onViewReset?: (id: string) => void;
  };
}

export function TeamCard({
  team,
  viewMode = "grid",
  userDisplay = "member",
  actions,
}: TeamCardProps) {
  // Utilisation de currentSquadSize à la place de _count.members
  const memberCount = team.currentSquadSize || 0;
  // Utilisation correcte du nom du capitaine depuis la relation captain
  const captainName = team.captain?.username || "N/A";

  if (viewMode === "list") {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors group">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 rounded-lg border bg-muted">
            <AvatarImage
              src={team.logo || undefined}
              alt={team.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-lg">{team.name}</div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                {captainName}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {memberCount} membres
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline-block mr-4">
            Créée le {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "N/A"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options d'équipe</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => actions?.onViewReset?.(team.id)}>
                Voir détails
              </DropdownMenuItem>
              {userDisplay !== "member" && (
                <>
                  <DropdownMenuItem onClick={() => actions?.onEdit?.(team.id)}>
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => actions?.onDelete?.(team.id)}
                  >
                    Dissoudre l'équipe
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group relative">
      {/* Banner/Header Pattern */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/50 to-purple-500/50" />

      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <Avatar className="h-14 w-14 rounded-xl border-2 border-background shadow-sm bg-muted">
            <AvatarImage
              src={team.logo || undefined}
              alt={team.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-xl text-lg font-bold">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions?.onViewReset?.(team.id)}>
                Voir détails
              </DropdownMenuItem>
              {userDisplay !== "member" && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => actions?.onDelete?.(team.id)}
                >
                  Dissoudre
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h3
            className="font-bold text-lg leading-tight mb-1 truncate"
            title={team.name}
          >
            {team.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">Cap: {captainName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-4 border-t">
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {memberCount}
          </Badge>
          <div className="text-xs text-muted-foreground ml-auto">
{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
