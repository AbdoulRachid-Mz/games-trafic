// @/components/cards/tournament-card.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";
import { tournamentStatusLabel } from "@/utils/types-label";
import {
  Trophy,
  Calendar,
  Users,
  Gamepad2,
  MapPin,
  Clock,
  Award,
  Shield,
  TrendingUp,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import type { Tournament } from "@/database/schema";
import { useRouter } from "next/navigation";

type TournamentStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface TournamentCardProps extends BaseCardProps<
  Tournament & {
    currentEdition?: {
      id: string;
      name: string;
      startDate: Date;
      prizePool: number;
      participants: number;
    };
    organizer?: {
      username: string;
    };
  }
> {
  showDetails?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showFollowButton?: boolean;
  showLikeButton?: boolean;
  onJoin?: (item: Tournament & {
    currentEdition?: {
      id: string;
      name: string;
      startDate: Date;
      prizePool: number;
      participants: number;
    };
    organizer?: {
      username: string;
    };
  }) => void;
}

export function TournamentCard({
  item: tournament,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onJoin,
  showDetails = true,
  showStats = true,
  showActions = true,
  showFollowButton = true,
  showLikeButton = false,
  className,
}: TournamentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;
  const router = useRouter();

  const statusConfig: Record<TournamentStatus, {
    label: string;
    color: string;
    icon: React.ReactNode;
  }> = {
    UPCOMING: {
      label: tournamentStatusLabel("UPCOMING"),
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: <Calendar className="w-3 h-3" />,
    },
    LIVE: {
      label: tournamentStatusLabel("LIVE"),
      color: "bg-green-500/10 text-green-600 border-green-500/20 animate-pulse",
      icon: <TrendingUp className="w-3 h-3" />,
    },
    COMPLETED: {
      label: tournamentStatusLabel("COMPLETED"),
      color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      icon: <Award className="w-3 h-3" />,
    },
    CANCELLED: {
      label: tournamentStatusLabel("CANCELLED"),
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: <Shield className="w-3 h-3" />,
    },
  };

  const handleView = () => {
    if (onView) {
      onView(tournament);
    } else {
      router.push(`/tournaments/${tournament.id}`);
    }
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(tournament);
    else if (activeAction === "edit" && onEdit) onEdit(tournament);
    else if (activeAction === "delete" && onDelete) onDelete(tournament);
    else handleView();
  };

  // Bouton « Voir » : même pattern que handleJoin — ne pas laisser le click
  // bouillonner vers handleMainAction (double navigation).
  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleView();
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(tournament);
    }
  };

  const extraActions: extraActionsProps[] = [];
  if (onJoin && tournament.status === "UPCOMING") {
    extraActions.push({
      id: "join",
      label: "S'inscrire",
      icon: UserPlus,
      onClick: () => onJoin(tournament),
    });
  }

  const hasActions = onEdit || onView || onDelete || extraActions.length > 0;

  // Rendu de l'image
  const renderImage = () => (
    <div className="relative overflow-hidden py-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 aspect-[16/9]">
      {tournament.coverImage ? (
        <Image
          src={tournament.coverImage}
          alt={tournament.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500",
            isHovered && "scale-105"
          )}
          sizes={isList ? "300px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy className="w-16 h-16 text-primary/30" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Statut en overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 items-center">
        <Badge className={cn(
          "backdrop-blur-md border gap-1 px-3",
          statusConfig[tournament.status as TournamentStatus]?.color
        )}>
          {statusConfig[tournament.status as TournamentStatus]?.icon}
          {statusConfig[tournament.status as TournamentStatus]?.label}
        </Badge>

        {!isList && hasActions && (
          <div onClick={(e) => e.stopPropagation()} className="z-20">
            <CardActionMenu
              onEdit={onEdit ? () => onEdit(tournament) : undefined}
              onView={onView ? () => onView(tournament) : undefined}
              onDelete={onDelete ? () => onDelete(tournament) : undefined}
              entityName={`le tournoi ${tournament.name}`}
              extraActions={extraActions}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Rendu du contenu
  const renderContent = () => {
    if (isCompact) {
      return (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
            {tournament.profileImage ? (
              <Image
                src={tournament.profileImage}
                alt={tournament.name}
                fill
                className="object-cover"
              />
            ) : (
              <Trophy className="w-6 h-6 text-primary absolute inset-0 m-auto" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="body-sm" weight="semibold" className="truncate">
              {tournament.name}
            </Typography>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {tournament.game}
              </Badge>
              <Typography variant="caption2" theme="muted">
                {tournament.totalParticipants || 0} participants
              </Typography>
            </div>
          </div>
          {isCompact && hasActions && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(tournament) : undefined}
                onView={onView ? () => onView(tournament) : undefined}
                onDelete={onDelete ? () => onDelete(tournament) : undefined}
                entityName={`le tournoi ${tournament.name}`}
                extraActions={extraActions}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Typography
              variant={isList ? "h4" : "h5"}
              weight="bold"
              className="line-clamp-1 group-hover:text-primary transition-colors"
            >
              {tournament.name}
            </Typography>

            {showDetails && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <Gamepad2 className="w-3 h-3 mr-1" />
                  {tournament.game}
                </Badge>
                {tournament.organizer && (
                  <Typography variant="caption2" theme="muted">
                    Par {tournament.organizer.username}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {isList && hasActions && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(tournament) : undefined}
                onView={onView ? () => onView(tournament) : undefined}
                onDelete={onDelete ? () => onDelete(tournament) : undefined}
                entityName={`le tournoi ${tournament.name}`}
                extraActions={extraActions}
              />
            </div>
          )}
        </div>

        {/* Description */}
        {showDetails && tournament.description && (
          <Typography
            variant="body-sm"
            theme="muted"
            className="line-clamp-2 leading-relaxed"
          >
            {tournament.description}
          </Typography>
        )}

        {/* Statistiques */}
        {showStats && showDetails && (
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <Trophy className="w-5 h-5" />
                {tournament.totalPrizePool || 0} GTC
              </div>
              <Typography variant="caption2" theme="muted">
                Cashprize
              </Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold">
                <Users className="w-5 h-5" />
                {tournament.totalParticipants || 0}
              </div>
              <Typography variant="caption2" theme="muted">
                Participants
              </Typography>
            </div>
          </div>
        )}

        {/* Édition courante */}
        {tournament.currentEdition && showDetails && (
          // stopPropagation : ce Link vit DANS la carte cliquable entière ;
          // sans lui, le click bouillonne vers handleMainAction (router.push
          // vers le tournoi) et la navigation est une course Link vs push.
          <div onClick={(e) => e.stopPropagation()}>
            <Link href={`/tournaments/${tournament.id}/editions/${tournament.currentEdition.id}`}>
              <div className="rounded-lg bg-secondary/10 cursor-pointer p-3 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="body-sm" weight="semibold">
                      {tournament.currentEdition.name || "Édition en cours"}
                    </Typography>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <Typography variant="caption2" theme="muted">
                        {new Date(tournament.currentEdition.startDate).toLocaleDateString('fr-FR')}
                      </Typography>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {tournament.currentEdition.participants || 0} inscrits
                  </Badge>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {showFollowButton && (
                <InteractionButton
                  type="follow"
                  entityType="TOURNAMENT"
                  entityId={tournament.id}
                  size="sm"
                  variant="outline"
                />
              )}
              {showLikeButton && (
                <InteractionButton
                  type="like"
                  entityType="TOURNAMENT"
                  entityId={tournament.id}
                  size="sm"
                  variant="ghost"
                  iconOnly
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              {tournament.status === "UPCOMING" && onJoin && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleJoin}
                  className="gap-2"
                >
                  S'inscrire
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewClick}
                className="gap-2"
              >
                Voir
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rendu selon le mode
  if (isList) {
    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all hover:shadow-lg relative overflow-hidden",
          isCliquable && "active:scale-[0.99]",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleMainAction}
      >
        <div className="flex gap-4 p-4">
          <div className="w-40 sm:w-64 flex-shrink-0">
            {renderImage()}
          </div>
          <CardContent className="p-0 flex-1">
            {renderContent()}
          </CardContent>
        </div>
      </Card>
    );
  }

  if (isGrid) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "group cursor-pointer h-full overflow-hidden transition-all hover:shadow-xl border-border/50 relative",
            isCliquable && "active:scale-[0.99]",
            className
          )}
          onClick={handleMainAction}
        >
          <CardContent className="p-0">
            {renderImage()}
            <div className="p-4">
              {renderContent()}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Mode compact
  return (
    <Card
      className={cn("cursor-pointer hover:shadow-md relative overflow-hidden", className)}
      onClick={handleMainAction}
    >
      <CardContent className="p-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}