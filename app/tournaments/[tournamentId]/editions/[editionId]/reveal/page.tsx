import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { phaseGroups } from "@/database/schema";
import { inArray, asc } from "drizzle-orm";
import { getTournamentById } from "@/actions/tournaments";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { getTournamentPhases, getMatchesWithParticipants } from "@/actions/phases";
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

  // Récupération des vrais groupes avec participants pour la phase de révélation
  const phaseIds = phases.map((p) => p.id);
  let fetchedGroups: any[] = [];
  if (phaseIds.length > 0) {
    try {
      fetchedGroups = await db.query.phaseGroups.findMany({
        where: inArray(phaseGroups.phaseId, phaseIds),
        with: {
          participants: {
            with: {
              registration: {
                with: {
                  member: {
                    with: {
                      user: true,
                      team: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [asc(phaseGroups.order)],
      });
    } catch (e) {
      console.error("Error fetching phase groups for reveal:", e);
    }
  }

  // Récupération des matchs réels de l'édition (pour arbre & playoffs)
  let fetchedMatches: any[] = [];
  try {
    const matchesResponse = await getMatchesWithParticipants({
      filters: { editionId },
      pagination: { page: 1, limit: 100 },
    });
    fetchedMatches = matchesResponse.data || [];
  } catch (e) {
    console.error("Error fetching matches for reveal:", e);
  }

  return (
    <EditionStructureRevealPageClient
      tournament={tournament}
      edition={edition}
      phases={phases}
      phaseGroups={fetchedGroups}
      matches={fetchedMatches}
      level={level}
      autoRedirect={autoRedirect !== "false"}
      redirectUrl={redirect}
    />
  );
}
