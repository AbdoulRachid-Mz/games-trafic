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
        side="right" 
        className="h-[85vh] w-[85%] md:w-[300px] rounded-t-3xl border-t border-white/10 bg-[#0a0a0b]"
      >
        <SheetHeader className="pb-4 border-b border-white/5">
          <SheetTitle className="text-white flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Commentaires
          </SheetTitle>
        </SheetHeader>
        <div className="h-full overflow-y-auto pb-20">
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