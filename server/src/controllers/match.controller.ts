import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Calculate distance between two points in km (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const getMatchesForJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { maxDistance, limit } = req.query;

    const jobId = parseInt(id, 10);
    if (isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.latitude || !job.longitude) {
      return res.status(400).json({ 
        message: 'Job does not have a valid location. Please add coordinates to find matches.' 
      });
    }

    // Fetch all active contractors with their profiles
    const contractors = await prisma.user.findMany({
      where: {
        role: 'SUBCONTRACTOR',
        status: 'ACTIVE',
        contractorProfile: {
          isNot: null
        }
      },
      include: {
        contractorProfile: true
      }
    });

    // Calculate distances and filter
    const maxDistanceKm = maxDistance ? parseFloat(maxDistance as string) : 100;
    const resultLimit = limit ? parseInt(limit as string, 10) : 50;

    const matches = contractors
      .map(contractor => {
        const profile = contractor.contractorProfile;
        if (!profile?.latitude || !profile?.longitude) return null;

        const distance = getDistanceFromLatLonInKm(
          job.latitude!,
          job.longitude!,
          profile.latitude,
          profile.longitude
        );

        // Filter by max distance
        if (distance > maxDistanceKm) return null;

        return {
          id: contractor.id,
          email: contractor.email,
          contractorProfile: {
            skills: profile.skills,
            hourlyRate: profile.hourlyRate,
            rating: profile.rating,
            isVerified: profile.isVerified
          },
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, resultLimit);

    res.json({
      job: {
        id: job.id,
        title: job.title,
        location: job.location
      },
      matches,
      totalFound: matches.length
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'An error occurred while finding matches' });
  }
};
