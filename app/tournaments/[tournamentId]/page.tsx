import { Suspense } from "react";
import { TournamentPageContent, TournamentSkeleton } from "./client-page";

// mise en cache de la page


// Page principale avec Suspense
export default function TournamentPage() {
  return (
    <Suspense fallback={<TournamentSkeleton />}>
      <TournamentPageContent />
    </Suspense>
  );
}
