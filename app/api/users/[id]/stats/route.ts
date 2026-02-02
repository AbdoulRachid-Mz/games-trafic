import { getUserStats, UserStatsFilters } from '@/actions/user-stats';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { id } = await params;

    // Build filters object from all possible query parameters
    const filters: UserStatsFilters = {
      userId: id,
      period: searchParams.get('period') as 'day' | 'week' | 'month' | 'year' | 'all' | undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    };

    const stats = await getUserStats(filters);

    if (!stats.success) {
      return NextResponse.json(stats, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}