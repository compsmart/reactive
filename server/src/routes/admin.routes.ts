import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
    // User management
    getUsers,
    getUserDetails,
    updateUser,
    deleteUser,
    // Contractor management
    getPendingContractors,
    approveContractor,
    rejectContractor,
    toggleContractorVerification,
    // Payment management
    getPayments,
    getPaymentStats,
    issueRefund,
    // System config
    getConfig,
    updateConfig,
    // Dashboard
    getDashboardStats
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Dashboard
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Contractor management
router.get('/contractors/pending', getPendingContractors);
router.post('/contractors/:id/approve', approveContractor);
router.post('/contractors/:id/reject', rejectContractor);
router.post('/contractors/:id/verify', toggleContractorVerification);

// Payment management
router.get('/payments', getPayments);
router.get('/payments/stats', getPaymentStats);
router.post('/payments/:id/refund', issueRefund);

// System config
router.get('/config', getConfig);
router.put('/config', updateConfig);

export default router;

