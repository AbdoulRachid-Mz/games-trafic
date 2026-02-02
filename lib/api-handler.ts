// lib/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ApiErrorResponse, PermissionCheck } from '@/types/api';
import { requireAuth } from './auth/middleware';

export class ApiHandler {
  static async handleRequest<T>(
    request: NextRequest,
    handler: (req: NextRequest, ctx?: any) => Promise<ApiResponse<T>>,
    params?: any
  ): Promise<NextResponse> {
    try {
      const auth = await requireAuth(request);
      if (!auth.authorized || !auth.user) {
        return this.errorResponse(401, 'UNAUTHORIZED', auth.error || 'Non authentifié');
      }

      const permissionCheck: PermissionCheck = {
        userId: auth.user.id,
        action: this.getActionFromMethod(request.method),
        entity: this.getEntityFromPath(request.nextUrl.pathname),
      };

      const permissionResult = await this.checkPermissions(permissionCheck, auth.user);
      if (!permissionResult.allowed) {
        return this.errorResponse(403, 'FORBIDDEN', permissionResult.reason || 'Accès refusé');
      }

      const ctx = { user: auth.user, params };
      const result = await handler(request, ctx);

      if (!result.success) {
        return this.errorResponse(400, 'BAD_REQUEST', (result as ApiErrorResponse).error.message);
      }

      return NextResponse.json(result);
    } catch (error) {
      console.error('API Handler error:', error);
      return this.errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Erreur interne');
    }
  }

  private static async checkPermissions(check: PermissionCheck, user: any): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true };
  }

  private static getActionFromMethod(method: string): string {
    const methodActions: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return methodActions[method] || 'read';
  }

  private static getEntityFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'unknown';
  }

  private static errorResponse(status: number, code: string, message: string): NextResponse {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
      },
    };
    return NextResponse.json(errorResponse, { status });
  }
}
