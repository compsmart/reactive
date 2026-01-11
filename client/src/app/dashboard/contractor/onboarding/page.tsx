'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const tradeCategories = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚' },
  { id: 'painting', name: 'Painting & Decorating', icon: '🎨' },
  { id: 'roofing', name: 'Roofing', icon: '🏠' },
  { id: 'landscaping', name: 'Landscaping', icon: '🌳' },
  { id: 'cleaning', name: 'Cleaning', icon: '✨' },
  { id: 'hvac', name: 'Heating & Cooling', icon: '❄️' },
  { id: 'building', name: 'Building & Construction', icon: '🏗️' },
  { id: 'flooring', name: 'Flooring', icon: '🪵' },
  { id: 'windows', name: 'Windows & Doors', icon: '🚪' },
  { id: 'locksmith', name: 'Locksmith', icon: '🔐' },
  { id: 'pest-control', name: 'Pest Control', icon: '🐛' },
  { id: 'removals', name: 'Removals', icon: '📦' },
  { id: 'handyman', name: 'General Handyman', icon: '🛠️' },
];

interface OnboardingData {
  // Step 1: Business Details
  businessName: string;
  businessDesc: string;
  yearsInBusiness: string;
  phone: string;
  mobile: string;
  website: string;

  // Step 2: Services & Trades
  selectedTrades: string[];
  customServices: { name: string; price: string; priceType: string }[];

  // Step 3: Service Areas
  postcode: string;
  travelRadius: string;
  serviceAreas: string[];

  // Step 4: Pricing
  hourlyRate: string;
  callOutFee: string;

  // Step 5: Certifications
  certifications: string[];
  customCertifications: string[];
  insuranceInfo: string;

  // Step 6: Profile Media
  bio: string;
}

const initialData: OnboardingData = {
  businessName: '',
  businessDesc: '',
  yearsInBusiness: '',
  phone: '',
  mobile: '',
  website: '',
  selectedTrades: [],
  customServices: [],
  postcode: '',
  travelRadius: '25',
  serviceAreas: [],
  hourlyRate: '',
  callOutFee: '',
  certifications: [],
  customCertifications: [],
  insuranceInfo: '',
  bio: '',
};

const commonCertifications = [
  'Gas Safe Registered',
  'NICEIC Approved',
  'Part P Certified',
  'City & Guilds Qualified',
  'NVQ Level 3',
  'CSCS Card Holder',
  'FENSA Registered',
  'TrustMark Registered',
];

