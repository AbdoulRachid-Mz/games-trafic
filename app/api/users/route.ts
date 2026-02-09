import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
} from '@/actions/users';
import { NewUser } from '@/database/schema';

// GET /api/users – list users with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const id = searchParams.get('id') || undefined;
    const authUid = searchParams.get('authUid') || undefined;
    const email = searchParams.get('email') || undefined;
    const emailVerified = searchParams.get('emailVerified') === 'true';
    const username = searchParams.get('username') || undefined;
    const fullName = searchParams.get('fullName') || undefined;
    const country = searchParams.get('country') || undefined;
    const countryCode = searchParams.get('countryCode') || undefined;
    const isPublicProfile = searchParams.get('isPublicProfile') === 'true';
    const isVip = searchParams.get('isVip') === 'true';
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const isAnonymous = searchParams.get('isAnonymous') === 'true';
    const role = searchParams.get('role') || undefined;
    const banned = searchParams.get('banned') === 'true';
    const accountTypes = searchParams.get('accountTypes')?.split(',') || undefined;
    const level = searchParams.get('level')?.split(',') as ("A" | "B" | "C")[] || undefined;
    const shopsCreatedCountMin = searchParams.get('shopsCreatedCountMin') ? parseInt(searchParams.get('shopsCreatedCountMin')!, 10) : undefined;
    const shopsCreatedCountMax = searchParams.get('shopsCreatedCountMax') ? parseInt(searchParams.get('shopsCreatedCountMax')!, 10) : undefined;
    const tournamentsCreatedCountMin = searchParams.get('tournamentsCreatedCountMin') ? parseInt(searchParams.get('tournamentsCreatedCountMin')!, 10) : undefined;
    const tournamentsCreatedCountMax = searchParams.get('tournamentsCreatedCountMax') ? parseInt(searchParams.get('tournamentsCreatedCountMax')!, 10) : undefined;
    const postsCreatedCountMin = searchParams.get('postsCreatedCountMin') ? parseInt(searchParams.get('postsCreatedCountMin')!, 10) : undefined;
    const postsCreatedCountMax = searchParams.get('postsCreatedCountMax') ? parseInt(searchParams.get('postsCreatedCountMax')!, 10) : undefined;
    const lastLoginFrom = searchParams.get('lastLoginFrom') || undefined;
    const lastLoginTo = searchParams.get('lastLoginTo') || undefined;
    const createdFrom = searchParams.get('createdFrom') || undefined;
    const createdTo = searchParams.get('createdTo') || undefined;

    const result = await getUsers({
      pagination: { page, limit },
      filters: {
        search,
        id,
        authUid,
        email,
        emailVerified,
        username,
        fullName,
        country,
        countryCode,
        isPublicProfile,
        isVip,
        isAdmin,
        isAnonymous,
        role,
        banned,
        accountTypes,
        level,
        shopsCreatedCountMin,
        shopsCreatedCountMax,
        tournamentsCreatedCountMin,
        tournamentsCreatedCountMax,
        postsCreatedCountMin,
        postsCreatedCountMax,
        lastLoginFrom,
        lastLoginTo,
        createdFrom,
        createdTo,
      },
      options: { sortBy: 'createdAt', sortOrder: 'desc' }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status: 500 }
    );
  }
}

// POST /api/users – create a new user
export async function POST(req: NextRequest) {
  try {
    const body: NewUser = await req.json();

    const result = await createUser(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    const status = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status }
    );
  }
}
