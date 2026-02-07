// @/app/game-clips/page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GameClipWithRelations } from "@/validations/game-clips";

export default function GameClipsPage() {
  const searchParams = useSearchParams();
  const activeClipId = searchParams.get("activeClip");
  
  const { clips, loading, hasNextPage, fetchNextPage, isFetchingNextPage, getClip } =
    useGameClips({
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: 10,
    });

  const [initialClip, setInitialClip] = useState<GameClipWithRelations | null>(null);

// @/app/game-clips/page.tsx
  useEffect(() => {
    if (!activeClipId) return;
    const foundInClips = clips.find(clip => clip.id === activeClipId);
    if (foundInClips) {
      setInitialClip(foundInClips);
      return;
    }
    // Fallback: fetch the clip individually if not in the list
    getClip(activeClipId)
      .then(clip => clip && setInitialClip(clip as unknown as GameClipWithRelations))
      .catch(() => setInitialClip(null));
  }, [activeClipId, clips, getClip]);

  return (
    <div className="fixed inset-0 bg-black">
      <GameClipReel
        clips={clips}
        initialClipId={activeClipId || undefined}
        loading={loading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onFetchNextPage={fetchNextPage}
      />
    </div>
  );
}