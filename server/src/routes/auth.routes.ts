import { Router } from 'express';
import { register, login, getProfile, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Public routes with rate limiting to prevent brute force attacks
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);

// Protected routes
router.get('/me', authenticate, getProfile);

export default router;
