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
  });

  return (
    <div className="w-full py-4 border rounded-xl bg-background/60 backdrop-blur">
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <Typography variant="h4" className="text-lg font-bold">
            Game Clips
          </Typography>
        </div>

        <ScrollArea>
          <div className="flex gap-4 w-max">
            {/* Creation always visible */}
            <GameClipCreationDialog />

            {/* Clips */}
            {clips.map((clip) => (
              <button
                key={clip.id}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="h-16 w-16 rounded-full overflow-hidden border">
                  <video
                    src={clip.videoUrl}
                    muted
                    playsInline
                    className="object-cover h-full w-full"
                  />
                </div>
                <span className="text-[11px] truncate max-w-[60px]">
                  @{clip.author?.username || "user"}
                </span>
              </button>
            ))}

            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-16 rounded-full bg-muted animate-pulse" />
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

