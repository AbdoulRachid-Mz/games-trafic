import { NextRequest, NextResponse } from 'next/server';
import { 
  createUserWallet, 
  getUserWalletById, 
  getUserWalletByUserId, 
  getUserWallets, 
  updateUserWallet,
  getWalletStats,
} from '@/actions/wallets';

// GET /api/wallets - Lister les wallets avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Filtres
    const filters = {
      userId: searchParams.get('userId') || undefined,
      balanceMin: searchParams.get('balanceMin') ? parseFloat(searchParams.get('balanceMin')!) : undefined,
      balanceMax: searchParams.get('balanceMax') ? parseFloat(searchParams.get('balanceMax')!) : undefined,
      isLocked: searchParams.get('isLocked') ? searchParams.get('isLocked') === 'true' : undefined,
      verificationStatus: searchParams.get('verificationStatus') ? [searchParams.get('verificationStatus')!] as ('PENDING' | 'VERIFIED' | 'REJECTED')[] : undefined,
      failedAttemptsMin: searchParams.get('failedAttemptsMin') ? parseInt(searchParams.get('failedAttemptsMin')!) : undefined,
      failedAttemptsMax: searchParams.get('failedAttemptsMax') ? parseInt(searchParams.get('failedAttemptsMax')!) : undefined
    };

    // Options de tri
    const options = {
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc' as 'asc' | 'desc'
    };

    const result = await getUserWallets({
      pagination: { page, limit },
      filters,
      options
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur GET /api/wallets:', error);
    return NextResponse.json(
      { 
        error: {
          code: 'SERVER_ERROR',
          message: 'Erreur interne du serveur',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

// POST /api/wallets - Créer un nouveau wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const wallet = await createUserWallet(body);

    return NextResponse.json({ data: wallet }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/wallets:', error);
    return NextResponse.json(
      { 
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erreur interne du serveur',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: error instanceof Error && error.message.includes('already has a wallet') ? 409 : 500 }
    );
  }
}
