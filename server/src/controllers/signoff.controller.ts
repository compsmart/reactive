import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Contractor marks job as complete with evidence
export const submitCompletion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { completionNotes, completionPhotos } = req.body;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jobId = parseInt(id, 10);
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { assignments: true }
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if user is assigned to this job
        const isAssigned = job.assignments.some(a => a.userId === user.userId);
        const isAdmin = user.role === 'ADMIN';

        if (!isAssigned && !isAdmin) {
            return res.status(403).json({ message: 'You are not assigned to this job' });
        }

        if (job.status !== 'IN_PROGRESS' && job.status !== 'SCHEDULED') {
            return res.status(400).json({ message: 'Job must be in progress to submit completion' });
        }

        // Update job with completion details
        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: {
                completedAt: new Date(),
                completionNotes,
                completionPhotos: completionPhotos || [],
                contractorSignedOff: true,
                status: 'COMPLETED'
            }
        });

        // Create signoff record for customer to approve
        await prisma.jobSignoff.upsert({
            where: { jobId },
            update: {
                status: 'PENDING'
            },
            create: {
                jobId,
                status: 'PENDING'
            }
        });

        res.json({ 
            message: 'Job completion submitted for customer approval',
            job: updatedJob 
        });
    } catch (error) {
        console.error('Submit completion error:', error);
        res.status(500).json({ message: 'Error submitting job completion' });
    }
};

// Customer approves/signs off on completed job
export const approveSignoff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { customerNotes, rating, reviewComment } = req.body;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jobId = parseInt(id, 10);
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { 
                signoff: true,
                assignments: true 
            }
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Must be the customer who owns this job or admin
        if (job.customerId !== user.userId && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!job.contractorSignedOff) {
            return res.status(400).json({ message: 'Contractor has not yet submitted completion' });
        }

        // Update signoff status
        const signoff = await prisma.jobSignoff.update({
            where: { jobId },
            data: {
                status: 'APPROVED',
                customerNotes,
                signedAt: new Date()
            }
        });

        // Create review if rating provided
        if (rating && job.assignments.length > 0) {
            const contractorId = job.assignments[0].userId;
            await prisma.review.upsert({
                where: {
                    jobId_reviewerId: {
                        jobId,
                        reviewerId: user.userId
                    }
                },
                update: {
                    rating,
                    comment: reviewComment
                },
                create: {
                    jobId,
                    reviewerId: user.userId,
                    revieweeId: contractorId,
                    rating,
                    comment: reviewComment
                }
            });

            // Update contractor's average rating
            const reviews = await prisma.review.findMany({
                where: { revieweeId: contractorId }
            });
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            
            await prisma.contractorProfile.update({
                where: { userId: contractorId },
                data: { rating: avgRating }
            });
        }

        res.json({ 
            message: 'Job signed off successfully',
            signoff 
        });
    } catch (error) {
        console.error('Approve signoff error:', error);
        res.status(500).json({ message: 'Error approving signoff' });
    }
};

// Customer disputes completed job
export const disputeSignoff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { disputeReason } = req.body;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!disputeReason || disputeReason.trim().length < 10) {
            return res.status(400).json({ message: 'Please provide a detailed dispute reason' });
        }

        const jobId = parseInt(id, 10);
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { signoff: true }
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.customerId !== user.userId && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!job.contractorSignedOff) {
            return res.status(400).json({ message: 'Contractor has not yet submitted completion' });
        }

        const signoff = await prisma.jobSignoff.update({
            where: { jobId },
            data: {
                status: 'DISPUTED',
                disputeReason,
                disputedAt: new Date()
            }
        });

        // Optionally revert job status
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'IN_PROGRESS' }
        });

        res.json({ 
            message: 'Dispute submitted. An admin will review.',
            signoff 
        });
    } catch (error) {
        console.error('Dispute signoff error:', error);
        res.status(500).json({ message: 'Error submitting dispute' });
    }
};

// Admin resolves dispute
export const resolveDispute = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { resolution, resolutionNotes, finalStatus } = req.body;

        const jobId = parseInt(id, 10);
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { signoff: true }
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.signoff?.status !== 'DISPUTED') {
            return res.status(400).json({ message: 'No active dispute for this job' });
        }

        // Update signoff
        const signoff = await prisma.jobSignoff.update({
            where: { jobId },
            data: {
                status: resolution === 'approved' ? 'APPROVED' : 'PENDING',
                resolvedAt: new Date(),
                resolutionNotes
            }
        });

        // Update job status based on resolution
        await prisma.job.update({
            where: { id: jobId },
            data: { 
                status: finalStatus || (resolution === 'approved' ? 'COMPLETED' : 'IN_PROGRESS')
            }
        });

        res.json({ 
            message: 'Dispute resolved',
            signoff 
        });
    } catch (error) {
        console.error('Resolve dispute error:', error);
        res.status(500).json({ message: 'Error resolving dispute' });
    }
};

// Get signoff status for a job
export const getSignoffStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jobId = parseInt(id, 10);
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { 
                signoff: true,
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check access
        const isOwner = job.customerId === user.userId;
        const isAssigned = job.assignments.some(a => a.userId === user.userId);
        const isAdmin = user.role === 'ADMIN';

        if (!isOwner && !isAssigned && !isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            jobId: job.id,
            jobStatus: job.status,
            contractorSignedOff: job.contractorSignedOff,
            completedAt: job.completedAt,
            completionNotes: job.completionNotes,
            completionPhotos: job.completionPhotos,
            signoff: job.signoff,
            contractor: job.assignments[0]?.user
        });
    } catch (error) {
        console.error('Get signoff status error:', error);
        res.status(500).json({ message: 'Error fetching signoff status' });
    }
};

// Get all jobs pending signoff (for customer)
export const getPendingSignoffs = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jobs = await prisma.job.findMany({
            where: {
                customerId: user.userId,
                contractorSignedOff: true,
                signoff: {
                    status: 'PENDING'
                }
            },
            include: {
                signoff: true,
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                contractorProfile: {
                                    select: {
                                        rating: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { completedAt: 'desc' }
        });

        res.json(jobs);
    } catch (error) {
        console.error('Get pending signoffs error:', error);
        res.status(500).json({ message: 'Error fetching pending signoffs' });
    }
};

// Get all disputed jobs (for admin)
export const getDisputedJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.job.findMany({
            where: {
                signoff: {
                    status: 'DISPUTED'
                }
            },
            include: {
                signoff: true,
                customer: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(jobs);
    } catch (error) {
        console.error('Get disputed jobs error:', error);
        res.status(500).json({ message: 'Error fetching disputed jobs' });
    }
};

