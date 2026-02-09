// @/components/game-clips/home-game-clips-section.tsx
"use client";

import React from "react";
import { useGameClips } from "@/hooks/use-game-clips";
import { Typography } from "@/components/ui/typography";
import { GameClipCreationDialog } from "./game-clip-creation-dialog";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronRight, PlusCircle, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function HomeGameClipsSection() {
  const router = useRouter();
  const { clips, loading } = useGameClips({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 5, // Limité aux 5 derniers comme demandé
  });

  const handleClipClick = (clipId: string) => {
    router.push(`/game-clips?activeClipId=${clipId}`);
  };

  const handleSeeMore = () => {
    router.push("/game-clips");
  };

  const handleCreate = () => {
    router.push("/game-clips?create=true");
  };

  return (
    <div className="w-full py-4 bg-background/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <Typography variant="h4" className="text-base font-bold tracking-tight">
              Derniers Clips
            </Typography>
          </div>
          {clips.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSeeMore}
              className="text-primary hover:text-primary/80 text-xs font-bold gap-1 p-0 h-auto"
            >
              Voir tout <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-5 pb-2">
            {/* Create Clip Button */}
            <button
              onClick={handleCreate}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary/30 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-300">
                <PlusCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary">Créer</span>
            </button>

            {/* Clips List */}
            {clips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => handleClipClick(clip.id)}
                className="flex flex-col items-center gap-2 group transition-all"
              >
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary group-hover:scale-105 transition-all duration-300 ring-4 ring-transparent group-hover:ring-primary/20">
                  {clip.videoUrl ? (
                    <video
                      src={clip.videoUrl}
                      muted
                      playsInline
                      className="object-cover h-full w-full grayscale-[0.3] group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <Image
                      src={clip.images?.[0] || clip.thumbnailUrl || ""}
                      className="object-cover h-full w-full grayscale-[0.3] group-hover:grayscale-0 transition-all"
                      alt=""
                      width={64}
                      height={64}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/60 group-hover:text-white truncate max-w-[64px] text-center">
                  @{clip.author?.username?.split(' ')[0] || "user"}
                </span>
              </button>
            ))}

            {/* Loading Skeletons */}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-white/5 border border-white/5 animate-pulse" />
                  <div className="h-2 w-8 bg-white/5 rounded animate-pulse" />
                </div>
              ))}

            {/* No Clips empty state button */}
            {!loading && clips.length === 0 && (
              <div className="flex items-center justify-center py-2">
                <Typography variant="caption1" className="text-white/40 italic">Partagez le premier clip !</Typography>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>
    </div>
  );
}
