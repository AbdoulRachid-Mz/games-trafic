import { getTournamentEditions } from "@/actions/tournaments";
import { TournamentsList } from "@/components/pages/tournaments/tournaments-list";
import { Suspense } from "react";


export const metadata = {
  title: "Tournois | Games-Trafics",
  description: "Participez aux meilleurs tournois et compétitions e-sport.",
};

export default async function TournamentsPage() {
  const response = await getTournamentEditions({
    pagination: { page: 1, limit: 100 },
  });

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Chargement des tournois...</div>}>
      <TournamentsList initialTournaments={response.data} />
    </Suspense>
  );
}
