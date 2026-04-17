
import { Router } from 'express';
import { 
  getAIConfigs, 
  createAIConfig, 
  activateAIConfig, 
  deleteAIConfig 
} from '../controllers/ai-config-controller';

const router = Router({ mergeParams: true });

// Routes are prefixed with /api/v1/tenant/:tenantId/ai-configs in index.ts
router.get('/', getAIConfigs);
router.post('/', createAIConfig);
router.put('/:configId/activate', activateAIConfig);
router.delete('/:configId', deleteAIConfig);

export default router;
