import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ==================== USER MANAGEMENT ====================

// Get all users with filters
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { role, status, search, page = '1', limit = '20' } = req.query;
        
        const where: any = {
            deletedAt: null // Don't show soft-deleted users
        };

        if (role) where.role = role;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { email: { contains: search as string, mode: 'insensitive' } },
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    approvedAt: true,
                    contractorProfile: {
                        select: {
                            isVerified: true,
                            rating: true,
                            skills: true
                        }
                    },
                    customerProfile: {
                        select: {
                            type: true,
                            companyName: true
                        }
                    },
                    _count: {
                        select: {
                            assignedJobs: true,
                            jobsPosted: true,
                            bids: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Get single user details (admin view)
export const getUserDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                contractorProfile: true,
                customerProfile: true,
                subscription: true,
                _count: {
                    select: {
                        assignedJobs: true,
                        jobsPosted: true,
                        bids: true,
                        payments: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user' });
    }
};

// Update user (role, status, etc.)
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role, status, firstName, lastName, phone } = req.body;

        const user = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...(role && { role }),
                ...(status && { status }),
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(phone !== undefined && { phone })
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user' });
    }
};

// Soft delete user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                deletedAt: new Date(),
                status: 'SUSPENDED'
            }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// ==================== CONTRACTOR MANAGEMENT ====================

// Get pending contractor requests
export const getPendingContractors = async (req: Request, res: Response) => {
    try {
        const contractors = await prisma.user.findMany({
            where: {
                role: 'SUBCONTRACTOR',
                status: 'PENDING',
                deletedAt: null
            },
            include: {
                contractorProfile: true
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(contractors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pending contractors' });
    }
};

// Approve contractor
export const approveContractor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.userId;

        const contractor = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: 'ACTIVE',
                approvedAt: new Date(),
                approvedById: adminId,
                contractorProfile: {
                    update: {
                        isVerified: true
                    }
                }
            },
            include: {
                contractorProfile: true
            }
        });

        // TODO: Send approval email to contractor

        res.json({ message: 'Contractor approved', contractor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving contractor' });
    }
};

// Reject contractor
export const rejectContractor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const contractor = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: 'REJECTED',
                rejectionReason: reason
            }
        });

        // TODO: Send rejection email to contractor

        res.json({ message: 'Contractor rejected', contractor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error rejecting contractor' });
    }
};

// Verify/unverify contractor
export const toggleContractorVerification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const profile = await prisma.contractorProfile.findUnique({
            where: { userId: parseInt(id, 10) }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Contractor profile not found' });
        }

        const updated = await prisma.contractorProfile.update({
            where: { userId: parseInt(id, 10) },
            data: { isVerified: !profile.isVerified }
        });

        res.json({ message: `Contractor ${updated.isVerified ? 'verified' : 'unverified'}`, profile: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error toggling verification' });
    }
};

// ==================== PAYMENT MANAGEMENT ====================

// Get all payments
export const getPayments = async (req: Request, res: Response) => {
    try {
        const { type, status, userId, startDate, endDate, page = '1', limit = '20' } = req.query;

        const where: any = {};
        if (type) where.type = type;
        if (status) where.status = status;
        if (userId) where.userId = parseInt(userId as string, 10);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    job: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.payment.count({ where })
        ]);

        res.json({
            payments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payments' });
    }
};

// Get payment stats
export const getPaymentStats = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
            if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
        }

        const [
            totalRevenue,
            subscriptionRevenue,
            unlockRevenue,
            jobPayments,
            pendingPayments,
            recentPayments
        ] = await Promise.all([
            prisma.payment.aggregate({
                where: { status: 'COMPLETED', ...dateFilter },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { status: 'COMPLETED', type: 'SUBSCRIPTION', ...dateFilter },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { status: 'COMPLETED', type: 'JOB_UNLOCK', ...dateFilter },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { status: 'COMPLETED', type: 'JOB_PAYMENT', ...dateFilter },
                _sum: { amount: true }
            }),
            prisma.payment.count({
                where: { status: 'PENDING', ...dateFilter }
            }),
            prisma.payment.findMany({
                where: { status: 'COMPLETED', ...dateFilter },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    user: { select: { email: true } }
                }
            })
        ]);

        res.json({
            totalRevenue: totalRevenue._sum.amount || 0,
            subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
            unlockRevenue: unlockRevenue._sum.amount || 0,
            jobPayments: jobPayments._sum.amount || 0,
            pendingPayments,
            recentPayments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payment stats' });
    }
};

// Issue refund
export const issueRefund = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(id, 10) }
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Can only refund completed payments' });
        }

        // Create refund record
        const refund = await prisma.payment.create({
            data: {
                userId: payment.userId,
                amount: payment.amount,
                type: 'REFUND',
                status: 'COMPLETED',
                jobId: payment.jobId,
                description: `Refund for payment #${payment.id}: ${reason}`,
                reference: `REFUND-${payment.id}`
            }
        });

        // Update original payment
        await prisma.payment.update({
            where: { id: parseInt(id, 10) },
            data: { status: 'REFUNDED' }
        });

        res.json({ message: 'Refund issued', refund });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error issuing refund' });
    }
};

// ==================== SYSTEM CONFIG ====================

// Get all config
export const getConfig = async (req: Request, res: Response) => {
    try {
        const config = await prisma.systemConfig.findMany({
            orderBy: { key: 'asc' }
        });

        // Convert to key-value object
        const configObj: Record<string, string> = {};
        config.forEach(c => { configObj[c.key] = c.value; });

        res.json(configObj);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching config' });
    }
};

// Update config
export const updateConfig = async (req: Request, res: Response) => {
    try {
        const updates = req.body; // { key: value, key2: value2, ... }

        const results = await Promise.all(
            Object.entries(updates).map(([key, value]) =>
                prisma.systemConfig.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) }
                })
            )
        );

        res.json({ message: 'Config updated', updated: results.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating config' });
    }
};

// ==================== DASHBOARD STATS ====================

// Get admin dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const [
            totalUsers,
            activeUsers,
            pendingContractors,
            totalContractors,
            totalEmployees,
            totalCustomers,
            totalJobs,
            openJobs,
            completedJobs,
            activeSubscriptions,
            recentPayments
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
            prisma.user.count({ where: { role: 'SUBCONTRACTOR', status: 'PENDING', deletedAt: null } }),
            prisma.user.count({ where: { role: 'SUBCONTRACTOR', deletedAt: null } }),
            prisma.user.count({ where: { role: 'EMPLOYEE', deletedAt: null } }),
            prisma.user.count({ where: { role: { in: ['CUST_RESIDENTIAL', 'CUST_COMMERCIAL'] }, deletedAt: null } }),
            prisma.job.count(),
            prisma.job.count({ where: { status: 'OPEN' } }),
            prisma.job.count({ where: { status: 'COMPLETED' } }),
            prisma.subscription.count({ where: { active: true, endDate: { gt: new Date() } } }),
            prisma.payment.aggregate({
                where: { status: 'COMPLETED', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                _sum: { amount: true }
            })
        ]);

        res.json({
            users: {
                total: totalUsers,
                active: activeUsers,
                contractors: totalContractors,
                employees: totalEmployees,
                customers: totalCustomers,
                pendingContractors
            },
            jobs: {
                total: totalJobs,
                open: openJobs,
                completed: completedJobs
            },
            subscriptions: {
                active: activeSubscriptions
            },
            revenue: {
                last30Days: recentPayments._sum.amount || 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
};

