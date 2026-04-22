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
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Tournament, TournamentEditionWithRelations } from "@/database/schema";
import { useScreenSize } from "@/hooks/use-screen";
import { useRouter } from "next/navigation";
import { useDeleteEdition } from "@/hooks/use-editions";
import { cn } from "@/lib/utils";
import { EditionJoinDialog } from "./edition-join-dialog";
import { InteractionButton } from "@/components/shared/interaction-button";

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
  recentMatches?: any[];
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
  recentMatches = [],
}: EditionDetailHeaderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const { isMobile } = useScreenSize();

  // Autoplay functionality: 15 seconds
  React.useEffect(() => {
    if (!emblaApi) return;
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [emblaApi]);
  const router = useRouter();
  const deleteMutation = useDeleteEdition();

  const dropdownData = [
    {
      label: "Tableau de bord",
      icon: null,
      onClick: () =>
        router.push(
          `/tournaments/${tournament.id}/editions/${edition.id}/dashboard`,
        ),
      disabled: false,
      requireOrganizer: true,
    },
    {
      label: "Matchs",
      icon: null,
      onClick: () =>
        router.push(
          `/tournaments/${tournament.id}/editions/${edition.id}/matches`,
        ),
      disabled: false,
      requireOrganizer: true,
    },
    {
      label: "Calendrier",
      icon: Calendar,
      onClick: () =>
        router.push(
          `/tournaments/${tournament.id}/editions/${edition.id}/calendar`,
        ),
      disabled: false,
      requireOrganizer: true,
    },
    {
      label: "Modifier",
      icon: Edit,
      onClick: onEdit,
      disabled: false,
      requireOrganizer: true,
    },
    {
      label: "Supprimer",
      icon: Trash2,
      onClick: () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette édition ?")) {
          deleteMutation.mutate(edition.id, {
            onSuccess: () => {
              router.push(`/tournaments/${tournament.id}`);
            },
          });
        }
      },
      disabled: deleteMutation.isPending,
      requireOrganizer: true,
      variant: "destructive",
    },
  ];

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
  const visibleActions = dropdownData.filter(
    (item) => !item.requireOrganizer || isOrganizer,
  );
  const primaryActions = visibleActions.slice(0, 2);
  const secondaryActions = visibleActions.slice(2);

  return (
    <div className="relative border-b bg-gradient-to-b from-background via-background to-muted/10">
      {/* Bannière Carousel */}
      <div
        className="relative h-64 md:h-80 overflow-hidden bg-muted/20"
        ref={emblaRef}
      >
        <div className="flex h-full">
          {/* Slide 1: Cover Image */}
          <div className="flex-[0_0_100%] min-w-0 relative h-full group">
            {tournament.coverImage ? (
              <Image
                src={tournament.coverImage}
                alt={tournament.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:left-24 md:translate-x-0 hidden md:block">
              <Badge className="bg-primary/80 backdrop-blur-md border-primary/20 text-white px-4 py-1.5 uppercase tracking-[0.2em] text-[10px] font-black italic">
                Official Cover
              </Badge>
            </div>
          </div>

          {/* Matches Slides */}
          {recentMatches.map((match, idx) => (
            <Link
              key={match.id}
              href={`/tournaments/${tournament.id}/editions/${edition.id}/matches/${match.id}`}
              className="flex-[0_0_100%] lg:flex-[0_0_50%] xl:flex-[0_0_33.333%] min-w-0 relative h-full px-2 py-4"
            >
              <div className="absolute inset-0 pointer-events-none">
                {tournament.coverImage && (
                  <Image
                    src={tournament.coverImage}
                    alt="match"
                    fill
                    className="object-cover opacity-10 blur-sm scale-110"
                  />
                )}
              </div>

              <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group/card hover:border-primary/30 transition-colors">
                {/* Decorative background circle */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover/card:bg-primary/20 transition-colors" />

                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="outline"
                    className="bg-background/20 backdrop-blur-sm border-white/10 text-[10px] uppercase font-bold tracking-widest text-white/70"
                  >
                    {match.phase?.name || "Match"}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium italic">
                    <Clock className="h-3 w-3" />
                    {match.status === "COMPLETED"
                      ? "Terminé"
                      : format(
                          new Date(match.scheduledTime || match.createdAt),
                          "HH:mm",
                          { locale: fr },
                        )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 md:gap-8 flex-1">
                  {/* Participant 1 */}
                  <div className="flex flex-col items-center gap-3 flex-1 text-center">
                    <div className="relative">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted/20 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-lg group-hover/card:scale-110 transition-transform relative">
                        {match.participant1?.member?.team?.logo ||
                        match.participant1?.member?.user?.profileImage ? (
                          <Image
                            src={
                              match.participant1?.member?.team?.logo ||
                              match.participant1?.member?.user?.profileImage ||
                              match.participant1?.member?.user?.image ||
                              "/icons/avatar-500.png"
                            }
                            alt="participant1"
                            fill
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-white/20 font-black">?</div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-white line-clamp-1 truncate w-full uppercase tracking-tighter">
                      {match.participant1?.member?.team?.name ||
                        match.participant1?.member?.user?.username ||
                        "À déterminer"}
                    </span>
                  </div>

                  {/* Score / VS */}
                  <div className="flex flex-col items-center gap-1">
                    {match.status === "COMPLETED" ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-2xl md:text-3xl font-black italic",
                            (match.score1 ?? 0) > (match.score2 ?? 0)
                              ? "text-primary shadow-primary/20"
                              : "text-white/90",
                          )}
                        >
                          {match.score1 ?? 0}
                        </span>
                        <span className="text-white/20 font-black">-</span>
                        <span
                          className={cn(
                            "text-2xl md:text-3xl font-black italic",
                            (match.score2 ?? 0) > (match.score1 ?? 0)
                              ? "text-primary shadow-primary/20"
                              : "text-white/90",
                          )}
                        >
                          {match.score2 ?? 0}
                        </span>
                      </div>
                    ) : (
                      <div className="h-8 w-12 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
                        <span className="text-xs font-black italic text-primary">
                          VS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Participant 2 */}
                  <div className="flex flex-col items-center gap-3 flex-1 text-center">
                    <div className="relative">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted/20 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-lg group-hover/card:scale-110 transition-transform relative">
                        {match.participant2?.member?.team?.logo ||
                        match.participant2?.member?.user?.profileImage ? (
                          <Image
                            src={
                              match.participant2?.member?.team?.logo ||
                              match.participant2?.member?.user?.profileImage ||
                              match.participant2?.member?.user?.image ||
                              "/icons/avatar-500.png"
                            }
                            alt=""
                            fill
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-white/20 font-black">?</div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-white line-clamp-1 truncate w-full uppercase tracking-tighter">
                      {match.participant2?.member?.team?.name ||
                        match.participant2?.member?.user?.username ||
                        "À déterminer"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-[10px] text-white/30 hover:text-primary h-auto p-0 uppercase font-black"
                    asChild
                  >
                    <Link
                      href={`/tournaments/${tournament.id}/editions/${edition.id}/matches/${match.id}`}
                    >
                      Voir les détails <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Informations */}
      <div className="container mx-auto px-2 relative -mt-16">
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
          {/* Logo/Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <div className="relative">
              <div className="w-24 relative h-24 md:w-28 md:h-28 rounded-xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-2xl">
                <Image
                  src={
                    edition.tournament?.profileImage ??
                    "/icons/tournament-500.png"
                  }
                  alt={edition.name || "edition image profile"}
                  fill
                  className="h-full w-full object-cover"
                />
                {/* <Trophy className="h-12 w-12 md:h-14 md:w-14 text-primary" /> */}
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
                  <span className="text-lg">
                    {getLocationIcon(edition.locationType || "ONLINE")}
                  </span>
                  {edition.locationType === "ONLINE"
                    ? "En ligne"
                    : "Présentiel"}
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
                  {edition.registrations?.length || 0} /{" "}
                  {edition.maxParticipants} participants
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center max-md:my-2 max-md:w-full gap-3">
            {primaryActions.map((action, index) => (
              <Button
                key={index}
                variant="default"
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="gap-2 flex-1"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
            {secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {secondaryActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        action.variant === "destructive" && "text-destructive",
                      )}
                    >
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
