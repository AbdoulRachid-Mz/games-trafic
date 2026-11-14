"use client";

import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EditionCard } from "@/components/pages/tournaments/editions/edition-card";
import { TournamentEdition } from "@/database/schema";
import { Trophy, Sparkles, Layers, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EditionRelatedCarouselProps {
  tournamentId: string;
  currentEditionId: string;
  otherEditions?: TournamentEdition[];
  similarEditions?: TournamentEdition[];
  isOrganizer?: boolean;
}

export function EditionRelatedCarousel({
  tournamentId,
  currentEditionId,
  otherEditions = [],
  similarEditions = [],
  isOrganizer = false,
}: EditionRelatedCarouselProps) {
  const hasOtherEditions = otherEditions.length > 0;
  const hasSimilarEditions = similarEditions.length > 0;

  if (!hasOtherEditions && !hasSimilarEditions) {
    return null;
  }

  return (
    <div className="space-y-10 pt-8 border-t border-white/10 mt-12">
      {/* ─── SECTION 1 : AUTRES ÉDITIONS DU MÊME TOURNOI ───────────────── */}
      {hasOtherEditions && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black italic tracking-tight flex items-center gap-2">
                  Autres Éditions de ce Tournoi
                  <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary">
                    {otherEditions.length}
                  </Badge>
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  Consultez les éditions précédentes et à venir de cette même compétition
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" asChild className="gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
              <Link href={`/tournaments/${tournamentId}/editions`}>
                Voir tout
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="relative px-2">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 md:-ml-4">
                {otherEditions.map((edition) => (
                  <CarouselItem
                    key={edition.id}
                    className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <div className="h-full">
                      <EditionCard
                        edition={edition}
                        tournamentId={edition.tournamentId}
                        className="h-full"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden sm:block">
                <CarouselPrevious className="-left-4 bg-background/80 backdrop-blur-md border-white/10 hover:bg-primary hover:text-white" />
                <CarouselNext className="-right-4 bg-background/80 backdrop-blur-md border-white/10 hover:bg-primary hover:text-white" />
              </div>
            </Carousel>
          </div>
        </div>
      )}

      {/* ─── SECTION 2 : ÉDITIONS SIMILAIRES & RECOMMANDÉES ─────────────── */}
      {hasSimilarEditions && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black italic tracking-tight flex items-center gap-2">
                  Éditions Similaires & Recommandées
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-black">
                    Découverte
                  </Badge>
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  D&apos;autres compétitions esport qui pourraient vous intéresser
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" asChild className="gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
              <Link href="/tournaments">
                Explorer
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="relative px-2">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 md:-ml-4">
                {similarEditions.map((edition) => (
                  <CarouselItem
                    key={edition.id}
                    className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <div className="h-full">
                      <EditionCard
                        edition={edition}
                        tournamentId={edition.tournamentId}
                        className="h-full"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden sm:block">
                <CarouselPrevious className="-left-4 bg-background/80 backdrop-blur-md border-white/10 hover:bg-amber-500 hover:text-black" />
                <CarouselNext className="-right-4 bg-background/80 backdrop-blur-md border-white/10 hover:bg-amber-500 hover:text-black" />
              </div>
            </Carousel>
          </div>
        </div>
      )}
    </div>
  );
}
