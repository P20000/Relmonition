import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { AuthorizedRequest } from './authorize';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import crypto from 'crypto';

const tenantManager = new TenantDatabaseManager();

/**
 * Middleware: Logs all mutating API operations (POST, PUT, PATCH, DELETE)
 * to the global audit_logs table after the response completes.
 */
export const auditLogger = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Only audit mutations (POST, PUT, PATCH, DELETE)
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!isMutation) {
    return next();
  }

  // Hook into response finish event to capture final status code
  res.on('finish', async () => {
    try {
      const { client } = tenantManager.getGlobalClient();
      
      const userId = req.user?.userId || null;
      const tenantId = (req as AuthorizedRequest).tenantId || 
                       req.params?.tenantId || 
                       req.body?.tenantId || 
                       req.query?.tenantId || 
                       null;

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
      const userAgent = req.headers['user-agent'] || null;

      await client.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        userId,
        tenantId,
        action: `${req.method} ${req.path}`,
        resource: req.originalUrl || req.url,
        ip,
        userAgent,
        statusCode: res.statusCode,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('[Audit Log Error] Failed to write audit log entry:', err);
    }
  });

  next();
};
