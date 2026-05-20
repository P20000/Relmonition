import { Router } from 'express';
import { getDailyPrompt, createEntry, getEntries } from '../controllers/journal-controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateBody, createJournalSchema } from '../utils/validation';

const router = Router();

router.get('/prompt', authenticate, authorize(), getDailyPrompt);
router.post('/entry', authenticate, authorize(), validateBody(createJournalSchema), createEntry);
router.get('/:tenantId/entries', authenticate, authorize(), getEntries);

export default router;
