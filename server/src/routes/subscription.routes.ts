import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getMySubscription,
  createSubscription,
  cancelSubscription
} from '../controllers/subscription.controller';

const router = Router();

router.use(authenticate);

// Get current user's subscription status
router.get('/me', getMySubscription);

// Create/renew subscription
router.post('/', authorize(['SUBCONTRACTOR']), createSubscription);

// Cancel subscription
router.delete('/', authorize(['SUBCONTRACTOR']), cancelSubscription);

export default router;

