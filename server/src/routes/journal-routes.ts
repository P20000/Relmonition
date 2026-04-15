import { Router } from 'express';
import { getDailyPrompt, createEntry, getEntries } from '../controllers/journal-controller';

const router = Router();

router.get('/prompt', getDailyPrompt);
router.post('/entry', createEntry);
router.get('/:tenantId/entries', getEntries);

export default router;
