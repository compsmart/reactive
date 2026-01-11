'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, ContractorSidebar } from '@/components/dashboard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Payment {
  id: number;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  createdAt: string;
  job?: {
    id: number;
    title: string;
  };
}

interface CompletedJob {
  id: number;
  title: string;
  contractorPayRate: number | null;
  contractorPayType: string | null;
  completedAt: string;
}

interface EarningsData {
  summary: {
    totalEarnings: number;
    thisMonthEarnings: number;
    pendingEarnings: number;
    completedJobsCount: number;
  };
  payments: Payment[];
  completedJobs: CompletedJob[];
}

export default function ContractorEarningsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'jobs'>('payments');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'SUBCONTRACTOR') {
      router.push('/auth/login');
      return;
    }
    fetchEarnings();
  }, [user, authLoading, router]);

  const fetchEarnings = async () => {
    try {
      const res = await api.get(`/users/${user?.id}/earnings`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
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

  return (
    <DashboardLayout sidebar={<ContractorSidebar />} allowedRoles={['SUBCONTRACTOR']}>
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Earnings</h1>
            <p className="text-slate-500">Track your income and payment history.</p>
          </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500">Total Earnings</p>
              <p className="text-3xl font-bold text-green-600">
                ${data?.summary.totalEarnings.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-400 mt-1">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500">This Month</p>
              <p className="text-3xl font-bold text-blue-600">
                ${data?.summary.thisMonthEarnings.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleString('default', { month: 'long' })}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                ${data?.summary.pendingEarnings.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500">Completed Jobs</p>
              <p className="text-3xl font-bold text-purple-600">
                {data?.summary.completedJobsCount || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total jobs done</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed Jobs
          </button>
        </div>

        {/* Payment History Tab */}
        {activeTab === 'payments' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.payments.length ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">💰</p>
                  <p className="text-slate-500">No payment records yet</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Payments will appear here after completing jobs
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Job</th>
                        <th className="text-left p-3">Description</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-right p-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 text-sm text-slate-600">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {payment.job ? (
                              <span className="font-medium">{payment.job.title}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-slate-600">
                            {payment.description || '-'}
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold text-green-600">
                            ${Number(payment.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Jobs Tab */}
        {activeTab === 'jobs' && (
          <Card>
            <CardHeader>
              <CardTitle>Completed Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.completedJobs.length ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">📋</p>
                  <p className="text-slate-500">No completed jobs yet</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Complete your first job to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.completedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{job.title}</h3>
                        <p className="text-sm text-slate-500">
                          Completed: {job.completedAt 
                            ? new Date(job.completedAt).toLocaleDateString()
                            : 'Unknown'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        {job.contractorPayRate ? (
                          <p className="font-semibold text-green-600">
                            ${Number(job.contractorPayRate).toFixed(2)}
                            {job.contractorPayType === 'HOURLY' && (
                              <span className="text-slate-400 text-sm">/hr</span>
                            )}
                          </p>
                        ) : (
                          <span className="text-slate-400">Rate TBD</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">💡</span>
              <div>
                <h3 className="font-semibold text-blue-800">Payment Information</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Payments are processed after the customer signs off on completed work.
                  Typically, payments are deposited within 3-5 business days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

