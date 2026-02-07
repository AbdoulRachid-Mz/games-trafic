"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GameClipReel } from "./game-clip-reel";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { GameClipWithStats } from "@/types/game-clips";

interface GameClipViewerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialClipId?: string;
  clips: GameClipWithStats[];
}

export function GameClipViewerModal({
  isOpen,
  onOpenChange,
  initialClipId,
  clips,
}: GameClipViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-screen h-screen p-0 m-0 border-none bg-black overflow-hidden"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Game Clips Viewer</DialogTitle>
        </VisuallyHidden>
        <div className="h-full w-full">
          <GameClipReel clips={clips} initialClipId={initialClipId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
