/**
 * Contractor Scraper
 * 
 * Scrapes contractor information using Google Places API (default) or Gemini AI.
 * Imports directly into the PostgreSQL database.
 * 
 * Features:
 * - Direct database storage (no JSON files)
 * - Job-based progress tracking for safe stop/resume
 * - Deduplication by phone, website, or name+location
 * - Google Places API for bulk discovery
 * - Optional Gemini AI mode for detailed results
 */

import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });
console.log(`📁 Loaded env from: ${path.join(__dirname, '..', '.env')}`);

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration
const config = {
  apiKey: process.env.GEMINI_API_KEY || '',
  googlePlacesApiKey: process.env.GOOGLE_CLOUD_API_KEY || '',
  rateLimit: parseInt(process.env.RATE_LIMIT || '10'),
  placesRateLimit: parseInt(process.env.PLACES_RATE_LIMIT || '30'),
  businessesPerSearch: parseInt(process.env.BUSINESSES_PER_SEARCH || '5'),
};

// UK Locations
const ukLocations = [
  'London', 'Manchester', 'Birmingham', 'Glasgow', 'Southampton', 'Liverpool',
  'Newcastle upon Tyne', 'Nottingham', 'Sheffield', 'Bristol', 'Belfast', 'Brighton',
  'Leicester', 'Edinburgh', 'Bournemouth', 'Leeds', 'Cardiff', 'Coventry',
  'Middlesbrough', 'Stoke-on-Trent', 'Bradford', 'Reading', 'Sunderland', 'Preston',
  'Birkenhead', 'Kingston upon Hull', 'Newport', 'Swansea', 'Islington', 'Southend-on-Sea',
  'Derby', 'Luton', 'Portsmouth', 'City of Westminster', 'Plymouth', 'Milton Keynes',
  'Bexley', 'Wolverhampton', 'Northampton', 'Archway', 'Aberdeen', 'York', 'Norwich',
  'Dudley', 'Sutton', 'Swindon', 'Crawley', 'Peterborough', 'Ipswich', 'Wigan',
  'Croydon', 'Walsall', 'Mansfield', 'Warrington', 'Slough', 'Gloucester', 'Oxford',
  'Doncaster', 'Poole', 'Burnley', 'Cambridge', 'Huddersfield', 'Telford', 'Dundee',
  'Blackburn', 'Blackpool', 'Basildon', 'Bolton', 'Stockport', 'West Bromwich',
  'Grimsby', 'Hastings', 'High Wycombe', 'Exeter', 'Watford', 'Saint Peters',
  'Burton upon Trent', 'Colchester', 'Chelmsford', 'Eastbourne', 'Rotherham',
  'Cheltenham', 'Chesterfield', 'Mendip', 'Dagenham', 'Basingstoke', 'Maidstone',
  'Lincoln', 'Sutton Coldfield', 'Bedford', 'Bath', 'Oldham', 'Enfield Town',
  'Woking', 'St Helens', 'Worcester', 'Gillingham', 'Becontree', 'Worthing', 'Rochdale',
];

// Trade categories
const tradeCategories = [
  { id: 'plumbing', name: 'Plumbing', searchTerms: ['plumber', 'plumbing services'] },
  { id: 'electrical', name: 'Electrical', searchTerms: ['electrician', 'electrical services'] },
  { id: 'carpentry', name: 'Carpentry', searchTerms: ['carpenter', 'joiner'] },
  { id: 'painting', name: 'Painting', searchTerms: ['painter', 'decorator'] },
  { id: 'roofing', name: 'Roofing', searchTerms: ['roofer', 'roofing contractor'] },
  { id: 'landscaping', name: 'Landscaping', searchTerms: ['landscaper', 'garden services'] },
  { id: 'cleaning', name: 'Cleaning', searchTerms: ['cleaning services', 'cleaners'] },
  { id: 'hvac', name: 'HVAC', searchTerms: ['heating engineer', 'boiler service'] },
  { id: 'building', name: 'Building', searchTerms: ['builder', 'building contractor'] },
  { id: 'flooring', name: 'Flooring', searchTerms: ['flooring specialist', 'floor fitter'] },
  { id: 'plastering', name: 'Plastering', searchTerms: ['plasterer', 'plastering services'] },
  { id: 'handyman', name: 'Handyman', searchTerms: ['handyman', 'property maintenance'] },
];

