// components/comments/comments-sheet.tsx
"use client";

import React, { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CommentsSection } from "./comments-section";
import { useClipEngineStore } from "@/hooks/use-clip-engine";

// components/comments/comments-sheet.tsx
type EntityType =
  | "GAMECLIP"
  | "POST"
  | "PRODUCT"
  | "USER"
  | "GAME"
  | "TOURNAMENT"
  | "SHOP"
  | "BLOG"
  | "MESSAGE"
  | "TEAM"
  | "THEME"
  | "NEWS"
  | "GROUP"
  | "ANNOUNCEMENT"
  | "SERVICE"
  | "GUIDE"
  | "COMMENT"
  | "MATCH"
  | "GAME_ITEM"
  | "PARTNER"
  | "EDITION";
interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: EntityType;
}

export function CommentsSheet({
  open,
  onOpenChange,
  entityId,
  entityType,
}: CommentsSheetProps) {
  const setGlobalPause = useClipEngineStore((s) => s.setGlobalPause);

  // Pause playback when sheet is open
  useEffect(() => {
    if (open) {
      setGlobalPause(true);
    } else {
      setGlobalPause(false);
    }
  }, [open, setGlobalPause]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] rounded-t-[2.5rem] border-t border-white/10 bg-[#0a0a0b] p-0 overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" />
        <SheetHeader className="px-6 pb-4 border-b border-white/5">
          <SheetTitle className="text-white flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-black tracking-tight text-xl">
              Commentaires
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="h-full overflow-y-auto pt-4 pb-32 px-2">
          <CommentsSection
            entityId={entityId}
            entityType={entityType}
            className="px-4"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
