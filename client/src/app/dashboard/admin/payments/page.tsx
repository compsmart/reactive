'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import Link from 'next/link';

interface Payment {
  id: number;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  createdAt: string;
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  job?: {
    id: number;
    title: string;
  };
}

interface Stats {
  totalRevenue: number;
  subscriptionRevenue: number;
  unlockRevenue: number;
  jobPayments: number;
  pendingPayments: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [pagination.page, typeFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(pagination.page));
      params.append('limit', '20');
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const [paymentsRes, statsRes] = await Promise.all([
        api.get(`/admin/payments?${params}`),
        api.get('/admin/payments/stats')
      ]);

      setPayments(paymentsRes.data.payments);
      setPagination(paymentsRes.data.pagination);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId: number) => {
    const reason = prompt('Enter refund reason:');
    if (!reason) return;

    try {
      await api.post(`/admin/payments/${paymentId}/refund`, { reason });
      fetchData();
    } catch (err) {
      alert('Error issuing refund');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION': return 'bg-purple-100 text-purple-800';
      case 'JOB_UNLOCK': return 'bg-blue-100 text-blue-800';
      case 'JOB_PAYMENT': return 'bg-green-100 text-green-800';
      case 'REFUND': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-slate-500">Track transactions and revenue</p>
          </div>
          <Link href="/dashboard/admin/payments/subscriptions">
            <Button variant="outline">View Subscriptions</Button>
          </Link>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${Number(stats?.totalRevenue || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Subscriptions</p>
              <p className="text-2xl font-bold text-purple-600">
                ${Number(stats?.subscriptionRevenue || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Job Unlocks</p>
              <p className="text-2xl font-bold text-blue-600">
                ${Number(stats?.unlockRevenue || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.pendingPayments || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="JOB_UNLOCK">Job Unlock</option>
                  <option value="JOB_PAYMENT">Job Payment</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : payments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No payments found</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">User</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <p className="font-medium">{payment.user.email}</p>
                            {payment.job && (
                              <p className="text-sm text-slate-500">Job: {payment.job.title}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded ${getTypeColor(payment.type)}`}>
                              {payment.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={payment.type === 'REFUND' ? 'text-red-600' : 'text-green-600'}>
                              {payment.type === 'REFUND' ? '-' : ''}${Number(payment.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-slate-500">
                            {new Date(payment.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            {payment.status === 'COMPLETED' && payment.type !== 'REFUND' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefund(payment.id)}
                              >
                                Refund
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

