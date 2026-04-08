// @/app/game-clips/client-page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import { GameClipCreationDialog } from "@/components/game-clips/game-clip-creation-dialog";
import { useScreenSize } from "@/hooks/use-screen";
import { Typography } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { CommentsSheet } from "@/components/comments/comments-sheet";
import { useGameClipsStore } from "@/stores/game-clips-store";

export function ClientGameClipsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeClipId = searchParams.get("activeClipId");

  const { isMobile, isDesktop } = useScreenSize();
  const { commentSheetOpen, setCommentSheetOpen, activeTab, setActiveTab } = useGameClipsStore();

  const {
    clips,
    loading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refresh
  } = useGameClips({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 20,
  });

  const handleClipChange = useCallback((clipId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("activeClipId", clipId);
    router.replace(`/game-clips?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleFetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const currentClip = clips.find(c => c.id === useGameClipsStore.getState().activeClipId);

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] flex overflow-hidden">
      {/* MAIN CONTENT - GAME CLIP REEL */}
      <div className={isDesktop ? "flex-1" : "w-full h-full"}>
        <GameClipReel
          clips={clips}
          initialClipId={activeClipId || undefined}
          loading={loading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={handleFetchNext}
          onClipChange={handleClipChange}
          onCommentsToggle={() => setCommentSheetOpen(!commentSheetOpen)}
          areCommentsOpen={commentSheetOpen}
        />
        <GameClipCreationDialog />
      </div>

      {/* DESKTOP SIDEBAR */}
      {isDesktop && currentClip && (
        <div className="w-[420px] border-l border-white/10 bg-black/95 backdrop-blur-xl flex flex-col">
          {/* ... contenu du sidebar inchangé ... */}
        </div>
      )}

      {/* MOBILE COMMENTS SHEET */}
      {isMobile && (
        <CommentsSheet
          open={commentSheetOpen}
          onOpenChange={setCommentSheetOpen}
          entityId={useGameClipsStore.getState().activeClipId || ""}
          entityType="GAMECLIP"
        />
      )}
    </div>
  );
}

// skeleton
export function ClientGameClipsContentSkeleton() {
  return (
    <div className="h-full w-full bg-gradient-to-b from-black/95 to-black/80 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <Typography variant="body-sm" className="text-white/50">
          Chargement des clips...
        </Typography>
      </div>
    </div>
  );
}