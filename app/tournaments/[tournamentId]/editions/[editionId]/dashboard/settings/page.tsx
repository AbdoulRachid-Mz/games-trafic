import { getTournamentEditionById } from "@/actions/tournaments";
import { EditionSettingsForm } from "@/components/pages/tournaments/edition-detail/edition-settings-form";
import { notFound } from "next/navigation";

interface DashboardSettingsPageProps {
  params: {
    tournamentId: string;
    editionId: string;
  };
}

export default async function DashboardSettingsPage({
  params,
}: DashboardSettingsPageProps) {
  const { editionId, tournamentId } = params;

  const edition = await getTournamentEditionById(editionId);

  if (!edition) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground">
          Gérez la configuration de cette édition.
        </p>
      </div>

      <EditionSettingsForm edition={edition} tournamentId={tournamentId} />
    </div>
  );
}
