import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from './session';
import { type User } from '@/database/schema';
// import { User } from '@/database/schema';
export async function verifyAuthToken(): Promise<{
  user: User | null;
  error?: string;
}> {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return { user: null, error: 'Session non trouvée' };
    }

    // Note: Dans un vrai middleware, on ne devrait pas faire d'appel DB
    // On se base sur la session uniquement
    const authUser: User = {
      id: session.user.id,
      authUid: session.user.authUid as string | null,
      email: session.user.email,
      emailVerified: session.user.emailVerified as boolean,
      image: session.user.image as string | null,
      // name: session.user.name as string | null,
      username: (session.user as any).username as string | null,
      fullName: (session.user as any).fullName as string | null,
      profileImage: (session.user as any).profileImage as string | null,
      coverImage: (session.user as any).coverImage as string | null,
      bio: (session.user as any).bio as string | null,
      website: (session.user as any).website as string | null,
      country: (session.user as any).country as string | null,
      countryCode: (session.user as any).countryCode as string | null,
      socialMedia: (session.user as any).socialMedia as any,
      phoneNumber: (session.user as any).phoneNumber as string | null,
      address: (session.user as any).address as any,
      isPublicProfile: (session.user as any).isPublicProfile as boolean,
      isVip: (session.user as any).isVip as boolean,
      isAdmin: (session.user as any).isAdmin as boolean,
      isActive: (session.user as any).isActive as boolean,
      isDeleted: (session.user as any).isDeleted as boolean,
      isAnonymous: (session.user as any).isAnonymous as boolean,
      role: (session.user as any).role as string,
      banned: (session.user as any).banned as boolean,
      banReason: (session.user as any).banReason as string | null,
      banExpires: (session.user as any).banExpires as Date | null,
      settings: (session.user as any).settings as any,
      accountTypes: (session.user as any).accountTypes as string[],
      level: (session.user as any).level as 'A' | 'B' | 'C' | null,
      shopsCreatedCount: (session.user as any).shopsCreatedCount as number,
      tournamentsCreatedCount: (session.user as any).tournamentsCreatedCount as number,
      postsCreatedCount: (session.user as any).postsCreatedCount as number,
      metadata: (session.user as any).metadata as any,
      lastLoginMethod: (session.user as any).lastLoginMethod as string | null,
      createdAt: (session.user as any).createdAt as Date,
      updatedAt: (session.user as any).updatedAt as Date,
      lastLogin: (session.user as any).lastLogin as Date | null,
    };

    return { user: authUser };

  } catch (error: any) {
    console.error('Error verifying auth token:', error);
    return { user: null, error: 'Erreur de vérification de session' };
  }
}

export async function requireAuth(
  request: NextRequest, 
  requiredPermissions: string[] = []
): Promise<{
  authorized: boolean;
  user?: User;
  error?: string;
  status?: number;
}> {
  const authResult = await verifyAuthToken();
  
  if (!authResult.user) {
    return { 
      authorized: false, 
      error: authResult.error || 'Non autorisé',
      status: 401 
    };
  }

  // Vérifier les permissions si demandé
  if (requiredPermissions.length > 0) {
    const hasPermission = checkUserPermissions(authResult.user, requiredPermissions);

    if (!hasPermission) {
      return { 
        authorized: false, 
        error: 'Permissions insuffisantes',
        status: 403 
      };
    }
  }

  return { 
    authorized: true, 
    user: authResult.user 
  };
}

export function withAuth(
  handler: (request: NextRequest, user: User) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await requireAuth(request, requiredPermissions);
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    return handler(request, authResult.user!);
  };
}

function checkUserPermissions(user: User, permissions: string[]): boolean {
  const userPermissions = getUserPermissions(user);
  return permissions.every(permission => userPermissions.includes(permission));
}

function getUserPermissions(user: User): string[] {
  const permissions: string[] = [];
  
  // Permissions de base
  permissions.push('user:read', 'user:write');
  
  // Permissions VIP
  if (user.isVip) {
    permissions.push('vip:access', 'theme:create', 'shop:create_multiple', 'tournament:create_multiple');
  }
  
  // Permissions admin
  if (user.isAdmin) {
    permissions.push('admin:access', 'user:manage', 'content:manage', 'system:config');
  }
  
  // Permissions basées sur le niveau
  if (user.level === 'A') {
    permissions.push('premium:features', 'analytics:access');
  }
  
  // Permissions basées sur le type de compte
  if (user.accountTypes?.includes('SELLER')) {
    permissions.push('product:sell', 'shop:create');
  }
  
  if (user.accountTypes?.includes('TOURNAMENT_ORGANIZER')) {
    permissions.push('tournament:create', 'tournament:manage');
  }

  if (user.accountTypes?.includes('TRADER')) {
    permissions.push('product:trade', 'exchange:create');
  }

  return permissions;
}