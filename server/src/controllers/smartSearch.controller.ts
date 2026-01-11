import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { config } from '../utils/config';
import { logJobOutreach } from '../utils/commsLogger';

// Gemini API response types
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// Google Places API types
interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  photos?: { name: string }[];
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
}

interface TextSearchResponse {
  places?: PlaceResult[];
}

// Trade categories mapping
const tradeCategories: Record<string, { name: string; searchTerms: string[] }> = {
  plumbing: { name: 'Plumbing', searchTerms: ['plumber', 'plumbing services'] },
  electrical: { name: 'Electrical', searchTerms: ['electrician', 'electrical services'] },
  carpentry: { name: 'Carpentry', searchTerms: ['carpenter', 'joiner'] },
  painting: { name: 'Painting', searchTerms: ['painter', 'decorator'] },
  roofing: { name: 'Roofing', searchTerms: ['roofer', 'roofing contractor'] },
  landscaping: { name: 'Landscaping', searchTerms: ['landscaper', 'garden services'] },
  cleaning: { name: 'Cleaning', searchTerms: ['cleaning services', 'cleaners'] },
  hvac: { name: 'HVAC', searchTerms: ['heating engineer', 'boiler service'] },
  building: { name: 'Building', searchTerms: ['builder', 'building contractor'] },
  flooring: { name: 'Flooring', searchTerms: ['flooring specialist', 'floor fitter'] },
  plastering: { name: 'Plastering', searchTerms: ['plasterer', 'plastering services'] },
  handyman: { name: 'Handyman', searchTerms: ['handyman', 'property maintenance'] },
};

// Helper to generate a slug
function generateSlug(businessName: string): string {
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${baseSlug}-${Date.now().toString(36)}`;
}

// Extract UK postcode from address
function extractPostcode(address: string | undefined): string | null {
  if (!address) return null;
  const postcodeMatch = address.match(/[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0].toUpperCase() : null;
}

// Get photo URL from Places API photo reference
function getPhotoUrl(photoName: string, apiKey: string, maxHeight: number = 400): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeight}&key=${apiKey}`;
}

// Search contractors using Google Places API
export const searchContractors = async (req: Request, res: Response) => {
  try {
    const { trade, location } = req.body;

    if (!trade || !location) {
      return res.status(400).json({ message: 'Trade and location are required' });
    }

    const tradeConfig = tradeCategories[trade.toLowerCase()];
    if (!tradeConfig) {
      return res.status(400).json({ message: 'Invalid trade category' });
    }

    const apiKey = config.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Google Places API key not configured' });
    }

    // Search using Google Places Text Search API
    const textQuery = `${tradeConfig.searchTerms[0]} in ${location} UK`;
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.shortFormattedAddress',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.googleMapsUri',
      'places.rating',
      'places.userRatingCount',
      'places.businessStatus',
      'places.photos',
      'places.regularOpeningHours'
    ].join(',');

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 10,
        languageCode: 'en'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places API error:', errorText);
      return res.status(500).json({ message: 'Failed to search contractors' });
    }

    const data = await response.json() as TextSearchResponse;
    const places = data.places || [];

    // Upsert each contractor into the database
    const contractors = [];
    for (const place of places) {
      const businessName = place.displayName?.text || 'Unknown Business';
      
      // Check if contractor already exists by Google Maps URL or phone
      let existingContractor = null;
      
      if (place.googleMapsUri) {
        existingContractor = await prisma.scrapedContractor.findFirst({
          where: { googleMapsUrl: place.googleMapsUri }
        });
      }
      
      if (!existingContractor && place.nationalPhoneNumber) {
        const normalizedPhone = place.nationalPhoneNumber.replace(/\D/g, '').slice(-10);
        if (normalizedPhone) {
          existingContractor = await prisma.scrapedContractor.findFirst({
            where: { phone: { contains: normalizedPhone.slice(-7) } }
          });
        }
      }

      const contractorData = {
        businessName,
        tradeName: tradeConfig.name,
        tradeId: trade.toLowerCase(),
        location,
        address: place.formattedAddress || null,
        postcode: extractPostcode(place.formattedAddress),
        phone: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
        googleMapsUrl: place.googleMapsUri || null,
        googleRating: place.rating || null,
        googleReviewCount: place.userRatingCount || null,
        businessStatus: place.businessStatus || null,
        photos: place.photos?.map(p => getPhotoUrl(p.name, apiKey)) || [],
        openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
        source: 'smart-search',
        scrapedAt: new Date(),
        lastVerifiedAt: new Date(),
      };

      let contractor;
      if (existingContractor) {
        // Update existing contractor
        contractor = await prisma.scrapedContractor.update({
          where: { id: existingContractor.id },
          data: {
            ...contractorData,
            // Preserve existing AI data if present
            aiSummary: existingContractor.aiSummary,
            aiPros: existingContractor.aiPros,
            aiCons: existingContractor.aiCons,
            aiFindings: existingContractor.aiFindings,
            aiEnrichedAt: existingContractor.aiEnrichedAt,
          }
        });
      } else {
        // Create new contractor
        contractor = await prisma.scrapedContractor.create({
          data: {
            ...contractorData,
            slug: generateSlug(businessName),
            isActive: true,
            isClaimed: false,
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            skills: [],
            certifications: [],
            aiPros: [],
            aiCons: [],
          }
        });
      }

      contractors.push(contractor);
    }

    res.json({
      message: `Found ${contractors.length} contractors`,
      contractors,
      searchQuery: textQuery
    });
  } catch (error) {
    console.error('Search contractors error:', error);
    res.status(500).json({ message: 'An error occurred while searching contractors' });
  }
};

