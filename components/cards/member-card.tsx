import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Shield, User, Trophy, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TournamentMemberWithRelations } from "@/database/schema";

interface MemberCardProps {
  member: TournamentMemberWithRelations;
  viewMode?: "grid" | "list";
  userDisplay?: "admin" | "organizer" | "member";
  actions?: {
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onViewProfile?: (id: string) => void;
  };
}

export function MemberCard({
  member,
  viewMode = "grid",
  userDisplay = "member",
  actions,
}: MemberCardProps) {
  const user = member?.user;
  const role = member.role || "PARTICIPANT";
  const isActive = member.isActive ?? true;
  const isBanned = member.isBanned ?? false;

  // Helper to determine role color/icon
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ORGANIZER":
      case "CO_ORGANIZER":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Trophy className="w-3 h-3 mr-1" /> {role}
          </Badge>
        );
      case "REFEREE":
        return (
          <Badge variant="outline">
            <Shield className="w-3 h-3 mr-1" /> REFEREE
          </Badge>
        );
      case "COMMENTATOR":
        return <Badge variant="secondary">COMMENTATOR</Badge>;
      case "SPECTATOR":
        return <Badge variant="outline">SPECTATOR</Badge>;
      default:
        return (
          <Badge variant="secondary">
            <User className="w-3 h-3 mr-1" /> PARTICIPANT
          </Badge>
        );
    }
  };

  if (viewMode === "list") {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage
              src={member.avatar || user?.profileImage || user?.image || undefined}
              alt={member.displayName || user?.username || "User"}
            />
            <AvatarFallback>
              {(member.displayName || user?.username || "U")
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {member.displayName || user?.username || "Utilisateur inconnu"}
              {getRoleBadge(role)}
              {isBanned && <Badge variant="destructive">BANNED</Badge>}
              {!isActive && <Badge variant="secondary">INACTIVE</Badge>}
            </div>
            {member.contactEmail && (
              <div className="text-xs text-muted-foreground">{member.contactEmail}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {member.team && (
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary/50" />
              {member.team.name}
            </div>
          )}

          {userDisplay !== "member" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {actions?.onViewProfile && (
                  <DropdownMenuItem
                    onClick={() => actions.onViewProfile!(member.id)}
                  >
                    Voir le profil
                  </DropdownMenuItem>
                )}
                {actions?.onEdit && (
                  <DropdownMenuItem onClick={() => actions.onEdit!(member.id)}>
                    Modifier le rôle
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {actions?.onDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => actions.onDelete!(member.id)}
                  >
                    Retirer du tournoi
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex flex-col items-center text-center gap-4 relative">
        {userDisplay !== "member" && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => actions?.onViewProfile?.(member.id)}
                >
                  Voir le profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions?.onEdit?.(member.id)}>
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => actions?.onDelete?.(member.id)}
                >
                  Retirer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
          <AvatarImage src={member.avatar || user?.profileImage || user?.image || undefined} alt={member.displayName || user?.username || "User"} />
          <AvatarFallback className="text-lg bg-primary/5 text-primary">
            {(member.displayName || user?.username || "U")
              .substring(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 w-full">
          <h3
            className="font-bold truncate"
            title={member.displayName || user?.username || "Inconnu"}
          >
            {member.displayName || user?.username || "Inconnu"}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {member.contactEmail || "Pas d'email"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center w-full">
          {getRoleBadge(role)}
          {isBanned && <Badge variant="destructive">BANNED</Badge>}
          {!isActive && <Badge variant="secondary">INACTIVE</Badge>}
          {member.team && (
            <Badge
              variant="outline"
              className="truncate max-w-[120px]"
              title={member.team.name}
            >
              {member.team.name}
            </Badge>
          )}
        </div>

        {member.joinedAt && (
          <div className="text-xs text-muted-foreground pt-2 border-t w-full mt-2">
            Membre depuis le: {new Date(member.joinedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
