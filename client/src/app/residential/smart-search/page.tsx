'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

// Trade categories
const tradeCategories = [
  { id: 'plumbing', name: 'Plumbing', icon: '/icons/services/plumbing.png' },
  { id: 'electrical', name: 'Electrical', icon: '/icons/services/electrical.png' },
  { id: 'carpentry', name: 'Carpentry', icon: '/icons/services/carpentry.png' },
  { id: 'painting', name: 'Painting & Decorating', icon: '/icons/services/painting.png' },
  { id: 'roofing', name: 'Roofing', icon: '/icons/services/roofing.png' },
  { id: 'landscaping', name: 'Landscaping', icon: '/icons/services/landscaping.png' },
  { id: 'cleaning', name: 'Cleaning', icon: '/icons/services/cleaning.png' },
  { id: 'hvac', name: 'Heating & Cooling', icon: '/icons/services/hvac.png' },
  { id: 'building', name: 'Building Work', icon: '/icons/services/building.png' },
  { id: 'flooring', name: 'Flooring', icon: '/icons/services/flooring.png' },
];

interface Contractor {
  id: number;
  slug: string;
  businessName: string;
  tradeName: string;
  location: string;
  address: string | null;
  postcode: string | null;
  phone: string | null;
  website: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  businessStatus: string | null;
  photos: string[];
  openingHours: string[];
  aiSummary: string | null;
  aiPros: string[];
  aiCons: string[];
  aiFindings: string | null;
  aiEnrichedAt: string | null;
}

type PageState = 'idle' | 'searching' | 'results' | 'complete';

