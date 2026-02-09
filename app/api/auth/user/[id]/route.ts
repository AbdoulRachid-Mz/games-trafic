import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier que l'utilisateur a accès à ces données
    const session = await AuthService.getSession();
    if (!session || session.user.id !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await AuthService.getCompleteUserData(id);
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}