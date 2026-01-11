'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import PublicLayout from '@/components/public/PublicLayout';
import api from '@/lib/api';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  canApprove: boolean;
}

interface OnboardingData {
  // Step 1: Account
  email: string;
  password: string;
  firstName: string;
  lastName: string;

  // Step 2: Company Details
  companyName: string;
  companyNumber: string;
  vatNumber: string;
  industry: string;
  companySize: string;

  // Step 3: Locations
  locations: Location[];

  // Step 4: Team & Users
  teamMembers: TeamMember[];

  // Step 5: Billing
  billingEmail: string;
  billingAddress: string;
  billingCity: string;
  billingPostcode: string;
  paymentMethod: string;

  // Step 6: Branding
  primaryColor: string;
}

const initialData: OnboardingData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  companyName: '',
  companyNumber: '',
  vatNumber: '',
  industry: '',
  companySize: '',
  locations: [{
    id: '1',
    name: 'Head Office',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
    isPrimary: true,
  }],
  teamMembers: [],
  billingEmail: '',
  billingAddress: '',
  billingCity: '',
  billingPostcode: '',
  paymentMethod: 'invoice',
  primaryColor: '#7c3aed',
};

const industries = [
  'Retail',
  'Hospitality',
  'Healthcare',
  'Property Management',
  'Education',
  'Manufacturing',
  'Financial Services',
  'Technology',
  'Construction',
  'Other',
];

const companySizes = [
  { value: 'small', label: '1-10 employees', locations: '1-5 locations' },
  { value: 'medium', label: '11-50 employees', locations: '6-20 locations' },
  { value: 'large', label: '51-200 employees', locations: '21-100 locations' },
  { value: 'enterprise', label: '200+ employees', locations: '100+ locations' },
];

const teamRoles = [
  { value: 'admin', label: 'Administrator', desc: 'Full access to all features' },
  { value: 'manager', label: 'Manager', desc: 'Can create jobs and approve quotes' },
  { value: 'viewer', label: 'Viewer', desc: 'View only access' },
];

