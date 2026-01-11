'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Contractor {
  id: number;
  slug: string;
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  hourlyRate: number | null;
  location: string;
  bio: string;
}

// Mock data for demonstration
const mockContractors: Contractor[] = [
  {
    id: 1,
    slug: 'mikes-plumbing',
    businessName: "Mike's Plumbing Services",
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@example.com',
    skills: ['Plumbing', 'Emergency Repairs', 'Bathroom Installation'],
    rating: 4.9,
    reviewCount: 127,
    isVerified: true,
    hourlyRate: 45,
    location: 'London, UK',
    bio: 'Over 15 years experience in residential and commercial plumbing.',
  },
  {
    id: 2,
    slug: 'elite-electrical',
    businessName: 'Elite Electrical Ltd',
    firstName: 'James',
    lastName: 'Smith',
    email: 'james@example.com',
    skills: ['Electrical', 'Rewiring', 'Smart Home', 'EV Chargers'],
    rating: 4.8,
    reviewCount: 89,
    isVerified: true,
    hourlyRate: 55,
    location: 'Manchester, UK',
    bio: 'NICEIC approved contractor specializing in domestic electrical work.',
  },
  {
    id: 3,
    slug: 'precision-builders',
    businessName: 'Precision Builders',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david@example.com',
    skills: ['Building', 'Extensions', 'Renovations', 'Carpentry'],
    rating: 4.7,
    reviewCount: 64,
    isVerified: true,
    hourlyRate: null,
    location: 'Birmingham, UK',
    bio: 'Family run building company with 25 years of experience.',
  },
  {
    id: 4,
    slug: 'green-gardens',
    businessName: 'Green Gardens Landscaping',
    firstName: 'Sarah',
    lastName: 'Brown',
    email: 'sarah@example.com',
    skills: ['Landscaping', 'Garden Design', 'Fencing', 'Patios'],
    rating: 4.9,
    reviewCount: 156,
    isVerified: true,
    hourlyRate: 35,
    location: 'Leeds, UK',
    bio: 'Award-winning garden design and landscaping services.',
  },
  {
    id: 5,
    slug: 'quick-clean-services',
    businessName: 'Quick Clean Services',
    firstName: 'Emma',
    lastName: 'Taylor',
    email: 'emma@example.com',
    skills: ['Cleaning', 'Deep Cleaning', 'End of Tenancy', 'Commercial'],
    rating: 4.6,
    reviewCount: 203,
    isVerified: false,
    hourlyRate: 25,
    location: 'Bristol, UK',
    bio: 'Professional cleaning services for homes and offices.',
  },
  {
    id: 6,
    slug: 'ace-roofing',
    businessName: 'Ace Roofing Solutions',
    firstName: 'Tom',
    lastName: 'Harris',
    email: 'tom@example.com',
    skills: ['Roofing', 'Guttering', 'Flat Roofs', 'Repairs'],
    rating: 4.8,
    reviewCount: 78,
    isVerified: true,
    hourlyRate: 50,
    location: 'Glasgow, UK',
    bio: 'All types of roofing work, fully insured and guaranteed.',
  },
];

const trades = [
  'All Trades',
  'Plumbing',
  'Electrical',
  'Building',
  'Carpentry',
  'Painting',
  'Roofing',
  'Landscaping',
  'Cleaning',
  'HVAC',
];

