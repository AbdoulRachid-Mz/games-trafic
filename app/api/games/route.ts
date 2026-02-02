import { NextRequest, NextResponse } from 'next/server';
import {
  getGameById,
  getGameByName,
  getGames,
  getGameStats,
  createGame,
  updateGame,
  deleteGame,
} from '@/actions/games';

// GET /api/games?...
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
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 50);
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const includeDeleted = searchParams.has('includeDeleted');

  const filters = Object.fromEntries(
    searchParams.entries()
  ) as Parameters<typeof getGames>[0]['filters'];

  const result = await getGames({
    pagination: { page, limit },
    filters,
    options: { sortBy, sortOrder, includeDeleted },
  });
  return NextResponse.json(result);
}

// POST /api/games
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const game = await createGame(body);
    return NextResponse.json(game, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create game' },
      { status: 400 }
    );
  }
}

// PATCH /api/games?id=...
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const game = await updateGame(id, body);
    return NextResponse.json(game);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update game' },
      { status: 400 }
    );
  }
}

// DELETE /api/games?id=...
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const game = await deleteGame(id);
    return NextResponse.json(game);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete game' },
      { status: 400 }
    );
  }
}
