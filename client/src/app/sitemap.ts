import { MetadataRoute } from 'next';
import { ukLocations, tradeCategories, locationToSlug } from '@/data/locations';

const BASE_URL = 'https://reactive.co.uk';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Main pages
  const mainPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/residential`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/commercial`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/contractors`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/contractors/join`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/residential/post-job`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Location pages
  const locationPages: MetadataRoute.Sitemap = ukLocations.map((location) => ({
    url: `${BASE_URL}/contractors/area/${locationToSlug(location)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Trade + Location combination pages (for high-value SEO)
  const tradeLocationPages: MetadataRoute.Sitemap = [];
  
  // Only generate for major cities to avoid too many pages
  const majorCities = [
    'London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool',
    'Bristol', 'Leeds', 'Sheffield', 'Edinburgh', 'Cardiff',
  ];

  majorCities.forEach((location) => {
    tradeCategories.forEach((trade) => {
      tradeLocationPages.push({
        url: `${BASE_URL}/contractors/area/${locationToSlug(location)}?trade=${trade.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      });
    });
  });

  return [...mainPages, ...locationPages, ...tradeLocationPages];
}