export default function ContractorOnboarding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newServiceArea, setNewServiceArea] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const totalSteps = 7;

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'SUBCONTRACTOR')) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.businessName.trim().length >= 3 && data.phone.trim().length >= 10;
      case 2:
        return data.selectedTrades.length > 0;
      case 3:
        return data.postcode.trim().length >= 3;
      case 4:
        return true; // Pricing is optional
      case 5:
        return true; // Certifications are optional
      case 6:
        return data.bio.trim().length >= 50;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // In production, this would save to the API
      // await api.post('/contractors/profile', { ... });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push('/dashboard/contractor?onboarded=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  const addServiceArea = () => {
    if (newServiceArea.trim() && !data.serviceAreas.includes(newServiceArea.trim())) {
      setData({ ...data, serviceAreas: [...data.serviceAreas, newServiceArea.trim()] });
      setNewServiceArea('');
    }
  };

  const removeServiceArea = (area: string) => {
    setData({ ...data, serviceAreas: data.serviceAreas.filter(a => a !== area) });
  };

  const toggleCertification = (cert: string) => {
    if (data.certifications.includes(cert)) {
      setData({ ...data, certifications: data.certifications.filter(c => c !== cert) });
    } else {
      setData({ ...data, certifications: [...data.certifications, cert] });
    }
  };

  const addCustomCertification = () => {
    if (newCertification.trim() && !data.customCertifications.includes(newCertification.trim())) {
      setData({ ...data, customCertifications: [...data.customCertifications, newCertification.trim()] });
      setNewCertification('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-28">
              <Image
                src="/logo-wide.webp"
                alt="Reactive Ltd"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900">Set Up Your Business Profile</span>
          </div>
          <span className="text-sm text-slate-500">Step {step} of {totalSteps}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your business</h1>
            <p className="text-slate-600 mb-8">This information will appear on your public profile</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={data.businessName}
                  onChange={(e) => setData({ ...data, businessName: e.target.value })}
                  placeholder="e.g., Mike's Plumbing Services"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Description
                </label>
                <textarea
                  value={data.businessDesc}
                  onChange={(e) => setData({ ...data, businessDesc: e.target.value })}
                  placeholder="Brief description of your business and what makes you stand out..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    placeholder="020 7946 0958"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number
                  </label>
                  <Input
                    type="tel"
                    value={data.mobile}
                    onChange={(e) => setData({ ...data, mobile: e.target.value })}
                    placeholder="07700 000000"
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Years in Business
                </label>
                <select
                  value={data.yearsInBusiness}
                  onChange={(e) => setData({ ...data, yearsInBusiness: e.target.value })}
                  className="w-full h-12 px-4 border border-slate-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="1">Less than 1 year</option>
                  <option value="2">1-2 years</option>
                  <option value="5">3-5 years</option>
                  <option value="10">6-10 years</option>
                  <option value="15">11-15 years</option>
                  <option value="20">16-20 years</option>
                  <option value="25">20+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website (Optional)
                </label>
                <Input
                  type="url"
                  value={data.website}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  placeholder="www.yourbusiness.co.uk"
                  className="h-12"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Services & Trades */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">What services do you offer?</h1>
            <p className="text-slate-600 mb-8">Select all the trades that apply to your business</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tradeCategories.map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => {
                    const trades = data.selectedTrades.includes(trade.id)
                      ? data.selectedTrades.filter(t => t !== trade.id)
                      : [...data.selectedTrades, trade.id];
                    setData({ ...data, selectedTrades: trades });
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    data.selectedTrades.includes(trade.id)
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{trade.icon}</span>
                  <span className="font-medium text-slate-900 text-sm">{trade.name}</span>
                </button>
              ))}
            </div>

            {data.selectedTrades.length > 0 && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>{data.selectedTrades.length}</strong> trade(s) selected
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Service Areas */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Where do you work?</h1>
            <p className="text-slate-600 mb-8">Define your service areas so customers can find you</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Postcode <span className="text-red-500">*</span>
                </label>
                <Input
                  value={data.postcode}
                  onChange={(e) => setData({ ...data, postcode: e.target.value.toUpperCase() })}
                  placeholder="SW1A 1AA"
                  className="h-12"
                />
                <p className="text-xs text-slate-500 mt-1">Your base location for calculating distances</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Travel Radius
                </label>
                <select
                  value={data.travelRadius}
                  onChange={(e) => setData({ ...data, travelRadius: e.target.value })}
                  className="w-full h-12 px-4 border border-slate-300 rounded-lg"
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="25">25 miles</option>
                  <option value="50">50 miles</option>
                  <option value="100">100+ miles (nationwide)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specific Areas (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newServiceArea}
                    onChange={(e) => setNewServiceArea(e.target.value)}
                    placeholder="e.g., North London"
                    className="h-10"
                    onKeyDown={(e) => e.key === 'Enter' && addServiceArea()}
                  />
                  <Button type="button" onClick={addServiceArea} variant="outline">
                    Add
                  </Button>
                </div>
                {data.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.serviceAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-sm"
                      >
                        {area}
                        <button
                          onClick={() => removeServiceArea(area)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Set your pricing</h1>
            <p className="text-slate-600 mb-8">Help customers understand your rates (you can leave blank for "quote only")</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hourly Rate
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                  <Input
                    type="number"
                    value={data.hourlyRate}
                    onChange={(e) => setData({ ...data, hourlyRate: e.target.value })}
                    placeholder="45"
                    className="h-12 pl-8"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">/hour</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Call Out Fee
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                  <Input
                    type="number"
                    value={data.callOutFee}
                    onChange={(e) => setData({ ...data, callOutFee: e.target.value })}
                    placeholder="50"
                    className="h-12 pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Fixed fee for coming to assess a job</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Competitive pricing helps you win more jobs, but don't undervalue your expertise!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Certifications */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Certifications & Insurance</h1>
            <p className="text-slate-600 mb-8">Build trust by showcasing your qualifications</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select your certifications
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {commonCertifications.map((cert) => (
                    <button
                      key={cert}
                      onClick={() => toggleCertification(cert)}
                      className={`p-3 rounded-lg border text-left text-sm transition-all ${
                        data.certifications.includes(cert)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {data.certifications.includes(cert) && '✓ '}
                      {cert}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Other Certifications
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Add custom certification..."
                    className="h-10"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomCertification()}
                  />
                  <Button type="button" onClick={addCustomCertification} variant="outline">
                    Add
                  </Button>
                </div>
                {data.customCertifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.customCertifications.map((cert) => (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                      >
                        {cert}
                        <button
                          onClick={() => setData({
                            ...data,
                            customCertifications: data.customCertifications.filter(c => c !== cert)
                          })}
                          className="hover:text-green-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Insurance Details
                </label>
                <textarea
                  value={data.insuranceInfo}
                  onChange={(e) => setData({ ...data, insuranceInfo: e.target.value })}
                  placeholder="e.g., Public Liability £2m, Professional Indemnity £1m"
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Profile & Bio */}
        {step === 6 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete your profile</h1>
            <p className="text-slate-600 mb-8">Tell customers more about you and your work</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  About You / Your Business <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  placeholder="Tell potential customers about your experience, what makes you different, and why they should hire you..."
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {data.bio.length}/50 minimum characters
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-3">
                  📷 <strong>Profile Photos</strong> - In the full version, you can upload:
                </p>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>• Business logo</li>
                  <li>• Cover photo</li>
                  <li>• Portfolio images of your work</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {step === 7 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Review your profile</h1>
            <p className="text-slate-600 mb-8">Check everything looks good before publishing</p>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Business Info */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-slate-900 mb-3">Business Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">Business Name</span>
                    <p className="font-medium">{data.businessName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Phone</span>
                    <p className="font-medium">{data.phone}</p>
                  </div>
                  {data.mobile && (
                    <div>
                      <span className="text-sm text-slate-500">Mobile</span>
                      <p className="font-medium">{data.mobile}</p>
                    </div>
                  )}
                  {data.yearsInBusiness && (
                    <div>
                      <span className="text-sm text-slate-500">Experience</span>
                      <p className="font-medium">{data.yearsInBusiness}+ years</p>
                    </div>
                  )}
                  {data.website && (
                    <div>
                      <span className="text-sm text-slate-500">Website</span>
                      <p className="font-medium">{data.website}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="p-6 border-b bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-3">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {data.selectedTrades.map((tradeId) => {
                    const trade = tradeCategories.find(t => t.id === tradeId);
                    return (
                      <span key={tradeId} className="bg-white px-3 py-1 rounded-full text-sm border">
                        {trade?.icon} {trade?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-slate-900 mb-3">Service Area</h3>
                <p className="text-slate-600">
                  Based in <strong>{data.postcode}</strong>, covering{' '}
                  <strong>{data.travelRadius} miles</strong>
                </p>
                {data.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.serviceAreas.map((area) => (
                      <span key={area} className="bg-slate-100 px-2 py-1 rounded text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="p-6 border-b bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-3">Pricing</h3>
                <div className="flex gap-8">
                  <div>
                    <span className="text-sm text-slate-500">Hourly Rate</span>
                    <p className="font-medium">{data.hourlyRate ? `£${data.hourlyRate}/hr` : 'Quote only'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Call Out Fee</span>
                    <p className="font-medium">{data.callOutFee ? `£${data.callOutFee}` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              {(data.certifications.length > 0 || data.customCertifications.length > 0) && (
                <div className="p-6 border-b">
                  <h3 className="font-semibold text-slate-900 mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...data.certifications, ...data.customCertifications].map((cert) => (
                      <span key={cert} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">About</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{data.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="h-12 px-6"
          >
            ← Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="h-12 px-8 bg-amber-500 hover:bg-amber-600"
            >
              Continue →
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-12 px-8 bg-amber-500 hover:bg-amber-600"
            >
              {submitting ? 'Publishing...' : 'Publish My Profile'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

