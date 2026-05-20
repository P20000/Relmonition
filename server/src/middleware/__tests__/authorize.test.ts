import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorize } from '../authorize';
import { Request, Response, NextFunction } from 'express';
import * as schema from '../../db/schema';

// Setup query chain mocks
const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();

vi.mock('../../tenant-manager', () => {
  return {
    TenantDatabaseManager: class {
      getGlobalClient() {
        return {
          client: {
            select: () => ({
              from: (table: any) => ({
                where: () => ({
                  limit: async () => {
                    if (table === schema.tenants) {
                      return [{ id: 'tenant-123', deletedAt: null }];
                    }
                    if (table === schema.tenantMembers) {
                      return mockLimit();
                    }
                    return [];
                  }
                })
              })
            })
          }
        };
      }
    }
  };
});

describe('Authorization Middleware', () => {
  let req: any;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { userId: 'user-123' },
      params: { tenantId: 'tenant-123' },
      body: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;

    // Default mock behavior: active owner member
    mockLimit.mockResolvedValue([
      {
        id: 'member-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'owner',
        status: 'active',
      }
    ]);
  });

  it('should return 401 when no user is attached to request', async () => {
    delete req.user;
    await authorize()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when tenant ID is missing', async () => {
    req.params = {};
    await authorize()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tenant ID is required for this operation' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should authorize valid active member of tenant', async () => {
    await authorize()(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(req.tenantId).toBe('tenant-123');
  });

  it('should return 403 when user is not a member of the tenant', async () => {
    mockLimit.mockResolvedValue([]); // Database returns no membership
    await authorize()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Access to this tenant is denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should enforce role checks and authorize matching role', async () => {
    await authorize('owner')(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 when role does not match required role', async () => {
    await authorize('partner')(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden: Requires role 'partner'" });
    expect(next).not.toHaveBeenCalled();
  });
});
