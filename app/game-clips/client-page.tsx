// app/game-clips/client-page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { useCallback, Suspense, useMemo } from "react";
import { GameTraficsLoader } from "@/components/game-clips/game-trafics-loader";
import { useAuthContext } from "@/contexts/auth-context";
import { useSearchParams } from "next/navigation";

function ClientGameClipsContentInner() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const initialClipId = searchParams.get("activeClipId");
  
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

  // Simple handlers
  const handleClipChange = useCallback((clipId: string, index: number) => {
    // Optionally update URL without full re-render
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('activeClipId', clipId);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleLike = useCallback((clipId: string) => {
    // Will be implemented with mutation
    console.log("Like clip:", clipId);
  }, []);

  const handleBookmark = useCallback((clipId: string) => {
    console.log("Bookmark clip:", clipId);
  }, []);

  const handleShare = useCallback((clipId: string) => {
    console.log("Share clip:", clipId);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] overflow-hidden max-h-screen">
      <GameClipReel
        clips={clips}
        initialClipId={initialClipId}
        userId={user?.id}
        loading={loading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onFetchNextPage={handleFetchNext}
        onClipChange={handleClipChange}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onShare={handleShare}
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