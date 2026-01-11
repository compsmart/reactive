import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import {
  searchContractors,
  enrichContractor,
  generateOverallSummary,
  sendJobToContractors
} from '../controllers/smartSearch.controller';

const router = Router();

// Search contractors - no auth required
router.post('/', optionalAuth, searchContractors);

// Enrich single contractor with AI - no auth required
router.post('/enrich/:id', optionalAuth, enrichContractor);

// Generate overall summary - no auth required
router.post('/overall-summary', optionalAuth, generateOverallSummary);

// Send job to contractors - auth required
router.post('/send-job', authenticateToken, sendJobToContractors);

export default router;

