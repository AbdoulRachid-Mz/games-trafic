// app/api/explanations/state/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page');
  const userId = searchParams.get('userId');
  
  if (!page) {
    return NextResponse.json(
      { success: false, error: 'page is required' },
      { status: 400 }
    );
  }
  
  try {
    // En production, on récupérerait ça depuis la base de données
    // Pour l'instant, on retourne un état par défaut
    
    return NextResponse.json({
      success: true,
      page,
      state: {
        shown: false,
        completed: false,
        skipped: false,
        shouldShow: userId ? true : false, // Logique métier
      },
    });
    
  } catch (error) {
    console.error('Error fetching explanation state:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch explanation state' },
      { status: 500 }
    );
  }
}