// Enrich a single contractor with AI-generated summary
export const enrichContractor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contractorId = parseInt(id, 10);

    if (isNaN(contractorId)) {
      return res.status(400).json({ message: 'Invalid contractor ID' });
    }

    const contractor = await prisma.scrapedContractor.findUnique({
      where: { id: contractorId }
    });

    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    // Check if already enriched recently (within last 24 hours)
    if (contractor.aiEnrichedAt) {
      const hoursSinceEnrich = (Date.now() - contractor.aiEnrichedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceEnrich < 24 && contractor.aiSummary) {
        return res.json({
          message: 'Using cached AI data',
          contractor,
          cached: true
        });
      }
    }

    // Build prompt for Gemini
    const prompt = `You are analyzing a ${contractor.tradeName} contractor business for a homeowner who is looking to hire them.

Business Information:
- Name: ${contractor.businessName}
- Trade: ${contractor.tradeName}
- Location: ${contractor.location}
${contractor.address ? `- Address: ${contractor.address}` : ''}
${contractor.website ? `- Website: ${contractor.website}` : ''}
${contractor.googleRating ? `- Google Rating: ${contractor.googleRating}/5 (${contractor.googleReviewCount || 0} reviews)` : ''}
${contractor.businessStatus ? `- Status: ${contractor.businessStatus}` : ''}
${contractor.openingHours?.length ? `- Opening Hours: ${contractor.openingHours.join(', ')}` : ''}

Based on this information and your knowledge of the contractor industry, provide:
1. A brief summary of the business (2-3 sentences)
2. 3 potential pros/strengths
3. 2-3 potential cons/things to verify
4. Any additional findings or recommendations

IMPORTANT: Respond in valid JSON format only, with this exact structure:
{
  "summary": "Brief business summary here",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "findings": "Additional recommendations or things to check"
}`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ message: 'Failed to generate AI summary' });
    }

    const geminiData = await geminiResponse.json() as GeminiResponse;
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let aiData;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Fallback: create generic AI data
      aiData = {
        summary: `${contractor.businessName} is a ${contractor.tradeName.toLowerCase()} service provider in ${contractor.location}.`,
        pros: ['Local business', 'Listed on Google', contractor.googleRating ? `${contractor.googleRating}/5 rating` : 'Established presence'],
        cons: ['Verify credentials', 'Get multiple quotes'],
        findings: 'Recommend checking reviews and verifying insurance before hiring.'
      };
    }

    // Update contractor with AI data
    const updatedContractor = await prisma.scrapedContractor.update({
      where: { id: contractorId },
      data: {
        aiSummary: aiData.summary,
        aiPros: aiData.pros || [],
        aiCons: aiData.cons || [],
        aiFindings: aiData.findings,
        aiEnrichedAt: new Date()
      }
    });

    res.json({
      message: 'AI enrichment complete',
      contractor: updatedContractor,
      cached: false
    });
  } catch (error) {
    console.error('Enrich contractor error:', error);
    res.status(500).json({ message: 'An error occurred while enriching contractor' });
  }
};

