import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser, 
  getUsers, 
} from '@/actions/users';
import { NewUser } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { RateLimiter } from '@/lib/api/rate-limiter';
import { toPublicUser } from '@/lib/api/projections';
import {
  formatValidationError,
  usersListQuerySchema,
} from '@/lib/api/validation';

// GET /api/users – list users with admin auth & minimal projection (S2-01)
export async function GET(req: NextRequest) {
  try {
    // S2-03 : limite l'énumération massive (Redis si dispo, sinon PostgreSQL).
    const limited = await RateLimiter.getInstance().middleware(req, {
      max: 60,
      window: 60_000,
      keyPrefix: 'api:users:list',
    });
    if (limited) return limited;

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
    const parsed = usersListQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      id: searchParams.get('id') ?? undefined,
      username: searchParams.get('username') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      level: searchParams.get('level') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatValidationError(parsed.error) },
        { status: 400 }
      );
    }

    const { page, limit, search, id, username, role, level } = parsed.data;

    const result = await getUsers({
      pagination: { page, limit },
      filters: {
        search,
        id,
        username,
        role,
        level: level?.split(',') as ("A" | "B" | "C")[] | undefined,
      },
      options: { sortBy: 'createdAt', sortOrder: 'desc' }
    });

    // Minimal safe projection: strip any sensitive credentials or keys (S2-01)
    const sanitizedData = result.data.map((u: any) => toPublicUser(u));

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
    const limited = await RateLimiter.getInstance().middleware(req, {
      max: 10,
      window: 60_000,
      keyPrefix: 'api:users:create',
    });
    if (limited) return limited;

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