// Contractor interface for internal use
interface ContractorData {
  businessName: string;
  tradeName: string;
  tradeId: string;
  location: string;
  address?: string | null;
  postcode?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  services: string[];
  certifications?: string[];
  yearsInBusiness?: number | null;
  source: string;
  googleMapsUrl?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  businessStatus?: string | null;
  photos?: string[];
  openingHours?: string[];
}

// Helper function to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiter class
class RateLimiter {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval: number;

  constructor(requestsPerMinute: number) {
    this.minInterval = 60000 / requestsPerMinute;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await sleep(this.minInterval - timeSinceLastRequest);
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }

    this.processing = false;
  }
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

// Google Places API Client
class GooglePlacesClient {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://places.googleapis.com/v1';
  
  private fieldMask = [
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

  constructor(apiKey: string, requestsPerMinute: number = 30) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(requestsPerMinute);
  }

  async searchBusiness(businessName: string, location: string): Promise<PlaceResult | null> {
    if (!this.apiKey) {
      return null;
    }

    const textQuery = `${businessName} ${location} UK`;
    
    try {
      const result = await this.rateLimiter.execute(async () => {
        const response = await fetch(`${this.baseUrl}/places:searchText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': this.fieldMask
          },
          body: JSON.stringify({
            textQuery,
            maxResultCount: 1,
            languageCode: 'en'
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Places API error: ${response.status} - ${errorText}`);
        }

        return response.json() as Promise<TextSearchResponse>;
      });

      if (result.places && result.places.length > 0) {
        return result.places[0];
      }
      return null;
    } catch (error: any) {
      console.log(`   ⚠️  Places API lookup failed for "${businessName}": ${error.message}`);
      return null;
    }
  }

  // Search for multiple businesses in an area by trade type
  async searchBusinessesInArea(
    trade: typeof tradeCategories[0], 
    location: string, 
    maxResults: number = 20
  ): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      throw new Error('GOOGLE_CLOUD_API_KEY is required for Places API search');
    }

    // Use the first search term for the trade (e.g., "plumber in Manchester UK")
    const textQuery = `${trade.searchTerms[0]} in ${location} UK`;
    
    try {
      const result = await this.rateLimiter.execute(async () => {
        const response = await fetch(`${this.baseUrl}/places:searchText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': this.fieldMask
          },
          body: JSON.stringify({
            textQuery,
            maxResultCount: Math.min(maxResults, 20), // API max is 20
            languageCode: 'en'
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Places API error: ${response.status} - ${errorText}`);
        }

        return response.json() as Promise<TextSearchResponse>;
      });

      return result.places || [];
    } catch (error: any) {
      console.log(`   ⚠️  Places API search failed for "${trade.name} in ${location}": ${error.message}`);
      throw error;
    }
  }

  // Check if API key is configured
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  getPhotoUrl(photoName: string, maxHeight: number = 400): string {
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeight}&key=${this.apiKey}`;
  }
}

// Enrich contractor with Google Places data
async function enrichContractorWithPlaces(
  contractor: ContractorData, 
  placesClient: GooglePlacesClient
): Promise<ContractorData> {
  // Skip if already has all info
  if (contractor.phone && contractor.website && contractor.googleRating) {
    return contractor;
  }

  const place = await placesClient.searchBusiness(contractor.businessName, contractor.location);
  
  if (!place) {
    return contractor;
  }

  const enriched = { ...contractor };

  // Fill in missing data
  if (!enriched.phone && place.nationalPhoneNumber) {
    enriched.phone = place.nationalPhoneNumber;
  }
  if (!enriched.website && place.websiteUri) {
    enriched.website = place.websiteUri;
  }
  if (!enriched.address && place.formattedAddress) {
    enriched.address = place.formattedAddress;
  }
  if (!enriched.googleMapsUrl && place.googleMapsUri) {
    enriched.googleMapsUrl = place.googleMapsUri;
  }
  if (!enriched.googleRating && place.rating) {
    enriched.googleRating = place.rating;
  }
  if (!enriched.googleReviewCount && place.userRatingCount) {
    enriched.googleReviewCount = place.userRatingCount;
  }
  if (!enriched.businessStatus && place.businessStatus) {
    enriched.businessStatus = place.businessStatus;
  }
  if (place.photos && place.photos.length > 0) {
    enriched.photos = place.photos.map(p => placesClient.getPhotoUrl(p.name));
    if (!enriched.logoUrl) {
      enriched.logoUrl = enriched.photos[0];
    }
  }
  if (place.regularOpeningHours?.weekdayDescriptions) {
    enriched.openingHours = place.regularOpeningHours.weekdayDescriptions;
  }

  // Update source to reflect enrichment
  if (enriched.source === 'gemini-search') {
    enriched.source = 'gemini-search+places-api';
  }

  return enriched;
}

// Generate slug from business name
function generateSlug(businessName: string): string {
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${baseSlug}-${Date.now().toString(36)}`;
}

