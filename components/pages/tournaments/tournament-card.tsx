"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Calendar, Users, Trophy, ArrowRight, Gamepad2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";
import { TournamentWithRelations } from "@/database/schema";

interface TournamentCardProps {
  tournament: TournamentWithRelations; // On typerait mieux avec le schéma drizzle si dispo dans le front
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const statusColors = {
    UPCOMING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    LIVE: "bg-green-500/10 text-green-500 border-green-500/20 animate-pulse",
    COMPLETED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const statusLabels = {
    UPCOMING: "À venir",
    LIVE: "En cours",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
  };

  const editions = Array.isArray(tournament.editions)
    ? tournament.editions
    : [];
  const currentEdition =
    editions.find((e: any) => e.status === "LIVE") ??
    editions
      .filter((e: any) => e.status === "UPCOMING")
      .sort(
        (a: any, b: any) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )[0] ??
    editions
      .filter((e: any) => e.status === "COMPLETED")
      .sort((a: any, b: any) => {
        const aDate = a.endDate ?? a.startDate;
        const bDate = b.endDate ?? b.startDate;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })[0] ??
    null;
  const upcomingEditionStart = Array.isArray(editions)
    ? editions
      .filter((e: any) => e.status === "UPCOMING" && e.startDate)
      .sort(
        (a: any, b: any) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )[0]?.startDate
    : undefined;

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/50 hover:bg-card hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden">
        {tournament.coverImage ? (
          <Image
            src={tournament.coverImage}
            alt={tournament.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Gamepad2 className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant="outline"
            className={`backdrop-blur-md border ${statusColors[tournament.status as keyof typeof statusColors] ||
              statusColors.COMPLETED
              }`}
          >
            {statusLabels[tournament.status as keyof typeof statusLabels] ||
              tournament.status}
          </Badge>
        </div>

        <div className="absolute top-3 left-3 z-10">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-black/60 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-0 overflow-hidden">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl">Inscription Rapide</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scannez pour rejoindre le tournoi</p>
                </DialogHeader>
                <div className="flex justify-center">
                  <TransactionQRCode
                    data={encodeTransactionQR({
                      t: "TOURNAMENT_PARTICIPATION",
                      id: tournament.id,
                      // a: parseFloat(tournament.entryFee || "0"),
                      m: { name: tournament.name }
                    })}
                    label={tournament.name}
                    className="shadow-none border-none p-0 bg-transparent"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />

        <div className="absolute bottom-3 left-3 right-3">
          <Typography variant="h4" className="text-white font-bold truncate">
            {tournament.name}
          </Typography>
          <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
            <Trophy className="h-3 w-3 text-yellow-400" />
            <span>{tournament.totalPrizePool ?? 0} GTC</span>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Typography
              variant="caption1"
              className="text-muted-foreground flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              {upcomingEditionStart
                ? format(new Date(upcomingEditionStart), "d MMM yyyy", {
                  locale: fr,
                })
                : "Date à définir"}
            </Typography>
          </div>
        </div>

        {currentEdition && (
          <div className="rounded-lg border border-border/50 p-3 bg-secondary/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentEdition.name ??
                    `Édition ${currentEdition.editionNumber ?? ""}`.trim()}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[
                    currentEdition.status as keyof typeof statusColors
                    ] || statusColors.COMPLETED
                    }`}
                >
                  {statusLabels[
                    currentEdition.status as keyof typeof statusLabels
                  ] || currentEdition.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentEdition.startDate
                  ? format(new Date(currentEdition.startDate), "d MMM yyyy", {
                    locale: fr,
                  })
                  : "Date à définir"}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-secondary/50 p-2 rounded-lg flex flex-col items-center justify-center border border-border/50">
            <span className="text-xs text-muted-foreground mb-1">
              Cashprize
            </span>
            <span className="font-bold text-primary">
              {tournament.totalPrizePool ?? 0} GTC
            </span>
          </div>
          <div className="bg-secondary/50 p-2 rounded-lg flex flex-col items-center justify-center border border-border/50">
            <span className="text-xs text-muted-foreground mb-1">
              Participants
            </span>
            <div className="flex items-center gap-1 font-bold">
              <Users className="h-3 w-3" />
              <span>{tournament.totalParticipants ?? 0}</span>
            </div>
          </div>
        </div>

        {tournament.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tournament.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full group" asChild>
          <Link href={`/tournaments/${tournament.id}`}>
            Voir le tournoi
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
