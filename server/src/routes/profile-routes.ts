import { Router } from 'express';
import { 
  getProfiles, 
  triggerProfileGeneration, 
  updateLikesDislikes 
} from '../controllers/profile-controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Secure all profile routes
router.use(authenticate);

// GET /api/v1/profiles/:tenantId
router.get('/:tenantId', authorize(), getProfiles);

// POST /api/v1/profiles/:tenantId/generate
router.post('/:tenantId/generate', authorize(), triggerProfileGeneration);

// PATCH /api/v1/profiles/:tenantId/:userId/likes
router.patch('/:tenantId/:userId/likes', authorize(), updateLikesDislikes);

export default router;
