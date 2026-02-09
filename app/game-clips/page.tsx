// @/app/game-clips/page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { GameClipWithRelations } from "@/types/game-clips";
import { CommentsSection } from "@/components/comments/comments-section";
import { GameClipCreationDialog } from "@/components/game-clips/game-clip-creation-dialog";
import { useScreenSize } from "@/hooks/use-screen";
import { Typography } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";

function GameClipsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeClipId = searchParams.get("activeClipId");
  const shouldCreate = searchParams.get("create") === "true";

  const { isLargeScreen } = useScreenSize();

  const { clips, loading, hasNextPage, fetchNextPage, isFetchingNextPage, getClip } =
    useGameClips({
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: 10,
    });

  const [currentActiveId, setCurrentActiveId] = useState<string | null>(activeClipId);

  // Sync current active ID when scrolling or initial load
  useEffect(() => {
    if (activeClipId) {
      setCurrentActiveId(activeClipId);
    } else if (clips.length > 0 && !currentActiveId) {
      setCurrentActiveId(clips[0].id);
    }
  }, [activeClipId, clips, currentActiveId]);

  const handleFetchNext = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const closeCreation = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("create");
    router.replace(`/game-clips?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] flex overflow-hidden">
      {/* Main Content: Reel */}
      <div className="flex-1 relative h-full">
        <GameClipReel
          clips={clips}
          initialClipId={activeClipId || undefined}
          loading={loading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={handleFetchNext}
        />

        {/* Floating Creation Dialog Trigger (Internal to reel but managed here) */}
        {shouldCreate && (
          <div className="hidden">
            {/* This handles the logic but the dialog itself might need to be open */}
            {/* We rely on the search param to auto-open if we modify the dialog */}
          </div>
        )}

        {/* We can just put the dialog here and it will handle search params if we modify it */}
        <GameClipCreationDialog />
      </div>

      {/* Desktop Sidebar: Comments */}
      {isLargeScreen && clips.length > 0 && (
        <div className="w-[400px] border-l border-white/5 bg-[#0a0a0b] flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <Typography variant="h4" className="text-xl font-bold tracking-tight text-white">
              Commentaires
            </Typography>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>

          <div className="flex-1 overflow-hidden">
            {currentActiveId ? (
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <CommentsSection
                      entityId={currentActiveId}
                      entityType="GAMECLIP"
                    />
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-white/30">
                <Loader2 className="h-8 w-8 animate-spin mb-4 opacity-20" />
                <Typography variant="body-sm">Chargement des interactions...</Typography>
              </div>
            )}
          </div>

          {/* Subtle footer */}
          <div className="p-4 text-[10px] text-white/20 text-center uppercase tracking-[0.2em] font-bold border-t border-white/5">
            Games Trafics Community
          </div>
        </div>
      )}
    </div>
  );
}

export default function GameClipsPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <GameClipsContent />
    </Suspense>
  );
}