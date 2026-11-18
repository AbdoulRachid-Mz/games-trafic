import { Suspense } from "react";
import { TournamentPageContent, TournamentSkeleton } from "./client-page";
import { Metadata } from "next";

// mise en cache de la page

//metadata
export const metadata: Metadata = {
  title: "Tournoi | Games-Trafics",
  description: "Détails du tournoi sur Games-Trafics.",
  keywords: "tournoi, compétition, e-sport, games-trafics",
  robots: "index, follow",
  icons: {
    icon: "/icons/tournament-240.png",
    shortcut: "/icons/tournament-128.png",
  },
};

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
