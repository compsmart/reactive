'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface ConfigValues {
  default_unlock_fee: string;
  monthly_subscription_price: string;
  annual_subscription_price: string;
  platform_commission_rate: string;
  booking_deadline_days: string;
  support_email: string;
  company_name: string;
}

const DEFAULT_CONFIG: ConfigValues = {
  default_unlock_fee: '10.00',
  monthly_subscription_price: '29.99',
  annual_subscription_price: '249.99',
  platform_commission_rate: '10',
  booking_deadline_days: '3',
  support_email: 'support@connectteam.com',
  company_name: 'ConnectTeam'
};

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigValues>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/config');
      setConfig({ ...DEFAULT_CONFIG, ...res.data });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/config', config);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof ConfigValues, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-slate-500">Configure platform settings and pricing</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={config.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Support Email</label>
                <Input
                  type="email"
                  value={config.support_email}
                  onChange={(e) => handleChange('support_email', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Default Job Unlock Fee ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.default_unlock_fee}
                    onChange={(e) => handleChange('default_unlock_fee', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Default fee for contractors to unlock job contact details
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Platform Commission (%)</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={config.platform_commission_rate}
                    onChange={(e) => handleChange('platform_commission_rate', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Commission taken from job payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Monthly Subscription Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.monthly_subscription_price}
                    onChange={(e) => handleChange('monthly_subscription_price', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Annual Subscription Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.annual_subscription_price}
                    onChange={(e) => handleChange('annual_subscription_price', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Discount: {(100 - (Number(config.annual_subscription_price) / (Number(config.monthly_subscription_price) * 12)) * 100).toFixed(0)}% off monthly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Job Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Booking Deadline (days)</label>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={config.booking_deadline_days}
                  onChange={(e) => handleChange('booking_deadline_days', e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Days contractors have to schedule a job after being assigned
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="w-40">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

