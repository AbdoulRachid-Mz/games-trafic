// @/app/game-clips/page.tsx
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
import { Loader2, Users, Heart, Share2, MessageCircle } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"comments" | "likes" | "shares">("comments");

  // Utiliser un ref pour éviter les mises à jour en boucle
  const isInitialized = useRef(false);

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

  // Initialisation unique de l'ID actif
  useEffect(() => {
    if (!isInitialized.current && clips.length > 0) {
      if (activeClipId) {
        const exists = clips.some(c => c.id === activeClipId);
        if (exists) {
          setCurrentActiveId(activeClipId);
        } else {
          setCurrentActiveId(clips[0].id);
        }
      } else {
        setCurrentActiveId(clips[0].id);
      }
      isInitialized.current = true;
    }
  }, [clips, activeClipId]);

  // Mise à jour de l'URL sans re-render infini
  const handleClipChange = useCallback((clipId: string) => {
    setCurrentActiveId(clipId);

    // Mettre à jour l'URL sans navigation complète
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
        <div className="w-[420px] border-l border-white/5 bg-[#0a0a0b] flex flex-col animate-in slide-in-from-right duration-500">
          {/* Header avec infos auteur */}
          <div className="p-6 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/30">
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
              <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Typography variant="body-sm" className="text-white/80 leading-relaxed">
                  {currentClip.caption}
                </Typography>
              </div>
            )}

            {/* Game Tag */}
            {currentClip.game && (
              <div className="mt-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-sm font-bold text-primary uppercase tracking-wider">
                  {currentClip.game.name}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {[
              { id: "comments", icon: MessageCircle, label: "Commentaires", count: currentClip.commentsCount },
              { id: "likes", icon: Heart, label: "J'aime", count: currentClip.likesCount },
              // { id: "shares", icon: Share2, label: "Partages", count: currentClip.sharesCount || 0 },
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
                  <span>{tab.label}</span>
                  <span className="text-xs ml-1">({tab.count || 0})</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
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
                  // compact
                  />
                )}

                {activeTab === "likes" && (
                  <InteractionList
                    entityId={currentClip.id}
                    entityType="GAMECLIP"
                    interactionType="LIKE"
                  />
                )}

                {activeTab === "shares" && (
                  <InteractionList
                    entityId={currentClip.id}
                    entityType="GAMECLIP"
                    interactionType="SHARE"
                  />
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between">
              <InteractionButton
                type="like"
                entityType="GAMECLIP"
                entityId={currentClip.id}
                withConfetti
                className="bg-white/5 hover:bg-white/10 border-0"
              />
              <InteractionButton
                type="bookmark"
                entityType="GAMECLIP"
                entityId={currentClip.id}
                className="bg-white/5 hover:bg-white/10 border-0"
              />
              <InteractionButton
                type="share"
                entityType="GAMECLIP"
                entityId={currentClip.id}
                className="bg-white/5 hover:bg-white/10 border-0"
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
    <div className="h-full w-full bg-black/20 flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
