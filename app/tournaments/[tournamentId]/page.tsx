import { Suspense } from "react";
import { TournamentPageContent, TournamentSkeleton } from "./client-page";

// mise en cache de la page

// Page principale avec Suspense
export default async function TournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;

  return (
    <Suspense fallback={<TournamentSkeleton />}>
      <TournamentPageContent tournamentId={tournamentId} />
    </Suspense>
  );
}
