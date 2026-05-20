import { Router } from 'express';
import { signup, login, logout, getMe, updateProfile } from '../controllers/auth-controller';
import { authenticate } from '../middleware/auth';
import { validateBody, authSchema, updateProfileSchema } from '../utils/validation';

const router = Router();

router.post('/signup', validateBody(authSchema), signup);
router.post('/login', validateBody(authSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.patch('/update-profile', authenticate, validateBody(updateProfileSchema), updateProfile);

export default router;