export default function CommercialOnboarding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 7;

  // If user is already logged in, skip to step 2
  useEffect(() => {
    if (!authLoading && user) {
      if (step === 1) setStep(2);
      setData(prev => ({ ...prev, email: user.email }));
    }
  }, [user, authLoading, step]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return (
          data.email.includes('@') &&
          data.password.length >= 8 &&
          data.firstName.trim().length >= 2
        );
      case 2:
        return (
          data.companyName.trim().length >= 2 &&
          data.industry !== '' &&
          data.companySize !== ''
        );
      case 3:
        return data.locations.length > 0 && data.locations[0].postcode.trim().length >= 3;
      case 4:
        return true; // Team members are optional
      case 5:
        return data.billingEmail.includes('@');
      case 6:
        return true; // Branding is optional
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step === 1 && !user) {
      // Create account first
      setSubmitting(true);
      setError('');
      try {
        await api.post('/auth/register', {
          email: data.email,
          password: data.password,
          role: 'CUST_COMMERCIAL',
          firstName: data.firstName,
          lastName: data.lastName,
        });
        await api.post('/auth/login', {
          email: data.email,
          password: data.password,
        });
        window.location.reload();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to create account');
        setSubmitting(false);
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (step > (user ? 2 : 1)) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // In production, this would save to the API
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/dashboard/customer?onboarded=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete setup');
    } finally {
      setSubmitting(false);
    }
  };

  const addLocation = () => {
    const newLocation: Location = {
      id: Date.now().toString(),
      name: `Location ${data.locations.length + 1}`,
      address: '',
      city: '',
      postcode: '',
      phone: '',
      email: '',
      isPrimary: false,
    };
    setData({ ...data, locations: [...data.locations, newLocation] });
  };

  const updateLocation = (id: string, field: keyof Location, value: string | boolean) => {
    setData({
      ...data,
      locations: data.locations.map(loc =>
        loc.id === id ? { ...loc, [field]: value } : loc
      ),
    });
  };

  const removeLocation = (id: string) => {
    if (data.locations.length > 1) {
      setData({
        ...data,
        locations: data.locations.filter(loc => loc.id !== id),
      });
    }
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'viewer',
      department: '',
      canApprove: false,
    };
    setData({ ...data, teamMembers: [...data.teamMembers, newMember] });
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string | boolean) => {
    setData({
      ...data,
      teamMembers: data.teamMembers.map(member =>
        member.id === id ? { ...member, [field]: value } : member
      ),
    });
  };

  const removeTeamMember = (id: string) => {
    setData({
      ...data,
      teamMembers: data.teamMembers.filter(member => member.id !== id),
    });
  };

  return (
    <PublicLayout>
      <div className="min-h-[70vh] bg-gradient-to-br from-violet-50 to-purple-50">
        {/* Progress Bar with purple top border */}
        <div className="bg-white border-b border-slate-200 shadow-sm border-t-4 border-t-violet-500">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-slate-600">Business Account Setup — Step {step} of {totalSteps}</span>
              <span className="font-medium text-violet-600">
                {Math.round((step / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Create Account */}
        {step === 1 && !user && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your business account</h1>
            <p className="text-slate-600 mb-8">Start by setting up your personal login credentials</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={data.firstName}
                    onChange={(e) => setData({ ...data, firstName: e.target.value })}
                    placeholder="John"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    value={data.lastName}
                    onChange={(e) => setData({ ...data, lastName: e.target.value })}
                    placeholder="Smith"
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="john@company.com"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="h-12"
                />
              </div>

              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-violet-600 font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Company Details */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your company</h1>
            <p className="text-slate-600 mb-8">This helps us customize your experience</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  placeholder="Acme Corporation Ltd"
                  className="h-12"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Number
                  </label>
                  <Input
                    value={data.companyNumber}
                    onChange={(e) => setData({ ...data, companyNumber: e.target.value })}
                    placeholder="12345678"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    VAT Number
                  </label>
                  <Input
                    value={data.vatNumber}
                    onChange={(e) => setData({ ...data, vatNumber: e.target.value })}
                    placeholder="GB123456789"
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Industry <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.industry}
                  onChange={(e) => setData({ ...data, industry: e.target.value })}
                  className="w-full h-12 px-4 border border-slate-300 rounded-lg"
                >
                  <option value="">Select your industry...</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Company Size <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {companySizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setData({ ...data, companySize: size.value })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        data.companySize === size.value
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-medium text-slate-900 block">{size.label}</span>
                      <span className="text-sm text-slate-500">{size.locations}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Locations */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Add your locations</h1>
            <p className="text-slate-600 mb-8">Add all the sites where you need maintenance services</p>

            <div className="space-y-4">
              {data.locations.map((location, index) => (
                <div key={location.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <Input
                        value={location.name}
                        onChange={(e) => updateLocation(location.id, 'name', e.target.value)}
                        placeholder="Location name"
                        className="h-10 w-48 font-medium"
                      />
                      {location.isPrimary && (
                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded">Primary</span>
                      )}
                    </div>
                    {data.locations.length > 1 && (
                      <button
                        onClick={() => removeLocation(location.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-600 mb-1">Address</label>
                      <Input
                        value={location.address}
                        onChange={(e) => updateLocation(location.id, 'address', e.target.value)}
                        placeholder="123 High Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">City</label>
                      <Input
                        value={location.city}
                        onChange={(e) => updateLocation(location.id, 'city', e.target.value)}
                        placeholder="London"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Postcode <span className="text-red-500">*</span></label>
                      <Input
                        value={location.postcode}
                        onChange={(e) => updateLocation(location.id, 'postcode', e.target.value.toUpperCase())}
                        placeholder="SW1A 1AA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Phone</label>
                      <Input
                        value={location.phone}
                        onChange={(e) => updateLocation(location.id, 'phone', e.target.value)}
                        placeholder="020 1234 5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Email</label>
                      <Input
                        type="email"
                        value={location.email}
                        onChange={(e) => updateLocation(location.id, 'email', e.target.value)}
                        placeholder="location@company.com"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addLocation}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-violet-500 hover:text-violet-600 transition-colors"
              >
                + Add Another Location
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Team Members */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invite your team</h1>
            <p className="text-slate-600 mb-8">Add team members who will use the platform (you can skip and add later)</p>

            <div className="space-y-4">
              {data.teamMembers.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                  <span className="text-4xl mb-4 block">👥</span>
                  <h3 className="font-medium text-slate-900 mb-2">No team members added yet</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Add colleagues who need access to manage maintenance requests
                  </p>
                  <Button onClick={addTeamMember} variant="outline">
                    + Add Team Member
                  </Button>
                </div>
              ) : (
                <>
                  {data.teamMembers.map((member, index) => (
                    <div key={member.id} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium text-slate-900">Team Member {index + 1}</span>
                        <button
                          onClick={() => removeTeamMember(member.id)}
                          className="text-slate-400 hover:text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Name</label>
                          <Input
                            value={member.name}
                            onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Email</label>
                          <Input
                            type="email"
                            value={member.email}
                            onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                            placeholder="jane@company.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Role</label>
                          <select
                            value={member.role}
                            onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)}
                            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm"
                          >
                            {teamRoles.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label} - {role.desc}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Department</label>
                          <Input
                            value={member.department}
                            onChange={(e) => updateTeamMember(member.id, 'department', e.target.value)}
                            placeholder="Operations"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.canApprove}
                          onChange={(e) => updateTeamMember(member.id, 'canApprove', e.target.checked)}
                          className="w-4 h-4 text-violet-600 rounded"
                        />
                        <span className="text-sm text-slate-600">Can approve quotes and payments</span>
                      </label>
                    </div>
                  ))}

                  <button
                    onClick={addTeamMember}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-violet-500 hover:text-violet-600 transition-colors"
                  >
                    + Add Another Team Member
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Billing */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Billing preferences</h1>
            <p className="text-slate-600 mb-8">Set up how you'd like to receive invoices and make payments</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Billing Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={data.billingEmail}
                  onChange={(e) => setData({ ...data, billingEmail: e.target.value })}
                  placeholder="accounts@company.com"
                  className="h-12"
                />
                <p className="text-xs text-slate-500 mt-1">Invoices will be sent to this address</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Billing Address
                </label>
                <Input
                  value={data.billingAddress}
                  onChange={(e) => setData({ ...data, billingAddress: e.target.value })}
                  placeholder="123 Business Park"
                  className="h-12 mb-3"
                />
                <div className="grid md:grid-cols-2 gap-3">
                  <Input
                    value={data.billingCity}
                    onChange={(e) => setData({ ...data, billingCity: e.target.value })}
                    placeholder="City"
                  />
                  <Input
                    value={data.billingPostcode}
                    onChange={(e) => setData({ ...data, billingPostcode: e.target.value.toUpperCase() })}
                    placeholder="Postcode"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'invoice', label: 'Invoice (Net 30)', desc: 'Pay within 30 days of invoice' },
                    { value: 'card', label: 'Credit/Debit Card', desc: 'Automatic payment on completion' },
                    { value: 'direct-debit', label: 'Direct Debit', desc: 'Monthly consolidated billing' },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        data.paymentMethod === method.value
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={data.paymentMethod === method.value}
                        onChange={(e) => setData({ ...data, paymentMethod: e.target.value })}
                        className="w-4 h-4 text-violet-600"
                      />
                      <div>
                        <span className="font-medium text-slate-900">{method.label}</span>
                        <p className="text-sm text-slate-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Branding */}
        {step === 6 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Customize your portal</h1>
            <p className="text-slate-600 mb-8">Add your branding for a personalized experience (optional)</p>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div className="p-6 bg-slate-50 rounded-lg text-center">
                <span className="text-5xl mb-4 block">🏢</span>
                <h3 className="font-medium text-slate-900 mb-2">Upload Company Logo</h3>
                <p className="text-slate-500 text-sm mb-4">
                  In the full version, you can upload your company logo here
                </p>
                <Button variant="outline" disabled>Upload Logo</Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Brand Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={data.primaryColor}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={data.primaryColor}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    placeholder="#7c3aed"
                    className="w-32"
                  />
                  <span className="text-sm text-slate-500">
                    This will be used for buttons and accents in your portal
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {step === 7 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Review your setup</h1>
            <p className="text-slate-600 mb-8">Check everything looks correct before completing</p>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Company */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-slate-900 mb-3">Company Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">Company Name</span>
                    <p className="font-medium">{data.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Industry</span>
                    <p className="font-medium">{data.industry}</p>
                  </div>
                  {data.companyNumber && (
                    <div>
                      <span className="text-sm text-slate-500">Company Number</span>
                      <p className="font-medium">{data.companyNumber}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-slate-500">Size</span>
                    <p className="font-medium">
                      {companySizes.find(s => s.value === data.companySize)?.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div className="p-6 border-b bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Locations ({data.locations.length})
                </h3>
                <div className="space-y-2">
                  {data.locations.map((loc) => (
                    <div key={loc.id} className="flex items-center gap-2">
                      <span className="text-violet-600">📍</span>
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-slate-500">- {loc.city || loc.postcode}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Team Members ({data.teamMembers.length})
                </h3>
                {data.teamMembers.length === 0 ? (
                  <p className="text-slate-500">No team members added - you can add them later</p>
                ) : (
                  <div className="space-y-2">
                    {data.teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <span className="text-violet-600">👤</span>
                        <span className="font-medium">{member.name || member.email}</span>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {teamRoles.find(r => r.value === member.role)?.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing */}
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Billing</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">Billing Email</span>
                    <p className="font-medium">{data.billingEmail}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Payment Method</span>
                    <p className="font-medium capitalize">{data.paymentMethod.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-violet-50 rounded-lg border border-violet-200">
              <h3 className="font-medium text-violet-900 mb-2">What happens next?</h3>
              <ul className="space-y-1 text-sm text-violet-700">
                <li>✓ Your account will be activated immediately</li>
                <li>✓ Team members will receive email invitations</li>
                <li>✓ You can start posting maintenance requests right away</li>
                <li>✓ A dedicated account manager will be in touch within 24 hours</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || (step === 2 && user !== null)}
            className="h-12 px-6"
          >
            ← Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              className="h-12 px-8 bg-violet-600 hover:bg-violet-700"
            >
              {submitting ? 'Please wait...' : 'Continue →'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-12 px-8 bg-violet-600 hover:bg-violet-700"
            >
              {submitting ? 'Setting up...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </main>
      </div>
    </PublicLayout>
  );
}

