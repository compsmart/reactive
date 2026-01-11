import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getUserById, updateUser, getUserJobs, getUserEarnings } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

// Get user by ID (admin can get any, users can get their own)
router.get('/:id', getUserById);

// Get user's job history (for contractors)
router.get('/:id/jobs', getUserJobs);

// Get user's earnings (for contractors)
router.get('/:id/earnings', getUserEarnings);

// Update user profile
router.put('/:id', updateUser);

export default router;

