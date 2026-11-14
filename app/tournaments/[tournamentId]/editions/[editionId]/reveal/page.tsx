import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTournamentById } from "@/actions/tournaments";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { getTournamentPhases } from "@/actions/phases";
import { EditionStructureRevealPageClient } from "@/components/pages/tournaments/edition-detail/edition-structure-reveal-page-client";

interface RevealPageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
  searchParams: Promise<{
    level?: string;
    autoRedirect?: string;
    redirect?: string;
  }>;
}

export async function generateMetadata({
  params,
}: RevealPageProps): Promise<Metadata> {
  const { editionId } = await params;
  const edition = await getTournamentEditionWithRelations(editionId);
  return {
    title: `Révélation de la Structure • ${edition?.name || "Édition"} | Games-Trafics`,
    description: "Cérémonie officielle de révélation de la structure, des phases et des matchs de l'édition.",
    robots: "noindex, nofollow",
  };
}

export default async function EditionStructureRevealPage({
  params,
  searchParams,
}: RevealPageProps) {
  const { tournamentId, editionId } = await params;
  const { level = "all", autoRedirect = "true", redirect } = await searchParams;

  const [tournament, edition] = await Promise.all([
    getTournamentById(tournamentId),
    getTournamentEditionWithRelations(editionId),
  ]);

  if (!tournament || !edition) {
    notFound();
  }

  const phasesResponse = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const phases = phasesResponse.data || edition.phases || [];

  return (
    <EditionStructureRevealPageClient
      tournament={tournament}
      edition={edition}
      phases={phases}
      level={level}
      autoRedirect={autoRedirect !== "false"}
      redirectUrl={redirect}
    />
  );
}
