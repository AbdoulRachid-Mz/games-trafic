//@/lib/api/access-control.ts
import { db } from '@/lib/db';
import { users, products, shops, tournaments } from '@/database/schema';
import { eq } from 'drizzle-orm';

export interface PermissionContext {
  user: typeof users.$inferSelect;
  resourceId?: string;
  attributes?: Record<string, any>;
}

export interface PermissionResult {
  granted: boolean;
  reason?: string;
}

// Mapping rôle -> permissions (basé sur le champ `role` de users)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // Toutes les permissions
  
  moderator: [
    'user:read',
    'user:update',
    'product:read',
    'product:update',
    'tournament:read',
    'tournament:update',
    'content:moderate',
  ],
  
  vip: [
    'user:read',
    'product:create',
    'product:update',
    'product:delete:own',
    'tournament:create',
    'tournament:update:own',
    'shop:create',
    'theme:create',
  ],
  
  seller: [
    'user:read',
    'product:create',
    'product:update:own',
    'product:delete:own',
    'shop:create',
    'shop:update:own',
  ],
  
  user: [
    'user:read:own',
    'product:read',
    'tournament:read',
    'interaction:create',
  ],
};

export class AccessControl {
  /**
   * Récupère les permissions d'un utilisateur basé sur son rôle
   */
  private static async getUserPermissions(user: typeof users.$inferSelect): Promise<Set<string>> {
    const permissions = new Set<string>();
    
    // Ajouter les permissions basées sur le rôle
    const roleKey = user.role ?? 'user';
    const rolePerms = ROLE_PERMISSIONS[roleKey] || ROLE_PERMISSIONS['user'];
    rolePerms.forEach(p => permissions.add(p));

    // Ajouter les permissions VIP si applicable
    if (user.isVip) {
      const vipPerms = ROLE_PERMISSIONS['vip'] || [];
      vipPerms.forEach(p => permissions.add(p));
    }

    // Ajouter les permissions admin si applicable
    if (user.isAdmin) {
      permissions.add('*'); // Admin a tous les droits
    }

    // Ajouter les permissions basées sur accountTypes
    if (user.accountTypes?.includes('SELLER')) {
      permissions.add('product:sell');
    }
    
    if (user.accountTypes?.includes('TOURNAMENT_ORGANIZER')) {
      permissions.add('tournament:organize');
    }

    return permissions;
  }

  /**
   * Vérifie si un utilisateur a une permission
   */
  static async hasPermission(
    user: typeof users.$inferSelect,
    requiredPermission: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    const permissions = await this.getUserPermissions(user);
    
    // Admin a tous les droits
    if (permissions.has('*')) {
      return { granted: true };
    }

    // Vérifier la permission exacte
    if (permissions.has(requiredPermission)) {
      return { granted: true };
    }

    // Vérifier les wildcards (ex: product:*)
    const [resource, action] = requiredPermission.split(':');
    if (permissions.has(`${resource}:*`)) {
      return { granted: true };
    }

    // Vérifier les permissions "own" (propriétaire)
    if (action?.endsWith('own') && context?.resourceId) {
      const basePermission = requiredPermission.replace(':own', '');
      
      // Vérifier si l'utilisateur est propriétaire
      const isOwner = await this.checkOwnership(
        resource,
        context.resourceId,
        user.id
      );

      if (isOwner && permissions.has(basePermission)) {
        return { granted: true, reason: 'Propriétaire de la ressource' };
      }
    }

    return { granted: false, reason: 'Permission manquante' };
  }

  /**
   * Vérifie plusieurs permissions (toutes requises)
   */
  static async hasAllPermissions(
    user: typeof users.$inferSelect,
    requiredPermissions: string[],
    context?: PermissionContext
  ): Promise<PermissionResult> {
    for (const permission of requiredPermissions) {
      const result = await this.hasPermission(user, permission, context);
      if (!result.granted) {
        return { granted: false, reason: `Permission manquante: ${permission}` };
      }
    }
    return { granted: true };
  }

  /**
   * Vérifie plusieurs permissions (au moins une)
   */
  static async hasAnyPermission(
    user: typeof users.$inferSelect,
    requiredPermissions: string[],
    context?: PermissionContext
  ): Promise<PermissionResult> {
    for (const permission of requiredPermissions) {
      const result = await this.hasPermission(user, permission, context);
      if (result.granted) {
        return { granted: true };
      }
    }
    return { granted: false, reason: 'Aucune permission requise' };
  }

  /**
   * Vérifie si un utilisateur est propriétaire d'une ressource
   */
  private static async checkOwnership(
    resource: string,
    resourceId: string,
    userId: string
  ): Promise<boolean> {
    switch (resource) {
      case 'product':
        const [product] = await db
          .select({ userId: products.userId })
          .from(products)
          .where(eq(products.id, resourceId))
          .limit(1);
        return product?.userId === userId;

      case 'shop':
        const [shop] = await db
          .select({ ownerId: shops.ownerId })
          .from(shops)
          .where(eq(shops.id, resourceId))
          .limit(1);
        return shop?.ownerId === userId;

      case 'tournament':
        const [tournament] = await db
          .select({ organizerId: tournaments.organizerId })
          .from(tournaments)
          .where(eq(tournaments.id, resourceId))
          .limit(1);
        return tournament?.organizerId === userId;

      default:
        return false;
    }
  }
}