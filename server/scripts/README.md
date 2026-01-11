# Server Scripts

## Contractor Scraper

Scrapes contractor information using Google Places API (default) or Gemini AI.

### Usage

From the `server` directory:

```bash
# Install dependencies first
npm install

# Run test scrape (London, Plumbing only)
npm run scrape:test

# Full scrape using Places API (default)
npm run scrape

# Use Gemini AI mode
npx tsx scripts/scraper.ts --use-gemini

# Single location
npx tsx scripts/scraper.ts --location Manchester

# View scraper jobs
npm run scrape:jobs

# View database stats
npm run scrape:stats

# Resume interrupted job
npx tsx scripts/scraper.ts --resume 5

# Help
npx tsx scripts/scraper.ts --help
```

### Environment Variables

Add to `server/.env`:

```env
# Required for Places API mode (default)
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

# Required for --use-gemini mode
GEMINI_API_KEY=your_gemini_api_key
```

### Modes

| Mode | Flag | Description |
|------|------|-------------|
| Places API | (default) | Uses Google Places Text Search. Up to 20 results per query. Cost-effective. |
| Gemini AI | `--use-gemini` | Uses Gemini 2.5 Flash. More detailed results with descriptions, services, certifications. |

### Trade Categories

plumbing, electrical, carpentry, painting, roofing, landscaping, cleaning, hvac, building, flooring, plastering, handyman

### UK Locations

100 UK cities and towns covered.

