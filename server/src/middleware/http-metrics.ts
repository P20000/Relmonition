import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDurationSeconds, activeSessionsGauge } from './metrics';

/**
 * Express middleware that records per-request Prometheus metrics.
 * Captures: method, normalized route pattern, HTTP status code, and duration.
 *
 * Route normalization replaces dynamic segments (UUIDs, IDs) with placeholders
 * so Grafana cardinality stays bounded (e.g. /api/v1/tenant/:id not 1000 labels).
 */
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  activeSessionsGauge.inc();

  res.on('finish', () => {
    activeSessionsGauge.dec();

    // Normalize route: use Express matched route if available, else raw path
    const route = (req.route?.path as string) || normalizeRoute(req.path);
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);

    const durationNs = process.hrtime.bigint() - start;
    const durationSecs = Number(durationNs) / 1e9;
    httpRequestDurationSeconds.observe(labels, durationSecs);
  });

  next();
}

/** Replace UUIDs and numeric IDs in paths with named placeholders. */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}
