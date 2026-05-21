import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const tenantManager = new TenantDatabaseManager();

export interface AuthorizedRequest extends AuthenticatedRequest {
  tenantId?: string;
}

/**
 * Middleware: Validates that the authenticated user is an active member of the tenant
 * they are attempting to access, and optionally checks their role ('owner' | 'partner').
 * Attaches req.tenantId downstream.
 */
export const authorize = (requiredRole?: 'owner' | 'partner') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { userId } = req.user;
      const tenantId = req.params.tenantId || req.body?.tenantId || req.query.tenantId as string | undefined;

      if (!tenantId || typeof tenantId !== 'string') {
        return res.status(400).json({ error: 'Tenant ID is required for this operation' });
      }

      const { client } = tenantManager.getGlobalClient();

      // Check that tenant is not deleted
      const tenant = await client
        .select()
        .from(schema.tenants)
        .where(
          and(
            eq(schema.tenants.id, tenantId),
            isNull(schema.tenants.deletedAt)
          )
        )
        .limit(1);

      if (tenant.length === 0) {
        return res.status(404).json({ error: 'Tenant not found or has been deleted' });
      }

      const membership = await client
        .select()
        .from(schema.tenantMembers)
        .where(
          and(
            eq(schema.tenantMembers.userId, userId),
            eq(schema.tenantMembers.tenantId, tenantId),
            eq(schema.tenantMembers.status, 'active')
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Access to this tenant is denied' });
      }

      if (requiredRole && membership[0].role !== requiredRole) {
        return res.status(403).json({ error: `Forbidden: Requires role '${requiredRole}'` });
      }

      // Attach tenant ID downstream
      (req as AuthorizedRequest).tenantId = tenantId;

      next();
    } catch (err: any) {
      console.error('Authorization middleware error:', err);
      return res.status(500).json({ 
        error: 'Authorization service error',
        details: err?.message || String(err)
      });
    }
  };
};
