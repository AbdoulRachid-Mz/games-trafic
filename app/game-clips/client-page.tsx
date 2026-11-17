// app/game-clips/client-page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/pages/game-clips/game-clip-reel";
import { useCallback, Suspense } from "react";
import { GameTraficsLoader } from "@/components/pages/game-clips/game-trafics-loader";
import { useAuthContext } from "@/contexts/auth-context";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

function ClientGameClipsContentInner() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const initialClipId = searchParams.get("activeClipId");

  const {
    clips,
    loading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refresh,
    shareClip,
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

  // Like/bookmark n'ont pas encore de mutation métier : on ne simule pas
  // de succès (pas de faux état). Les boutons restent rendus par le reel.
  const handleLike = useCallback((_clipId: string) => {}, []);
  const handleBookmark = useCallback((_clipId: string) => {}, []);

  const handleShare = useCallback(
    async (clipId: string) => {
      try {
        await shareClip(clipId);
      } catch {
        // Le toast d'erreur est déjà émis par la mutation du hook.
      }
    },
    [shareClip]
  );

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden max-h-[100dvh] p-6">
        <div
          role="alert"
          className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-lg"
        >
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          <h1 className="text-xl font-bold text-foreground">
            Impossible de charger les clips
          </h1>
          <p className="text-sm text-muted-foreground">
            Une erreur est survenue lors de la récupération du flux. Vérifiez
            votre connexion puis réessayez.
          </p>
          <Button onClick={() => refresh()} className="gap-2">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden max-h-[100dvh]">
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