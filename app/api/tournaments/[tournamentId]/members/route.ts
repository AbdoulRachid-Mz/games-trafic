import { NextRequest } from "next/server";
import { type TournamentMemberFilters } from "@/types/api";
import { getTournamentMembers } from "@/actions/tournaments";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const sortBy = searchParams.get("sortBy") ?? "joinedAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const { tournamentId } = await params;
  const filters: TournamentMemberFilters = {
    tournamentId: tournamentId,
    isDeleted: false,
  };

  const result = await getTournamentMembers({
    pagination: { page, limit },
    filters,
    options: { sortBy, sortOrder },
  });

  return Response.json(result);
}