// Normalize phone number for comparison
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '').slice(-10);
}

// Extract domain from URL
function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  } catch {
    return null;
  }
}

// Scrape mode type
type ScrapeMode = 'places' | 'gemini';

// Main scraper class
class ContractorScraper {
  private genAI: GoogleGenAI | null = null;
  private rateLimiter: RateLimiter;
  private placesClient: GooglePlacesClient;
  private jobId: number | null = null;
  private mode: ScrapeMode = 'places';

  constructor(mode: ScrapeMode = 'places') {
    this.mode = mode;
    this.placesClient = new GooglePlacesClient(config.googlePlacesApiKey, config.placesRateLimit);
    this.rateLimiter = new RateLimiter(config.rateLimit);

    if (mode === 'gemini') {
      if (!config.apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required for Gemini mode');
      }
      this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
      console.log('🤖 Using Gemini AI mode');
      if (config.googlePlacesApiKey) {
        console.log('🗺️  Google Places API enabled for contact enrichment');
      }
    } else {
      if (!config.googlePlacesApiKey) {
        throw new Error('GOOGLE_CLOUD_API_KEY environment variable is required for Places API mode');
      }
      console.log('🗺️  Using Google Places API mode (default)');
    }
  }

  // Generate search prompt for Gemini
  private generatePrompt(location: string, trade: typeof tradeCategories[0]): string {
    return `Search for ${config.businessesPerSearch} real, currently operating ${trade.name.toLowerCase()} businesses/contractors in ${location}, UK.

For each business, find and provide:
1. Business Name (exact registered name)
2. Full Address including postcode
3. Phone Number (landline/office number - IMPORTANT: search for this on their website, Google Business listing, or directory entries)
4. Mobile Number (mobile/cell number if different from main phone - often listed for emergency contact)
5. Email Address (if available)
6. Website URL
7. Description of services offered
8. List of specific services they provide
9. Any certifications or accreditations (Gas Safe, NICEIC, etc.)
10. Years in business (if mentioned)
11. Logo URL (if available on their website)

IMPORTANT: Phone numbers are critical - look carefully on business websites, Google Business profiles, Yell.com, Checkatrade, or similar directories to find contact numbers.

IMPORTANT:
- Only include REAL businesses that currently exist and operate in ${location}
- Verify the businesses are legitimate by checking their online presence
- Include their Google Business profile info if available
- Do not make up or fabricate any business information
- If you cannot find ${config.businessesPerSearch} businesses, return as many as you can verify

Format your response as a JSON array with this structure:
[
  {
    "businessName": "Example Plumbing Ltd",
    "address": "123 High Street, ${location}",
    "postcode": "XX1 1XX",
    "phone": "020 7946 0958",
    "mobile": "07700 900000",
    "email": "info@example.com",
    "website": "https://www.example.com",
    "description": "Professional plumbing services...",
    "services": ["Boiler Installation", "Emergency Repairs", "Bathroom Fitting"],
    "certifications": ["Gas Safe Registered"],
    "yearsInBusiness": 15,
    "logoUrl": "https://..."
  }
]

Return ONLY the JSON array, no additional text.`;
  }

