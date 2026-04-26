import { Router } from 'express';
import { 
  getProfiles, 
  triggerProfileGeneration, 
  updateLikesDislikes 
} from '../controllers/profile-controller';

const router = Router();

// GET /api/v1/profiles/:tenantId
router.get('/:tenantId', getProfiles);

// POST /api/v1/profiles/:tenantId/generate
router.post('/:tenantId/generate', triggerProfileGeneration);

// PATCH /api/v1/profiles/:tenantId/:userId/likes
router.patch('/:tenantId/:userId/likes', updateLikesDislikes);

export default router;
