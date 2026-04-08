import express from 'express';
import dotenv from 'dotenv';

import tenantRoutes from './routes/tenant-routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// API Routes
app.use('/api/v1/tenant', tenantRoutes);

app.get('/api/v1/dashboard/:tenantId', getDashboardData);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Relmonition API is running' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
