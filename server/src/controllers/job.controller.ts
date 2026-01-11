import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createJobSchema, placeBidSchema, assignJobSchema, validate } from '../utils/validation';

// Create a new job
export const createJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Validate input
    const validation = validate(createJobSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const { title, description, budget, location, latitude, longitude } = validation.data;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        budget,
        location,
        latitude,
        longitude,
        customerId: userId,
        status: 'OPEN'
      }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'An error occurred while creating the job' });
  }
};

// Get all jobs (with role-based filtering)
export const getJobs = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let where: any = {};

    // Role-based filtering
    if (user.role === 'CUST_RESIDENTIAL' || user.role === 'CUST_COMMERCIAL') {
      // Customers only see their own jobs
      where.customerId = user.userId;
    } else if (user.role === 'SUBCONTRACTOR') {
      // Contractors see OPEN jobs or jobs assigned to them
      where = {
        OR: [
          { status: 'OPEN' },
          { assignments: { some: { userId: user.userId } } }
        ]
      };
    }
    // ADMIN sees all jobs - no filter needed
    
    // Optional status filter
    if (status && typeof status === 'string') {
      if (where.OR) {
        // For contractors, apply status within the OR conditions
        where = {
          AND: [
            where,
            { status }
          ]
        };
      } else {
        where.status = status;
      }
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: { 
          select: { 
            id: true,
            email: true, 
            customerProfile: {
              select: {
                address: true,
                type: true
              }
            }
          } 
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        _count: { select: { bids: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'An error occurred while fetching jobs' });
  }
};

// Get single job details
export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jobId = parseInt(id, 10);
    if (isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: { 
          select: { 
            id: true,
            email: true, 
            customerProfile: true 
          } 
        },
        assignments: { 
          include: { 
            user: { 
              select: { 
                id: true,
                email: true, 
                contractorProfile: true 
              } 
            } 
          } 
        },
        bids: { 
          include: { 
            contractor: { 
              select: { 
                id: true,
                email: true, 
                contractorProfile: true 
              } 
            } 
          } 
        },
        timesheets: true
      }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Authorization check: only allow access if user is admin, the customer who posted it,
    // or a contractor who is assigned or has bid on it
    const isAdmin = user.role === 'ADMIN';
    const isOwner = job.customerId === user.userId;
    const isAssigned = job.assignments.some(a => a.userId === user.userId);
    const hasBid = job.bids.some(b => b.contractorId === user.userId);

    if (!isAdmin && !isOwner && !isAssigned && !hasBid) {
      return res.status(403).json({ message: 'You do not have permission to view this job' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ message: 'An error occurred while fetching the job' });
  }
};

// Place a bid
export const placeBid = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jobId = parseInt(id, 10);
    if (isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    // Validate input
    const validation = validate(placeBidSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const { amount, notes } = validation.data;

    // Check if job exists and is OPEN
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.status !== 'OPEN') {
      return res.status(400).json({ message: 'This job is no longer accepting bids' });
    }

    // Check if contractor already bid on this job
    const existingBid = await prisma.bid.findFirst({
      where: { jobId, contractorId: userId }
    });
    if (existingBid) {
      return res.status(409).json({ message: 'You have already placed a bid on this job' });
    }

    const bid = await prisma.bid.create({
      data: {
        jobId,
        contractorId: userId,
        amount,
        notes
      }
    });

    res.status(201).json(bid);
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ message: 'An error occurred while placing your bid' });
  }
};

// Assign job to contractor
export const assignJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const jobId = parseInt(id, 10);
    if (isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    // Validate input
    const validation = validate(assignJobSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const { contractorId } = validation.data;

    // Check if job exists and is OPEN
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.status !== 'OPEN') {
      return res.status(400).json({ message: 'This job has already been assigned' });
    }

    // Check if contractor exists and is a valid contractor
    const contractor = await prisma.user.findUnique({ 
      where: { id: contractorId },
      include: { contractorProfile: true }
    });
    if (!contractor || contractor.role !== 'SUBCONTRACTOR') {
      return res.status(400).json({ message: 'Invalid contractor' });
    }

    // Transaction to update status and create assignment
    const [updatedJob, assignment] = await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: { status: 'ASSIGNED' }
      }),
      prisma.assignment.create({
        data: {
          jobId,
          userId: contractorId
        }
      })
    ]);

    res.json({ 
      message: 'Job assigned successfully',
      job: updatedJob, 
      assignment 
    });
  } catch (error) {
    console.error('Assign job error:', error);
    res.status(500).json({ message: 'An error occurred while assigning the job' });
  }
};

