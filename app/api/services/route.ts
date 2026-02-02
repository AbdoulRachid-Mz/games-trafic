import { NextRequest, NextResponse } from 'next/server';
import {
  getServiceById,
  getServices,
  getServiceStats,
  createService,
  updateService,
  deleteService,
  restoreService,
  toggleServiceActive,
  type ServiceFilters,
} from '@/actions/services';

// GET /api/services – list or stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // If ?stats=true, return statistics
  if (searchParams.get('stats') === 'true') {
    const filters: ServiceFilters = {
      title: searchParams.get('title') || undefined,
      description: searchParams.get('description') || undefined,
      adminId: searchParams.get('adminId') || undefined,
      isActive: searchParams.has('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
      isDeleted: searchParams.has('isDeleted')
        ? searchParams.get('isDeleted') === 'true'
        : undefined,
      hasImages: searchParams.has('hasImages')
        ? searchParams.get('hasImages') === 'true'
        : undefined,
      createdFrom: searchParams.get('createdFrom') || undefined,
      createdTo: searchParams.get('createdTo') || undefined,
    };

    try {
      const stats = await getServiceStats(filters);
      return NextResponse.json(stats);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Otherwise, list services
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const populate = searchParams.get('populate')?.split(',') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const filters: ServiceFilters = {
    id: searchParams.get('id') || undefined,
    title: searchParams.get('title') || undefined,
    description: searchParams.get('description') || undefined,
    adminId: searchParams.get('adminId') || undefined,
    isActive: searchParams.has('isActive')
      ? searchParams.get('isActive') === 'true'
      : undefined,
    isDeleted: searchParams.has('isDeleted')
      ? searchParams.get('isDeleted') === 'true'
      : undefined,
    hasImages: searchParams.has('hasImages')
      ? searchParams.get('hasImages') === 'true'
      : undefined,
    createdFrom: searchParams.get('createdFrom') || undefined,
    createdTo: searchParams.get('createdTo') || undefined,
  };

  try {
    const data = await getServices({
      pagination: { page, limit },
      filters,
      options: {
        sortBy,
        sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
        populate,
        includeDeleted,
        includeInactive,
      },
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/services – create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await createService(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/services?id=... – update
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id query param' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await updateService(id, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/services?id=... – soft delete
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id query param' }, { status: 400 });
  }

  try {
    const deleted = await deleteService(id);
    return NextResponse.json(deleted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/services/restore?id=... – restore
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id query param' }, { status: 400 });
  }

  const action = searchParams.get('action');

  if (action === 'restore') {
    try {
      const restored = await restoreService(id);
      return NextResponse.json(restored);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (action === 'toggleActive') {
    const isActive = searchParams.get('isActive') === 'true';
    try {
      const toggled = await toggleServiceActive(id, isActive);
      return NextResponse.json(toggled);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 });
}
