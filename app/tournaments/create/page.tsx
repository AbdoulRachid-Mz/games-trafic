import { CreateTournamentForm } from "@/components/pages/tournaments/create/create-tournament-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un Tournoi | Games-Trafics",
  description: "Lancez votre propre compétition e-sport et invitez des joueurs.",
  keywords: "tournoi, création, compétition, e-sport, games-trafics",
  robots: "index, follow",
  icons: {
    icon: "/icons/tournament-240.png",
    shortcut: "/icons/tournament-128.png",
  },
};

export default function CreateTournamentPage() {
  return <CreateTournamentForm />;
}
