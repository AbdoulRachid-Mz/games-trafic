import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser, 
  getUsers, 
} from '@/actions/users';
import { NewUser } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/users – list users with admin auth & minimal projection (S2-01)
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const isAdmin = sessionUser.role === 'admin' || (sessionUser as any).isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || undefined;
    const id = searchParams.get('id') || undefined;
    const username = searchParams.get('username') || undefined;
    const role = searchParams.get('role') || undefined;
    const level = searchParams.get('level')?.split(',') as ("A" | "B" | "C")[] || undefined;

    const result = await getUsers({
      pagination: { page, limit },
      filters: {
        search,
        id,
        username,
        role,
        level,
      },
      options: { sortBy: 'createdAt', sortOrder: 'desc' }
    });

    // Minimal safe projection: strip any sensitive credentials or keys (S2-01)
    const sanitizedData = result.data.map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      role: u.role,
      level: u.level,
      isVip: u.isVip,
      walletNumber: u.walletNumber,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      data: sanitizedData,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status: 500 }
    );
  }
}

// POST /api/users – create a user (Level A Admin only) (S2-02)
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const isAdminLevelA =
      (sessionUser.role === 'admin' || (sessionUser as any).isAdmin === true) &&
      (sessionUser as any).level === 'A';

    if (!isAdminLevelA) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Level A administrator privileges required to provision users directly' } },
        { status: 403 }
      );
    }

    const body: NewUser = await req.json();
    const result = await createUser(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    const status = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
    return NextResponse.json(
      { error: { code: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status }
    );
  }
}
