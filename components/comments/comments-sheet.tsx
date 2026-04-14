// @/components/comments/comments-sheet.tsx
"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CommentsSection } from "./comments-section";
import { EntityType } from "@/database/schema";

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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-[2.5rem] border-t border-white/10 dark:border-black/10 bg-[#0a0a0b] dark:bg-white p-0 overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-white/10 dark:bg-black/10 rounded-full mx-auto mt-4 mb-2" />
        <SheetHeader className="px-6 pb-4 border-b border-white/5 dark:border-black/5">
          <SheetTitle className="text-white dark:text-black flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-black tracking-tight text-xl">Commentaires</span>
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
