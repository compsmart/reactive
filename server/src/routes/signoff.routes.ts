import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
    submitCompletion,
    approveSignoff,
    disputeSignoff,
    resolveDispute,
    getSignoffStatus,
    getPendingSignoffs,
    getDisputedJobs
} from '../controllers/signoff.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Contractor submits job completion
router.post('/jobs/:id/complete', authorize(['SUBCONTRACTOR', 'ADMIN']), submitCompletion);

// Customer approves signoff
router.post('/jobs/:id/approve', authorize(['CUST_RESIDENTIAL', 'CUST_COMMERCIAL', 'ADMIN']), approveSignoff);

// Customer disputes completion
router.post('/jobs/:id/dispute', authorize(['CUST_RESIDENTIAL', 'CUST_COMMERCIAL', 'ADMIN']), disputeSignoff);

// Admin resolves dispute
router.post('/jobs/:id/resolve', authorize(['ADMIN']), resolveDispute);

// Get signoff status for a job
router.get('/jobs/:id/signoff', getSignoffStatus);

// Get all pending signoffs for current customer
router.get('/pending', authorize(['CUST_RESIDENTIAL', 'CUST_COMMERCIAL']), getPendingSignoffs);

// Get all disputed jobs (admin)
router.get('/disputed', authorize(['ADMIN']), getDisputedJobs);

export default router;

