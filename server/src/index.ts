import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import tenantRoutes from './routes/tenant-routes';
import authRoutes from './routes/auth-routes';
import { getDashboardData } from './controllers/tenant-controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ 
  origin: 'https://relmonition.dpdns.org',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.get('/api/v1/dashboard/:tenantId', getDashboardData);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Relmonition API is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
