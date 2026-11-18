// @/app/games/[itemId]/page.tsx
import React, { Suspense } from "react";
import { getGameItemById } from "@/actions/games";
import { GameItemDetail } from "@/components/pages/games/game-item-detail";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { GameItemWithRelations } from "@/database/schema";

interface GameItemPageProps {
  params: Promise<{ itemId: string }>;
}

// metadata
export const metadata: Metadata = {
  title: "Jeu | Games-Trafics",
  description: "Détails du jeu sur Games-Trafics.",
  keywords: "jeu, jeux vidéo, jeux en ligne, e-sport, games-trafics",
  robots: "index, follow",
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-128.png",
  },
};

async function GameItemContent({ itemId }: { itemId: string }) {
  const item = await getGameItemById(itemId);

  if (!item) {
    notFound();
  }

  return <GameItemDetail item={item as GameItemWithRelations} />;
}

export default async function GameItemPage({ params }: GameItemPageProps) {
  const { itemId } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement de l'item...</p>
        </div>
      </div>
    }>
      <GameItemContent itemId={itemId} />
    </Suspense>
  );
}
