// app/api/traces/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { getUserTracesBySessionId, getUserTracesByUserId } from '@/actions/traces';
import { analyzeUserJourney } from '@/lib/services/journey-analyzer';
import { getUserTracesBySessionId, getUserTracesByUserId } from '@/actions/user-traces';
import { UserTrace } from '@/database/schema';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, limit = 100 } = await request.json();
    
    if (!sessionId && !userId) {
      return NextResponse.json(
        { success: false, error: 'sessionId or userId is required' },
        { status: 400 }
      );
    }
    
    let traces: UserTrace[];
    
    if (sessionId) {
      traces = await getUserTracesBySessionId(sessionId, { limit });
    } else if (userId) {
      traces = await getUserTracesByUserId(userId, { limit });
    } else {
      traces = [];
    }
    
    const analysis = await analyzeUserJourney(sessionId || 'anonymous', userId, traces);
    
    return NextResponse.json({
      success: true,
      analysis,
      traceCount: traces.length,
    });
    
  } catch (error) {
    console.error('Error analyzing traces:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to analyze traces' },
      { status: 500 }
    );
  }
}