import { Router } from 'express';
import { ragQuery, ragEmbed } from '../controllers/rag-controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

import { rateLimiter } from '../middleware/rate-limiter';

const router = Router();

const aiLimiter = rateLimiter(20, 15 * 60 * 1000); // 20 requests per 15 mins

// Secure all RAG endpoints
router.use(authenticate);

// POST /api/v1/rag/query — semantic search + AI generation
router.post('/query', aiLimiter, authorize(), ragQuery);

// POST /api/v1/rag/embed — store a journal entry embedding
router.post('/embed', authorize(), ragEmbed);

export default router;
