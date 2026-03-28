import { Metadata } from "next";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { notFound } from "next/navigation";
import { OrganizeWizardClient } from "@/components/pages/tournaments/edition-detail/organize-wizard-client";

export const metadata: Metadata = {
  title: "Organisation Massif de l'Édition",
};

export default async function EditionOrganizePage({
  params,
}: {
  params: Promise<{ tournamentId: string; editionId: string }>;
}) {
  const { tournamentId, editionId } = await params;
  const edition = await getTournamentEditionWithRelations(editionId);
  if (!edition) notFound();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cerveau d'Organisation</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Générez instantanément des phases, des groupes et l'arbre d'élimination de votre tournoi.
        </p>
      </div>

      <OrganizeWizardClient
        editionId={editionId}
        tournamentId={tournamentId}
        edition={edition}
      />
    </div>
  );
}
