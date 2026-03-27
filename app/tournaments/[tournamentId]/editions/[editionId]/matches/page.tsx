import { EditionMatchesClient } from "./edition-matches-client";
import { getTournamentEditionWithRelations } from "@/actions/editions";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function EditionMatchesPage({ params }: PageProps) {
  const { editionId } = await params;
  
  // Minimal data loading if needed, but we can do it all in the client component
  // to benefit from the interactive filters.
  
  return (
    <div className="space-y-8">
      <EditionMatchesClient editionId={editionId} />
    </div>
  );
}