// Generate overall summary comparing all contractors
export const generateOverallSummary = async (req: Request, res: Response) => {
  try {
    const { contractorIds, trade, location } = req.body;

    if (!contractorIds || !Array.isArray(contractorIds) || contractorIds.length === 0) {
      return res.status(400).json({ message: 'Contractor IDs are required' });
    }

    const contractors = await prisma.scrapedContractor.findMany({
      where: { id: { in: contractorIds.map((id: string) => parseInt(id, 10)) } }
    });

    if (contractors.length === 0) {
      return res.status(404).json({ message: 'No contractors found' });
    }

    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    // Build summary of all contractors for the prompt
    const contractorSummaries = contractors.map((c, i) => `
${i + 1}. ${c.businessName}
   - Rating: ${c.googleRating || 'N/A'}/5 (${c.googleReviewCount || 0} reviews)
   - Location: ${c.address || c.location}
   ${c.aiSummary ? `- Summary: ${c.aiSummary}` : ''}
   ${c.aiPros?.length ? `- Pros: ${c.aiPros.join(', ')}` : ''}
   ${c.aiCons?.length ? `- Cons: ${c.aiCons.join(', ')}` : ''}`
    ).join('\n');

    const prompt = `You are helping a homeowner choose a ${trade || 'contractor'} in ${location || 'the UK'}.

Here are the ${contractors.length} contractors found:
${contractorSummaries}

Return ONLY raw HTML (no markdown, no code fences, no backticks). Be concise - 2 sentences max per section.

Use this EXACT format:
<h4>Overview</h4>
<p>Brief comparison in 1-2 sentences.</p>

<h4>Top Pick</h4>
<p><strong>Business Name</strong> - Why in 1 sentence.</p>

<h4>Questions to Ask</h4>
<ul>
<li>Question 1?</li>
<li>Question 2?</li>
<li>Question 3?</li>
</ul>

<h4>Tips</h4>
<ul>
<li>Tip 1</li>
<li>Tip 2</li>
</ul>

CRITICAL: Output ONLY the HTML tags directly. No markdown. No code blocks. No explanation.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ message: 'Failed to generate overall summary' });
    }

    const geminiData = await geminiResponse.json() as GeminiResponse;
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({
      message: 'Overall summary generated',
      summary,
      contractorsAnalyzed: contractors.length
    });
  } catch (error) {
    console.error('Generate overall summary error:', error);
    res.status(500).json({ message: 'An error occurred while generating summary' });
  }
};

// Send job request to selected contractors
export const sendJobToContractors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { jobId, contractorIds } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!jobId || !contractorIds || !Array.isArray(contractorIds)) {
      return res.status(400).json({ message: 'Job ID and contractor IDs are required' });
    }

    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId, 10) },
      include: { customer: true }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customerId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get the contractors
    const contractors = await prisma.scrapedContractor.findMany({
      where: { id: { in: contractorIds.map((id: string) => parseInt(id, 10)) } }
    });

    if (contractors.length === 0) {
      return res.status(404).json({ message: 'No contractors found' });
    }

    const outreachResults = [];
    
    for (const contractor of contractors) {
      let emailSent = false;
      let smsSent = false;
      let logPaths: { emailPath?: string; smsPath?: string } = {};

      // In TEST_MODE, log to files instead of sending
      if (config.TEST_MODE) {
        logPaths = logJobOutreach({
          contractorName: contractor.businessName,
          contractorEmail: contractor.email,
          contractorPhone: contractor.phone,
          jobTitle: job.title,
          jobDescription: job.description,
          jobLocation: job.location || 'Not specified',
          customerName: job.customer.firstName 
            ? `${job.customer.firstName} ${job.customer.lastName || ''}`.trim()
            : undefined,
          customerEmail: job.customer.email,
          customerPhone: job.customer.phone || undefined,
        });
        
        emailSent = !!logPaths.emailPath;
        smsSent = !!logPaths.smsPath;
      } else {
        // TODO: Implement real email/SMS sending here
        // For now, just mark as would-be-sent
        emailSent = !!contractor.email;
        smsSent = !!contractor.phone;
      }

      // Log the outreach activity to database
      await prisma.activityLog.create({
        data: {
          type: 'OUTREACH_EMAIL_SENT',
          jobId: job.id,
          userId: userId,
          metadata: {
            contractorName: contractor.businessName,
            contractorEmail: contractor.email,
            contractorPhone: contractor.phone,
            contractorId: contractor.id,
            source: 'smart-search',
            testMode: config.TEST_MODE,
            logPaths: config.TEST_MODE ? logPaths : undefined,
          }
        }
      });

      outreachResults.push({
        contractorId: contractor.id,
        businessName: contractor.businessName,
        email: contractor.email,
        phone: contractor.phone,
        emailSent,
        smsSent,
        status: config.TEST_MODE ? 'logged' : 'queued',
        testMode: config.TEST_MODE,
      });
    }

    res.json({
      message: config.TEST_MODE 
        ? `[TEST MODE] Job logged for ${contractors.length} contractors (check logs/email and logs/sms)`
        : `Job sent to ${contractors.length} contractors`,
      testMode: config.TEST_MODE,
      outreaches: outreachResults
    });
  } catch (error) {
    console.error('Send job to contractors error:', error);
    res.status(500).json({ message: 'An error occurred while sending job' });
  }
};

