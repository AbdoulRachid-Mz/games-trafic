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
    const country = searchParams.get('country') || undefined;
    const isVerified = searchParams.get('isVerified') === 'true';
    const isVip = searchParams.get('isVip') === 'true';
    const isActive = searchParams.get('isActive') === 'true';

    const result = await getUsers({
      pagination: { page, limit },
      filters: { search, country, isVerified, isVip, isActive },
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
