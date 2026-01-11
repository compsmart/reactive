import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = parseInt(id, 10);

        // Admin can see any user, others can only see themselves
        if (user.role !== 'ADMIN' && user.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const foundUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                contractorProfile: {
                    select: {
                        id: true,
                        skills: true,
                        hourlyRate: true,
                        rating: true,
                        isVerified: true,
                        bio: true,
                        latitude: true,
                        longitude: true,
                        phone: true,
                        mobile: true,
                        businessName: true,
                        website: true,
                        yearsInBusiness: true,
                        certifications: true,
                        postcode: true,
                        travelRadius: true,
                        serviceAreas: true,
                    }
                },
                customerProfile: true
            }
        });

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(foundUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { firstName, lastName, phone, mobile, contractorProfile } = req.body;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = parseInt(id, 10);

        // Admin can edit any user, others can only edit themselves
        if (user.role !== 'ADMIN' && user.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update basic user info
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phone
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                contractorProfile: {
                    select: {
                        id: true,
                        skills: true,
                        hourlyRate: true,
                        rating: true,
                        isVerified: true,
                        bio: true,
                        phone: true,
                        mobile: true,
                    }
                }
            }
        });

        // If contractor profile data provided, update it
        if (contractorProfile && (updatedUser.role === 'SUBCONTRACTOR' || updatedUser.role === 'EMPLOYEE')) {
            const { skills, hourlyRate, bio, latitude, longitude } = contractorProfile;
            
            await prisma.contractorProfile.upsert({
                where: { userId },
                update: {
                    ...(skills !== undefined && { skills }),
                    ...(hourlyRate !== undefined && { hourlyRate }),
                    ...(bio !== undefined && { bio }),
                    ...(latitude !== undefined && { latitude }),
                    ...(longitude !== undefined && { longitude }),
                    ...(mobile !== undefined && { mobile })
                },
                create: {
                    userId,
                    skills: skills || [],
                    hourlyRate,
                    bio,
                    latitude,
                    longitude,
                    mobile
                }
            });

            // Fetch updated user with profile
            const userWithProfile = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    contractorProfile: {
                        select: {
                            id: true,
                            skills: true,
                            hourlyRate: true,
                            rating: true,
                            isVerified: true,
                            bio: true,
                            phone: true,
                            mobile: true,
                        }
                    }
                }
            });

            return res.json(userWithProfile);
        }

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user' });
    }
};

// Get contractor's earnings summary
export const getUserEarnings = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = parseInt(id, 10);

        // Admin can see any user's earnings, others can only see their own
        if (user.role !== 'ADMIN' && user.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get payments for this contractor
        const payments = await prisma.payment.findMany({
            where: { 
                userId,
                type: 'JOB_PAYMENT'
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate summary
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const totalEarnings = payments
            .filter(p => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + Number(p.amount), 0);
            
        const thisMonthEarnings = payments
            .filter(p => p.status === 'COMPLETED' && new Date(p.createdAt) >= startOfMonth)
            .reduce((sum, p) => sum + Number(p.amount), 0);
            
        const pendingEarnings = payments
            .filter(p => p.status === 'PENDING')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        // Also get completed jobs that may not have payment records yet
        const completedJobs = await prisma.job.findMany({
            where: {
                assignments: {
                    some: { userId }
                },
                status: 'COMPLETED'
            },
            select: {
                id: true,
                title: true,
                contractorPayRate: true,
                contractorPayType: true,
                completedAt: true
            },
            orderBy: { completedAt: 'desc' }
        });

        res.json({
            summary: {
                totalEarnings,
                thisMonthEarnings,
                pendingEarnings,
                completedJobsCount: completedJobs.length
            },
            payments,
            completedJobs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching earnings' });
    }
};

// Get contractor's job history
export const getUserJobs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = parseInt(id, 10);

        // Admin can see any user's jobs, others can only see their own
        if (user.role !== 'ADMIN' && user.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get jobs assigned to this contractor
        const assignments = await prisma.assignment.findMany({
            where: { userId },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        scheduledDate: true,
                        createdAt: true,
                        location: true,
                        customer: {
                            select: {
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                assignedAt: 'desc'
            }
        });

        const jobs = assignments.map(a => a.job);
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user jobs' });
    }
};

