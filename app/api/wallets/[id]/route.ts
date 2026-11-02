import { NextRequest, NextResponse } from 'next/server';
import { getUserWalletById, updateUserWallet, toggleWalletLock } from '@/actions/wallets';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────

// PUT: non-admins can only update pinHash / isActive.
// Fields like balance, isLocked, verificationStatus, failedAttempts
// are admin-only or handled by dedicated endpoints.
const updateWalletSchemaUser = z.object({
  pinHash: z.string().min(4).optional(),
  isActive: z.boolean().optional(),
});

const updateWalletSchemaAdmin = z.object({
  pinHash: z.string().min(4).optional(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  failedAttempts: z.number().int().min(0).optional(),
  // balance is intentionally excluded — use the transaction API
});

const toggleLockSchema = z.object({
  isLocked: z.boolean(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallets/[id] — Fetch wallet (owner or admin only)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const wallet = await getUserWalletById(id);

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 });
    }

    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    const isOwner = wallet.userId === currentUser.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('[GET /api/wallets/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du wallet' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/wallets/[id] — Update wallet metadata (owner or admin, restricted fields)
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const wallet = await getUserWalletById(id);

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 });
    }

    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    const isOwner = wallet.userId === currentUser.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();

    // Admins can update more fields; owners are restricted to safe fields only
    const schema = isAdmin ? updateWalletSchemaAdmin : updateWalletSchemaUser;
    const validatedData = schema.parse(body);

    // Safety net: strip balance regardless of schema (direct balance edits are forbidden)
    const { balance: _balance, ...safeData } = validatedData as any;

    const updatedWallet = await updateUserWallet(id, safeData);

    return NextResponse.json(updatedWallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Wallet not found') {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 });
    }

    console.error('[PUT /api/wallets/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du wallet' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/wallets/[id] — Direct balance modification is DISABLED
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  _request: NextRequest,
  _props: Props
) {
  return NextResponse.json(
    {
      error: 'Modification directe du solde désactivée',
      details: 'Utilisez l\'API transactions (DEPOSIT / WITHDRAWAL) pour modifier le solde.',
    },
    { status: 400 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallets/[id] — Toggle lock (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const wallet = await getUserWalletById(id);

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 });
    }

    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    const isOwner = wallet.userId === currentUser.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { isLocked } = toggleLockSchema.parse(body);

    const updatedWallet = await toggleWalletLock(id, isLocked);

    return NextResponse.json(updatedWallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Wallet not found') {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 });
    }

    console.error('[POST /api/wallets/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du verrouillage du wallet' },
      { status: 500 }
    );
  }
}
