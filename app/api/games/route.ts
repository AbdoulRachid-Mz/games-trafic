import { NextRequest, NextResponse } from 'next/server';
import {
  getGameById,
  getGameByName,
  getGames,
  getGameStats,
  createGame,
  updateGame,
} from '@/actions/games';
import { getCurrentUser } from '@/lib/auth/session';
import {
  formatValidationError,
  gameCreateSchema,
  gameUpdateSchema,
  gamesListQuerySchema,
} from '@/lib/api/validation';

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { authorized: false, status: 401, error: "Authentication required" };
  }
  const isAdmin = user.role === "admin" || (user as any).isAdmin === true;
  if (!isAdmin) {
    return { authorized: false, status: 403, error: "Admin access required" };
  }
  return { authorized: true, user };
}

// GET /api/games?... (Public catalog read)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Single resource routes
  if (searchParams.has('id')) {
    const id = searchParams.get('id')!;
    const game = await getGameById(id);
    return game
      ? NextResponse.json(game)
      : NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  if (searchParams.has('name')) {
    const name = searchParams.get('name')!;
    const game = await getGameByName(name);
    return game
      ? NextResponse.json(game)
      : NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Stats endpoint
  if (searchParams.has('stats')) {
    const filters = Object.fromEntries(
      searchParams.entries()
    ) as Parameters<typeof getGameStats>[0];
    const stats = await getGameStats(filters);
    return NextResponse.json(stats);
  }

  // List with pagination / filters
  const parsedQuery = gamesListQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: searchParams.get('sortOrder') ?? undefined,
    includeDeleted: searchParams.get('includeDeleted') ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: formatValidationError(parsedQuery.error) },
      { status: 400 }
    );
  }

  const {
    page,
    limit,
    sortBy,
    sortOrder,
    includeDeleted: includeDeletedFlag,
  } = parsedQuery.data;
  const includeDeleted = includeDeletedFlag === true;

  // Build filters object compatible with GameFilters
  const filters: Record<string, unknown> = {};
  searchParams.forEach((value, key) => {
    if (
      key !== 'page' &&
      key !== 'limit' &&
      key !== 'sortBy' &&
      key !== 'sortOrder' &&
      key !== 'includeDeleted'
    ) {
      filters[key] = value;
    }
  });

  const result = await getGames({
    pagination: { page, limit },
    filters,
    options: { sortBy, sortOrder, includeDeleted },
  });
  return NextResponse.json(result);
}

// POST /api/games (Admin only)
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = gameCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatValidationError(parsed.error) },
        { status: 400 }
      );
    }
    const game = await createGame(parsed.data as any);
    return NextResponse.json(game, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create game' },
      { status: 400 }
    );
  }
}

// PATCH /api/games?id=... (Admin only)
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = gameUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatValidationError(parsed.error) },
        { status: 400 }
      );
    }
    const game = await updateGame(id, parsed.data as any);
    return NextResponse.json(game);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update game' },
      { status: 400 }
    );
  }
}
