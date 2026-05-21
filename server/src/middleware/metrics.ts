import http from 'http';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// ---------------------------------------------------------------------------
// Central Prometheus registry for all Relmonition application metrics.
//
// Runs on a DEDICATED port (9464) completely isolated from the Express API
// so it is NEVER reachable via the public Nginx ingress, CORS middleware,
// or rate limiter. Prometheus scrapes this port directly inside the cluster
// via a ServiceMonitor CRD — zero public exposure.
// ---------------------------------------------------------------------------

export const register = new Registry();
register.setDefaultLabels({ app: 'relmonition' });

// Collect default Node.js runtime metrics:
//   - process_cpu_seconds_total
//   - nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes
//   - nodejs_gc_duration_seconds (GC pause histogram)
//   - nodejs_eventloop_lag_seconds
//   - nodejs_active_handles_total / nodejs_active_requests_total
collectDefaultMetrics({ register });

// ─── HTTP Request Layer ───────────────────────────────────────────────────────

/**
 * Counts every HTTP request by method, normalized route, and status code.
 * Used for RPS panels and error rate calculations in Grafana.
 */
export const httpRequestsTotal = new Counter({
  name: 'relmonition_http_requests_total',
  help: 'Total HTTP requests processed, labeled by method, route, and HTTP status',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [register],
});

/**
 * Latency histogram for every HTTP request.
 * Enables P50 / P95 / P99 SLO tracking per route in Grafana.
 */
export const httpRequestDurationSeconds = new Histogram({
  name: 'relmonition_http_request_duration_seconds',
  help: 'HTTP request latency in seconds, labeled by method, route, and status',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// ─── Auth / Session ───────────────────────────────────────────────────────────

/**
 * Gauge tracking the number of requests currently being processed.
 * Incremented at request start, decremented on response finish.
 * A proxy for instantaneous concurrency / active session count.
 */
export const activeSessionsGauge = new Gauge({
  name: 'relmonition_active_sessions',
  help: 'Number of HTTP requests currently in flight (active sessions)',
  registers: [register],
});

// ─── Metrics HTTP Server (port 9464) ─────────────────────────────────────────

const METRICS_PORT = parseInt(process.env.METRICS_PORT || '9464', 10);

/**
 * Starts a minimal HTTP server that serves Prometheus text-format metrics.
 * This is intentionally a raw Node http.Server, NOT an Express app, so it
 * bypasses all app-level middleware (auth, CORS, rate limiter, audit logger).
 *
 * Called once from server/src/index.ts inside the app.listen() callback.
 */
export function startMetricsServer(): void {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics' && req.method === 'GET') {
      try {
        const metrics = await register.metrics();
        res.setHeader('Content-Type', register.contentType);
        res.writeHead(200);
        res.end(metrics);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    } else if (req.url === '/health') {
      res.writeHead(200);
      res.end('ok');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.on('error', (err) => {
    console.error(`[Metrics] Server error on port ${METRICS_PORT}:`, err);
  });

  server.listen(METRICS_PORT, '0.0.0.0', () => {
    console.log(`[Metrics] Prometheus scrape endpoint listening on :${METRICS_PORT}/metrics`);
  });
}
