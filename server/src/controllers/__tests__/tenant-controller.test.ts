import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { createTenant, joinTenant } from '../tenant-controller';

let dbClientMock: any;

vi.mock('../../tenant-manager', () => {
  return {
    TenantDatabaseManager: class {
      getGlobalClient() {
        return { client: dbClientMock };
      }
    }
  };
});

describe('Tenant Onboarding Controller Security Checks', () => {
  let req: any;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    const valuesFn = vi.fn().mockResolvedValue({});
    const insertMock = vi.fn().mockReturnValue({
      values: valuesFn
    });

    const limitFn = vi.fn().mockResolvedValue([]);
    const whereFn = vi.fn().mockReturnValue({
      limit: limitFn
    });
    const fromFn = vi.fn().mockReturnValue({
      where: whereFn
    });
    const selectMock = vi.fn().mockReturnValue({
      from: fromFn
    });

    dbClientMock = {
      select: selectMock,
      insert: insertMock
    };

    req = {
      user: { userId: 'auth-user-999' }, // Authenticated identity
      body: {},
      params: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('createTenant', () => {
    it('should ignore user ID from body and use authenticated user identity', async () => {
      req.body = {
        userId: 'spoofed-user-111', // Spoofed ID
        tenantName: 'New Couple'
      };

      await createTenant(req as Request, res as Response);

      expect(dbClientMock.insert).toHaveBeenCalledTimes(2); // 1. tenant, 2. tenantMember
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Tenant created'
      }));
    });
  });

  describe('joinTenant', () => {
    it('should ignore user ID from body and use authenticated user identity', async () => {
      req.body = {
        userId: 'spoofed-user-111', // Spoofed ID
        connectionCode: 'ABCDEF'
      };
      
      // Mock tenant select
      dbClientMock.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'tenant-123', name: 'Existing Couple', connectionCode: 'ABCDEF' }])
          })
        })
      });

      await joinTenant(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Successfully joined tenant'
      }));
      expect(dbClientMock.insert).toHaveBeenCalledTimes(1); // inserts tenantMember
    });

    it('should return 404 for invalid connection codes', async () => {
      req.body = {
        userId: 'auth-user-999',
        connectionCode: 'INVALID'
      };
      // No tenant found
      dbClientMock.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await joinTenant(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid connection code'
      }));
    });
  });
});
