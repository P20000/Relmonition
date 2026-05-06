import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import tenantRoutes from './routes/tenant-routes';
import authRoutes from './routes/auth-routes';
import ragRoutes from './routes/rag-routes';
import journalRoutes from './routes/journal-routes';
import coachRoutes from './routes/coach-routes';
import aiConfigRoutes from './routes/ai-config-routes';
import profileRoutes from './routes/profile-routes';
import { getDashboardData } from './controllers/tenant-controller';

dotenv.config();

import dns from 'dns';

// Configure public DNS servers for reliable resolution in the cloud
try {
  console.log('[DNS] Initializing public DNS servers (1.1.1.1, 8.8.8.8) for reliable host resolution...');
  dns.setServers(['1.1.1.1', '8.8.8.8']);
  
  // Monkey-patch dns.lookup for Turso database hostname
  const originalLookup = dns.lookup as any;
  // @ts-ignore
  dns.lookup = function(hostname: string, options: any, callback: any) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    if (hostname === 'relmonitionship-p20000.aws-ap-south-1.turso.io') {
      dns.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          originalLookup(hostname, options, callback);
        } else {
          const ip = addresses[0];
          console.log(`[DNS Override] Successfully resolved ${hostname} to ${ip} via dns.resolve4 (all: ${!!(options && options.all)})`);
          if (options && options.all) {
            callback(null, [{ address: ip, family: 4 }]);
          } else {
            callback(null, ip, 4);
          }
        }
      });
    } else {
      originalLookup(hostname, options, callback);
    }
  } as any;
} catch (e: any) {
  console.warn('[DNS] Failed to set public DNS servers or patch lookup:', e.message);
}

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ 
  origin: ['https://relmonition.dpdns.org', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/rag', ragRoutes);
app.use('/api/v1/journal', journalRoutes);
app.use('/api/v1/coach', coachRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/tenant/:tenantId/ai-configs', aiConfigRoutes);
app.get('/api/v1/dashboard/:tenantId', getDashboardData);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Relmonition API is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
