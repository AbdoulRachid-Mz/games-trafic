import { NextRequest } from "next/server";
import { type TournamentEditionFilters } from "@/types/api";
import { getTournamentEditions } from "@/actions/tournaments";

export async function GET(req: NextRequest, { params }: { params: Promise<
  { tournamentId: string }> }) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const sortBy = searchParams.get("sortBy") ?? "startDate";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const {tournamentId} =  await params
  const filters: TournamentEditionFilters = {
    tournamentId: tournamentId,
    isDeleted: false,
  };

  const result = await getTournamentEditions({
    pagination: { page, limit },
    filters,
    options: { sortBy, sortOrder },
  });

  return Response.json(result);
}

