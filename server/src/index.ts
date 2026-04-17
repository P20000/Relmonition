import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import tenantRoutes from './routes/tenant-routes';
import authRoutes from './routes/auth-routes';
import ragRoutes from './routes/rag-routes';
import journalRoutes from './routes/journal-routes';
import coachRoutes from './routes/coach-routes';
import aiConfigRoutes from './routes/ai-config-routes';
import { getDashboardData } from './controllers/tenant-controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ 
  origin: ['https://relmonition.dpdns.org', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/rag', ragRoutes);
app.use('/api/v1/journal', journalRoutes);
app.use('/api/v1/coach', coachRoutes);
app.use('/api/v1/tenant/:tenantId/ai-configs', aiConfigRoutes);
app.get('/api/v1/dashboard/:tenantId', getDashboardData);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Relmonition API is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
