// @/app/game-clips/page.tsx - version corrigée
"use client";

import { useGameClips } from "@/hooks/use-game-clips";
import { GameClipReel } from "@/components/game-clips/game-clip-reel";
import { motion } from "framer-motion";
import { Loader2, VideoOff } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { HomeGameClipsSection } from "@/components/game-clips/home-game-clips-section";

export default function GameClipsPage() {
  const { clips, loading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useGameClips({
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: 10,
    });

  // Show loading state
  if (loading && clips.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Typography variant="body-lg" className="text-white">
            Chargement des clips...
          </Typography>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Section sur la page d'accueil */}
      <HomeGameClipsSection />

      {/* Page complète des clips */}
      <div className="fixed inset-0 bg-black">
        <GameClipReel
          clips={clips}
          loading={loading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={fetchNextPage}
        />
      </div>
    </>
  );
}