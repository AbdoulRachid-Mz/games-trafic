// components/pages/tournaments/edition-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Trophy, 
  MapPin, 
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TournamentEdition } from "@/database/schema";

interface EditionCardProps {
  edition: TournamentEdition;
  tournamentId: string;
  onView?: () => void;
  onJoin?: () => void;
}

export function EditionCard({ edition, tournamentId, onView, onJoin }: EditionCardProps) {
  const getStatusBadge = () => {
    switch (edition.status) {
      case "UPCOMING":
        return (
          <Badge className="bg-blue-500 gap-1">
            <Clock className="h-3 w-3" />
            À venir
          </Badge>
        );
      case "LIVE":
        return (
          <Badge className="bg-green-500 gap-1 animate-pulse">
            <PlayCircle className="h-3 w-3" />
            En direct
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-gray-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Terminé
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-500 gap-1">
            <XCircle className="h-3 w-3" />
            Annulé
          </Badge>
        );
      default:
        return null;
    }
  };

  const isJoinable = edition.status === "UPCOMING" && 
    new Date(edition.registrationDeadline || edition.startDate) > new Date();

  return (
    <Card className="h-full hover:shadow-md transition-all group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate">
            {edition.name || `Édition #${edition.editionNumber}`}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Typography variant="body-sm">
              {format(new Date(edition.startDate), "d MMM yyyy", { locale: fr })}
              {edition.endDate && ` - ${format(new Date(edition.endDate), "d MMM yyyy", { locale: fr })}`}
            </Typography>
          </div>
          
          {edition.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm" className="truncate">
                {edition.location}
              </Typography>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-4 w-4 text-blue-500" />
              <Typography variant="body-base" weight="bold">
                {edition.currentParticipants || 0}/{edition.maxParticipants || "∞"}
              </Typography>
            </div>
            <Typography variant="caption2" theme="muted">
              Participants
            </Typography>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <Typography variant="body-base" weight="bold">
                {edition.prizePool || 0} GTC
              </Typography>
            </div>
            <Typography variant="caption2" theme="muted">
              Cashprize
            </Typography>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onView}
          >
            Détails
          </Button>
          {isJoinable && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={onJoin}
            >
              S'inscrire
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}