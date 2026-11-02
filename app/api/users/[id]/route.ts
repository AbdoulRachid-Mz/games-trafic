import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser, getUserById } from '@/actions/users';
import { getCurrentUser } from '@/lib/auth/session';

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/users/:id – get user by id
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Protection des données sensibles si le demandeur n'est ni le propriétaire ni un admin
    const currentUser = await getCurrentUser();
    const isOwnerOrAdmin = currentUser && (currentUser.id === id || currentUser.role === 'admin' || (currentUser as any).isAdmin === true);

    const safeUser = isOwnerOrAdmin ? user : {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      profileImage: user.profileImage,
      coverImage: user.coverImage,
      bio: user.bio,
      level: user.level,
      isVip: user.isVip,
      accountTypes: user.accountTypes,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FAILED_TO_FETCH_USER', message: error.message || 'Failed to fetch user' } },
      { status: 500 }
    );
  }
}

// PATCH /api/users/:id – update user
export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  try {
    // 🛡️ SEC-002: Contrôle d'authentification et d'autorisation
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentification requise' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    if (currentUser.id !== id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Vous ne pouvez modifier que votre propre profil' } },
        { status: 403 }
      );
    }

    const body = await req.json();

    // 🛡️ Filtrer les champs réservés aux administrateurs
    const safeBody = { ...body };
    if (!isAdmin) {
      delete safeBody.role;
      delete safeBody.isAdmin;
      delete safeBody.isVip;
      delete safeBody.banned;
      delete safeBody.banReason;
      delete safeBody.banExpires;
      delete safeBody.accountTypes;
      delete safeBody.level;
      delete safeBody.isDeleted;
    }

    const updatedUser = await updateUser(id, safeBody);

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('PATCH /api/users/[id] error:', error);
    const status = error.message === 'User not found' ? 404
                 : error.message === 'Email already exists' || error.message === 'Username already exists' ? 409
                 : 400;
    return NextResponse.json(
      { success: false, error: { code: error.message.replace(/\s+/g, '_').toUpperCase(), message: error.message } },
      { status }
    );
  }
}

// DELETE /api/users/:id – soft delete user
export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
  try {
    // 🛡️ SEC-002: Contrôle d'authentification et d'autorisation
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentification requise' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    if (currentUser.id !== id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Action non autorisée' } },
        { status: 403 }
      );
    }

    const deletedUser = await deleteUser(id);

    return NextResponse.json({ success: true, data: deletedUser });
  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    const status = error.message === 'User not found' ? 404 : 400;
    return NextResponse.json(
      { success: false, error: { code: error.message.replace(/\s+/g, '_').toUpperCase(), message: error.message } },
      { status }
    );
  }
}