  // Parse Gemini response into contractors
  private parseResponse(
    response: string, 
    location: string, 
    trade: typeof tradeCategories[0]
  ): ContractorData[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('   ⚠️  No JSON array found in response');
        return [];
      }

      const data = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => ({
        businessName: item.businessName || 'Unknown Business',
        tradeName: trade.name,
        tradeId: trade.id,
        location,
        address: item.address || null,
        postcode: item.postcode || null,
        phone: item.phone || null,
        mobile: item.mobile || null,
        email: item.email || null,
        website: item.website || null,
        logoUrl: item.logoUrl || null,
        description: item.description || null,
        services: item.services || [],
        certifications: item.certifications || [],
        yearsInBusiness: item.yearsInBusiness || null,
        source: 'gemini-search',
      }));
    } catch (error: any) {
      console.log(`   ⚠️  Failed to parse response: ${error.message}`);
      return [];
    }
  }

  // Check if contractor already exists in database
  private async findExistingContractor(contractor: ContractorData): Promise<{ id: number; isClaimed: boolean } | null> {
    // Priority 1: Match by phone
    const normalizedPhone = normalizePhone(contractor.phone);
    const normalizedMobile = normalizePhone(contractor.mobile);
    
    if (normalizedPhone || normalizedMobile) {
      const phoneMatch = await prisma.scrapedContractor.findFirst({
        where: {
          OR: [
            ...(normalizedPhone ? [{ phone: { contains: normalizedPhone.slice(-7) } }] : []),
            ...(normalizedMobile ? [{ mobile: { contains: normalizedMobile.slice(-7) } }] : []),
          ],
        },
        select: { id: true, isClaimed: true },
      });
      if (phoneMatch) return phoneMatch;
    }

    // Priority 2: Match by website
    if (contractor.website) {
      const domain = extractDomain(contractor.website);
      if (domain) {
        const websiteMatch = await prisma.scrapedContractor.findFirst({
          where: { website: { contains: domain, mode: 'insensitive' } },
          select: { id: true, isClaimed: true },
        });
        if (websiteMatch) return websiteMatch;
      }
    }

    // Priority 3: Match by business name + location
    const nameMatch = await prisma.scrapedContractor.findFirst({
      where: {
        businessName: { equals: contractor.businessName, mode: 'insensitive' },
        location: { equals: contractor.location, mode: 'insensitive' },
      },
      select: { id: true, isClaimed: true },
    });
    
    return nameMatch;
  }

  // Save contractor to database (create or update)
  private async saveContractor(contractor: ContractorData): Promise<'created' | 'updated' | 'skipped'> {
    const existing = await this.findExistingContractor(contractor);

    const data = {
      businessName: contractor.businessName,
      tradeName: contractor.tradeName,
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
      skills: contractor.services,
      certifications: contractor.certifications || [],
      yearsInBusiness: contractor.yearsInBusiness,
      source: contractor.source,
      googleMapsUrl: contractor.googleMapsUrl,
      googleRating: contractor.googleRating,
      googleReviewCount: contractor.googleReviewCount,
      businessStatus: contractor.businessStatus,
      photos: contractor.photos || [],
      openingHours: contractor.openingHours || [],
    };

    if (existing) {
      if (existing.isClaimed) {
        // Don't overwrite claimed profiles
        return 'skipped';
      }
      
      // Update unclaimed profile
      await prisma.scrapedContractor.update({
        where: { id: existing.id },
        data: {
          ...data,
          scrapedAt: new Date(),
          lastVerifiedAt: new Date(),
        },
      });
      return 'updated';
    }

    // Create new
    await prisma.scrapedContractor.create({
      data: {
        ...data,
        slug: generateSlug(contractor.businessName),
        isActive: true,
        isClaimed: false,
        rating: 0,
        reviewCount: 0,
      },
    });
    return 'created';
  }

  // Scrape a single location/trade combination using Gemini
  async scrapeLocationTrade(
    location: string, 
    trade: typeof tradeCategories[0],
    progressId: number
  ): Promise<number> {
    const prompt = this.generatePrompt(location, trade);
    
    try {
      // Mark progress as in_progress
      await prisma.scraperProgress.update({
        where: { id: progressId },
        data: { status: 'in_progress', startedAt: new Date() },
      });

      const result = await this.rateLimiter.execute(async () => {
        console.log(`🔍 Searching: ${trade.name} in ${location}...`);
        const response = await this.genAI!.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text || '';
      });

      const contractors = this.parseResponse(result, location, trade);
      console.log(`   ✅ Found ${contractors.length} contractors from Gemini`);
      
      let savedCount = 0;
      
      for (const contractor of contractors) {
        // Enrich with Places API
        const enriched = await enrichContractorWithPlaces(contractor, this.placesClient);
        
        // Save to database
        const action = await this.saveContractor(enriched);
        
        if (action === 'created') {
          console.log(`   ✅ Created: ${enriched.businessName}`);
          savedCount++;
        } else if (action === 'updated') {
          console.log(`   🔄 Updated: ${enriched.businessName}`);
          savedCount++;
        } else {
          console.log(`   ⏭️  Skipped (claimed): ${enriched.businessName}`);
        }
      }

      // Mark progress as completed
      await prisma.scraperProgress.update({
        where: { id: progressId },
        data: { 
          status: 'completed', 
          found: savedCount,
          completedAt: new Date(),
        },
      });

      return savedCount;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error(`   ❌ Error: ${errorMsg}`);
      
      // Mark progress as failed
      await prisma.scraperProgress.update({
        where: { id: progressId },
        data: { 
          status: 'failed', 
          error: errorMsg,
          completedAt: new Date(),
        },
      });
      
      return 0;
    }
  }

  // Convert PlaceResult to ContractorData
  private placeToContractor(
    place: PlaceResult,
    location: string,
    trade: typeof tradeCategories[0]
  ): ContractorData {
    return {
      businessName: place.displayName?.text || 'Unknown Business',
      tradeName: trade.name,
      tradeId: trade.id,
      location,
      address: place.formattedAddress || null,
      postcode: this.extractPostcode(place.formattedAddress),
      phone: place.nationalPhoneNumber || null,
      mobile: null,
      email: null,
      website: place.websiteUri || null,
      logoUrl: place.photos && place.photos.length > 0 
        ? this.placesClient.getPhotoUrl(place.photos[0].name) 
        : null,
      description: null,
      services: [],
      certifications: [],
      yearsInBusiness: null,
      source: 'places-api',
      googleMapsUrl: place.googleMapsUri || null,
      googleRating: place.rating || null,
      googleReviewCount: place.userRatingCount || null,
      businessStatus: place.businessStatus || null,
      photos: place.photos?.map(p => this.placesClient.getPhotoUrl(p.name)) || [],
      openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
    };
  }

  // Extract UK postcode from address
  private extractPostcode(address: string | undefined): string | null {
    if (!address) return null;
    // UK postcode regex pattern
    const postcodeMatch = address.match(/[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}/i);
    return postcodeMatch ? postcodeMatch[0].toUpperCase() : null;
  }

  // Scrape using Places API directly (no AI)
  async scrapeLocationTradePlaces(
    location: string,
    trade: typeof tradeCategories[0],
    progressId: number
  ): Promise<number> {
    try {
      // Mark progress as in_progress
      await prisma.scraperProgress.update({
        where: { id: progressId },
        data: { status: 'in_progress', startedAt: new Date() },
      });

      console.log(`🔍 Searching: ${trade.name} in ${location}...`);
      const places = await this.placesClient.searchBusinessesInArea(trade, location);
      console.log(`   ✅ Found ${places.length} businesses from Places API`);

      let savedCount = 0;

      for (const place of places) {
        const contractor = this.placeToContractor(place, location, trade);
        
        // Save to database
        const action = await this.saveContractor(contractor);

        if (action === 'created') {
          console.log(`   ✅ Created: ${contractor.businessName}`);
          savedCount++;
        } else if (action === 'updated') {
          console.log(`   🔄 Updated: ${contractor.businessName}`);
          savedCount++;
        } else {
          console.log(`   ⏭️  Skipped (claimed): ${contractor.businessName}`);
        }
      }

      // Mark progress as completed
      await prisma.scraperProgress.update({
        where: { id: progressId },
        data: {
          status: 'completed',
          found: savedCount,
          completedAt: new Date(),
        },
      });

      return savedCount;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error(`   ❌ Error: ${errorMsg}`);

      // Mark progress as failed
      await prisma.scraperProgress.update({
        where: { id: progressId },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date(),
        },
      });

      return 0;
    }
  }

  // Create a new scraper job
  async createJob(
    name: string,
    locations: string[],
    trades: typeof tradeCategories
  ): Promise<number> {
    const job = await prisma.scraperJob.create({
      data: {
        name,
        status: 'running',
        locations,
        trades: trades.map(t => t.id),
        totalSearches: locations.length * trades.length,
      },
    });

    // Create progress entries for each location/trade combo
    const progressData = [];
    for (const location of locations) {
      for (const trade of trades) {
        progressData.push({
          jobId: job.id,
          location,
          tradeId: trade.id,
          tradeName: trade.name,
          status: 'pending',
        });
      }
    }

    await prisma.scraperProgress.createMany({ data: progressData });
    
    this.jobId = job.id;
    console.log(`📋 Created job #${job.id}: ${name}`);
    console.log(`   ${locations.length} locations × ${trades.length} trades = ${job.totalSearches} searches`);
    
    return job.id;
  }

  // Resume an existing job
  async resumeJob(jobId: number): Promise<boolean> {
    const job = await prisma.scraperJob.findUnique({
      where: { id: jobId },
      include: {
        progress: {
          where: { status: { in: ['pending', 'failed'] } },
        },
      },
    });

    if (!job) {
      console.error(`❌ Job #${jobId} not found`);
      return false;
    }

    if (job.status === 'completed') {
      console.log(`✅ Job #${jobId} is already completed`);
      return false;
    }

    this.jobId = jobId;
    
    const remaining = job.progress.length;
    const completed = job.totalSearches - remaining;
    
    console.log(`📋 Resuming job #${jobId}: ${job.name}`);
    console.log(`   Completed: ${completed}/${job.totalSearches} (${remaining} remaining)`);
    
    // Update job status
    await prisma.scraperJob.update({
      where: { id: jobId },
      data: { status: 'running', pausedAt: null },
    });

    return true;
  }

  // Run the scraper
  async run(locations?: string[], trades?: typeof tradeCategories, jobName?: string) {
    const targetLocations = locations || ukLocations;
    const targetTrades = trades || tradeCategories;
    const modeLabel = this.mode === 'gemini' ? 'Gemini AI' : 'Places API';
    const name = jobName || `[${modeLabel}] ${targetLocations.length} locations, ${targetTrades.length} trades`;

    console.log('');
    console.log('═'.repeat(60));
    if (this.mode === 'gemini') {
      console.log('🤖 CONTRACTOR SCRAPER - GEMINI AI MODE');
    } else {
      console.log('🗺️  CONTRACTOR SCRAPER - PLACES API MODE');
    }
    console.log('═'.repeat(60));

    // Create new job
    await this.createJob(name, targetLocations, targetTrades);

    await this.processJob();
  }

  // Resume and process a job
  async processJob() {
    if (!this.jobId) {
      console.error('❌ No job to process');
      return;
    }

    // Get pending progress entries
    const pendingProgress = await prisma.scraperProgress.findMany({
      where: {
        jobId: this.jobId,
        status: { in: ['pending', 'failed'] },
      },
      orderBy: [{ location: 'asc' }, { tradeId: 'asc' }],
    });

    let totalFound = 0;
    let completedSearches = 0;
    let currentLocation = '';

    for (const progress of pendingProgress) {
      // Print location header when it changes
      if (progress.location !== currentLocation) {
        currentLocation = progress.location;
        console.log(`\n📍 Processing: ${currentLocation}`);
        console.log('─'.repeat(40));
      }

      const trade = tradeCategories.find(t => t.id === progress.tradeId);
      if (!trade) continue;

      // Use appropriate scrape method based on mode
      const found = this.mode === 'gemini'
        ? await this.scrapeLocationTrade(progress.location, trade, progress.id)
        : await this.scrapeLocationTradePlaces(progress.location, trade, progress.id);
      totalFound += found;
      completedSearches++;

      // Update job progress
      await prisma.scraperJob.update({
        where: { id: this.jobId },
        data: {
          completedSearches,
          contractorsFound: { increment: found },
        },
      });
    }

    // Mark job as completed
    await prisma.scraperJob.update({
      where: { id: this.jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Print summary
    const job = await prisma.scraperJob.findUnique({
      where: { id: this.jobId },
    });

    const totalContractors = await prisma.scrapedContractor.count();

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 SCRAPING COMPLETE');
    console.log('═'.repeat(60));
    console.log(`✅ Job #${this.jobId}: ${job?.name}`);
    console.log(`📊 Searches completed: ${job?.completedSearches}/${job?.totalSearches}`);
    console.log(`✅ Contractors found this run: ${job?.contractorsFound}`);
    console.log(`📂 Total contractors in database: ${totalContractors}`);
    console.log(`⏱️  Started: ${job?.startedAt}`);
    console.log(`⏱️  Completed: ${job?.completedAt}`);
    console.log('═'.repeat(60));
  }

  // List all jobs
  static async listJobs() {
    const jobs = await prisma.scraperJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    console.log('\n📋 Recent Scraper Jobs:');
    console.log('─'.repeat(70));
    
    for (const job of jobs) {
      const statusIcon = job.status === 'completed' ? '✅' : 
                        job.status === 'running' ? '🔄' : 
                        job.status === 'paused' ? '⏸️' : '❌';
      console.log(`${statusIcon} #${job.id} | ${job.name}`);
      console.log(`   Progress: ${job.completedSearches}/${job.totalSearches} | Found: ${job.contractorsFound}`);
      console.log(`   Started: ${job.startedAt.toISOString()}`);
      if (job.completedAt) {
        console.log(`   Completed: ${job.completedAt.toISOString()}`);
      }
      console.log('');
    }
  }

  // Get job status
  static async getJobStatus(jobId: number) {
    const job = await prisma.scraperJob.findUnique({
      where: { id: jobId },
      include: {
        progress: true,
      },
    });

    if (!job) {
      console.log(`❌ Job #${jobId} not found`);
      return;
    }

    const pending = job.progress.filter(p => p.status === 'pending').length;
    const inProgress = job.progress.filter(p => p.status === 'in_progress').length;
    const completed = job.progress.filter(p => p.status === 'completed').length;
    const failed = job.progress.filter(p => p.status === 'failed').length;

    console.log(`\n📋 Job #${jobId}: ${job.name}`);
    console.log('─'.repeat(50));
    console.log(`Status: ${job.status}`);
    console.log(`Progress: ${job.completedSearches}/${job.totalSearches}`);
    console.log(`  - Pending: ${pending}`);
    console.log(`  - In Progress: ${inProgress}`);
    console.log(`  - Completed: ${completed}`);
    console.log(`  - Failed: ${failed}`);
    console.log(`Contractors Found: ${job.contractorsFound}`);
  }

  // Database stats
  static async showStats() {
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
        take: 10,
      }),
      prisma.scrapedContractor.count({ where: { isClaimed: true } }),
    ]);

    console.log('\n📊 Database Statistics:');
    console.log('═'.repeat(50));
    console.log(`Total Contractors: ${total}`);
    console.log(`Claimed: ${claimed}`);
    console.log(`Unclaimed: ${total - claimed}`);
    console.log('\nBy Trade:');
    for (const t of byTrade) {
      console.log(`  - ${t.tradeId}: ${t._count}`);
    }
    console.log('\nTop Locations:');
    for (const l of byLocation) {
      console.log(`  - ${l.location}: ${l._count}`);
    }
    console.log('═'.repeat(50));
  }
}

