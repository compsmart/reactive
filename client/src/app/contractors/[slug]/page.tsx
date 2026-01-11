'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

// Contractor interface matching the database schema
interface ScrapedContractor {
  id: number;
  slug: string;
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
  bio?: string | null;
  skills: string[];
  certifications: string[];
  yearsInBusiness?: number | null;
  // Google Places API data
  googleMapsUrl?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  businessStatus?: string | null;
  photos: string[];
  openingHours: string[];
  // Status fields
  isClaimed: boolean;
  rating: number;
  reviewCount: number;
  source: string;
}

// Tab configuration type
interface Tab {
  id: string;
  label: string;
  show: boolean;
}

export default function ContractorProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const [contractor, setContractor] = useState<ScrapedContractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('about');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const slug = params.slug as string;

  // Fetch contractor data
  useEffect(() => {
    const fetchContractor = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/contractors/scraped/${slug}`);
        setContractor(response.data);
      } catch (err: any) {
        console.error('Error fetching contractor:', err);
        setError(err.response?.data?.error || 'Contractor not found');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchContractor();
    }
  }, [slug]);

  // Dynamic tabs based on available data
  const availableTabs = useMemo<Tab[]>(() => {
    if (!contractor) return [];
    
    const hasRating = (contractor.googleRating && contractor.googleRating > 0) || 
                      (contractor.rating && contractor.rating > 0);
    const reviewCount = contractor.googleReviewCount || contractor.reviewCount || 0;
    
    return [
      { id: 'about', label: 'About', show: true }, // Always show
      { id: 'services', label: 'Services', show: contractor.skills?.length > 0 },
      { id: 'reviews', label: `Reviews${reviewCount > 0 ? ` (${reviewCount})` : ''}`, show: hasRating || reviewCount > 0 },
      { id: 'gallery', label: 'Gallery', show: contractor.photos?.length > 0 },
      { id: 'hours', label: 'Hours', show: contractor.openingHours?.length > 0 },
    ].filter(tab => tab.show);
  }, [contractor]);

  // Set default tab when tabs are available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // Get display rating (prefer Google rating)
  const displayRating = contractor?.googleRating || contractor?.rating || 0;
  const displayReviewCount = contractor?.googleReviewCount || contractor?.reviewCount || 0;
  const hasAnyContact = contractor?.phone || contractor?.mobile || contractor?.email;

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 w-48 bg-slate-200 rounded mx-auto"></div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !contractor) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Contractor Not Found</h1>
            <p className="text-slate-600 mb-4">{error || "The contractor you're looking for doesn't exist."}</p>
            <Link href="/contractors">
              <Button>Browse Contractors</Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Header / Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo / Avatar */}
            <div className="flex-shrink-0">
              {contractor.logoUrl ? (
                <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/10">
                  <Image
                    src={contractor.logoUrl}
                    alt={contractor.businessName}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
                  <span className="text-5xl font-bold text-white">
                    {contractor.businessName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white truncate">{contractor.businessName}</h1>
                {contractor.isClaimed && (
                  <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {contractor.googleRating && (
                  <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </span>
                )}
              </div>

              {/* Meta info row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300 mb-4">
                {displayRating > 0 && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400">★</span>
                      <span className="font-semibold text-white">{displayRating.toFixed(1)}</span>
                      {displayReviewCount > 0 && (
                        <span className="text-slate-400">({displayReviewCount} reviews)</span>
                      )}
                    </span>
                    <span className="text-slate-600">•</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {contractor.location}
                </span>
                {contractor.yearsInBusiness && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span>{contractor.yearsInBusiness} years in business</span>
                  </>
                )}
                {contractor.businessStatus === 'OPERATIONAL' && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      Open
                    </span>
                  </>
                )}
              </div>

              {/* Skills tags */}
              {contractor.skills && contractor.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {contractor.skills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      className="bg-white/10 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {contractor.skills.length > 6 && (
                    <span className="bg-white/5 text-slate-400 text-sm px-3 py-1 rounded-full">
                      +{contractor.skills.length - 6} more
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {user ? (
                  <Link href={`/residential/post-job?contractor=${contractor.id}`}>
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                      Request Quote
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                      Log In to Request Quote
                    </Button>
                  </Link>
                )}
                {hasAnyContact && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="!bg-transparent !border-white/30 !text-white hover:!bg-white/10"
                    onClick={() => setShowContactInfo(!showContactInfo)}
                  >
                    {showContactInfo ? 'Hide Contact' : 'Show Contact'}
                  </Button>
                )}
                {contractor.googleMapsUrl && (
                  <a
                    href={contractor.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="!bg-transparent !border-white/30 !text-white hover:!bg-white/10"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      View on Maps
                    </Button>
                  </a>
                )}
              </div>

              {/* Contact Info (expandable) */}
              {showContactInfo && (
                <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  {user ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
                      {contractor.phone && (
                        <div>
                          <span className="text-slate-400 text-sm">Phone</span>
                          <p className="font-medium">
                            <a href={`tel:${contractor.phone}`} className="hover:text-amber-400 transition-colors">
                              {contractor.phone}
                            </a>
                          </p>
                        </div>
                      )}
                      {contractor.mobile && (
                        <div>
                          <span className="text-slate-400 text-sm">Mobile</span>
                          <p className="font-medium">
                            <a href={`tel:${contractor.mobile}`} className="hover:text-amber-400 transition-colors">
                              {contractor.mobile}
                            </a>
                          </p>
                        </div>
                      )}
                      {contractor.email && (
                        <div>
                          <span className="text-slate-400 text-sm">Email</span>
                          <p className="font-medium">
                            <a href={`mailto:${contractor.email}`} className="hover:text-amber-400 transition-colors">
                              {contractor.email}
                            </a>
                          </p>
                        </div>
                      )}
                      {contractor.website && (
                        <div>
                          <span className="text-slate-400 text-sm">Website</span>
                          <p className="font-medium">
                            <a 
                              href={contractor.website.startsWith('http') ? contractor.website : `https://${contractor.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-amber-400 transition-colors flex items-center gap-1"
                            >
                              {contractor.website.replace(/^https?:\/\//, '')}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </p>
                        </div>
                      )}
                      {!contractor.phone && !contractor.mobile && !contractor.email && (
                        <p className="col-span-2 text-slate-400">Contact details not available</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-slate-300 mb-3">Log in to see contact details</p>
                      <Link href="/auth/login">
                        <Button size="sm">Log In</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white rounded-xl p-6 shadow-xl min-w-[260px] hidden lg:block">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                {displayRating > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Rating</span>
                    <span className="font-semibold flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      {displayRating.toFixed(1)}
                    </span>
                  </div>
                )}
                {displayReviewCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reviews</span>
                    <span className="font-semibold">{displayReviewCount}</span>
                  </div>
                )}
                {contractor.yearsInBusiness && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experience</span>
                    <span className="font-semibold">{contractor.yearsInBusiness} years</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Trade</span>
                  <span className="font-semibold text-sm">{contractor.tradeName}</span>
                </div>
                {contractor.address && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 mb-1">Address</p>
                    <p className="text-sm text-slate-700">{contractor.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs - Only show if we have more than just "About" */}
      {availableTabs.length > 1 && (
        <section className="border-b bg-white sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-8 overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 border-b-2 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </section>
      )}

      {/* Tab Content */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Bio Section */}
                {contractor.bio ? (
                  <div className="bg-white rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">About Us</h2>
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{contractor.bio}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">About {contractor.businessName}</h2>
                    <p className="text-slate-500 italic">
                      {contractor.businessName} is a {contractor.tradeName.toLowerCase()} service provider based in {contractor.location}.
                      {contractor.yearsInBusiness && ` With ${contractor.yearsInBusiness} years of experience in the industry.`}
                    </p>
                  </div>
                )}

                {/* Certifications Section */}
                {contractor.certifications && contractor.certifications.length > 0 && (
                  <div className="bg-white rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Certifications & Qualifications</h2>
                    <div className="flex flex-wrap gap-2">
                      {contractor.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Why Choose Us */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                  <h3 className="font-semibold text-slate-900 mb-4">Why Choose Us?</h3>
                  <ul className="space-y-3 text-slate-700 text-sm">
                    {contractor.yearsInBusiness && (
                      <li className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">✓</span>
                        {contractor.yearsInBusiness}+ years experience
                      </li>
                    )}
                    {displayReviewCount > 0 && (
                      <li className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">✓</span>
                        {displayReviewCount}+ customer reviews
                      </li>
                    )}
                    {contractor.certifications && contractor.certifications.length > 0 && (
                      <li className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">✓</span>
                        Fully certified & qualified
                      </li>
                    )}
                    <li className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">✓</span>
                      Local to {contractor.location}
                    </li>
                  </ul>
                </div>

                {/* Data Source Attribution */}
                {contractor.source?.includes('places') && (
                  <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                    <p className="text-xs text-slate-400">
                      Business data enhanced with
                    </p>
                    <p className="text-sm font-medium text-slate-600 flex items-center justify-center gap-2 mt-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google Places
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && contractor.skills && contractor.skills.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-slate-900">Services Offered</h2>
                <p className="text-slate-500 mt-1">Here's what {contractor.businessName} can help you with</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {contractor.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="font-medium text-slate-900">{skill}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t">
                <Link href={user ? `/residential/post-job?contractor=${contractor.id}` : '/auth/login'}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                    Request a Quote for These Services
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (displayRating > 0 || displayReviewCount > 0) && (
            <div className="space-y-6">
              {/* Reviews Summary */}
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-slate-900">{displayRating.toFixed(1)}</p>
                    <div className="flex gap-1 justify-center my-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xl ${
                            i < Math.round(displayRating) ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-500">
                      {displayReviewCount > 0 ? `${displayReviewCount} reviews` : 'No reviews yet'}
                    </p>
                    {contractor.googleRating && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        </svg>
                        Rating from Google
                      </p>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      // Estimate distribution based on rating
                      const percentage = stars === Math.round(displayRating) ? 70 :
                                        stars === Math.round(displayRating) - 1 || stars === Math.round(displayRating) + 1 ? 20 : 5;
                      return (
                        <div key={stars} className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-slate-600 w-8">{stars}★</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Google Reviews Link */}
              {contractor.googleMapsUrl && (
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                  <p className="text-slate-600 mb-4">
                    Read detailed reviews on Google
                  </p>
                  <a
                    href={contractor.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      View Reviews on Google
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && contractor.photos && contractor.photos.length > 0 && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {contractor.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square bg-slate-200 rounded-xl overflow-hidden hover:opacity-90 transition-opacity focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  >
                    <Image
                      src={photo}
                      alt={`${contractor.businessName} photo ${index + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-slate-500 mt-6 text-sm">
                {contractor.photos.length} photos from Google Places
              </p>

              {/* Lightbox */}
              {selectedPhoto && (
                <div 
                  className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <button
                    className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <Image
                    src={selectedPhoto}
                    alt="Full size photo"
                    width={1200}
                    height={800}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )}

          {/* Hours Tab */}
          {activeTab === 'hours' && contractor.openingHours && contractor.openingHours.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-lg mx-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Business Hours</h2>
                {contractor.businessStatus === 'OPERATIONAL' && (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Open Now
                  </span>
                )}
              </div>
              <div className="divide-y">
                {contractor.openingHours.map((hours, index) => {
                  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
                  const isToday = hours.toLowerCase().startsWith(today.toLowerCase());
                  
                  return (
                    <div
                      key={index}
                      className={`px-6 py-4 flex justify-between items-center ${
                        isToday ? 'bg-amber-50' : ''
                      }`}
                    >
                      <span className={`font-medium ${isToday ? 'text-amber-700' : 'text-slate-900'}`}>
                        {hours.split(':')[0]}
                        {isToday && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Today</span>}
                      </span>
                      <span className={isToday ? 'text-amber-600' : 'text-slate-600'}>
                        {hours.split(':').slice(1).join(':').trim() || 'Hours not specified'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to get started with {contractor.businessName}?
          </h2>
          <p className="text-slate-600 mb-6">
            Get a free, no-obligation quote for your project today
          </p>
          <Link href={user ? `/residential/post-job?contractor=${contractor.id}` : '/auth/login'}>
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold h-12 px-8">
              Request a Free Quote
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
