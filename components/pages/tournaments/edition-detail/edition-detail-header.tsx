"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Calendar,
  Clock,
  MapPin,
  PlayCircle,
  Share2,
  Shield,
  Trophy,
  Users,
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
import {
  Tournament,
  TournamentEdition,
  TournamentEditionWithRelations,
} from "@/database/schema";
import { useScreenSize } from "@/hooks/use-screen";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteEdition } from "@/hooks/use-editions";

interface EditionDetailHeaderProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  isOrganizer: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EditionDetailHeader({
  tournament,
  edition,
  isOrganizer,
  onEdit,
  onDelete,
}: EditionDetailHeaderProps) {
  const { isSmallScreen } = useScreenSize();

  const getStatusBadge = () => {
    switch (edition.status) {
      case "UPCOMING":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 gap-1">
            <Calendar className="h-3 w-3" /> À venir
          </Badge>
        );
      case "LIVE":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 gap-1 animate-pulse">
            <PlayCircle className="h-3 w-3" /> En cours
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 gap-1">
            <Trophy className="h-3 w-3" /> Terminé
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 gap-1">
            <Trash2 className="h-3 w-3" /> Annulé
          </Badge>
        );
      default:
        return (
          <Badge className="bg-secondary text-secondary-foreground gap-1">
            <Trophy className="h-3 w-3" /> Terminé
          </Badge>
        );
    }
  };
  
  const router = useRouter();
  const deleteMutation = useDeleteEdition();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "LIVE":
        return "bg-green-500/10 text-green-500 border-green-500/20";
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
    <div className="relative border-b bg-card">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/tournaments" className="hover:text-primary">
            Tournois
          </Link>
          <span>/</span>
          <Link
            href={`/tournaments/${tournament.id}`}
            className="hover:text-primary"
          >
            {tournament.name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {edition.name || `Édition #${edition.editionNumber}`}
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={getStatusColor(edition.status || "UPCOMING")}>
                {getStatusLabel(edition.status || "UPCOMING")}
              </Badge>
              {edition.locationType === "ONLINE" && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> En ligne
                </Badge>
              )}
            </div>

            <div>
              <Typography
                variant="h1"
                className="text-3xl md:text-4xl font-bold mb-2"
              >
                {edition.name || `Édition #${edition.editionNumber}`}
              </Typography>
              {edition.tagline && (
                <Typography variant="body-lg" className="text-muted-foreground">
                  {edition.tagline}
                </Typography>
              )}
            </div>

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

            {/* NO PRICE DISPLAY HERE */}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isOrganizer ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/tournaments/${tournament.id}/editions/${edition.id}/dashboard`}
                  >
                    Tableau de bord
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // TODO: Open edit dialog or navigate to edit
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            )}

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
