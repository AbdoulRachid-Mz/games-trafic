// @/app/game-clips/client-page.tsx
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { GameClipWithRelations } from "@/types/game-clips";
import { GameClipCreationDialog } from "@/components/game-clips/game-clip-creation-dialog";
import { useScreenSize } from "@/hooks/use-screen";
import { Typography } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { InteractionButton } from "@/components/shared/interaction-button";
import { CommentsSection } from "@/components/comments/comments-section";
import { CommentsSheet } from "@/components/comments/comments-sheet";
import { InteractionList } from "@/components/game-clips/interaction-list";
import { cn } from "@/lib/utils";

export function ClientGameClipsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeClipId = searchParams.get("activeClipId");
  const shouldCreate = searchParams.get("create") === "true";

  const { isMobile, isDesktop } = useScreenSize();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [currentActiveId, setCurrentActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"comments" | "likes">("comments");

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
    limit: 10,
  });

  // Initialisation de l'ID actif
  useEffect(() => {
    if (clips.length > 0) {
      if (activeClipId) {
        const exists = clips.some(c => c.id === activeClipId);
        if (exists) {
          setCurrentActiveId(activeClipId);
        } else {
          setCurrentActiveId(clips[0].id);
        }
      } else if (!currentActiveId) {
        setCurrentActiveId(clips[0].id);
      }
    }
  }, [clips, activeClipId, currentActiveId]);

  // Mise à jour de l'URL
  const handleClipChange = useCallback((clipId: string) => {
    setCurrentActiveId(clipId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("activeClipId", clipId);
    router.replace(`/game-clips?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleFetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const currentClip = clips.find(c => c.id === currentActiveId);

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] flex overflow-hidden">
      {/* MAIN CONTENT - GAME CLIP REEL */}
      <div className={cn(
        "relative h-full transition-all duration-500",
        isDesktop ? "flex-1" : "w-full"
      )}>
        <GameClipReel
          clips={clips}
          initialClipId={currentActiveId || undefined}
          loading={loading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={handleFetchNext}
          onClipChange={handleClipChange}
          onCommentsToggle={() => setCommentsOpen(!commentsOpen)}
          areCommentsOpen={commentsOpen}
        />
        <GameClipCreationDialog />
      </div>

      {/* DESKTOP SIDEBAR */}
      {isDesktop && currentClip && (
        <div className="w-[420px] border-l border-white/10 bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-500">
          {/* Header avec infos auteur */}
          <div className="p-6 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-primary/30 ring-4 ring-primary/10">
                <AvatarImage src={currentClip.author?.profileImage || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {currentClip.author?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Typography variant="body-lg" className="font-bold text-white">
                  @{currentClip.author?.username}
                </Typography>
                <Typography variant="caption1" className="text-white/40">
                  {currentClip.createdAt
                    ? new Date(currentClip.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                    : ''}
                </Typography>
              </div>
            </div>

            {/* Caption */}
            {currentClip.caption && (
              <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <Typography variant="body-sm" className="text-white/80 leading-relaxed">
                  {currentClip.caption}
                </Typography>
              </div>
            )}

            {/* Game Tag */}
            {currentClip.game && (
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-sm font-bold text-primary uppercase tracking-wider">
                  {currentClip.game.name}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-black/20">
            {[
              { id: "comments", icon: MessageCircle, label: "Commentaires", count: currentClip.stats?.commentsCount || 0 },
              { id: "likes", icon: Heart, label: "J'aime", count: currentClip.stats?.likesCount || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all relative",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-white/30 hover:text-white/60"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="text-xs ml-1">({tab.count || 0})</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {activeTab === "comments" && (
                  <CommentsSection
                    entityId={currentClip.id}
                    entityType="GAMECLIP"
                  />
                )}

                {activeTab === "likes" && (
                  <InteractionList
                    entityId={currentClip.id}
                    entityType="GAMECLIP"
                    interactionType="LIKE"
                  />
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <InteractionButton
                type="like"
                entityType="GAMECLIP"
                entityId={currentClip.id}
                withConfetti
                className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm"
              />
              <InteractionButton
                type="bookmark"
                entityType="GAMECLIP"
                entityId={currentClip.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm"
              />
              <InteractionButton
                type="share"
                entityType="GAMECLIP"
                entityId={currentClip.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* MOBILE COMMENTS SHEET */}
      {isMobile && (
        <CommentsSheet
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          entityId={currentActiveId || ""}
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