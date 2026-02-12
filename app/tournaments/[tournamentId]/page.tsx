import { Suspense } from "react";
import { TournamentPageContent, TournamentSkeleton } from "./client-page";

// mise en cache de la page
export const revalidate = 60; // 60 secondes

// Page principale avec Suspense
export default function TournamentPage() {
  return (
    <Suspense fallback={<TournamentSkeleton />}>
      <TournamentPageContent />
    </Suspense>
  );
}
