// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';

// export const dynamic = 'force-dynamic';
import { unifiedSearch, recordSearchTrend } from '@/actions/search';
import { getCurrentUser2 } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const user = await getCurrentUser2(request.headers);

    // Paramètres
    const searchParams = new URL(request.url).searchParams;
    const term = searchParams.get('term') || '';
    const entity = searchParams.get('entity') || '';

    if (!term || term.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    // Déterminer les types d'entités
    const entityTypes = entity === 'all' || !entity
      ? ['shop', 'product', 'tournament', 'theme', 'service', 'guide', 'blog', 'news']
      : [entity];

    // Effectuer la recherche
    const results = await unifiedSearch(entityTypes, term, {
      limit: 20,
      userId: user?.id
    });

    // Enregistrer la tendance (de manière asynchrone)
    recordSearchTrend(term, entityTypes).catch(console.error);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    unstable_rethrow(error);
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}