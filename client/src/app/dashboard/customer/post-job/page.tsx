'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, CustomerSidebar } from '@/components/dashboard';
import api from '@/lib/api';

const categories = [
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
  { id: 'windows', name: 'Windows & Doors', icon: '/icons/services/windows.png' },
  { id: 'other', name: 'Other', icon: '/icons/services/other.png' },
];

const urgencyOptions = [
  { id: 'emergency', label: 'Emergency (ASAP)', desc: 'Need help right away' },
  { id: 'this-week', label: 'This Week', desc: 'Within the next 7 days' },
  { id: 'this-month', label: 'This Month', desc: 'Within the next 30 days' },
  { id: 'flexible', label: 'Flexible', desc: 'No rush, whenever available' },
];

interface JobData {
  category: string;
  title: string;
  description: string;
  location: string;
  postcode: string;
  budget: string;
  urgency: string;
  preferredTimes: string[];
}

const initialJobData: JobData = {
  category: '',
  title: '',
  description: '',
  location: '',
  postcode: '',
  budget: '',
  urgency: 'this-week',
  preferredTimes: [],
};

export default function CustomerPostJobPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [jobData, setJobData] = useState<JobData>(initialJobData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;

  const canProceed = () => {
    switch (step) {
      case 1:
        return jobData.category !== '';
      case 2:
        return (
          jobData.title.trim().length >= 5 &&
          jobData.description.trim().length >= 20 &&
          jobData.postcode.trim().length >= 3
        );
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmitJob = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/jobs', {
        title: jobData.title,
        description: `${jobData.description}\n\nCategory: ${jobData.category}\nUrgency: ${jobData.urgency}\nPreferred times: ${jobData.preferredTimes.join(', ') || 'Flexible'}`,
        budget: jobData.budget ? parseFloat(jobData.budget) : undefined,
        location: `${jobData.location}${jobData.location ? ', ' : ''}${jobData.postcode}`,
        latitude: 51.5074, // Would use geolocation API in production
        longitude: -0.1278,
      });
      router.push('/dashboard/customer/jobs?posted=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout sidebar={<CustomerSidebar />} allowedRoles={['CUST_RESIDENTIAL', 'CUST_COMMERCIAL']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<CustomerSidebar />} allowedRoles={['CUST_RESIDENTIAL', 'CUST_COMMERCIAL']}>
      <div className="min-h-screen bg-slate-100">
        {/* Progress Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-slate-900">Post a New Job</h1>
              <span className="text-sm font-medium text-emerald-600">
                Step {step} of {totalSteps}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          {/* Step 1: Category Selection */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>What type of work do you need?</CardTitle>
                <p className="text-slate-500">Select the category that best matches your job</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setJobData({ ...jobData, category: cat.id })}
                      className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center aspect-square ${
                        jobData.category === cat.id
                          ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:border-emerald-300 bg-white hover:shadow-md'
                      }`}
                    >
                      <Image 
                        src={cat.icon} 
                        alt={cat.name} 
                        width={48} 
                        height={48} 
                        className="mb-2 object-contain"
                      />
                      <span className="text-xs font-medium text-slate-700 leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Job Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Tell us about your job</CardTitle>
                <p className="text-slate-500">The more detail you provide, the better quotes you&apos;ll receive</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                    placeholder="e.g., Fix leaking kitchen tap"
                    className="h-12"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {jobData.title.length}/5 minimum characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    placeholder="Describe what needs to be done in detail. Include any relevant information like the size of the area, materials needed, access issues, etc."
                    rows={5}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {jobData.description.length}/20 minimum characters
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address / Area
                    </label>
                    <Input
                      value={jobData.location}
                      onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                      placeholder="e.g., 123 High Street, London"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Postcode <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={jobData.postcode}
                      onChange={(e) => setJobData({ ...jobData, postcode: e.target.value.toUpperCase() })}
                      placeholder="e.g., SW1A 1AA"
                      className="h-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Budget (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                    <Input
                      type="number"
                      value={jobData.budget}
                      onChange={(e) => setJobData({ ...jobData, budget: e.target.value })}
                      placeholder="Enter your budget"
                      className="h-12 pl-8"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Leave blank if you&apos;d like contractors to quote
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Timing */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>When do you need this done?</CardTitle>
                  <p className="text-slate-500">Help contractors understand your timeline</p>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium text-slate-900 mb-4">How urgent is this job?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {urgencyOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setJobData({ ...jobData, urgency: option.id })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          jobData.urgency === option.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="font-medium text-slate-900 block">{option.label}</span>
                        <span className="text-sm text-slate-500">{option.desc}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preferred times (optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekends'].map(
                      (time) => (
                        <button
                          key={time}
                          onClick={() => {
                            const times = jobData.preferredTimes.includes(time)
                              ? jobData.preferredTimes.filter((t) => t !== time)
                              : [...jobData.preferredTimes, time];
                            setJobData({ ...jobData, preferredTimes: times });
                          }}
                          className={`px-4 py-2 rounded-full border-2 transition-all ${
                            jobData.preferredTimes.includes(time)
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {time}
                        </button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Post Your Job</CardTitle>
                <p className="text-slate-500">Check everything looks correct before posting</p>
              </CardHeader>
              <CardContent>
                {/* Job Summary */}
                <div className="border-b pb-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Image 
                        src={categories.find((c) => c.id === jobData.category)?.icon || '/icons/services/other.png'} 
                        alt="Category" 
                        width={32} 
                        height={32}
                      />
                    </div>
                    <div>
                      <span className="text-sm text-slate-500">
                        {categories.find((c) => c.id === jobData.category)?.name || 'Other'}
                      </span>
                      <h2 className="text-xl font-semibold text-slate-900">{jobData.title}</h2>
                    </div>
                  </div>
                  <p className="text-slate-600 whitespace-pre-wrap">{jobData.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl mb-6">
                  <div>
                    <span className="text-sm text-slate-500">Location</span>
                    <p className="font-medium text-slate-900">
                      {jobData.location || 'Not specified'}{jobData.location ? ', ' : ''}{jobData.postcode}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Budget</span>
                    <p className="font-medium text-slate-900">
                      {jobData.budget ? `£${jobData.budget}` : 'Open to quotes'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Urgency</span>
                    <p className="font-medium text-slate-900">
                      {urgencyOptions.find((u) => u.id === jobData.urgency)?.label || 'Flexible'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Preferred Times</span>
                    <p className="font-medium text-slate-900">
                      {jobData.preferredTimes.length > 0
                        ? jobData.preferredTimes.join(', ')
                        : 'Flexible'}
                    </p>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="font-medium text-emerald-900 mb-3">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-emerald-800">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Your job will be posted to local contractors
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Receive up to 5 quotes from interested professionals
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Compare quotes, reviews, and choose the best fit
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
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
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700"
              >
                Continue →
              </Button>
            ) : (
              <Button
                onClick={handleSubmitJob}
                disabled={submitting}
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? 'Posting...' : 'Post My Job'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

