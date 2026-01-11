'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  users: {
    total: number;
    active: number;
    contractors: number;
    employees: number;
    customers: number;
    pendingContractors: number;
  };
  jobs: {
    total: number;
    open: number;
    completed: number;
  };
  subscriptions: {
    active: number;
  };
  revenue: {
    last30Days: number;
  };
}

interface RecentJob {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  customer?: {
    email: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/jobs?limit=5')
      ]);
      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'SCHEDULED': return 'bg-indigo-100 text-indigo-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.email}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Users</p>
                      <p className="text-3xl font-bold">{stats?.users.total || 0}</p>
                      <p className="text-sm text-green-600">{stats?.users.active || 0} active</p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </CardContent>
              </Card>

              <Card className={stats?.users.pendingContractors ? 'border-orange-300' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Pending Approvals</p>
                      <p className="text-3xl font-bold text-orange-600">{stats?.users.pendingContractors || 0}</p>
                      <Link href="/dashboard/admin/contractors" className="text-sm text-blue-600 hover:underline">
                        Review now →
                      </Link>
                    </div>
                    <div className="text-4xl">⏳</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Open Jobs</p>
                      <p className="text-3xl font-bold">{stats?.jobs.open || 0}</p>
                      <p className="text-sm text-slate-500">{stats?.jobs.total || 0} total</p>
                    </div>
                    <div className="text-4xl">📋</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Revenue (30d)</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${Number(stats?.revenue.last30Days || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-500">{stats?.subscriptions.active || 0} active subs</p>
                    </div>
                    <div className="text-4xl">💰</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-slate-500">Contractors</p>
                <p className="text-2xl font-semibold">{stats?.users.contractors || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-slate-500">Employees</p>
                <p className="text-2xl font-semibold">{stats?.users.employees || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-slate-500">Customers</p>
                <p className="text-2xl font-semibold">{stats?.users.customers || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-slate-500">Completed Jobs</p>
                <p className="text-2xl font-semibold">{stats?.jobs.completed || 0}</p>
              </div>
            </div>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Jobs</CardTitle>
                  <Link href="/dashboard/admin/jobs">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentJobs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No jobs yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                        onClick={() => router.push(`/dashboard/admin/jobs/${job.id}`)}
                      >
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-slate-500">{job.customer?.email || 'Unknown'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                          <span className="text-sm text-slate-500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
