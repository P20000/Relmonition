import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../rate-limiter';

describe('Rate Limiter Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.useFakeTimers();
    req = {
      headers: {},
      socket: {} as any,
      path: '/test'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests under the limit', () => {
    (req as any).ip = '127.0.0.1';
    const limiter = rateLimiter(2, 60000);

    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();

    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block requests exceeding the limit', () => {
    (req as any).ip = '127.0.0.2';
    const limiter = rateLimiter(2, 60000);

    // Call 1
    limiter(req as Request, res as Response, next);
    // Call 2
    limiter(req as Request, res as Response, next);
    // Call 3 (exceeds)
    limiter(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Too many requests'
    }));
  });

  it('should reset limits after the time window expires', () => {
    (req as any).ip = '127.0.0.3';
    const limiter = rateLimiter(1, 60000);

    // Call 1 (allowed)
    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Call 2 (blocked)
    limiter(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // Advance time by 61 seconds
    vi.advanceTimersByTime(61000);

    // Reset mocks
    next = vi.fn();
    res.status = vi.fn().mockReturnThis();

    // Call 3 (allowed again)
    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
