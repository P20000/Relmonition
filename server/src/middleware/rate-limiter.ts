import { Request, Response, NextFunction } from 'express';
import { Counter } from 'prom-client';

interface RateLimit {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimit>();

// Prometheus counter — incremented whenever a request is blocked by the rate limiter.
// Labeled by path so Grafana can show which endpoints are being hammered.
const rateLimitHitsTotal = new Counter({
  name: 'relmonition_rate_limit_hits_total',
  help: 'Total number of requests blocked by the rate limiter',
  labelNames: ['path'] as const,
});

/**
 * Custom lightweight in-memory rate limiter middleware.
 * Prevents Denial of Wallet/Service on expensive endpoints.
 */
export const rateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || 
                req.headers['x-forwarded-for'] || 
                req.socket.remoteAddress || 
                'unknown') as string;
                
    const now = Date.now();
    const limit = rateLimits.get(ip);

    if (!limit || now > limit.resetTime) {
      rateLimits.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (limit.count >= maxRequests) {
      console.warn(`[Rate Limiter] Rate limit exceeded for IP: ${ip} on path: ${req.path}`);
      // Increment Prometheus counter with the path label
      rateLimitHitsTotal.inc({ path: req.path });
      return res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the request limit for this action. Please try again later.'
      });
    }

    limit.count++;
    next();
  };
};

