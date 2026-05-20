import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { validateBody, createJournalSchema } from '../../utils/validation';
import { getUserTenants, leaveTenant } from '../../controllers/tenant-controller';
import { updateLikesDislikes } from '../../controllers/profile-controller';

// Setup query chain mocks
const mockLimit = vi.fn();
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: mockWhere }) });

vi.mock('../../tenant-manager', () => {
  return {
    TenantDatabaseManager: class {
      getGlobalClient() {
        return {
          client: {
            select: mockSelect,
            update: mockUpdate
          }
        };
      }
      getDatabaseClient() {
        return {
          client: {
            select: mockSelect,
            update: mockUpdate
          }
        };
      }
    }
  };
});

describe('BOLA/IDOR Security Enforcement', () => {
  let req: any;
  let res: Partial<Response>;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: {},
      body: {},
      query: {},
      user: { userId: 'user-123' },
      tenantId: 'tenant-123'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  describe('getUserTenants BOLA Protection', () => {
    it('should return 403 when requesting tenants for a different userId than the token identity', async () => {
      req.params.userId = 'user-456'; // Swapping ID
      
      await getUserTenants(req as Request, res as Response);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "Forbidden: Cannot access another user's tenants"
      }));
    });

    it('should proceed to fetch tenants if userId matches token identity', async () => {
      req.params.userId = 'user-123'; // Matching ID
      mockSelect.mockReturnValue({ from: mockFrom });
      mockFrom.mockReturnValue({ where: mockWhere });
      mockWhere.mockResolvedValue([]); // Empty memberships

      await getUserTenants(req as Request, res as Response);
      
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('updateLikesDislikes IDOR Protection', () => {
    it("should return 403 when trying to update another user's likes/dislikes preferences", async () => {
      req.params.userId = 'user-456'; // Swapping ID
      
      await updateLikesDislikes(req as Request, res as Response);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "Forbidden: Cannot update another user's preferences"
      }));
    });
  });

  describe('leaveTenant Security enforcement', () => {
    it('should block leave request if the user is the owner of the tenant', async () => {
      req.user.userId = 'owner-123';
      req.params.tenantId = 'tenant-123';
      
      mockSelect.mockReturnValue({ from: mockFrom });
      mockFrom.mockReturnValue({ where: mockWhere });
      mockWhere.mockReturnValue({ limit: mockLimit });
      mockLimit.mockResolvedValue([{ role: 'owner' }]); // Database returns owner role

      await leaveTenant(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Owner cannot leave the tenant. Delete the tenant instead.'
      }));
    });
  });
});

describe('Zod Validation Middleware', () => {
  let req: any;
  let res: Partial<Response>;
  let next: any;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  it('should return 400 validation error for missing or empty content in journal schema', async () => {
    req.body = { date: '2026-05-19' }; // Missing content
    
    const middleware = validateBody(createJournalSchema);
    await middleware(req, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Validation failed'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 validation error for incorrect date format in journal schema', async () => {
    req.body = { content: 'Healthy conversation', date: '05-19-2026' }; // Wrong format
    
    const middleware = validateBody(createJournalSchema);
    await middleware(req, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass Zod validation and call next() for valid payloads', async () => {
    req.body = { content: 'Healthy conversation', date: '2026-05-19' };
    
    const middleware = validateBody(createJournalSchema);
    await middleware(req, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