// CLI handler
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--help')) {
      console.log(`
Contractor Scraper

Usage:
  npx tsx scripts/scraper.ts [options]

Modes:
  (default)           Uses Google Places API (cost-effective, no AI tokens)
  --use-gemini        Use Gemini AI with search grounding (more detailed results)

Options:
  --test              Test mode: scrape London, Plumbing only
  --location <name>   Scrape single location (all trades)
  --trade <id>        Scrape single trade (all locations)
  --resume <jobId>    Resume an interrupted job
  --jobs              List recent scraper jobs
  --status <jobId>    Show job status details
  --stats             Show database statistics
  --help              Show this help

Examples:
  npx tsx scripts/scraper.ts --test                    # Places API, London only
  npx tsx scripts/scraper.ts --test --use-gemini       # Gemini AI, London only
  npx tsx scripts/scraper.ts --location Manchester     # Places API, Manchester
  npx tsx scripts/scraper.ts --use-gemini              # Gemini AI, full scrape
  npx tsx scripts/scraper.ts --resume 5
  npx tsx scripts/scraper.ts --jobs
  npx tsx scripts/scraper.ts --stats

Available trades: ${tradeCategories.map(t => t.id).join(', ')}
`);
      return;
    }

    if (args.includes('--jobs')) {
      await ContractorScraper.listJobs();
      return;
    }

    if (args.includes('--stats')) {
      await ContractorScraper.showStats();
      return;
    }

    if (args.includes('--status')) {
      const idx = args.indexOf('--status') + 1;
      const jobId = parseInt(args[idx]);
      if (isNaN(jobId)) {
        console.error('Please provide a job ID: --status <jobId>');
        return;
      }
      await ContractorScraper.getJobStatus(jobId);
      return;
    }

    // Determine mode: default is 'places', use 'gemini' if --use-gemini flag is present
    const mode: ScrapeMode = args.includes('--use-gemini') ? 'gemini' : 'places';
    const scraper = new ContractorScraper(mode);

    if (args.includes('--resume')) {
      const idx = args.indexOf('--resume') + 1;
      const jobId = parseInt(args[idx]);
      if (isNaN(jobId)) {
        console.error('Please provide a job ID: --resume <jobId>');
        return;
      }
      const canResume = await scraper.resumeJob(jobId);
      if (canResume) {
        await scraper.processJob();
      }
      return;
    }

    if (args.includes('--test')) {
      console.log('🧪 Running in TEST mode (London, Plumbing only)');
      await scraper.run(['London'], [tradeCategories[0]], 'Test: London Plumbing');
      return;
    }

    if (args.includes('--location')) {
      const idx = args.indexOf('--location') + 1;
      const location = args[idx];
      if (!location) {
        console.error('Please provide a location: --location <name>');
        return;
      }
      console.log(`📍 Scraping single location: ${location}`);
      await scraper.run([location], undefined, `Single Location: ${location}`);
      return;
    }

    if (args.includes('--trade')) {
      const idx = args.indexOf('--trade') + 1;
      const tradeId = args[idx];
      const trade = tradeCategories.find(t => t.id === tradeId);
      if (!trade) {
        console.error(`Unknown trade: ${tradeId}`);
        console.log('Available trades:', tradeCategories.map(t => t.id).join(', '));
        return;
      }
      console.log(`🔧 Scraping single trade: ${trade.name}`);
      await scraper.run(undefined, [trade], `Single Trade: ${trade.name}`);
      return;
    }

    // Full scrape
    await scraper.run();

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

