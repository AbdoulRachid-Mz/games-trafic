import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Shield, User, Trophy, Mail, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TournamentMemberWithRelations } from "@/database/schema";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: TournamentMemberWithRelations;
  viewMode?: "grid" | "list";
  userDisplay?: "admin" | "organizer" | "member";
  actions?: {
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onViewProfile?: (id: string) => void;
    onToggleCoOrganizer?: (id: string) => void;
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
  const isMe = member.userId === user?.id;

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
              src={member.avatar || user?.profileImage || undefined}
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
          {userDisplay === "organizer" && member.userId && !isMe && (
            <Button
              variant={role === "CO_ORGANIZER" ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "gap-2 h-8",
                role === "CO_ORGANIZER" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" : ""
              )}
              onClick={() => actions?.onToggleCoOrganizer?.(member.id)}
            >
              {role === "CO_ORGANIZER" ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {role === "CO_ORGANIZER" ? "Co-organisateur" : "Nommer Co-organisateur"}
              </span>
            </Button>
          )}

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
                <DropdownMenuItem
                  onClick={() => actions?.onToggleCoOrganizer?.(member.id)}
                  disabled={!member.userId || isMe}
                >
                  {role === "CO_ORGANIZER" ? "Retirer co-organisateur" : "Nommer co-organisateur"}
                </DropdownMenuItem>
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
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-card to-card/50 relative">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-6 flex flex-col items-center text-center gap-4 relative z-10">
        {userDisplay !== "member" && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-background/80"
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
                <DropdownMenuItem
                  onClick={() => actions?.onToggleCoOrganizer?.(member.id)}
                  disabled={!member.userId || isMe}
                >
                  {role === "CO_ORGANIZER" ? "Retirer co-organisateur" : "Nommer co-organisateur"}
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

        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl scale-100 group-hover:scale-105 transition-transform duration-300">
            <AvatarImage src={member.avatar || user?.profileImage || undefined} alt={member.displayName || user?.username || "User"} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-black italic">
              {(member.displayName || user?.username || "U")
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isActive && (
            <span className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 border-4 border-background rounded-full shadow-sm" title="Actif" />
          )}
        </div>

        <div className="space-y-1 w-full flex flex-col items-center">
          <h3
            className="font-black italic uppercase tracking-tighter text-lg truncate max-w-full"
            title={member.displayName || user?.username || "Inconnu"}
          >
            {member.displayName || user?.username || "Inconnu"}
            {isMe && <Badge className="ml-2 bg-primary text-[10px] h-4">Moi</Badge>}
          </h3>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {member.contactEmail || "Pas d'email"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center w-full min-h-[24px]">
          {getRoleBadge(role)}
          {isBanned && <Badge variant="destructive" className="animate-pulse">BANNED</Badge>}
          {member.team && (
            <Badge
              variant="outline"
              className="bg-background/50 backdrop-blur-sm border-primary/20"
              title={member.team.name}
            >
              <Trophy className="w-3 h-3 mr-1 text-primary" />
              {member.team.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 w-full gap-2 mt-2 pt-4 border-t border-primary/10">
          <Button
            variant="secondary"
            size="sm"
            className="w-full font-bold h-9"
            onClick={() => actions?.onViewProfile?.(member.id)}
          >
            Voir le profil
          </Button>

          {userDisplay === "organizer" && member.userId && !isMe && (
            <Button
              variant={role === "CO_ORGANIZER" ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "w-full font-bold h-9",
                role === "CO_ORGANIZER" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : ""
              )}
              onClick={() => actions?.onToggleCoOrganizer?.(member.id)}
            >
              {role === "CO_ORGANIZER" ? (
                <ShieldCheck className="h-4 w-4 mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {role === "CO_ORGANIZER" ? "Co-organisateur" : "Nommer Co-organisateur"}
            </Button>
          )}

          {member.team && (
            <Button
              variant="outline"
              size="sm"
              className="w-full font-bold h-9 bg-primary/5 border-primary/20 hover:bg-primary/10"
              onClick={() => {/* Gérer logic */ }}
            >
              Gérer l&apos;équipe
            </Button>
          )}
        </div>

        {member.joinedAt && (
          <div className="text-[10px] text-muted-foreground font-medium opacity-60">
            Dpuis le {new Date(member.joinedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
