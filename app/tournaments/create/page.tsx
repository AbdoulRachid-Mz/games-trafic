import { CreateTournamentForm } from "@/components/pages/tournaments/create/create-tournament-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un Tournoi | GT-V2",
  description: "Lancez votre propre compétition e-sport et invitez des joueurs.",
};

export default function CreateTournamentPage() {
  return <CreateTournamentForm />;
}
