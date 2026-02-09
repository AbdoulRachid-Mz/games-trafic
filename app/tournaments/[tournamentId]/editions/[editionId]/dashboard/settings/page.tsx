import { getTournamentEditionWithRelations } from "@/actions/editions";
import { EditionSettingsForm } from "@/components/pages/tournaments/edition-detail/edition-settings-form";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function DashboardSettingsPage({ params }: PageProps) {
  const { editionId, tournamentId } = await params;

  const edition = await getTournamentEditionWithRelations(editionId);

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
