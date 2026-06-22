import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import tenantRoutes from './routes/tenant-routes';
import authRoutes from './routes/auth-routes';
import ragRoutes from './routes/rag-routes';
import journalRoutes from './routes/journal-routes';
import coachRoutes from './routes/coach-routes';
import aiConfigRoutes from './routes/ai-config-routes';
import profileRoutes from './routes/profile-routes';
import { getDashboardData } from './controllers/tenant-controller';
// Observability: metrics registry + dedicated port 9464 server
import { startMetricsServer } from './middleware/metrics';
import { httpMetricsMiddleware } from './middleware/http-metrics';


import cookieParser from 'cookie-parser';
import { auditLogger } from './middleware/audit';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || /^https:\/\/([a-zA-Z0-9-]+\.)?relmonition\.dpdns\.org$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(auditLogger);
// Record HTTP latency + request counts for every route via Prometheus
app.use(httpMetricsMiddleware);

import { authenticate } from './middleware/auth';
import { authorize } from './middleware/authorize';

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/rag', ragRoutes);
app.use('/api/v1/journal', journalRoutes);
app.use('/api/v1/coach', coachRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/tenant/:tenantId/ai-configs', aiConfigRoutes);
app.get('/api/v1/dashboard/:tenantId', authenticate, authorize(), getDashboardData);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Relmonition API is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  // Start the dedicated Prometheus metrics server (port 9464, never public-facing)
  startMetricsServer();
});
