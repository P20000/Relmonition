import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../auth';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Setup query chain mocks
const mockLimit = vi.fn();
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock('../../tenant-manager', () => {
  return {
    TenantDatabaseManager: class {
      getGlobalClient() {
        return {
          client: {
            select: mockSelect
          }
        };
      }
    }
  };
});

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      cookies: {},
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
    
    // Default mock behavior: return active session
    mockLimit.mockResolvedValue([
      {
        id: 'session-id-123',
        token: 'opaque-token-1234567890123456789012345678901234567890123456789012345678901234',
        userId: 'user-id-123',
        expiresAt: new Date(Date.now() + 100000),
      }
    ]);
  });

  it('should return 401 when no token is present', async () => {
    await authenticate(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should validate valid JWT token in cookies', async () => {
    const JWT_SECRET = 'dev_jwt_secret_fallback_key_12345';
    const token = jwt.sign({ userId: 'user-id-123', sessionId: 'session-id-123' }, JWT_SECRET);
    req.cookies = { access_token: token };

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({
      userId: 'user-id-123',
      sessionId: 'session-id-123'
    });
  });

  it('should validate valid JWT token in Authorization header', async () => {
    const JWT_SECRET = 'dev_jwt_secret_fallback_key_12345';
    const token = jwt.sign({ userId: 'user-id-123', sessionId: 'session-id-123' }, JWT_SECRET);
    req.headers = { authorization: `Bearer ${token}` };

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({
      userId: 'user-id-123',
      sessionId: 'session-id-123'
    });
  });

  it('should return 401 when database session is missing/expired', async () => {
    const JWT_SECRET = 'dev_jwt_secret_fallback_key_12345';
    const token = jwt.sign({ userId: 'user-id-123', sessionId: 'session-id-123' }, JWT_SECRET);
    req.cookies = { access_token: token };

    // Database returns empty array (no session found)
    mockLimit.mockResolvedValue([]);

    await authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Session invalid or expired' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should support legacy opaque session tokens in Authorization header', async () => {
    // Legacy token is 64 characters hex
    const legacyToken = 'a'.repeat(64);
    req.headers = { authorization: `Bearer ${legacyToken}` };

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({
      userId: 'user-id-123',
      sessionId: 'session-id-123'
    });
  });
});
