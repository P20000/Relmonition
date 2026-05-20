import { Router } from 'express';
import { ragQuery, ragEmbed } from '../controllers/rag-controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Secure all RAG endpoints
router.use(authenticate);

// POST /api/v1/rag/query — semantic search + AI generation
router.post('/query', authorize(), ragQuery);

// POST /api/v1/rag/embed — store a journal entry embedding
router.post('/embed', authorize(), ragEmbed);

export default router;
