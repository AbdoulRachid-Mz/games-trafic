import { getTournamentsWithEditions } from "@/actions/tournaments";
import { TournamentsList } from "@/components/pages/tournaments/tournaments-list";
import { Suspense } from "react";

// mise en cache
export const revalidate = 60; // 60 secondes

export const metadata = {
  title: "Tournois | GT-V2",
  description: "Participez aux meilleurs tournois et compétitions e-sport.",
};

export default async function TournamentsPage() {
  const tournaments = await getTournamentsWithEditions(100, "createdAt", "desc");

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Chargement des tournois...</div>}>
      <TournamentsList initialTournaments={tournaments} />
    </Suspense>
  );
}
