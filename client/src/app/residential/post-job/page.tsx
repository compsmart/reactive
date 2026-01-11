'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import PublicLayout from '@/components/public/PublicLayout';
import api from '@/lib/api';
import {
  compressImage,
  fileToBase64,
  base64ToFile,
  type SerializedImage,
} from '@/lib/imageCompression';

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

const STORAGE_KEY = 'reactive_draft_job';
const MAX_IMAGES = 5;

interface JobData {
  category: string;
  title: string;
  description: string;
  location: string;
  postcode: string;
  budget: string;
  urgency: string;
  preferredTimes: string[];
  photos: File[];
}

interface SerializedJobData {
  category: string;
  title: string;
  description: string;
  location: string;
  postcode: string;
  budget: string;
  urgency: string;
  preferredTimes: string[];
  photos: SerializedImage[];
  step: number;
}

interface SelectedContractor {
  id: number;
  businessName: string;
  phone: string | null;
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
  photos: [],
};

function PostJobWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [jobData, setJobData] = useState<JobData>(initialJobData);
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'register' | null>(null);
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedContractors, setSelectedContractors] = useState<SelectedContractor[]>([]);
  const [fromSmartSearch, setFromSmartSearch] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const restoreFromStorage = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const parsed: SerializedJobData = JSON.parse(stored);
        
        // Deserialize photos back to File objects
        const photos = parsed.photos.map((img) =>
          base64ToFile(img.base64, img.name, img.type)
        );

        // Generate previews for restored photos
        const previews = parsed.photos.map((img) => img.base64);

        setJobData({
          category: parsed.category,
          title: parsed.title,
          description: parsed.description,
          location: parsed.location,
          postcode: parsed.postcode,
          budget: parsed.budget,
          urgency: parsed.urgency,
          preferredTimes: parsed.preferredTimes,
          photos,
        });
        setPhotoPreviews(previews);
        
        // Resume at saved step (at least step 3 if user just authenticated)
        const resumeStep = user ? Math.max(parsed.step, 3) : parsed.step;
        setStep(resumeStep);
        setRestoredFromStorage(true);
      } catch (err) {
        console.error('Failed to restore job data:', err);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    // Only restore after auth loading is complete
    if (!authLoading) {
      restoreFromStorage();
    }
  }, [authLoading, user]);

  // Pre-select category from URL params (only if not restored from storage)
  useEffect(() => {
    if (restoredFromStorage) return;
    
    const category = searchParams.get('category');
    if (category) {
      setJobData((prev) => ({ ...prev, category }));
    }
  }, [searchParams, restoredFromStorage]);

  // Handle smart search contractors from URL params
  useEffect(() => {
    const contractorIds = searchParams.get('contractors');
    const trade = searchParams.get('trade');
    const locationParam = searchParams.get('location');

    if (contractorIds) {
      setFromSmartSearch(true);
      
      // Pre-fill trade/category if provided
      if (trade) {
        setJobData((prev) => ({ ...prev, category: trade }));
      }
      
      // Pre-fill location if provided
      if (locationParam) {
        setJobData((prev) => ({ ...prev, location: locationParam }));
      }

      // Fetch contractor details
      const ids = contractorIds.split(',').filter(Boolean);
      const fetchContractors = async () => {
        try {
          // Fetch each contractor's details - in production, use a batch endpoint
          const contractors: SelectedContractor[] = [];
          for (const id of ids) {
            try {
              // For now, we'll use a simplified approach since we don't have a get-by-id endpoint
              // Store the IDs and we'll fetch names when available
              contractors.push({
                id: parseInt(id, 10),
                businessName: `Contractor #${id}`,
                phone: null
              });
            } catch (err) {
              console.error(`Failed to fetch contractor ${id}:`, err);
            }
          }
          setSelectedContractors(contractors);
        } catch (err) {
          console.error('Failed to fetch contractors:', err);
        }
      };

      fetchContractors();
    }
  }, [searchParams]);

  // Save to localStorage when relevant data changes
  const saveToStorage = useCallback(async () => {
    try {
      // Serialize photos to base64
      const serializedPhotos: SerializedImage[] = await Promise.all(
        jobData.photos.map(async (file) => ({
          name: file.name,
          type: file.type,
          base64: await fileToBase64(file),
        }))
      );

      const dataToStore: SerializedJobData = {
        category: jobData.category,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        postcode: jobData.postcode,
        budget: jobData.budget,
        urgency: jobData.urgency,
        preferredTimes: jobData.preferredTimes,
        photos: serializedPhotos,
        step,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (err) {
      console.error('Failed to save job data:', err);
    }
  }, [jobData, step]);

  // Clear storage after successful submission
  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

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
        return user !== null || showAuthForm === null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step === 3 && !user) {
      // Save before showing auth form
      await saveToStorage();
      setShowAuthForm('register');
      return;
    }
    if (step < totalSteps) {
      const newStep = step + 1;
      setStep(newStep);
      // Save progress
      await saveToStorage();
    }
  };

  const handleBack = () => {
    if (showAuthForm) {
      setShowAuthForm(null);
      return;
    }
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - jobData.photos.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    setCompressing(true);
    setError('');

    try {
      const compressedFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of selectedFiles) {
        // Compress the image to max 1MB
        const compressed = await compressImage(file);
        compressedFiles.push(compressed);

        // Generate preview
        const preview = await fileToBase64(compressed);
        newPreviews.push(preview);
      }

      setJobData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...compressedFiles],
      }));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Failed to compress images:', err);
      setError('Failed to process some images. Please try again.');
    } finally {
      setCompressing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove an image
  const handleRemoveImage = (index: number) => {
    setJobData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Filter for images only
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      setError('Please drop image files only');
      return;
    }

    const remainingSlots = MAX_IMAGES - jobData.photos.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const selectedFiles = imageFiles.slice(0, remainingSlots);
    setCompressing(true);
    setError('');

    try {
      const compressedFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of selectedFiles) {
        const compressed = await compressImage(file);
        compressedFiles.push(compressed);

        const preview = await fileToBase64(compressed);
        newPreviews.push(preview);
      }

      setJobData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...compressedFiles],
      }));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Failed to compress images:', err);
      setError('Failed to process some images. Please try again.');
    } finally {
      setCompressing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    // Save current state before auth
    await saveToStorage();
    
    try {
      await api.post('/auth/login', {
        email: authData.email,
        password: authData.password,
      });
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (authData.password !== authData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    
    // Save current state before auth
    await saveToStorage();
    
    try {
      await api.post('/auth/register', {
        email: authData.email,
        password: authData.password,
        role: 'CUST_RESIDENTIAL',
      });
      // Auto login after registration
      await api.post('/auth/login', {
        email: authData.email,
        password: authData.password,
      });
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitJob = async () => {
    setError('');
    setSubmitting(true);
    try {
      // Create the job
      const jobResponse = await api.post('/jobs', {
        title: jobData.title,
        description: `${jobData.description}\n\nCategory: ${jobData.category}\nUrgency: ${jobData.urgency}\nPreferred times: ${jobData.preferredTimes.join(', ') || 'Flexible'}`,
        budget: jobData.budget ? parseFloat(jobData.budget) : undefined,
        location: `${jobData.location}, ${jobData.postcode}`,
        latitude: 51.5074, // Would use geolocation API in production
        longitude: -0.1278,
      });

      const jobId = jobResponse.data.id;

      // If we have selected contractors from smart search, send the job to them
      if (selectedContractors.length > 0 && jobId) {
        try {
          await api.post('/smart-search/send-job', {
            jobId: jobId.toString(),
            contractorIds: selectedContractors.map(c => c.id.toString())
          });
        } catch (sendErr) {
          console.error('Failed to send job to contractors:', sendErr);
          // Continue anyway - job was created successfully
        }
      }
      
      // Clear saved draft after successful submission
      clearStorage();
      
      const successMessage = selectedContractors.length > 0 
        ? `posted=true&sent=${selectedContractors.length}`
        : 'posted=true';
      router.push(`/dashboard/customer?${successMessage}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  // Auth form overlay
  if (showAuthForm && !user) {
    return (
      <PublicLayout>
        <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <button
              onClick={handleBack}
              className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-2"
            >
              ← Back to job details
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {showAuthForm === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-slate-600 mb-6">
              {showAuthForm === 'login'
                ? 'Log in to post your job'
                : 'Sign up to post your job and receive quotes'}
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              <p className="text-emerald-700 text-sm flex items-center gap-2">
                <span>✓</span>
                Your job details have been saved and will be restored after you sign in.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={showAuthForm === 'login' ? handleLogin : handleRegister}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <Input
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                </div>
                {showAuthForm === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      value={authData.confirmPassword}
                      onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <Button type="submit" className="w-full h-12" disabled={submitting}>
                  {submitting
                    ? 'Please wait...'
                    : showAuthForm === 'login'
                    ? 'Log In'
                    : 'Create Account'}
                </Button>
              </div>
            </form>

            <p className="text-center text-slate-600 mt-6">
              {showAuthForm === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setShowAuthForm('register')}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowAuthForm('login')}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[70vh] bg-slate-100">
        {/* Progress Bar with green top border */}
        <div className="bg-white border-b shadow-sm border-t-4 border-t-emerald-500">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Step {step} of {totalSteps}</span>
              <span className="text-sm font-medium text-emerald-600">
                {Math.round((step / totalSteps) * 100)}% Complete
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
      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">What type of work do you need?</h1>
            <p className="text-slate-600 mb-6">Select the category that best matches your job</p>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setJobData({ ...jobData, category: cat.id })}
                  className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center justify-center aspect-square ${
                    jobData.category === cat.id
                      ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-emerald-300 bg-white hover:shadow-md'
                  }`}
                >
                  <Image 
                    src={cat.icon} 
                    alt={cat.name} 
                    width={56} 
                    height={56} 
                    className="mb-2 object-contain"
                  />
                  <span className="text-xs font-medium text-slate-700 leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Job Details */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your job</h1>
            <p className="text-slate-600 mb-8">The more detail you provide, the better quotes you'll receive</p>

            <div className="space-y-6 bg-white rounded-xl p-6 shadow-sm">
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
                <p className="text-xs text-slate-500 mt-1">Minimum 5 characters</p>
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

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photos (Optional)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Add up to {MAX_IMAGES} photos to help contractors understand the job. Images will be compressed to max 1MB.
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    compressing
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                  }`}
                >
                  {compressing ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                      <p className="text-slate-600">Compressing images...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center mb-3">
                        <svg
                          className="w-10 h-10 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-slate-600 mb-2">
                        Drag and drop images here, or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-emerald-600 font-medium hover:underline"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-slate-400">
                        {jobData.photos.length}/{MAX_IMAGES} images added
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Image Previews */}
                {photoPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          {(jobData.photos[index]?.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                  Leave blank if you'd like contractors to quote
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Account / Timing */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">When do you need this done?</h1>
            <p className="text-slate-600 mb-8">Help contractors understand your timeline</p>

            <div className="space-y-6">
              {/* Urgency */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-slate-900 mb-4">How urgent is this job?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {urgencyOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setJobData({ ...jobData, urgency: option.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        jobData.urgency === option.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-medium text-slate-900 block">{option.label}</span>
                      <span className="text-sm text-slate-500">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Times */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-slate-900 mb-4">
                  Preferred times (select all that apply)
                </h3>
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
                        className={`px-4 py-2 rounded-full border transition-all ${
                          jobData.preferredTimes.includes(time)
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  )}
                </div>
              </div>

              {!user && (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Almost there!</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Create a free account to post your job and receive quotes from contractors.
                  </p>
                  <Button
                    onClick={() => setShowAuthForm('register')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Account & Continue
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Review & Post Your Job</h1>
            <p className="text-slate-600 mb-8">Check everything looks correct before posting</p>

            {/* Smart Search Contractors Banner */}
            {fromSmartSearch && selectedContractors.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">AI Smart Search Selection</h3>
                    <p className="text-sm text-slate-600">
                      Your job will be sent to {selectedContractors.length} contractor{selectedContractors.length > 1 ? 's' : ''} you selected
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedContractors.map((contractor) => (
                    <span
                      key={contractor.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-purple-200 rounded-full text-sm text-slate-700"
                    >
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      {contractor.businessName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Job Summary */}
              <div className="p-6 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">
                    {categories.find((c) => c.id === jobData.category)?.icon || '📋'}
                  </span>
                  <div>
                    <span className="text-sm text-slate-500">
                      {categories.find((c) => c.id === jobData.category)?.name || 'Other'}
                    </span>
                    <h2 className="text-xl font-semibold text-slate-900">{jobData.title}</h2>
                  </div>
                </div>
                <p className="text-slate-600 whitespace-pre-wrap">{jobData.description}</p>
              </div>

              {/* Photo Preview in Review */}
              {photoPreviews.length > 0 && (
                <div className="p-6 border-b">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Photos ({photoPreviews.length})</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {photoPreviews.map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="p-6 bg-slate-50 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Location</span>
                  <p className="font-medium text-slate-900">
                    {jobData.location || 'Not specified'}, {jobData.postcode}
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
              <div className="p-6 border-t">
                <h3 className="font-medium text-slate-900 mb-3">What happens next?</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {fromSmartSearch && selectedContractors.length > 0 ? (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-500">✓</span>
                        Your job details will be sent to {selectedContractors.length} selected contractor{selectedContractors.length > 1 ? 's' : ''}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-500">✓</span>
                        They will receive your contact details to provide quotes
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-500">✓</span>
                        You&apos;ll be notified when they respond
                      </li>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </ul>
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
              disabled={!canProceed() || compressing}
              className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700"
            >
              Continue →
            </Button>
          ) : (
            <Button
              onClick={handleSubmitJob}
              disabled={submitting || !user}
              className={`h-12 px-8 ${
                fromSmartSearch 
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting 
                ? 'Sending...' 
                : fromSmartSearch && selectedContractors.length > 0
                  ? `Send to ${selectedContractors.length} Contractor${selectedContractors.length > 1 ? 's' : ''}`
                  : 'Post My Job'}
            </Button>
          )}
        </div>
      </main>
      </div>
    </PublicLayout>
  );
}

export default function PostJobWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PostJobWizardContent />
    </Suspense>
  );
}
