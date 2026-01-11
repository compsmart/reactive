import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  createJob, 
  getJobs, 
  getJobById, 
  placeBid, 
  assignJob,
  scheduleJob,
  createQuote,
  acceptQuote,
  unlockJob,
  acceptBid,
  updateJobStatus
} from '../controllers/job.controller';
import { getMatchesForJob } from '../controllers/match.controller';

const router = Router();

// All job routes require authentication
router.use(authenticate);

// Create job - Customers and Admins only
router.post('/', authorize(['CUST_RESIDENTIAL', 'CUST_COMMERCIAL', 'ADMIN']), createJob);

// List jobs - All authenticated users (filtered by role in controller)
router.get('/', getJobs);

// Get matching contractors for a job - Admin only
router.get('/:id/matches', authorize(['ADMIN']), getMatchesForJob);

// Get single job details - Authorization checked in controller
router.get('/:id', getJobById);

// Place bid on a job - Contractors only
router.post('/:id/bid', authorize(['SUBCONTRACTOR']), placeBid);

// Assign job to contractor - Admin only
router.post('/:id/assign', authorize(['ADMIN']), assignJob);

// Schedule job - Admin or assigned contractor
router.post('/:id/schedule', scheduleJob);

// Create quote for job - Admin only (commercial flow)
router.post('/:id/quote', authorize(['ADMIN']), createQuote);

// Accept quote - Customer only
router.post('/:id/accept-quote', authorize(['CUST_RESIDENTIAL', 'CUST_COMMERCIAL']), acceptQuote);

// Unlock job contact details - Contractor pays to see
router.post('/:id/unlock', authorize(['SUBCONTRACTOR']), unlockJob);

// Accept a bid - Customer or Admin
router.post('/:id/bids/:bidId/accept', authorize(['CUST_RESIDENTIAL', 'CUST_COMMERCIAL', 'ADMIN']), acceptBid);

// Update job status
router.patch('/:id/status', updateJobStatus);

export default router;
