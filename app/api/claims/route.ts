import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getClaimById,
  getClaims,
  getClaimStats,
  getUserClaims,
  createClaim,
  updateClaim,
  updateClaimStatus,
  deleteClaim,
  restoreClaim,
  addClaimEvidence,
} from '@/actions/claims';
import { getCurrentUser } from '@/lib/auth/session';
import { type ClaimFilters, type ListQuery } from '@/types/api';

// ---------- Schemas de validation ----------
const createClaimSchema = z.object({
  userId: z.string().uuid(),
  transactionId: z.string().uuid().optional(),
  type: z.enum(['PAYMENT', 'ACCOUNT', 'TECHNICAL', 'OTHER']),
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().optional(),
  image: z.string().url().optional(),
});

const updateClaimSchema = z.object({
  type: z.enum(['PAYMENT', 'ACCOUNT', 'TECHNICAL', 'OTHER']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  evidence: z.string().optional(),
  image: z.string().url().optional(),
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']),
  resolution: z.string().optional(),
});

const evidenceSchema = z.object({
  evidence: z.string().min(1),
  image: z.string().url().optional(),
});

// ---------- Helpers ----------
function buildListQuery(url: URL): ListQuery<ClaimFilters> {
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 50);
  const sortBy = url.searchParams.get('sortBy') ?? undefined;
  const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

  const filters: ClaimFilters = {
    userId: url.searchParams.get('userId') ?? undefined,
    transactionId: url.searchParams.get('transactionId') ?? undefined,
    type: url.searchParams.get('type') ?? undefined,
    title: url.searchParams.get('title') ?? undefined,
    status: url.searchParams.getAll('status'),
    hasEvidence: url.searchParams.has('hasEvidence')
      ? url.searchParams.get('hasEvidence') === 'true'
      : undefined,
    hasImage: url.searchParams.has('hasImage')
      ? url.searchParams.get('hasImage') === 'true'
      : undefined,
    createdFrom: url.searchParams.get('createdFrom') ?? undefined,
    createdTo: url.searchParams.get('createdTo') ?? undefined,
  };

  return {
    pagination: { page, limit },
    filters,
    options: { sortBy, sortOrder, includeDeleted },
  };
}

// ---------- Routes ----------
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const stats = url.searchParams.has('stats');
    const userId = url.searchParams.get('userId');

    if (id) {
      const populate = url.searchParams.getAll('populate');
      const claim = await getClaimById(id, { populate });
      if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
      return NextResponse.json(claim);
    }

    if (stats) {
      const filters = buildListQuery(url).filters;
      const statistics = await getClaimStats(filters);
      return NextResponse.json(statistics);
    }

    if (userId) {
      const query = buildListQuery(url);
      const result = await getUserClaims(userId, query);
      return NextResponse.json(result);
    }

    const query = buildListQuery(url);
    const result = await getClaims(query);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[GET] /api/claims error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = createClaimSchema.parse(body);
    const claim = await createClaim(data);
    return NextResponse.json(claim, { status: 201 });
  } catch (err: any) {
    console.error('[POST] /api/claims error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing claim id' }, { status: 400 });

    const body = await req.json();
    const data = updateClaimSchema.parse(body);
    const claim = await updateClaim(id, data);
    return NextResponse.json(claim);
  } catch (err: any) {
    console.error('[PATCH] /api/claims error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing claim id' }, { status: 400 });

    const body = await req.json();
    const { status, resolution } = statusSchema.parse(body);
    const claim = await updateClaimStatus(id, status, resolution);
    return NextResponse.json(claim);
  } catch (err: any) {
    console.error('[PUT] /api/claims error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing claim id' }, { status: 400 });

    const claim = await deleteClaim(id);
    return NextResponse.json(claim);
  } catch (err: any) {
    console.error('[DELETE] /api/claims error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// ---------- Routes supplémentaires ----------
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204 });
}
