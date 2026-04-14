// app/game-clips/client-page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, Suspense } from "react";
import { useScreenSize } from "@/hooks/use-screen";
import { Typography } from "@/components/ui/typography";
import { Loader2 } from "lucide-react";
import { GameClipCreationDialog } from "@/components/game-clips/game-clip-creation-dialog";

function ClientGameClipsContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeClipId = searchParams.get("activeClipId");

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

  return (
    <div className="fixed inset-0 bg-[#0a0a0b]">
      <GameClipReel
        clips={clips}
        loading={loading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onFetchNextPage={handleFetchNext}
        onClipChange={handleClipChange}
      />
      <GameClipCreationDialog />
    </div>
  );
}

export function ClientGameClipsContent() {
  return (
    <Suspense fallback={<ClientGameClipsContentSkeleton />}>
      <ClientGameClipsContentInner />
    </Suspense>
  );
}

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