import { NextRequest, NextResponse } from 'next/server';
import { getUserWalletById, updateUserWallet, updateWalletBalance, toggleWalletLock } from '@/actions/wallets';
import { z } from 'zod';

// Validation schemas
const updateWalletSchema = z.object({
  pinHash: z.string().min(4).optional(),
  balance: z.string().optional(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  failedAttempts: z.number().int().min(0).optional(),
});

const updateBalanceSchema = z.object({
  balance: z.string(),
});

const toggleLockSchema = z.object({
  isLocked: z.boolean(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/wallets/[id] - Get wallet by ID
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const wallet = await getUserWalletById(id);

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

// PUT /api/wallets/[id] - Update wallet
export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = updateWalletSchema.parse(body);

    const { id } = await params;
    const updatedWallet = await updateUserWallet(id, validatedData);

    return NextResponse.json(updatedWallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Wallet not found') {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    console.error('Error updating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}

// PATCH /api/wallets/[id]/balance - Update wallet balance
export async function PATCH(
  request: NextRequest,
  { params }: Props
) {
  try {
    const body = await request.json();

    // Validate input
    const { balance } = updateBalanceSchema.parse(body);
    const { id } = await params;

    const updatedWallet = await updateWalletBalance(id, balance);

    return NextResponse.json(updatedWallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Wallet not found') {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    console.error('Error updating wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet balance' },
      { status: 500 }
    );
  }
}

// POST /api/wallets/[id]/toggle-lock - Toggle wallet lock status
export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    const body = await request.json();

    // Validate input
    const { isLocked } = toggleLockSchema.parse(body);

    const { id } = await params;
    const updatedWallet = await toggleWalletLock(id, isLocked);

    return NextResponse.json(updatedWallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Wallet not found') {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    console.error('Error toggling wallet lock:', error);
    return NextResponse.json(
      { error: 'Failed to toggle wallet lock' },
      { status: 500 }
    );
  }
}
