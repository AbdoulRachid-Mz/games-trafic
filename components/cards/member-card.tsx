// @/components/cards/member-card.tsx
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  User,
  Trophy,
  Mail,
  ShieldCheck,
  ShieldAlert,
  PenSquare,
  Eye,
  MessageSquare,
  Phone,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TournamentMemberWithRelations } from "@/database/schema";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-screen";
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";
import Link from "next/link";

export interface MemberCardProps extends BaseCardProps<TournamentMemberWithRelations> {
  userDisplay?: "admin" | "organizer" | "member";
  showDetail?: boolean;
  onManage?: (item: TournamentMemberWithRelations) => void;
  onViewProfile?: (item: TournamentMemberWithRelations) => void;
  onToggleCoOrganizer?: (item: TournamentMemberWithRelations) => void;
}

export function MemberCard({
  item: member,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onManage,
  onViewProfile,
  onToggleCoOrganizer,
  userDisplay = "member",
  showDetail,
  className,
}: MemberCardProps) {
  const { isMobile, isTablet } = useScreenSize();
  const user = member?.user;
  const role = member.role || "PARTICIPANT";
  const isActive = member.isActive ?? true;
  const isBanned = member.isBanned ?? false;
  const isMe = member.userId === user?.id;

  const getRoleBadge = (roleStr: string) => {
    switch (roleStr) {
      case "ORGANIZER":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-[9px] md:text-[10px] px-1.5 py-0">
            <Trophy className="w-2.5 h-2.5 mr-0.5" /> Org
          </Badge>
        );
      case "CO_ORGANIZER":
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[9px] md:text-[10px] px-1.5 py-0">
            <ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Co-Org
          </Badge>
        );
      case "REFEREE":
        return (
          <Badge variant="outline" className="text-[9px] md:text-[10px] px-1.5 py-0">
            <Shield className="w-2.5 h-2.5 mr-0.5" /> Ref
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[9px] md:text-[10px] px-1.5 py-0">
            <User className="w-2.5 h-2.5 mr-0.5" /> Part
          </Badge>
        );
    }
  };

  const handleWhatsApp = () => {
    const phone = (member as any).contactPhone || (user as any)?.phoneNumber;
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
    }
  };

  const handleCall = () => {
    const phone = (member as any).contactPhone || (user as any)?.phoneNumber;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleEmail = () => {
    const email = member.contactEmail;
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(member);
    else if (activeAction === "edit" && onEdit) onEdit(member);
    else if (activeAction === "delete" && onDelete) onDelete(member);
    else if (onViewProfile) onViewProfile(member);
  };

  const extraActions: extraActionsProps[] = [];
  if (member.contactEmail) {
    extraActions.push({
      id: "email",
      label: "Envoyer un email",
      icon: Mail,
      onClick: handleEmail,
    });
  }
  if (member.contactPhone || user?.phoneNumber) {
    extraActions.push({
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageSquare,
      onClick: handleWhatsApp,
    });
    extraActions.push({
      id: "call",
      label: "Appeler",
      icon: Phone,
      onClick: handleCall,
    });
  }
  if (userDisplay === "organizer" && member.userId && !isMe && onToggleCoOrganizer) {
    extraActions.push({
      id: "co-organizer",
      label: role === "CO_ORGANIZER" ? "Retirer co-organisateur" : "Nommer co-organisateur",
      icon: role === "CO_ORGANIZER" ? ShieldAlert : ShieldCheck,
      onClick: () => onToggleCoOrganizer(member),
    });
  }
  if (onManage) {
    extraActions.push({
      id: "manage",
      label: "Gérer",
      icon: PenSquare,
      onClick: () => onManage(member),
    });
  }

  const hasActions = onEdit || onView || onDelete || extraActions.length > 0;

  // ============================================================
  // MODE LISTE
  // ============================================================
  if (viewMode === "list") {
    const isCompact = isMobile;
    
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-3 md:p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors group relative overflow-hidden",
          isCliquable && "cursor-pointer active:scale-[0.99]",
          className
        )}
        onClick={handleMainAction}
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <Avatar className="h-8 w-8 md:h-10 md:w-10 border shrink-0">
            <AvatarImage
              src={member.avatar || user?.profileImage || "/icons/avatar-2.png"}
              alt={member.displayName || user?.username || "User"}
            />
            <AvatarFallback className="text-xs md:text-sm bg-primary/10 text-primary font-bold">
              {(member.displayName || user?.username || "U")
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <span className="font-bold text-sm md:text-base truncate max-w-[120px] md:max-w-[200px]">
                {member.displayName || user?.username || "Utilisateur"}
              </span>
              {getRoleBadge(role)}
              {isBanned && <Badge variant="destructive" className="text-[8px] md:text-[9px] px-1">Banni</Badge>}
              {isMe && <Badge variant="default" className="text-[8px] md:text-[9px] px-1 bg-primary/80">Moi</Badge>}
            </div>
            
            {!isCompact && (
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                {member.contactEmail && (
                  <span className="truncate max-w-[120px] md:max-w-[200px]">
                    {member.contactEmail}
                  </span>
                )}
                {member.team && !isTablet && (
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="truncate max-w-[100px]">{member.team.name}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Actions rapides sur desktop */}
          {!isMobile && (
            <>
              {member.contactEmail && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-primary"
                        onClick={handleEmail}
                      >
                        <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Envoyer un email</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {(member.contactPhone || user?.phoneNumber) && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-green-600"
                          onClick={handleWhatsApp}
                        >
                          <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>WhatsApp</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-blue-600"
                          onClick={handleCall}
                        >
                          <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Appeler</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </>
          )}

          {/* Dropdown menu centralisé */}
          {hasActions && (
            <CardActionMenu
              onEdit={onEdit ? () => onEdit(member) : undefined}
              onView={onView ? () => onView(member) : undefined}
              onDelete={onDelete ? () => onDelete(member) : undefined}
              entityName={`le membre ${member.displayName || user?.username}`}
              extraActions={extraActions}
            />
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // MODE GRILLE (DEFAULT)
  // ============================================================
  const isCompactGrid = isMobile || isMini;
  const avatarSize = isCompactGrid ? "h-16 w-16" : "h-20 w-20 md:h-24 md:w-24";
  const avatarFallbackSize = isCompactGrid ? "text-lg" : "text-xl md:text-2xl";

  return (
    <Card 
      className={cn(
        "relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80",
        isCliquable && "cursor-pointer active:scale-[0.99]",
        className
      )}
      onClick={handleMainAction}
    >
      {/* Actions en absolute top-right */}
      {hasActions && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <CardActionMenu
            onEdit={onEdit ? () => onEdit(member) : undefined}
            onView={onView ? () => onView(member) : undefined}
            onDelete={onDelete ? () => onDelete(member) : undefined}
            entityName={`le membre ${member.displayName || user?.username}`}
            extraActions={extraActions}
          />
        </div>
      )}

      <CardContent className={cn(
        "flex flex-col items-center text-center",
        isCompactGrid ? "p-4" : "p-4 md:p-6"
      )}>
        {/* Avatar */}
        <div className="relative">
          <Avatar className={cn(avatarSize, "border-4 border-background shadow-xl group-hover:scale-105 transition-transform duration-300")}>
            <AvatarImage
              src={member.avatar || user?.profileImage || "/icons/avatar-2.png"}
              alt={member.displayName || user?.username || "User"}
            />
            <AvatarFallback className={cn(avatarFallbackSize, "bg-primary/10 text-primary font-bold")}>
              {(member.displayName || user?.username || "U")
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isActive && (
            <span className="absolute bottom-0 right-0 h-3 w-3 md:h-4 md:w-4 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>

        {/* Nom et badges */}
        <div className="mt-3 md:mt-4 space-y-1 w-full">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-sm md:text-base truncate max-w-[150px] md:max-w-[180px]">
              {member.displayName || user?.username || "Inconnu"}
            </h3>
            {isMe && (
              <Badge variant="default" className="text-[8px] md:text-[9px] h-4 px-1 bg-primary/80">Moi</Badge>
            )}
          </div>
          
          {/* Badges rôles */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {getRoleBadge(role)}
            {isBanned && (
              <Badge variant="destructive" className="text-[8px] md:text-[9px] px-1">Banni</Badge>
            )}
          </div>

          {/* Équipe */}
          {member.team && !isCompactGrid && (
            <Badge variant="outline" className="text-[8px] md:text-[9px] gap-1">
              <Trophy className="w-2.5 h-2.5" />
              {member.team.name.length > 20 ? member.team.name.slice(0, 20) + "..." : member.team.name}
            </Badge>
          )}
        </div>

        {/* Informations de contact (compact sur mobile) */}
        {!isCompactGrid && (member.contactEmail || member.contactPhone || user?.phoneNumber) && (
          <div className="mt-2 text-[10px] md:text-xs text-muted-foreground space-y-0.5">
            {member.contactEmail && (
              <div className="truncate max-w-[180px] md:max-w-[200px]">
                ✉️ {member.contactEmail.length > 25 ? member.contactEmail.slice(0, 25) + "..." : member.contactEmail}
              </div>
            )}
            {(member.contactPhone || user?.phoneNumber) && (
              <div className="truncate max-w-[180px] md:max-w-[200px]">
                📱 {(member.contactPhone || user?.phoneNumber)?.slice(0, 15)}
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action rapides (uniquement sur desktop) */}
        {!isCompactGrid && (
          <div className="grid grid-cols-2 gap-2 w-full mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-[10px] md:text-xs h-8 md:h-9 gap-1"
              onClick={handleMainAction}
            >
              <Eye className="w-3 h-3" />
              Profil
            </Button>

            {userDisplay === "organizer" && member.userId && !isMe && onToggleCoOrganizer && (
              <Button
                variant={role === "CO_ORGANIZER" ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "w-full text-[10px] md:text-xs h-8 md:h-9 gap-1",
                  role === "CO_ORGANIZER" && "bg-amber-500/10 text-amber-600"
                )}
                onClick={() => onToggleCoOrganizer(member)}
              >
                {role === "CO_ORGANIZER" ? (
                  <ShieldAlert className="w-3 h-3" />
                ) : (
                  <ShieldCheck className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">
                  {role === "CO_ORGANIZER" ? "Co-Org" : "Nommer"}
                </span>
              </Button>
            )}
          </div>
        )}

        {/* Date d'adhésion (masquée sur mobile) */}
        {member.joinedAt && !isCompactGrid && (
          <div className="text-[9px] md:text-[10px] text-muted-foreground/50 mt-2">
            Depuis {new Date(member.joinedAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}