import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Get current user's subscription
export const getMySubscription = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: user.userId }
        });

        if (!subscription) {
            return res.json({ hasSubscription: false });
        }

        const isActive = subscription.active && subscription.endDate > new Date();

        res.json({
            hasSubscription: isActive,
            subscription: {
                ...subscription,
                isActive
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching subscription' });
    }
};

// Create or renew subscription
export const createSubscription = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { type } = req.body; // MONTHLY or ANNUAL

        // Calculate end date
        const endDate = new Date();
        if (type === 'ANNUAL') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Upsert subscription
        const subscription = await prisma.subscription.upsert({
            where: { userId: user.userId },
            update: {
                type,
                startDate: new Date(),
                endDate,
                active: true
            },
            create: {
                userId: user.userId,
                type,
                startDate: new Date(),
                endDate,
                active: true
            }
        });

        // TODO: Integrate payment processing here

        res.status(201).json(subscription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating subscription' });
    }
};

// Cancel subscription
export const cancelSubscription = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: user.userId }
        });

        if (!subscription) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        await prisma.subscription.update({
            where: { userId: user.userId },
            data: { active: false }
        });

        res.json({ message: 'Subscription cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cancelling subscription' });
    }
};

