'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, ContractorSidebar } from '@/components/dashboard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: number;
  type: 'MONTHLY' | 'ANNUAL';
  startDate: string;
  endDate: string;
  active: boolean;
  isActive: boolean;
}

interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: Subscription;
}

const PRICING = {
  MONTHLY: {
    price: 29.99,
    period: 'month',
    savings: null
  },
  ANNUAL: {
    price: 299.99,
    period: 'year',
    savings: '2 months free!'
  }
};

export default function ContractorSubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'SUBCONTRACTOR') {
      router.push('/auth/login');
      return;
    }
    fetchSubscription();
  }, [user, authLoading, router]);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/me');
      setSubscriptionData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (type: 'MONTHLY' | 'ANNUAL') => {
    setSubmitting(true);
    try {
      await api.post('/subscriptions', { type });
      fetchSubscription();
      alert('Subscription activated! You now have unlimited job access.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await api.delete('/subscriptions');
      setShowConfirmCancel(false);
      fetchSubscription();
      alert('Subscription cancelled. You will retain access until the end of your billing period.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error cancelling subscription');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout sidebar={<ContractorSidebar />} allowedRoles={['SUBCONTRACTOR']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E86A33]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const subscription = subscriptionData?.subscription;
  const isActive = subscriptionData?.hasSubscription;

  return (
    <DashboardLayout sidebar={<ContractorSidebar />} allowedRoles={['SUBCONTRACTOR']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Subscription</h1>
            <p className="text-slate-300">Manage your ConnectTeam subscription plan.</p>
          </div>

        {/* Current Subscription Status */}
        {isActive && subscription && (
          <Card className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 border-0">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✓</span>
                    <h2 className="text-xl font-bold">Active Subscription</h2>
                  </div>
                  <p className="text-green-100">
                    {subscription.type === 'MONTHLY' ? 'Monthly' : 'Annual'} Plan
                  </p>
                  <p className="text-green-200 text-sm mt-1">
                    Valid until: {new Date(subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    ${subscription.type === 'MONTHLY' ? PRICING.MONTHLY.price : PRICING.ANNUAL.price}
                  </p>
                  <p className="text-green-200">
                    /{subscription.type === 'MONTHLY' ? 'month' : 'year'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card className="mb-8 bg-white/5 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Subscription Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: '🔓', title: 'Unlimited Job Unlocks', desc: 'Access all job contact details for free' },
                { icon: '⭐', title: 'Priority Matching', desc: 'Get matched to jobs before non-subscribers' },
                { icon: '📊', title: 'Advanced Analytics', desc: 'View detailed performance metrics' },
                { icon: '🏷️', title: 'Verified Badge', desc: 'Stand out with a subscriber badge on your profile' },
                { icon: '💬', title: 'Direct Messaging', desc: 'Message customers directly through the platform' },
                { icon: '📱', title: 'Mobile Alerts', desc: 'Instant notifications for new matching jobs' },
              ].map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <span className="text-2xl">{benefit.icon}</span>
                  <div>
                    <h4 className="font-medium text-white">{benefit.title}</h4>
                    <p className="text-sm text-slate-300">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        {!isActive && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Monthly Plan */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedPlan === 'MONTHLY' 
                  ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-400' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => setSelectedPlan('MONTHLY')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Monthly</h3>
                    <p className="text-slate-300 text-sm">Pay month-to-month</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'MONTHLY' ? 'border-white bg-white' : 'border-white/50'
                  }`}>
                    {selectedPlan === 'MONTHLY' && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">${PRICING.MONTHLY.price}</span>
                  <span className="text-slate-300">/month</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Cancel anytime</li>
                  <li>✓ Full access to all features</li>
                  <li>✓ No long-term commitment</li>
                </ul>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card 
              className={`cursor-pointer transition-all relative overflow-hidden ${
                selectedPlan === 'ANNUAL' 
                  ? 'bg-purple-600 border-purple-400 ring-2 ring-purple-400' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => setSelectedPlan('ANNUAL')}
            >
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                BEST VALUE
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Annual</h3>
                    <p className="text-slate-300 text-sm">Save with yearly billing</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'ANNUAL' ? 'border-white bg-white' : 'border-white/50'
                  }`}>
                    {selectedPlan === 'ANNUAL' && (
                      <span className="text-purple-600 text-sm">✓</span>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">${PRICING.ANNUAL.price}</span>
                  <span className="text-slate-300">/year</span>
                  <p className="text-green-400 text-sm mt-1">
                    {PRICING.ANNUAL.savings}
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Save ${(PRICING.MONTHLY.price * 12 - PRICING.ANNUAL.price).toFixed(2)}/year</li>
                  <li>✓ Full access to all features</li>
                  <li>✓ Priority support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscribe Button */}
        {!isActive && (
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardContent className="p-6 text-center">
              <Button
                onClick={() => handleSubscribe(selectedPlan)}
                disabled={submitting}
                className={`px-8 py-6 text-lg ${
                  selectedPlan === 'MONTHLY' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {submitting ? 'Processing...' : `Subscribe to ${selectedPlan === 'MONTHLY' ? 'Monthly' : 'Annual'} Plan`}
              </Button>
              <p className="text-slate-400 text-sm mt-4">
                By subscribing, you agree to our Terms of Service and Privacy Policy.
                Payment will be processed securely.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cancel Subscription */}
        {isActive && (
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white">Cancel Subscription</h3>
                  <p className="text-sm text-slate-400">
                    You will retain access until {subscription && new Date(subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmCancel(true)}
                  className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Cancel Modal */}
        {showConfirmCancel && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Cancel Subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  Are you sure you want to cancel your subscription? You will:
                </p>
                <ul className="text-slate-600 mb-6 space-y-2">
                  <li>• Lose access to unlimited job unlocks</li>
                  <li>• No longer receive priority matching</li>
                  <li>• Keep access until {subscription && new Date(subscription.endDate).toLocaleDateString()}</li>
                </ul>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmCancel(false)}
                    disabled={submitting}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    {submitting ? 'Cancelling...' : 'Yes, Cancel'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}

