"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Users,
  Trophy,
  ChevronRight,
  Shield,
  Zap,
  MapPin,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { TournamentEdition } from "@/database/schema";

interface EditionCardProps {
  edition: TournamentEdition;
  tournamentId?: string;
  onView?: (id: string) => void;
  className?: string;
}

const statusConfig = {
  UPCOMING: {
    label: "À venir",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Calendar,
  },
  LIVE: {
    label: "En direct",
    className: "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse",
    icon: Zap,
  },
  COMPLETED: {
    label: "Terminé",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: Shield,
  },
  CANCELLED: {
    label: "Annulé",
    className: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  },
};

export function EditionCard({
  edition,
  tournamentId,
  onView,
  className,
}: EditionCardProps) {
  const router = useRouter();
  const status = (edition.status as keyof typeof statusConfig) || "UPCOMING";
  const config = statusConfig[status];

  const handleNavigate = () => {
    if (onView) {
      onView(edition.id);
    } else if (tournamentId) {
      router.push(`/tournaments/${tournamentId}/editions/${edition.id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn("group h-full", className)}
    >
      <Card
        className="h-full overflow-hidden border-border/50 bg-card hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
        onClick={handleNavigate}
      >
        {/* Banner with Status */}
        <div className="relative h-32 overflow-hidden">
          {/* {edition.bannerImage ? (
            <Image
              src={edition.bannerImage}
              alt={edition.name || `Édition #${edition.editionNumber}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
          )} */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-purple-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-primary/40" />
          </div>

          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

          <div className="absolute top-3 left-3">
            <Badge className={cn("gap-1.5 px-2.5 py-0.5 font-semibold backdrop-blur-md border", config.className)}>
              <config.icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          <div className="absolute bottom-3 right-3 text-white text-[10px] px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 uppercase font-bold tracking-wider">
            {edition.editionNumber ? `Édition #${edition.editionNumber}` : "Événement"}
          </div>
        </div>

        <CardContent className="p-4 flex flex-col h-[calc(100%-8rem)]">
          <div className="flex-1 space-y-4">
            <div>
              <Typography variant="h5" weight="bold" className="line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                {edition.name || `Édition #${edition.editionNumber}`}
              </Typography>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(edition.startDate), "d MMM yyyy", { locale: fr })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Typography variant="caption2" theme="muted" className="flex items-center gap-1 uppercase tracking-tighter font-semibold">
                  <Trophy className="h-3 w-3" /> Cashprize
                </Typography>
                <Typography variant="body-sm" weight="bold" className="text-primary">
                  {edition.prizePool || 0} {edition.prizeCurrency || "GTC"}
                </Typography>
              </div>
              <div className="space-y-0.5">
                <Typography variant="caption2" theme="muted" className="flex items-center gap-1 uppercase tracking-tighter font-semibold">
                  <Users className="h-3 w-3" /> Joueurs
                </Typography>
                <Typography variant="body-sm" weight="bold">
                  {edition.currentParticipants || 0}/{edition.maxParticipants || "∞"}
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{edition.location || "En ligne"}</span>
            </div>
          </div>

          <div className="mt-5">
            <Button
              variant="outline"
              className="w-full group/btn relative overflow-hidden transition-all duration-300 hover:bg-primary hover:text-white"
            >
              <span className="relative z-10 flex items-center gap-2">
                Détails de l'édition
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}