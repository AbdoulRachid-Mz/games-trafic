// app/api/test/db/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Test Drizzle + Neon database connection with a simple query
    const result = await db.execute(sql`SELECT 1 AS connection_test`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Drizzle ORM + Neon database connection established successfully',
      testResult: result
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to connect to Drizzle + Neon database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
