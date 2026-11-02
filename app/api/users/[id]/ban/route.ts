// app/api/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🛡️ SEC-003: Vérification stricte des droits d'administration
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Accès interdit: privilèges administrateur requis' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = id;

    if (currentUser.id === userId) {
      return NextResponse.json(
        { success: false, error: 'Action impossible: vous ne pouvez pas vous auto-bannir' },
        { status: 400 }
      );
    }

    const { banned, banReason, banExpires } = await request.json();
    
    const [updatedUser] = await db
      .update(users)
      .set({
        banned: Boolean(banned),
        banReason: banned ? banReason || null : null,
        banExpires: banned ? (banExpires ? new Date(banExpires) : null) : null,
        isActive: !banned,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        banned: updatedUser.banned,
        banReason: updatedUser.banReason,
        banExpires: updatedUser.banExpires,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
