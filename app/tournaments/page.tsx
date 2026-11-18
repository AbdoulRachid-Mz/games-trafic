import { getTournamentEditions } from "@/actions/tournaments";
import { TournamentsList } from "@/components/pages/tournaments/tournaments-list";
import { Suspense } from "react";


export const metadata = {
  title: "Tournois | Games-Trafics",
  description: "Participez aux meilleurs tournois et compétitions e-sport.",
  keywords: "tournois, compétitions, jeux vidéo, jeux en ligne, e-sport, editions, games-trafics",
  icons: {
    icon: "/icons/tournament-240.png",
    shortcut: "/icons/tournament-128.png",
  },
};

export default async function TournamentsPage() {
  const response = await getTournamentEditions({
    filters: {
      isActive: true,
      isDeleted: false
    },
    pagination: { page: 1, limit: 100 },
  });

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Chargement des tournois...</div>}>
      <TournamentsList initialTournaments={response.data} />
    </Suspense>
  );
}
