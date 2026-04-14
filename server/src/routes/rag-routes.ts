import { Router } from 'express';
import { ragQuery, ragEmbed } from '../controllers/rag-controller';

const router = Router();

// POST /api/v1/rag/query — semantic search + Gemini generation
router.post('/query', ragQuery);

// POST /api/v1/rag/embed — store a journal entry embedding
router.post('/embed', ragEmbed);

export default router;
