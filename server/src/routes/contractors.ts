import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Import contractor from scraper (creates unverified listing in ScrapedContractor table)
router.post('/import', async (req, res) => {
  try {
    const {
      businessName,
      tradeName,
      tradeId,
      location,
      address,
      postcode,
      phone,
      mobile,
      email,
      website,
      logoUrl,
      description,
      services,
      certifications,
      yearsInBusiness,
      source,
    } = req.body;

    // Validate required fields
    if (!businessName || !location || !tradeId) {
      return res.status(400).json({
        error: 'Missing required fields: businessName, location, tradeId',
      });
    }

    // Generate slug from business name
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if contractor already exists (by business name + location)
    const existing = await prisma.scrapedContractor.findFirst({
      where: {
        businessName: { equals: businessName, mode: 'insensitive' },
        location: { equals: location, mode: 'insensitive' },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Contractor already exists',
        existingId: existing.id,
      });
    }

    // Create unique slug
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create the scraped contractor profile
    const contractor = await prisma.scrapedContractor.create({
      data: {
        businessName,
        slug,
        tradeName: tradeName || tradeId,
        tradeId,
        location,
        address,
        postcode,
        phone,
        mobile,
        email,
        website,
        logoUrl,
        bio: description,
        skills: services || [],
        certifications: certifications || [],
        yearsInBusiness: yearsInBusiness || null,
        source: source || 'gemini-scraper',
        isActive: true,
        isClaimed: false,
        rating: 0,
        reviewCount: 0,
      },
    });

    res.status(201).json({
      success: true,
      contractor: {
        id: contractor.id,
        businessName: contractor.businessName,
        slug: contractor.slug,
        location: contractor.location,
      },
    });
  } catch (error: any) {
    console.error('Error importing contractor:', error);
    res.status(500).json({
      error: 'Failed to import contractor',
      details: error.message,
    });
  }
});

