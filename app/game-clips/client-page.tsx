// app/game-clips/client-page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { useCallback, Suspense } from "react";
import { GameTraficsLoader } from "@/components/game-clips/game-trafics-loader";

function ClientGameClipsContentInner() {
  const {
    clips,
    loading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGameClips({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 20,
  });

  const handleFetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] overflow-hidden max-h-screen">
      <GameClipReel
        clips={clips}
        loading={loading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onFetchNextPage={handleFetchNext}
      />
    </div>
  );
}

export function ClientGameClipsContent() {
  return (
    <Suspense fallback={<GameTraficsLoader />}>
      <ClientGameClipsContentInner />
    </Suspense>
  );
}