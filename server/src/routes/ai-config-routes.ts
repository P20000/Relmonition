import { Router } from 'express';
import { 
  getAIConfigs, 
  createAIConfig, 
  activateAIConfig, 
  deleteAIConfig 
} from '../controllers/ai-config-controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateBody, createAIConfigSchema } from '../utils/validation';

const router = Router({ mergeParams: true });

// Secure all AI config endpoints with session and owner-only checks
router.use(authenticate);
router.use(authorize('owner'));

// Routes are prefixed with /api/v1/tenant/:tenantId/ai-configs in index.ts
router.get('/', getAIConfigs);
router.post('/', validateBody(createAIConfigSchema), createAIConfig);
router.put('/:configId/activate', activateAIConfig);
router.delete('/:configId', deleteAIConfig);

export default router;
