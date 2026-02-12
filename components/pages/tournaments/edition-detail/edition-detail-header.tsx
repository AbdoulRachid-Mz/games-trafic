"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Calendar,
  Users,
  Trophy,
  MapPin,
  Share2,
  PlayCircle,
  Clock,
  Shield,
  Award,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  Tournament,
  TournamentEditionWithRelations,
} from "@/database/schema";
import { useScreenSize } from "@/hooks/use-screen";
import { useRouter } from "next/navigation";
import { useDeleteEdition } from "@/hooks/use-editions";
import { cn } from "@/lib/utils";
import { EditionJoinDialog } from "./edition-join-dialog";

interface EditionDetailHeaderProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  isOrganizer: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onJoinClick?: () => void;
  onPaymentClick?: () => void;
  onCancelJoin?: () => void;
  onCancelPayment?: () => void;
  onConfirmPayment?: () => void;
  isRegistered?: boolean;
}

export function EditionDetailHeader({
  tournament,
  edition,
  isOrganizer,
  onEdit,
  onDelete,
  onJoinClick,
  onPaymentClick,
  onCancelJoin,
  onCancelPayment,
  onConfirmPayment,
  isRegistered,
}: EditionDetailHeaderProps) {
  const { isMobile } = useScreenSize();
  const router = useRouter();
  const deleteMutation = useDeleteEdition();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "LIVE":
        return "bg-green-500/10 text-green-500 border-green-500/20 animate-pulse";
      case "COMPLETED":
        return "bg-secondary text-secondary-foreground";
      case "CANCELLED":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "À venir";
      case "LIVE":
        return "En cours";
      case "COMPLETED":
        return "Terminé";
      case "CANCELLED":
        return "Annulé";
      default:
        return status;
    }
  };

  const getLocationIcon = (type: string) => {
    return type === "ONLINE" ? "🌐" : "📍";
  };

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette édition ?")) {
      deleteMutation.mutate(edition.id, {
        onSuccess: () => {
          router.push(`/tournaments/${tournament.id}`);
        },
      });
    }
  };

  return (
    <div className="relative border-b bg-gradient-to-b from-background via-background to-muted/10">
      {/* Bannière */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        {tournament.coverImage ? (
          <Image
            src={tournament.coverImage}
            alt={tournament.name}
            fill
            className="object-cover opacity-20"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />

        {/* Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      </div>

      {/* Informations */}
      <div className="container mx-auto px-4 relative -mt-16">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Logo/Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-2xl">
                <Trophy className="h-12 w-12 md:h-14 md:w-14 text-primary" />
              </div>

              {/* Statut */}
              <div className="absolute -bottom-2 -right-2">
                <Badge className={getStatusColor(edition.status || "UPCOMING")}>
                  {getStatusLabel(edition.status || "UPCOMING")}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Informations */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Typography
                variant="h1"
                weight="bold"
                className="text-2xl md:text-4xl"
              >
                {edition.name || `Édition #${edition.editionNumber}`}
              </Typography>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  <span className="text-lg">{getLocationIcon(edition.locationType || "ONLINE")}</span>
                  {edition.locationType === "ONLINE" ? "En ligne" : "Présentiel"}
                </Badge>

                {edition.entryFee && Number(edition.entryFee) > 0 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 gap-1">
                    <Trophy className="h-3 w-3" />
                    {edition.entryFee} {edition.prizeCurrency || "GTC"}
                  </Badge>
                )}
              </div>
            </div>

            {edition.tagline && (
              <Typography
                variant="body-lg"
                className="max-w-3xl mb-4 text-muted-foreground"
              >
                {edition.tagline}
              </Typography>
            )}

            <div className="flex flex-wrap gap-4 md:gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {format(new Date(edition.startDate), "d MMMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  {edition.currentParticipants || 0} / {edition.maxParticipants}{" "}
                  participants
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Join button for non-organizers */}
            {!isOrganizer && !isRegistered && (
              <Button
                variant="default"
                size="sm"
                onClick={onJoinClick}
              >
                Joindre
              </Button>
            )}

            {/* Organizer actions dropdown */}
            {isOrganizer && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/tournaments/${tournament.id}/editions/${edition.id}/dashboard`}
                    >
                      Tableau de bord
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/tournaments/${tournament.id}/editions/${edition.id}/matches`}
                    >
                      Matchs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/tournaments/${tournament.id}/editions/${edition.id}/calendar`}
                    >
                      Calendrier
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // TODO: Open edit dialog or navigate to edit
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Share button for non-organizers */}
            {!isOrganizer && (
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            )}

            {/* Map button */}
            {edition.locationType !== "ONLINE" && edition.location && (
              <Button variant="default" className="gap-2" asChild>
                <a
                  href={`https://maps.google.com/?q=${edition.location}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-4 w-4" />
                  Voir sur la carte
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
