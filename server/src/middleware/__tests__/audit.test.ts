import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLogger } from '../audit';
import { Request, Response, NextFunction } from 'express';

// Setup query chain mocks
const mockValues = vi.fn().mockResolvedValue({});
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock('../../tenant-manager', () => {
  return {
    TenantDatabaseManager: class {
      getGlobalClient() {
        return {
          client: {
            insert: mockInsert
          }
        };
      }
    }
  };
});

describe('Audit Logger Middleware', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      method: 'GET',
      path: '/api/v1/tenant',
      originalUrl: '/api/v1/tenant',
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Vitest Browser'
      },
      socket: { remoteAddress: '127.0.0.1' },
      user: { userId: 'user-123' },
      tenantId: 'tenant-123',
      params: {},
      body: {},
      query: {}
    };
    
    // Simulate Express Response res.on
    const callbacks: Record<string, () => void> = {};
    res = {
      statusCode: 200,
      on: vi.fn().mockImplementation((event: string, cb: () => void) => {
        callbacks[event] = cb;
      }),
      // Helper to trigger events in tests
      _trigger: (event: string) => {
        if (callbacks[event]) {
          callbacks[event]();
        }
      }
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('should ignore GET requests and not bind to finish event', async () => {
    req.method = 'GET';
    await auditLogger(req as Request, res as Response, next);
    
    expect(res.on).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should bind to finish event and log details for POST requests', async () => {
    req.method = 'POST';
    req.path = '/create';
    
    await auditLogger(req as Request, res as Response, next);
    
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(next).toHaveBeenCalled();
    
    // Trigger response completion event
    await res._trigger('finish');
    
    // Verify database insert was called with audit data
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        tenantId: 'tenant-123',
        action: 'POST /create',
        statusCode: 200,
        ip: '127.0.0.1',
        userAgent: 'Vitest Browser'
      })
    );
  });
});