// Bulk import contractors
router.post('/import/bulk', async (req, res) => {
  try {
    const { contractors } = req.body;

    if (!Array.isArray(contractors)) {
      return res.status(400).json({ error: 'contractors must be an array' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const contractor of contractors) {
      try {
        // Check for existing
        const existing = await prisma.scrapedContractor.findFirst({
          where: {
            businessName: { equals: contractor.businessName, mode: 'insensitive' },
            location: { equals: contractor.location, mode: 'insensitive' },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        const baseSlug = contractor.businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        await prisma.scrapedContractor.create({
          data: {
            businessName: contractor.businessName,
            slug: `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
            tradeName: contractor.tradeName || contractor.tradeId,
            tradeId: contractor.tradeId,
            location: contractor.location,
            address: contractor.address,
            postcode: contractor.postcode,
            phone: contractor.phone,
            mobile: contractor.mobile,
            email: contractor.email,
            website: contractor.website,
            logoUrl: contractor.logoUrl,
            bio: contractor.description,
            skills: contractor.services || [],
            certifications: contractor.certifications || [],
            yearsInBusiness: contractor.yearsInBusiness || null,
            source: contractor.source || 'gemini-scraper',
            isActive: true,
            isClaimed: false,
            rating: 0,
            reviewCount: 0,
          },
        });

        results.imported++;
      } catch (err: any) {
        results.errors.push(`${contractor.businessName}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('Error bulk importing contractors:', error);
    res.status(500).json({
      error: 'Failed to bulk import contractors',
      details: error.message,
    });
  }
});

// Get scraped contractors by location
router.get('/scraped/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { trade, page = '1', limit = '20' } = req.query;

    const where: any = {
      location: { contains: location, mode: 'insensitive' },
      isActive: true,
    };

    if (trade) {
      where.tradeId = trade;
    }

    const [contractors, total] = await Promise.all([
      prisma.scrapedContractor.findMany({
        where,
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: [
          { isClaimed: 'desc' }, // Show claimed (verified) first
          { rating: 'desc' },
        ],
      }),
      prisma.scrapedContractor.count({ where }),
    ]);

    res.json({
      contractors,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching scraped contractors by location:', error);
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

// Get all served locations from scraped contractors
router.get('/scraped/locations', async (req, res) => {
  try {
    const locations = await prisma.scrapedContractor.findMany({
      where: { isActive: true },
      select: { location: true },
      distinct: ['location'],
    });

    const locationCounts = await prisma.scrapedContractor.groupBy({
      by: ['location'],
      where: { isActive: true },
      _count: true,
    });

    res.json({
      locations: locations.map(l => l.location),
      counts: locationCounts.reduce((acc, l) => {
        acc[l.location] = l._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Claim a scraped contractor profile
router.post('/scraped/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const contractor = await prisma.scrapedContractor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    if (contractor.isClaimed) {
      return res.status(400).json({ error: 'This profile has already been claimed' });
    }

    // Update the scraped contractor as claimed
    const updated = await prisma.scrapedContractor.update({
      where: { id: parseInt(id) },
      data: {
        isClaimed: true,
        claimedByUserId: userId,
        claimedAt: new Date(),
      },
    });

    res.json({
      success: true,
      contractor: updated,
    });
  } catch (error: any) {
    console.error('Error claiming contractor:', error);
    res.status(500).json({ error: 'Failed to claim contractor' });
  }
});

// Get scraping stats
router.get('/scraped/stats', async (req, res) => {
  try {
    const [total, byTrade, byLocation, claimed] = await Promise.all([
      prisma.scrapedContractor.count({ where: { isActive: true } }),
      prisma.scrapedContractor.groupBy({
        by: ['tradeId'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.scrapedContractor.groupBy({
        by: ['location'],
        where: { isActive: true },
        _count: true,
        orderBy: { _count: { location: 'desc' } },
        take: 20,
      }),
      prisma.scrapedContractor.count({ where: { isClaimed: true } }),
    ]);

    res.json({
      total,
      claimed,
      unclaimed: total - claimed,
      byTrade: byTrade.map(t => ({ trade: t.tradeId, count: t._count })),
      topLocations: byLocation.map(l => ({ location: l.location, count: l._count })),
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get scraped contractor by slug
router.get('/scraped/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const contractor = await prisma.scrapedContractor.findUnique({
      where: { slug },
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    res.json(contractor);
  } catch (error: any) {
    console.error('Error fetching contractor by slug:', error);
    res.status(500).json({ error: 'Failed to fetch contractor' });
  }
});

// Helper function to extract domain from website URL
function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return domain.toLowerCase();
  } catch {
    return null;
  }
}

// Helper function to normalize phone number for comparison
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '').slice(-10); // Last 10 digits
}

// Smart upsert endpoint with multi-field deduplication
router.post('/import/upsert', async (req, res) => {
  try {
    const {
      businessName,
      tradeName,
      tradeId,
      location,
      address,
      postcode,
      phone,
      mobile,
      email,
      website,
      logoUrl,
      description,
      services,
      certifications,
      yearsInBusiness,
      source,
      // Google Places API fields
      googleMapsUrl,
      googleRating,
      googleReviewCount,
      businessStatus,
      photos,
      openingHours,
    } = req.body;

    // Validate required fields
    if (!businessName || !location || !tradeId) {
      return res.status(400).json({
        error: 'Missing required fields: businessName, location, tradeId',
      });
    }

    let existing = null;
    let matchedOn: string | null = null;

    // Priority 1: Match by phone number (most reliable)
    const normalizedPhone = normalizePhone(phone);
    const normalizedMobile = normalizePhone(mobile);
    if (normalizedPhone || normalizedMobile) {
      const phoneMatches = await prisma.scrapedContractor.findMany({
        where: {
          OR: [
            ...(normalizedPhone ? [{ phone: { contains: normalizedPhone.slice(-7) } }] : []),
            ...(normalizedMobile ? [{ mobile: { contains: normalizedMobile.slice(-7) } }] : []),
            ...(normalizedPhone ? [{ mobile: { contains: normalizedPhone.slice(-7) } }] : []),
            ...(normalizedMobile ? [{ phone: { contains: normalizedMobile.slice(-7) } }] : []),
          ],
        },
      });
      if (phoneMatches.length > 0) {
        existing = phoneMatches[0];
        matchedOn = 'phone';
      }
    }

    // Priority 2: Match by website domain
    if (!existing && website) {
      const domain = extractDomain(website);
      if (domain) {
        const websiteMatches = await prisma.scrapedContractor.findMany({
          where: {
            website: { contains: domain, mode: 'insensitive' },
          },
        });
        if (websiteMatches.length > 0) {
          existing = websiteMatches[0];
          matchedOn = 'website';
        }
      }
    }

    // Priority 3: Match by business name + location
    if (!existing) {
      existing = await prisma.scrapedContractor.findFirst({
        where: {
          businessName: { equals: businessName, mode: 'insensitive' },
          location: { equals: location, mode: 'insensitive' },
        },
      });
      if (existing) {
        matchedOn = 'name+location';
      }
    }

    // Prepare data for create/update
    const contractorData = {
      businessName,
      tradeName: tradeName || tradeId,
      tradeId,
      location,
      address: address || null,
      postcode: postcode || null,
      phone: phone || null,
      mobile: mobile || null,
      email: email || null,
      website: website || null,
      logoUrl: logoUrl || null,
      bio: description || null,
      skills: services || [],
      certifications: certifications || [],
      yearsInBusiness: yearsInBusiness || null,
      source: source || 'gemini-scraper',
      // Google Places API fields
      googleMapsUrl: googleMapsUrl || null,
      googleRating: googleRating || null,
      googleReviewCount: googleReviewCount || null,
      businessStatus: businessStatus || null,
      photos: photos || [],
      openingHours: openingHours || [],
    };

    let action: 'created' | 'updated' | 'skipped';
    let contractor;

    if (existing) {
      // Found existing - check if claimed
      if (existing.isClaimed) {
        // Don't overwrite claimed/verified profiles
        action = 'skipped';
        contractor = existing;
      } else {
        // Update the unclaimed profile with new data
        contractor = await prisma.scrapedContractor.update({
          where: { id: existing.id },
          data: {
            ...contractorData,
            scrapedAt: new Date(),
            lastVerifiedAt: new Date(),
          },
        });
        action = 'updated';
      }
    } else {
      // Create new contractor
      const baseSlug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      contractor = await prisma.scrapedContractor.create({
        data: {
          ...contractorData,
          slug,
          isActive: true,
          isClaimed: false,
          rating: 0,
          reviewCount: 0,
        },
      });
      action = 'created';
    }

    res.status(action === 'created' ? 201 : 200).json({
      success: true,
      action,
      matchedOn,
      contractor: {
        id: contractor.id,
        businessName: contractor.businessName,
        slug: contractor.slug,
        location: contractor.location,
      },
    });
  } catch (error: any) {
    console.error('Error upserting contractor:', error);
    res.status(500).json({
      error: 'Failed to upsert contractor',
      details: error.message,
    });
  }
});

// Bulk upsert contractors
router.post('/import/bulk-upsert', async (req, res) => {
  try {
    const { contractors } = req.body;

    if (!Array.isArray(contractors)) {
      return res.status(400).json({ error: 'contractors must be an array' });
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as { businessName: string; action: string; matchedOn: string | null }[],
    };

    for (const contractorInput of contractors) {
      try {
        const {
          businessName,
          tradeName,
          tradeId,
          location,
          address,
          postcode,
          phone,
          mobile,
          email,
          website,
          logoUrl,
          description,
          services,
          certifications,
          yearsInBusiness,
          source,
          googleMapsUrl,
          googleRating,
          googleReviewCount,
          businessStatus,
          photos,
          openingHours,
        } = contractorInput;

        if (!businessName || !location || !tradeId) {
          results.errors.push(`${businessName || 'Unknown'}: Missing required fields`);
          continue;
        }

        let existing = null;
        let matchedOn: string | null = null;

        // Priority 1: Match by phone
        const normalizedPhone = normalizePhone(phone);
        const normalizedMobile = normalizePhone(mobile);
        if (normalizedPhone || normalizedMobile) {
          const phoneMatches = await prisma.scrapedContractor.findMany({
            where: {
              OR: [
                ...(normalizedPhone ? [{ phone: { contains: normalizedPhone.slice(-7) } }] : []),
                ...(normalizedMobile ? [{ mobile: { contains: normalizedMobile.slice(-7) } }] : []),
              ],
            },
            take: 1,
          });
          if (phoneMatches.length > 0) {
            existing = phoneMatches[0];
            matchedOn = 'phone';
          }
        }

        // Priority 2: Match by website domain
        if (!existing && website) {
          const domain = extractDomain(website);
          if (domain) {
            const websiteMatches = await prisma.scrapedContractor.findMany({
              where: { website: { contains: domain, mode: 'insensitive' } },
              take: 1,
            });
            if (websiteMatches.length > 0) {
              existing = websiteMatches[0];
              matchedOn = 'website';
            }
          }
        }

        // Priority 3: Match by business name + location
        if (!existing) {
          existing = await prisma.scrapedContractor.findFirst({
            where: {
              businessName: { equals: businessName, mode: 'insensitive' },
              location: { equals: location, mode: 'insensitive' },
            },
          });
          if (existing) matchedOn = 'name+location';
        }

        const contractorData = {
          businessName,
          tradeName: tradeName || tradeId,
          tradeId,
          location,
          address: address || null,
          postcode: postcode || null,
          phone: phone || null,
          mobile: mobile || null,
          email: email || null,
          website: website || null,
          logoUrl: logoUrl || null,
          bio: description || null,
          skills: services || [],
          certifications: certifications || [],
          yearsInBusiness: yearsInBusiness || null,
          source: source || 'gemini-scraper',
          googleMapsUrl: googleMapsUrl || null,
          googleRating: googleRating || null,
          googleReviewCount: googleReviewCount || null,
          businessStatus: businessStatus || null,
          photos: photos || [],
          openingHours: openingHours || [],
        };

        if (existing) {
          if (existing.isClaimed) {
            results.skipped++;
            results.details.push({ businessName, action: 'skipped', matchedOn });
          } else {
            await prisma.scrapedContractor.update({
              where: { id: existing.id },
              data: { ...contractorData, scrapedAt: new Date(), lastVerifiedAt: new Date() },
            });
            results.updated++;
            results.details.push({ businessName, action: 'updated', matchedOn });
          }
        } else {
          const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
          
          await prisma.scrapedContractor.create({
            data: {
              ...contractorData,
              slug,
              isActive: true,
              isClaimed: false,
              rating: 0,
              reviewCount: 0,
            },
          });
          results.created++;
          results.details.push({ businessName, action: 'created', matchedOn: null });
        }
      } catch (err: any) {
        results.errors.push(`${contractorInput.businessName || 'Unknown'}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      summary: {
        total: contractors.length,
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length,
      },
      details: results.details,
      errors: results.errors,
    });
  } catch (error: any) {
    console.error('Error bulk upserting contractors:', error);
    res.status(500).json({
      error: 'Failed to bulk upsert contractors',
      details: error.message,
    });
  }
});

export default router;