export default function SmartSearchPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [location, setLocation] = useState('');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [enrichingIds, setEnrichingIds] = useState<Set<number>>(new Set());
  const [selectedContractors, setSelectedContractors] = useState<Set<number>>(new Set());
  const [overallSummary, setOverallSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search
  const handleSearch = async () => {
    if (!selectedTrade || !location.trim()) {
      setError('Please select a trade and enter a location');
      return;
    }

    setError('');
    setPageState('searching');
    setContractors([]);
    setOverallSummary('');
    setSelectedContractors(new Set());

    try {
      const response = await api.post('/smart-search', {
        trade: selectedTrade,
        location: location.trim()
      });

      setContractors(response.data.contractors);
      setSearchQuery(response.data.searchQuery);
      setPageState('results');

      // Start enriching each contractor
      enrichContractors(response.data.contractors);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search contractors');
      setPageState('idle');
    }
  };

  // Enrich contractors with AI
  const enrichContractors = async (contractorList: Contractor[]) => {
    for (const contractor of contractorList) {
      // Skip if already enriched
      if (contractor.aiEnrichedAt && contractor.aiSummary) {
        continue;
      }

      setEnrichingIds(prev => new Set([...prev, contractor.id]));

      try {
        const response = await api.post(`/smart-search/enrich/${contractor.id}`);
        
        // Update the contractor in state
        setContractors(prev => prev.map(c => 
          c.id === contractor.id ? response.data.contractor : c
        ));
      } catch (err) {
        console.error(`Failed to enrich contractor ${contractor.id}:`, err);
      } finally {
        setEnrichingIds(prev => {
          const next = new Set(prev);
          next.delete(contractor.id);
          return next;
        });
      }
    }

    // All enrichment complete
    setPageState('complete');
  };

  // Generate overall summary
  const handleGenerateSummary = async () => {
    if (contractors.length === 0) return;

    setLoadingSummary(true);
    try {
      const response = await api.post('/smart-search/overall-summary', {
        contractorIds: contractors.map(c => c.id.toString()),
        trade: selectedTrade,
        location: location
      });

      setOverallSummary(response.data.summary);
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Auto-generate summary when all enrichments complete
  useEffect(() => {
    if (pageState === 'complete' && contractors.length > 0 && !overallSummary) {
      handleGenerateSummary();
    }
  }, [pageState, contractors.length]);

  // Toggle contractor selection
  const toggleContractorSelection = (id: number) => {
    setSelectedContractors(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle request quote
  const handleRequestQuote = () => {
    const ids = Array.from(selectedContractors);
    if (ids.length === 0) return;
    
    // Navigate to post-job with selected contractors
    router.push(`/residential/post-job?contractors=${ids.join(',')}&trade=${selectedTrade}&location=${encodeURIComponent(location)}`);
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent_50%)]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <svg className="w-5 h-5 text-fuchsia-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-white/90 text-sm font-medium">AI-Powered Search</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Smart Search for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-cyan-300 block">
                Local Contractors
              </span>
            </h1>
            
            <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
              Let AI find and analyze contractors in your area. Get intelligent summaries, 
              pros & cons, and recommendations to make the best choice.
            </p>
          </div>

          {/* Search Form */}
          {pageState === 'idle' && (
            <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
              <div className="space-y-6">
                {/* Trade Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    What type of work do you need?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {tradeCategories.map((trade) => (
                      <button
                        key={trade.id}
                        type="button"
                        onClick={() => setSelectedTrade(trade.id)}
                        className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center ${
                          selectedTrade === trade.id
                            ? 'border-fuchsia-400 bg-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Image 
                          src={trade.icon} 
                          alt={trade.name} 
                          width={32} 
                          height={32} 
                          className="mb-1 brightness-0 invert opacity-80"
                        />
                        <span className="text-xs font-medium text-white/90">{trade.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Input */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Where do you need them?
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Rochdale, Manchester, London..."
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-fuchsia-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                {error && (
                  <div className="text-red-300 text-sm bg-red-500/20 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleSearch}
                  disabled={!selectedTrade || !location.trim()}
                  className="w-full h-14 text-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 border-0"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search with AI
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Searching State */}
      {pageState === 'searching' && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-600 animate-spin" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Searching for {tradeCategories.find(t => t.id === selectedTrade)?.name?.toLowerCase() || 'contractors'}
            </h2>
            <p className="text-slate-600 text-lg">
              in {location}...
            </p>
            <p className="text-slate-500 text-sm mt-4">
              Finding businesses on Google and preparing AI analysis
            </p>
          </div>
        </section>
      )}

      {/* Results */}
      {(pageState === 'results' || pageState === 'complete') && (
        <section className="py-12 bg-slate-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Found {contractors.length} {tradeCategories.find(t => t.id === selectedTrade)?.name?.toLowerCase() || 'contractors'}
                </h2>
                <p className="text-slate-600">in {location}</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPageState('idle');
                    setContractors([]);
                    setOverallSummary('');
                  }}
                  className="text-sm"
                >
                  ← New Search
                </Button>
                
                {selectedContractors.size > 0 && (
                  <Button
                    onClick={handleRequestQuote}
                    className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-sm"
                  >
                    Request Quote ({selectedContractors.size})
                  </Button>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contractor List */}
              <div className="lg:col-span-2 space-y-4">
                {contractors.map((contractor) => (
                  <ContractorCard
                    key={contractor.id}
                    contractor={contractor}
                    isEnriching={enrichingIds.has(contractor.id)}
                    isSelected={selectedContractors.has(contractor.id)}
                    onToggleSelect={() => toggleContractorSelection(contractor.id)}
                  />
                ))}
              </div>

              {/* Summary Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 space-y-4">
                  {/* Selection Summary */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <h3 className="font-semibold text-slate-900 mb-3">Selected for Quote</h3>
                    {selectedContractors.size === 0 ? (
                      <p className="text-slate-500 text-sm">
                        Click on contractors to select them for a quote request
                      </p>
                    ) : (
                      <>
                        <ul className="space-y-2 mb-4">
                          {contractors
                            .filter(c => selectedContractors.has(c.id))
                            .map(c => (
                              <li key={c.id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">{c.businessName}</span>
                                <button
                                  onClick={() => toggleContractorSelection(c.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                        </ul>
                        <Button
                          onClick={handleRequestQuote}
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600"
                        >
                          Request Quote from {selectedContractors.size}
                        </Button>
                      </>
                    )}
                  </div>

                  {/* AI Summary */}
                  <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="font-semibold text-slate-900">AI Summary</h3>
                    </div>
                    
                    {loadingSummary ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Analyzing contractors...</span>
                      </div>
                    ) : overallSummary ? (
                      <div 
                        className="ai-summary-content text-sm [&_h4]:text-purple-800 [&_h4]:font-bold [&_h4]:text-base [&_h4]:mt-4 [&_h4]:mb-2 [&_h4:first-child]:mt-0 [&_p]:text-slate-800 [&_p]:my-2 [&_p]:leading-relaxed [&_ul]:my-2 [&_ul]:pl-4 [&_li]:text-slate-800 [&_li]:my-1 [&_strong]:text-purple-700 [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ 
                          __html: overallSummary
                            .replace(/```html\n?/gi, '')
                            .replace(/```\n?/gi, '')
                            .trim() 
                        }}
                      />
                    ) : pageState === 'results' ? (
                      <p className="text-slate-500 text-sm">
                        Summary will appear once all contractors are analyzed...
                      </p>
                    ) : (
                      <Button
                        onClick={handleGenerateSummary}
                        variant="outline"
                        className="w-full text-sm"
                      >
                        Generate Summary
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works - Show when idle */}
      {pageState === 'idle' && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                How Smart Search Works
              </h2>
              <p className="text-xl text-slate-600">
                AI-powered contractor discovery in 4 simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  icon: '🔍',
                  title: 'Search',
                  desc: 'Tell us what trade you need and your location'
                },
                {
                  step: '2',
                  icon: '📊',
                  title: 'Discover',
                  desc: 'We search Google to find local contractors'
                },
                {
                  step: '3',
                  icon: '🤖',
                  title: 'Analyze',
                  desc: 'AI reviews each business and generates insights'
                },
                {
                  step: '4',
                  icon: '✉️',
                  title: 'Connect',
                  desc: 'Select your favorites and request quotes'
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-2xl flex items-center justify-center text-3xl">
                      {item.icon}
                    </div>
                    <span className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-lg">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}

// Contractor Card Component
function ContractorCard({ 
  contractor, 
  isEnriching, 
  isSelected,
  onToggleSelect 
}: { 
  contractor: Contractor;
  isEnriching: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
        isSelected 
          ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' 
          : 'border-transparent hover:border-purple-200'
      }`}
      onClick={onToggleSelect}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            {contractor.photos[0] ? (
              <img
                src={contractor.photos[0]}
                alt={contractor.businessName}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{contractor.businessName}</h3>
                <p className="text-slate-600 text-sm">{contractor.address || contractor.location}</p>
              </div>
              
              {/* Selection indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected 
                  ? 'bg-fuchsia-500 border-fuchsia-500' 
                  : 'border-slate-300'
              }`}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Rating & Status */}
            <div className="flex items-center gap-4 mt-2">
              {contractor.googleRating && (
                <div className="flex items-center gap-1">
                  <span className="text-amber-500">★</span>
                  <span className="font-medium text-slate-900">{contractor.googleRating.toFixed(1)}</span>
                  {contractor.googleReviewCount && (
                    <span className="text-slate-500 text-sm">({contractor.googleReviewCount})</span>
                  )}
                </div>
              )}
              
              {contractor.businessStatus === 'OPERATIONAL' && (
                <span className="text-emerald-600 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Open
                </span>
              )}

              {contractor.phone && (
                <span className="text-slate-500 text-sm">{contractor.phone}</span>
              )}
            </div>
          </div>
        </div>

        {/* AI Section */}
        <div className="mt-4 pt-4 border-t">
          {isEnriching ? (
            <div className="flex items-center gap-2 text-purple-600">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">AI is analyzing this business...</span>
            </div>
          ) : contractor.aiSummary ? (
            <div onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium text-purple-600">AI Analysis</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              <p className="text-slate-600 text-sm">{contractor.aiSummary}</p>
              
              {expanded && (
                <div className="mt-4 space-y-3">
                  {contractor.aiPros.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-emerald-700 mb-1">Pros</h4>
                      <ul className="space-y-1">
                        {contractor.aiPros.map((pro, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {contractor.aiCons.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-amber-700 mb-1">Things to Verify</h4>
                      <ul className="space-y-1">
                        {contractor.aiCons.map((con, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">!</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {contractor.aiFindings && (
                    <div>
                      <h4 className="text-sm font-medium text-purple-700 mb-1">Recommendations</h4>
                      <p className="text-sm text-slate-600">{contractor.aiFindings}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">
              Waiting for AI analysis...
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="px-6 py-3 bg-slate-50 rounded-b-xl flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {contractor.website && (
            <a
              href={contractor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Website
            </a>
          )}
          {contractor.phone && (
            <a
              href={`tel:${contractor.phone}`}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          )}
        </div>
        
        <Button
          size="sm"
          variant={isSelected ? 'default' : 'outline'}
          className={isSelected ? 'bg-fuchsia-500 hover:bg-fuchsia-600' : ''}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        >
          {isSelected ? 'Selected ✓' : 'Select for Quote'}
        </Button>
      </div>
    </div>
  );
}

