// app/api/auth/social/[provider]/route.ts
import { AuthService } from '@/lib/auth/service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = await params;

    const result = await AuthService.signInWithSocial(provider as "google" | "facebook" | "tiktok");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url
    });

  } catch (error: any) {
    console.error('Social auth API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}