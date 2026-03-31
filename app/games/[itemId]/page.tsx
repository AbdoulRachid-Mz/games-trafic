// @/app/games/[itemId]/page.tsx
import React, { Suspense } from "react";
import { getGameItemById } from "@/actions/games";
import { GameItemDetail } from "@/components/pages/games/game-item-detail";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { GameItemWithRelations } from "@/database/schema";

interface GameItemPageProps {
  params: Promise<{ itemId: string }>;
}

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
