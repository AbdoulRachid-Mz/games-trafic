"use client";

import React, { useState } from "react";
import { useGameClips } from "@/hooks/use-game-clips";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { GameClipCreationDialog } from "./game-clip-creation-dialog";
import { GameClipViewerModal } from "./game-clip-viewer-modal";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

export function HomeGameClipsSection() {
  const { clips, loading } = useGameClips({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 10,
    offset: 0,
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();

  const handleClipClick = (clipId: string) => {
    setSelectedClipId(clipId);
    setViewerOpen(true);
  };

  if (!loading && clips.length === 0) return null; // Don't show if empty and not loading

  return (
    <div className="w-full py-4 border-b bg-background/50 backdrop-blur-sm mb-6 rounded-xl border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <Typography
            variant="h4"
            className="text-lg font-bold flex items-center gap-2"
          >
            Game Clips{" "}
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </Typography>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 p-1">
            {/* Creation trigger */}
            <GameClipCreationDialog />

            {/* Clips list */}
            {clips.map((clip, index) => (
              <motion.button
                key={clip.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleClipClick(clip.id)}
                className="flex flex-col items-center gap-2 group relative"
              >
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-primary/20 p-0.5 transition-transform group-hover:scale-105 active:scale-95 group-hover:border-primary">
                  <div className="h-full w-full rounded-full overflow-hidden relative bg-muted">
                    <video
                      src={clip.videoUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseOut={(e) => {
                        (e.target as HTMLVideoElement).pause();
                        (e.target as HTMLVideoElement).currentTime = 0; // Reset
                      }}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                </div>
                <span className="text-[10px] md:text-xs font-medium text-foreground truncate max-w-[70px]">
                  @{clip.author?.username || "user"}
                </span>
              </motion.button>
            ))}

            {loading &&
              clips.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 animate-pulse"
                >
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted" />
                  <div className="h-2 w-10 bg-muted rounded" />
                </div>
              ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      <GameClipViewerModal
        isOpen={viewerOpen}
        onOpenChange={setViewerOpen}
        initialClipId={selectedClipId}
        clips={clips}
      />
    </div>
  );
}
