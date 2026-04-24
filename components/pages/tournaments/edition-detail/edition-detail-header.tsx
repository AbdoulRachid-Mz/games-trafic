"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  ChevronLeft,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
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
import { EditionPaymentDialog } from "./edition-payment-dialog";
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
  const [api, setApi] = useState<CarouselApi>();
  const { isMobile, screenSize } = useScreenSize();
  const router = useRouter();
  const deleteMutation = useDeleteEdition();

  // Autoplay: 15 secondes
  useEffect(() => {
    if (!api) return;
    
    const intervalId = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [api]);

  // Nombre d'items visibles selon la taille d'écran
  const getItemsPerView = () => {
    if (screenSize.width < 640) return 1;
    if (screenSize.width < 1024) return 2;
    return 3;
  };

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

  const visibleActions = dropdownData.filter(
    (item) => !item.requireOrganizer || isOrganizer,
  );
  const primaryActions = visibleActions.slice(0, 2);
  const secondaryActions = visibleActions.slice(2);

  return (
    <div className="relative border-b bg-gradient-to-b from-background via-background to-muted/10">
      {/* Bannière Carousel avec shadcn/ui */}
      <div className="relative w-full overflow-hidden">
        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
            align: "start",
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent>
            {/* Slide 1: Cover Image */}
            <CarouselItem className="relative h-48 sm:h-64 md:h-80 lg:h-96">
              <div className="relative w-full h-full group">
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
                <div className="absolute bottom-3 left-4 md:bottom-6 md:left-8">
                  <Badge className="bg-primary/80 backdrop-blur-md border-primary/20 text-white px-2 py-0.5 md:px-3 md:py-1 uppercase tracking-[0.1em] text-[8px] md:text-[10px] font-black italic">
                    Édition #{edition.editionNumber}
                  </Badge>
                </div>
              </div>
            </CarouselItem>

            {/* Si terminé, afficher le Champion */}
            {edition.status === "COMPLETED" && edition.winnerMetadata ? (
              <CarouselItem className="basis-full sm:basis-1/2 lg:basis-1/3 pl-2 md:pl-4">
                <div className="relative h-48 sm:h-64 md:h-80 w-full rounded-xl md:rounded-2xl overflow-hidden group/card border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-background to-background" />
                  
                  <div className="relative h-full w-full p-4 md:p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="absolute top-4 right-4">
                      <Trophy className="h-6 w-6 text-yellow-500 animate-pulse" />
                    </div>
                    
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/50 uppercase tracking-widest text-[10px]">
                      Champion de l'Édition
                    </Badge>
                    
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-muted overflow-hidden border-4 border-yellow-500 shadow-lg relative">
                      {(edition.winnerMetadata as any).image ? (
                        <Image
                          src={(edition.winnerMetadata as any).image}
                          alt={(edition.winnerMetadata as any).username || "Champion"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                          {((edition.winnerMetadata as any).username || "C").charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl md:text-2xl font-black italic tracking-tighter text-foreground">
                        {(edition.winnerMetadata as any).username}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Félicitations pour cette victoire !</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ) : null}

            {/* Slides des matchs récents */}
            {edition.status !== "COMPLETED" && recentMatches.map((match, idx) => (
              <CarouselItem
                key={match.id}
                className="basis-full sm:basis-1/2 lg:basis-1/3 pl-2 md:pl-4"
              >
                <Link
                  href={`/tournaments/${tournament.id}/editions/${edition.id}/matches/${match.id}`}
                  className="block h-full"
                >
                  <div className="relative h-48 sm:h-64 md:h-80 w-full rounded-xl md:rounded-2xl overflow-hidden group/card">
                    {/* Background avec overlay */}
                    <div className="absolute inset-0">
                      {tournament.coverImage && (
                        <Image
                          src={tournament.coverImage}
                          alt="background"
                          fill
                          className="object-cover opacity-20 blur-sm scale-110"
                        />
                      )}
                    </div>
                    
                    {/* Contenu de la carte */}
                    <div className="relative h-full w-full bg-gradient-to-br from-background/95 via-background/90 to-primary/5 backdrop-blur-sm p-3 md:p-5 flex flex-col justify-between">
                      {/* Header de la carte */}
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                        <Badge
                          variant="outline"
                          className="bg-background/50 backdrop-blur-sm border-white/10 text-[8px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground"
                        >
                          {match.phase?.name || "Match"}
                        </Badge>
                        <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          {match.status === "COMPLETED"
                            ? "Terminé"
                            : match.scheduledTime
                              ? format(new Date(match.scheduledTime), "HH:mm", { locale: fr })
                              : "À planifier"}
                        </div>
                      </div>

                      {/* Participants et score */}
                      <div className="flex items-center justify-center gap-2 md:gap-4 flex-1">
                        {/* Participant 1 */}
                        <div className="flex flex-col items-center gap-1.5 md:gap-2 flex-1 text-center">
                          <div className="relative">
                            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-muted/30 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-lg group-hover/card:scale-110 transition-transform">
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
                                  className="object-cover"
                                />
                              ) : (
                                <div className="text-white/20 font-black text-xs md:text-base">?</div>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] md:text-xs font-bold text-foreground line-clamp-1 max-w-[80px] md:max-w-[100px]">
                            {match.participant1?.member?.team?.name ||
                              match.participant1?.member?.user?.username ||
                              "TBD"}
                          </span>
                        </div>

                        {/* Score / VS */}
                        <div className="flex flex-col items-center">
                          {match.status === "COMPLETED" ? (
                            <div className="flex items-center gap-1 md:gap-2">
                              <span
                                className={cn(
                                  "text-lg md:text-2xl font-black italic",
                                  (match.score1 ?? 0) > (match.score2 ?? 0)
                                    ? "text-primary"
                                    : "text-foreground",
                                )}
                              >
                                {match.score1 ?? 0}
                              </span>
                              <span className="text-muted-foreground text-xs md:text-sm">-</span>
                              <span
                                className={cn(
                                  "text-lg md:text-2xl font-black italic",
                                  (match.score2 ?? 0) > (match.score1 ?? 0)
                                    ? "text-primary"
                                    : "text-foreground",
                                )}
                              >
                                {match.score2 ?? 0}
                              </span>
                            </div>
                          ) : (
                            <div className="h-6 w-10 md:h-8 md:w-14 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
                              <span className="text-[10px] md:text-xs font-black italic text-primary">
                                VS
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Participant 2 */}
                        <div className="flex flex-col items-center gap-1.5 md:gap-2 flex-1 text-center">
                          <div className="relative">
                            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-muted/30 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-lg group-hover/card:scale-110 transition-transform">
                              {match.participant2?.member?.team?.logo ||
                              match.participant2?.member?.user?.profileImage ? (
                                <Image
                                  src={
                                    match.participant2?.member?.team?.logo ||
                                    match.participant2?.member?.user?.profileImage ||
                                    match.participant2?.member?.user?.image ||
                                    "/icons/avatar-500.png"
                                  }
                                  alt="participant2"
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="text-white/20 font-black text-xs md:text-base">?</div>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] md:text-xs font-bold text-foreground line-clamp-1 max-w-[80px] md:max-w-[100px]">
                            {match.participant2?.member?.team?.name ||
                              match.participant2?.member?.user?.username ||
                              "TBD"}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-2 md:mt-4 pt-1 md:pt-2 border-t border-white/5 flex justify-center">
                        <span className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                          Cliquez pour voir les détails
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation buttons */}
          <CarouselPrevious className="left-2 md:left-4 h-7 w-7 md:h-8 md:w-8 bg-background/80 backdrop-blur-sm border-white/20" />
          <CarouselNext className="right-2 md:right-4 h-7 w-7 md:h-8 md:w-8 bg-background/80 backdrop-blur-sm border-white/20" />
        </Carousel>
      </div>

      {/* Informations */}
      <div className="container mx-auto px-3 md:px-4 relative -mt-8 md:-mt-12 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 md:gap-4">
          {/* Logo/Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-2xl overflow-hidden">
                <Image
                  src={
                    edition.tournament?.profileImage ??
                    "/icons/tournament-500.png"
                  }
                  alt={edition.name || "edition image profile"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <Badge className={cn(getStatusColor(edition.status || "UPCOMING"), "text-[8px] md:text-[10px] px-1.5 py-0 md:px-2 md:py-0.5")}>
                  {getStatusLabel(edition.status || "UPCOMING")}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <Typography
                variant="h3"
                weight="bold"
                className="text-xl md:text-2xl lg:text-3xl"
              >
                {edition.name || `Édition #${edition.editionNumber}`}
              </Typography>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="gap-0.5 text-[9px] md:text-xs">
                  <span className="text-xs md:text-sm">
                    {getLocationIcon(edition.locationType || "ONLINE")}
                  </span>
                  <span className="hidden sm:inline ml-0.5">
                    {edition.locationType === "ONLINE" ? "En ligne" : "Présentiel"}
                  </span>
                </Badge>
                {edition.entryFee && Number(edition.entryFee) > 0 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 gap-0.5 text-[9px] md:text-xs">
                    <Trophy className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    {edition.entryFee} {edition.prizeCurrency || "GTC"}
                  </Badge>
                )}
              </div>
            </div>

            {edition.tagline && (
              <Typography
                variant="body-sm"
                className="max-w-2xl mb-2 md:mb-3 text-muted-foreground text-xs md:text-sm"
              >
                {edition.tagline}
              </Typography>
            )}

            <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                <span>
                  {format(new Date(edition.startDate), "d MMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                <span>
                  {edition.registrations?.length || 0} /{" "}
                  {edition.maxParticipants} participants
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial flex gap-2">
              {primaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant="default"
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="gap-1.5 text-xs flex-1 sm:flex-initial"
                >
                  {action.icon && <action.icon className="h-3.5 w-3.5" />}
                  <span className="hidden xs:inline">{action.label}</span>
                </Button>
              ))}
            </div>
            {secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
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
                        "text-xs",
                      )}
                    >
                      {action.icon && <action.icon className="h-3.5 w-3.5 mr-2" />}
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