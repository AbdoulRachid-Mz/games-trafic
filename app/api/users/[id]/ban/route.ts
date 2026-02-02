// app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const {id} = await params
    const userId = id;
  try {
    const { banned, banReason, banExpires } = await request.json();
    
    const [updatedUser] = await db
      .update(users)
      .set({
        banned,
        banReason: banned ? banReason || null : null,
        banExpires: banned ? (banExpires ? new Date(banExpires) : null) : null,
        isActive: banned ? false : true,
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
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}