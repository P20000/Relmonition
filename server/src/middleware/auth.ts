import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';

const tenantManager = new TenantDatabaseManager();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_fallback_key_12345';

export interface AuthUser {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware: Validates authentication token from cookies or authorization header.
 * Supports HttpOnly JWT cookies, JWT bearer headers, and fallback to legacy opaque session tokens.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies?.access_token;

  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    let decoded: { userId: string; sessionId: string } | null = null;
    let isOpaqueToken = false;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string };
    } catch (err) {
      // If it looks like an opaque token (e.g. hex string from seed or legacy clients)
      if (typeof token === 'string' && token.length === 64) {
        isOpaqueToken = true;
      } else {
        return res.status(401).json({ error: 'Session invalid or expired' });
      }
    }

    const { client } = tenantManager.getGlobalClient();

    if (isOpaqueToken) {
      const sessionResult = await client
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .limit(1);

      if (sessionResult.length === 0 || new Date() > sessionResult[0].expiresAt) {
        return res.status(401).json({ error: 'Session invalid or expired' });
      }

      (req as AuthenticatedRequest).user = {
        userId: sessionResult[0].userId,
        sessionId: sessionResult[0].id,
      };
    } else if (decoded) {
      const sessionResult = await client
        .select()
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, decoded.sessionId),
            eq(schema.sessions.userId, decoded.userId)
          )
        )
        .limit(1);

      if (sessionResult.length === 0 || new Date() > sessionResult[0].expiresAt) {
        return res.status(401).json({ error: 'Session invalid or expired' });
      }

      (req as AuthenticatedRequest).user = {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
      };
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

/**
 * Middleware that allows unauthenticated requests but attaches user if present.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies?.access_token;
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return next();

  try {
    let decoded: { userId: string; sessionId: string } | null = null;
    let isOpaqueToken = false;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string };
    } catch (err) {
      if (typeof token === 'string' && token.length === 64) {
        isOpaqueToken = true;
      }
    }

    const { client } = tenantManager.getGlobalClient();

    if (isOpaqueToken) {
      const sessionResult = await client
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .limit(1);

      if (sessionResult.length > 0 && new Date() <= sessionResult[0].expiresAt) {
        (req as AuthenticatedRequest).user = {
          userId: sessionResult[0].userId,
          sessionId: sessionResult[0].id,
        };
      }
    } else if (decoded) {
      const sessionResult = await client
        .select()
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, decoded.sessionId),
            eq(schema.sessions.userId, decoded.userId)
          )
        )
        .limit(1);

      if (sessionResult.length > 0 && new Date() <= sessionResult[0].expiresAt) {
        (req as AuthenticatedRequest).user = {
          userId: decoded.userId,
          sessionId: decoded.sessionId,
        };
      }
    }
  } catch (err) {
    // Silently ignore invalid tokens
  }
  next();
};
