'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from '@/components/ui/Button';
import { ukLocations, tradeCategories, locationToSlug } from '@/data/locations';

// Find location name from slug
function getLocationFromSlug(slug: string): string | null {
  const location = ukLocations.find(loc => locationToSlug(loc) === slug);
  return location || null;
}

export default function LocationContractorsPage() {
  const params = useParams();
  const locationSlug = params.location as string;
  const location = getLocationFromSlug(locationSlug);
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);

  if (!location) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Location Not Found</h1>
            <p className="text-slate-600 mb-4">We don&apos;t currently serve this location.</p>
            <Link href="/contractors">
              <Button>Browse All Contractors</Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#E86A33]/20 text-[#E86A33] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <div className="relative w-4 h-4">
                <Image src="/icons/location.png" alt="" fill className="object-contain" />
              </div>
              {location}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Find Trusted Contractors in {location}
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Connect with verified local tradespeople. Get free quotes from plumbers, electricians, builders and more.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">150+</p>
              <p className="text-slate-300 text-sm">Local Contractors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">4.8</p>
              <p className="text-slate-300 text-sm">Average Rating</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-slate-300 text-sm">Jobs Completed</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">Free</p>
              <p className="text-slate-300 text-sm">To Get Quotes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trade Categories */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Browse Contractors by Trade in {location}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tradeCategories.map((trade) => (
              <Link
                key={trade.id}
                href={`/contractors?location=${encodeURIComponent(location)}&trade=${trade.id}`}
                className="group bg-white hover:bg-[#E86A33] rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center"
              >
                <div className="relative w-12 h-12 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Image
                    src={`/icons/${trade.id === 'hvac' ? 'snowflake' : trade.id === 'building' ? 'building' : trade.id === 'painting' ? 'paintbrush' : trade.id === 'electrical' ? 'lightning' : trade.id === 'plumbing' ? 'wrench' : trade.id === 'carpentry' ? 'hammer' : trade.id === 'roofing' ? 'roof' : trade.id === 'landscaping' ? 'tree' : trade.id === 'cleaning' ? 'sparkle' : trade.id === 'plastering' ? 'trowel' : trade.id === 'handyman' ? 'toolbox' : 'gear'}.png`}
                    alt={trade.name}
                    fill
                    className="object-contain group-hover:brightness-0 group-hover:invert transition-all"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-white transition-colors">
                  {trade.name}
                </h3>
                <p className="text-sm text-slate-500 group-hover:text-white/80 mt-1">
                  in {location}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            About Our {location} Contractor Network
          </h2>
          <div className="prose prose-slate max-w-none">
            <p>
              Finding reliable tradespeople in {location} has never been easier. The Reactive Network 
              connects you with verified local contractors who have been vetted for quality and 
              professionalism. Whether you need a plumber for an emergency repair, an electrician 
              for a rewire, or a builder for a home extension, we&apos;ve got you covered.
            </p>
            <h3>Why Choose Reactive for {location} Contractors?</h3>
            <ul>
              <li><strong>Verified Professionals:</strong> All contractors undergo background checks and credential verification</li>
              <li><strong>Local Experts:</strong> Work with tradespeople who know {location} and surrounding areas</li>
              <li><strong>Free Quotes:</strong> Get multiple quotes at no cost with no obligation</li>
              <li><strong>Customer Reviews:</strong> Read genuine reviews from customers in {location}</li>
              <li><strong>Quality Guarantee:</strong> We stand behind the work of our network contractors</li>
            </ul>
            <h3>Popular Services in {location}</h3>
            <p>
              Our {location} contractors cover all major trades including plumbing, electrical work, 
              carpentry, painting and decorating, roofing, landscaping, cleaning services, heating 
              and cooling (HVAC), building work, flooring, plastering, and general handyman services.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#E86A33]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Find a Contractor in {location}?
          </h2>
          <p className="text-white/90 mb-8">
            Post your job for free and receive quotes from trusted local tradespeople
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/residential/post-job">
              <Button size="lg" className="bg-white text-[#E86A33] hover:bg-slate-100 h-12 px-8">
                Post a Job Free
              </Button>
            </Link>
            <Link href={`/contractors?location=${encodeURIComponent(location)}`}>
              <Button size="lg" variant="outline" className="!bg-transparent !border-white !text-white hover:!bg-white/10 h-12 px-8">
                Browse Contractors
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Nearby Locations */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Find Contractors in Nearby Areas
          </h2>
          <div className="flex flex-wrap gap-2">
            {ukLocations
              .filter(loc => loc !== location)
              .slice(0, 20)
              .map((loc) => (
                <Link
                  key={loc}
                  href={`/contractors/area/${locationToSlug(loc)}`}
                  className="bg-white text-slate-600 hover:text-[#E86A33] px-4 py-2 rounded-lg text-sm border hover:border-[#E86A33] transition-colors"
                >
                  {loc}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

