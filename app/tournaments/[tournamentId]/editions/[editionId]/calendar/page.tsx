import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournamentEditionById } from "@/actions/tournaments";
import { getCurrentUser } from "@/lib/auth/session";
import { EditionCalendarTimeline } from "./edition-calendar-timeline";

interface PageProps {
  params: Promise<{ tournamentId: string; editionId: string }>;
}

export const metadata: Metadata = {
  title: "Calendrier - Édition",
};

export default async function EditionCalendarPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;
  const user = await getCurrentUser();
  const edition = await getTournamentEditionById(editionId);
  
  if (!edition) notFound();
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
        <p className="text-muted-foreground">
          Consultez le programme des matchs par date, phase et groupe.
        </p>
      </div>
      
      <EditionCalendarTimeline 
        editionId={editionId}
        currentUserId={user?.id}
      />
    </div>
  );
}