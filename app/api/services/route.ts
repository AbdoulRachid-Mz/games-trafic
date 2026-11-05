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
import { getCurrentUser } from '@/lib/auth/session';
import {
  formatValidationError,
  serviceCreateSchema,
  serviceUpdateSchema,
  servicesListQuerySchema,
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

// GET /api/services – list or stats (Public catalog)
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
  const parsedQuery = servicesListQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: searchParams.get('sortOrder') ?? undefined,
    includeDeleted: searchParams.get('includeDeleted') ?? undefined,
    includeInactive: searchParams.get('includeInactive') ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: formatValidationError(parsedQuery.error) },
      { status: 400 }
    );
  }

  const { page, limit, sortBy, includeDeleted, includeInactive } =
    parsedQuery.data;
  const sortOrder = parsedQuery.data.sortOrder ?? 'desc';
  const populate = searchParams.get('populate')?.split(',') || undefined;

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

// POST /api/services – create (Admin only)
export async function POST(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = serviceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatValidationError(parsed.error) },
        { status: 400 }
      );
    }
    // L'auteur est imposé par la session, jamais par le client.
    const adminId = (auth as { user?: { id?: string } }).user?.id;
    if (!adminId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const created = await createService({
      ...(parsed.data as any),
      adminId,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/services?id=... – update (Admin only)
export async function PUT(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id query param' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = serviceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatValidationError(parsed.error) },
        { status: 400 }
      );
    }
    const updated = await updateService(id, parsed.data as any);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/services?id=... – soft delete (Admin only)
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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

// PATCH /api/services/restore?id=... – restore / toggle (Admin only)
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
