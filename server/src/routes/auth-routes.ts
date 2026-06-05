import { Router } from 'express';
import { signup, login, logout, getMe, updateProfile, deleteAccount } from '../controllers/auth-controller';
import { authenticate } from '../middleware/auth';
import { validateBody, authSchema, updateProfileSchema } from '../utils/validation';
import { rateLimiter } from '../middleware/rate-limiter';

const router = Router();

// Strict limit: 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimiter(5, 15 * 60 * 1000);

router.post('/signup', validateBody(authSchema), signup);
router.post('/login', loginLimiter, validateBody(authSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.patch('/update-profile', authenticate, validateBody(updateProfileSchema), updateProfile);
router.delete('/me', authenticate, deleteAccount);

export default router;
