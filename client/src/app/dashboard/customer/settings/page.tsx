'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, CustomerSidebar } from '@/components/dashboard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface CustomerProfile {
  id: number;
  companyName: string | null;
  address: string | null;
  type: string;
  companyNumber: string | null;
  industry: string | null;
  billingEmail: string | null;
  vatNumber: string | null;
}

interface UserProfile {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  customerProfile: CustomerProfile | null;
}

export default function CustomerSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Commercial fields
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const isCommercial = user?.role === 'CUST_COMMERCIAL';

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.role.startsWith('CUST')) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${user?.id}`);
      const data = res.data as UserProfile;
      setProfile(data);

      // Populate form
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
      setAddress(data.customerProfile?.address || '');
      
      // Commercial fields
      setCompanyName(data.customerProfile?.companyName || '');
      setCompanyNumber(data.customerProfile?.companyNumber || '');
      setIndustry(data.customerProfile?.industry || '');
      setBillingEmail(data.customerProfile?.billingEmail || '');
      setVatNumber(data.customerProfile?.vatNumber || '');
    } catch (err) {
      console.error(err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.put(`/users/${user?.id}`, {
        firstName,
        lastName,
        phone,
        customerProfile: {
          address,
          ...(isCommercial && {
            companyName,
            companyNumber,
            industry,
            billingEmail,
            vatNumber,
          }),
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
            <p className="text-slate-500">Manage your profile and preferences.</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
              <span>✓</span> Your changes have been saved successfully.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}

          {/* Profile Summary Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {(firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {firstName} {lastName || profile?.email}
                  </h2>
                  <p className="text-slate-500">{profile?.email}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                    isCommercial 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isCommercial ? 'Business Account' : 'Homeowner Account'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Your last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07700 000000"
                  type="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="bg-slate-100 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Email address cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your home or primary address"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Details (Commercial Only) */}
          {isCommercial && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Number</label>
                    <Input
                      value={companyNumber}
                      onChange={(e) => setCompanyNumber(e.target.value)}
                      placeholder="e.g., 12345678"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                    <Input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Retail, Healthcare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">VAT Number</label>
                    <Input
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="e.g., GB123456789"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Email</label>
                  <Input
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="accounts@company.com"
                    type="email"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Invoices and receipts will be sent to this address
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Preferences */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium text-slate-900">Email notifications</span>
                    <p className="text-sm text-slate-500">Receive updates about your jobs via email</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium text-slate-900">SMS notifications</span>
                    <p className="text-sm text-slate-500">Receive important updates via text message</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium text-slate-900">Marketing emails</span>
                    <p className="text-sm text-slate-500">Tips, offers, and news from our team</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/customer')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