export default function ContractorsDirectoryPage() {
  const [contractors, setContractors] = useState<Contractor[]>(mockContractors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All Trades');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Filter contractors based on search criteria
  useEffect(() => {
    let filtered = mockContractors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.businessName.toLowerCase().includes(query) ||
          c.skills.some((s) => s.toLowerCase().includes(query)) ||
          c.location.toLowerCase().includes(query)
      );
    }

    if (selectedTrade !== 'All Trades') {
      filtered = filtered.filter((c) =>
        c.skills.some((s) => s.toLowerCase().includes(selectedTrade.toLowerCase()))
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter((c) =>
        c.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    if (minRating > 0) {
      filtered = filtered.filter((c) => c.rating >= minRating);
    }

    if (verifiedOnly) {
      filtered = filtered.filter((c) => c.isVerified);
    }

    setContractors(filtered);
  }, [searchQuery, selectedTrade, selectedLocation, minRating, verifiedOnly]);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Find Trusted Local Contractors
            </h1>
            <p className="text-xl text-slate-300">
              Browse the Reactive Network of verified professionals
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5">
                  <Image src="/icons/search.png" alt="" fill className="object-contain opacity-50" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by trade, name, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 text-lg bg-white"
                />
              </div>
              <Button className="h-14 px-8 flex-shrink-0">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h3 className="font-semibold text-slate-900 mb-4">Filters</h3>

                {/* Trade Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trade
                  </label>
                  <select
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    {trades.map((trade) => (
                      <option key={trade} value={trade}>
                        {trade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Location
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter city or postcode"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  />
                </div>

                {/* Rating Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Rating
                  </label>
                  <div className="flex gap-1">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                          minRating === rating
                            ? 'bg-[#E86A33] text-white border-[#E86A33]'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified Only */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 text-[#E86A33] rounded"
                    />
                    <span className="text-sm text-slate-700">Verified only</span>
                  </label>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTrade('All Trades');
                    setSelectedLocation('');
                    setMinRating(0);
                    setVerifiedOnly(false);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-900">{contractors.length}</span>{' '}
                  contractors found
                </p>
                <select className="p-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white">
                  <option>Sort by: Rating</option>
                  <option>Sort by: Reviews</option>
                  <option>Sort by: Price (Low)</option>
                  <option>Sort by: Price (High)</option>
                </select>
              </div>

              {/* Contractor Cards */}
              {contractors.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <p className="text-slate-500 text-lg">No contractors found matching your criteria</p>
                  <p className="text-slate-400 mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contractors.map((contractor) => (
                    <div
                      key={contractor.id}
                      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gradient-to-br from-[#E86A33] to-[#C85A28] rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {contractor.businessName.charAt(0)}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {contractor.businessName}
                                </h3>
                                {contractor.isVerified && (
                                  <span className="inline-flex items-center gap-1 bg-[#E86A33]/10 text-[#E86A33] text-xs px-2 py-0.5 rounded-full font-medium">
                                    <div className="relative w-3 h-3">
                                      <Image src="/icons/checkmark.png" alt="" fill className="object-contain" />
                                    </div>
                                    Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-sm">{contractor.location}</p>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="flex items-center gap-1">
                                <div className="relative w-5 h-5">
                                  <Image src="/icons/star.png" alt="" fill className="object-contain" />
                                </div>
                                <span className="font-semibold text-slate-900">{contractor.rating}</span>
                                <span className="text-slate-500 text-sm">
                                  ({contractor.reviewCount})
                                </span>
                              </div>
                              {contractor.hourlyRate && (
                                <p className="text-sm text-slate-500 mt-1">
                                  From £{contractor.hourlyRate}/hr
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                            {contractor.bio}
                          </p>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {contractor.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {contractor.skills.length > 4 && (
                              <span className="text-slate-400 text-xs py-1">
                                +{contractor.skills.length - 4} more
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link href={`/contractors/${contractor.slug}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View Profile
                              </Button>
                            </Link>
                            <Link href="/auth/login" className="flex-1">
                              <Button className="w-full">
                                Request Quote
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {contractors.length > 0 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" className="bg-[#E86A33] text-white border-[#E86A33]">
                    1
                  </Button>
                  <Button variant="outline">2</Button>
                  <Button variant="outline">3</Button>
                  <Button variant="outline">Next</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Are You a Contractor?
          </h2>
          <p className="text-slate-300 mb-8">
            Join the Reactive Network and connect with thousands of customers looking for your services.
          </p>
          <Link href="/contractors/join">
            <Button size="lg" className="h-12 px-8">
              Add Your Business — Free
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
