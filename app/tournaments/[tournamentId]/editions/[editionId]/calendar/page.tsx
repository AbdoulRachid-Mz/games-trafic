import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournamentEditionById } from "@/actions/tournaments";
import { getCurrentUser } from "@/lib/auth/session";
import { EditionCalendarTimeline } from "./edition-calendar-timeline";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ tournamentId: string; editionId: string }>;
}

export const metadata: Metadata = {
  title: "Calendrier - Édition",
  description: "Consultez le programme des matchs par date, phase et groupe.",
  keywords: "matchs, calendrier, programme",
  robots: "index, follow",
};

export default async function EditionCalendarPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;
  const user = await getCurrentUser();
  const edition = await getTournamentEditionById(editionId);

  if (!edition) notFound();

  return (
    <div className="mx-auto py-2 space-y-2">
      {/* back link */}
      <Link
        href={`/tournaments/${tournamentId}/editions/${editionId}`}
        className="text-muted-foreground flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Retourner à l'édition
      </Link>

      <div className="space-y-1">
        <h1 className="text-3xl max-md:text-2xl font-bold tracking-tight">Calendrier</h1>
        <p className="text-muted-foreground max-md:text-sm">
          Consultez le programme des matchs par date, phase et groupe.
        </p>
      </div>

      <EditionCalendarTimeline editionId={editionId} currentUserId={user?.id} />
    </div>
  );
}
