// app/api/search/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';

// export const dynamic = 'force-dynamic';
import { getSearchTrends } from '@/actions/search';
import { getCurrentUser } from '@/lib/auth/session';


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;
    const term = searchParams.get('term') || '';

    if (!term || term.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Récupérer les tendances populaires
    const trends = await getSearchTrends(10, 7);
    
    // Filtrer les tendances qui correspondent au terme
    const suggestions = trends
      .filter(trend => 
        trend.query.toLowerCase().includes(term.toLowerCase()) &&
        trend.query.toLowerCase() !== term.toLowerCase()
      )
      .map(trend => trend.query)
      .slice(0, 5);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}