// Schedule a job (set date/time)
export const scheduleJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { scheduledDate } = req.body;

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

    // Check permission: admin or assigned contractor
    const isAdmin = user.role === 'ADMIN';
    const isAssigned = job.assignments.some(a => a.userId === user.userId);

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If contractor is scheduling, check booking deadline
    if (!isAdmin && job.bookingDeadline && new Date() > job.bookingDeadline) {
      return res.status(400).json({ message: 'Booking deadline has passed' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        scheduledDate: new Date(scheduledDate),
        status: 'SCHEDULED'
      }
    });

    res.json(updatedJob);
  } catch (error) {
    console.error('Schedule job error:', error);
    res.status(500).json({ message: 'Error scheduling job' });
  }
};

// Admin creates quote for commercial job
export const createQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quoteAmount, quoteNotes, contractorPayType, contractorPayRate, unlockFee } = req.body;

    const jobId = parseInt(id, 10);
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        quoteAmount: quoteAmount ? parseFloat(quoteAmount) : undefined,
        quoteNotes,
        contractorPayType,
        contractorPayRate: contractorPayRate ? parseFloat(contractorPayRate) : undefined,
        unlockFee: unlockFee ? parseFloat(unlockFee) : undefined,
        status: 'PENDING_QUOTE'
      }
    });

    // TODO: Send notification to customer about new quote

    res.json(updatedJob);
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ message: 'Error creating quote' });
  }
};

// Customer accepts quote
export const acceptQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jobId = parseInt(id, 10);
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Must be the customer who owns this job
    if (job.customerId !== user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (job.status !== 'PENDING_QUOTE') {
      return res.status(400).json({ message: 'Job is not awaiting quote acceptance' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        quoteAccepted: true,
        status: 'OPEN' // Now available for assignment
      }
    });

    res.json(updatedJob);
  } catch (error) {
    console.error('Accept quote error:', error);
    res.status(500).json({ message: 'Error accepting quote' });
  }
};

// Contractor unlocks job details (pays to see contact info)
export const unlockJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jobId = parseInt(id, 10);
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has active subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.userId }
    });

    const hasActiveSubscription = subscription && subscription.active && subscription.endDate > new Date();

    // Check if already unlocked
    const existingUnlock = await prisma.jobUnlock.findUnique({
      where: {
        jobId_contractorId: {
          jobId,
          contractorId: user.userId
        }
      }
    });

    if (existingUnlock) {
      return res.status(400).json({ message: 'Job already unlocked' });
    }

    // Subscribers unlock for free, others pay the unlock fee
    const paidAmount = hasActiveSubscription ? 0 : (job.unlockFee ? Number(job.unlockFee) : 0);

    // Create unlock record
    const unlock = await prisma.jobUnlock.create({
      data: {
        jobId,
        contractorId: user.userId,
        paidAmount
      }
    });

    // Return full job details including customer contact
    const fullJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            customerProfile: true
          }
        }
      }
    });

    res.json({ unlock, job: fullJob });
  } catch (error) {
    console.error('Unlock job error:', error);
    res.status(500).json({ message: 'Error unlocking job' });
  }
};

// Accept a bid (customer or admin)
export const acceptBid = async (req: Request, res: Response) => {
  try {
    const { id, bidId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jobId = parseInt(id, 10);
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Must be admin or job owner
    if (user.role !== 'ADMIN' && job.customerId !== user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bid = await prisma.bid.findUnique({
      where: { id: parseInt(bidId, 10) }
    });

    if (!bid || bid.jobId !== jobId) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Calculate booking deadline (3 days from now)
    const bookingDeadline = new Date();
    bookingDeadline.setDate(bookingDeadline.getDate() + 3);

    // Transaction: mark bid as accepted, create assignment, update job status
    const [updatedBid, assignment, updatedJob] = await prisma.$transaction([
      prisma.bid.update({
        where: { id: bid.id },
        data: { accepted: true }
      }),
      prisma.assignment.create({
        data: {
          jobId,
          userId: bid.contractorId
        }
      }),
      prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'ASSIGNED',
          bookingDeadline,
          contractorPayType: 'FIXED',
          contractorPayRate: bid.amount
        }
      })
    ]);

    // TODO: Send notification to contractor

    res.json({
      message: 'Bid accepted',
      bid: updatedBid,
      assignment,
      job: updatedJob
    });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ message: 'Error accepting bid' });
  }
};

// Update job status
export const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

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

    // Check permission
    const isAdmin = user.role === 'ADMIN';
    const isAssigned = job.assignments.some(a => a.userId === user.userId);

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status }
    });

    res.json(updatedJob);
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Error updating job status' });
  }
};
