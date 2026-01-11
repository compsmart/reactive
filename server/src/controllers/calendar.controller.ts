import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Get user's weekly availability schedule
export const getAvailability = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const availability = await prisma.availability.findMany({
            where: { userId: Number(id) },
            orderBy: { dayOfWeek: 'asc' }
        });
        res.json(availability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching availability' });
    }
};

// Set user's weekly availability (bulk upsert)
export const setAvailability = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const { role, userId: requesterId } = req.user;
        
        // Only allow user to edit their own or admin to edit anyone
        if (role !== 'ADMIN' && requesterId !== Number(id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { schedule } = req.body; // Array of { dayOfWeek, startTime, endTime, isActive }

        // Delete existing and recreate
        await prisma.availability.deleteMany({ where: { userId: Number(id) } });

        const created = await prisma.availability.createMany({
            data: schedule.map((s: any) => ({
                userId: Number(id),
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                isActive: s.isActive ?? true
            }))
        });

        res.json({ message: 'Availability updated', count: created.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error setting availability' });
    }
};

// Get user's time blocks
export const getTimeBlocks = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { from, to } = req.query;

        const where: any = { userId: Number(id) };
        
        if (from && to) {
            where.OR = [
                { startDate: { gte: new Date(from as string), lte: new Date(to as string) } },
                { endDate: { gte: new Date(from as string), lte: new Date(to as string) } }
            ];
        }

        const timeBlocks = await prisma.timeBlock.findMany({
            where,
            orderBy: { startDate: 'asc' }
        });

        res.json(timeBlocks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching time blocks' });
    }
};

// Add a time block
export const addTimeBlock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const { role, userId: requesterId } = req.user;

        if (role !== 'ADMIN' && requesterId !== Number(id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { startDate, endDate, reason, notes } = req.body;

        const timeBlock = await prisma.timeBlock.create({
            data: {
                userId: Number(id),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                notes
            }
        });

        res.status(201).json(timeBlock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating time block' });
    }
};

// Delete a time block
export const deleteTimeBlock = async (req: Request, res: Response) => {
    try {
        const { blockId } = req.params;
        // @ts-ignore
        const { role, userId } = req.user;

        const block = await prisma.timeBlock.findUnique({ where: { id: Number(blockId) } });
        
        if (!block) return res.status(404).json({ message: 'Time block not found' });

        if (role !== 'ADMIN' && block.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await prisma.timeBlock.delete({ where: { id: Number(blockId) } });
        res.json({ message: 'Time block deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting time block' });
    }
};

// Get full calendar view
export const getUserCalendar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { from, to } = req.query;

        const [availability, timeBlocks, scheduledJobs] = await Promise.all([
            prisma.availability.findMany({
                where: { userId: Number(id) },
                orderBy: { dayOfWeek: 'asc' }
            }),
            prisma.timeBlock.findMany({
                where: {
                    userId: Number(id),
                    ...(from && to ? {
                        OR: [
                            { startDate: { gte: new Date(from as string), lte: new Date(to as string) } },
                            { endDate: { gte: new Date(from as string), lte: new Date(to as string) } }
                        ]
                    } : {})
                },
                orderBy: { startDate: 'asc' }
            }),
            prisma.assignment.findMany({
                where: {
                    userId: Number(id),
                    job: {
                        scheduledDate: from && to ? {
                            gte: new Date(from as string),
                            lte: new Date(to as string)
                        } : { not: null }
                    }
                },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            scheduledDate: true,
                            location: true,
                            status: true
                        }
                    }
                }
            })
        ]);

        res.json({
            availability,
            timeBlocks,
            scheduledJobs: scheduledJobs.map(a => a.job)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching calendar' });
    }
};

