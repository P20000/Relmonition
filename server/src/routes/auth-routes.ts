import { Router } from 'express';
import { signup, login, getMe, updateProfile } from '../controllers/auth-controller';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', getMe);
router.patch('/update-profile', updateProfile);

export default router;
