'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DashboardLayout, CustomerSidebar } from '@/components/dashboard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Assignment {
  id: number;
  userId: number;
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    contractorProfile?: {
      rating: number;
    };
  };
}

interface Bid {
  id: number;
  amount: number;
  notes: string | null;
  accepted: boolean;
  contractor: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Job {
  id: number;
  title: string;
  description: string;
  budget: number | null;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate: string | null;
  completedAt: string | null;
  assignments: Assignment[];
  bids?: Bid[];
}

type FilterStatus = 'all' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export default function CustomerJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load your jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !user.role.startsWith('CUST')) {
      router.push('/auth/login');
      return;
    }
    fetchJobs();
  }, [user, authLoading, router, fetchJobs]);

  const handleCancelJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    
    setCancelling(jobId);
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: 'CANCELLED' });
      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel job');
    } finally {
      setCancelling(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'open') return ['OPEN', 'DRAFT', 'PENDING_QUOTE'].includes(job.status);
    if (filter === 'in_progress') return ['ASSIGNED', 'SCHEDULED', 'IN_PROGRESS'].includes(job.status);
    if (filter === 'completed') return job.status === 'COMPLETED';
    if (filter === 'cancelled') return job.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700',
      PENDING_QUOTE: 'bg-amber-100 text-amber-800',
      OPEN: 'bg-blue-100 text-blue-800',
      ASSIGNED: 'bg-indigo-100 text-indigo-800',
      SCHEDULED: 'bg-purple-100 text-purple-800',
      IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-slate-100 text-slate-700';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFilterCounts = () => {
    return {
      all: jobs.length,
      open: jobs.filter(j => ['OPEN', 'DRAFT', 'PENDING_QUOTE'].includes(j.status)).length,
      in_progress: jobs.filter(j => ['ASSIGNED', 'SCHEDULED', 'IN_PROGRESS'].includes(j.status)).length,
      completed: jobs.filter(j => j.status === 'COMPLETED').length,
      cancelled: jobs.filter(j => j.status === 'CANCELLED').length,
    };
  };

  const counts = getFilterCounts();

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
            <p className="text-slate-500">View and manage all your posted jobs.</p>
          </div>
          <Link href="/dashboard/customer/post-job">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              ➕ Post New Job
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: 'all', label: 'All Jobs' },
            { key: 'open', label: 'Open' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f.label}
              <span className="ml-2 opacity-70">({counts[f.key]})</span>
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500 text-lg">No jobs found</p>
              <p className="text-slate-400 mt-2">
                {filter === 'all' 
                  ? "You haven't posted any jobs yet."
                  : `No jobs with "${filter.replace('_', ' ')}" status.`}
              </p>
              {filter === 'all' && (
                <Link href="/dashboard/customer/post-job">
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                    Post Your First Job
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const contractor = job.assignments[0]?.user;
              const canCancel = ['OPEN', 'DRAFT', 'PENDING_QUOTE'].includes(job.status);
              
              return (
                <Card key={job.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Main Row */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-slate-900">{job.title}</h3>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadge(job.status)}`}>
                              {formatStatus(job.status)}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2 mb-3">{job.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                            {job.budget && (
                              <span>💰 Budget: £{Number(job.budget).toFixed(2)}</span>
                            )}
                            {job.location && (
                              <span>📍 {job.location}</span>
                            )}
                            <span>📅 Posted: {formatDate(job.createdAt)}</span>
                            {job.scheduledDate && (
                              <span>🗓️ Scheduled: {formatDate(job.scheduledDate)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          {contractor && (
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Assigned to</p>
                              <p className="text-sm font-medium text-slate-900">
                                {contractor.firstName || contractor.email}
                              </p>
                            </div>
                          )}
                          <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t bg-slate-50 p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Full Description */}
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Full Description</h4>
                            <p className="text-slate-600 whitespace-pre-wrap">{job.description}</p>
                          </div>

                          {/* Job Details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-slate-900 mb-2">Job Details</h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-slate-500">Status:</dt>
                                  <dd className={`font-medium ${getStatusBadge(job.status)} px-2 py-0.5 rounded`}>
                                    {formatStatus(job.status)}
                                  </dd>
                                </div>
                                {job.budget && (
                                  <div className="flex justify-between">
                                    <dt className="text-slate-500">Budget:</dt>
                                    <dd className="text-slate-900">£{Number(job.budget).toFixed(2)}</dd>
                                  </div>
                                )}
                                {job.location && (
                                  <div className="flex justify-between">
                                    <dt className="text-slate-500">Location:</dt>
                                    <dd className="text-slate-900">{job.location}</dd>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <dt className="text-slate-500">Posted:</dt>
                                  <dd className="text-slate-900">{formatDate(job.createdAt)}</dd>
                                </div>
                                {job.scheduledDate && (
                                  <div className="flex justify-between">
                                    <dt className="text-slate-500">Scheduled:</dt>
                                    <dd className="text-slate-900">{formatDate(job.scheduledDate)}</dd>
                                  </div>
                                )}
                                {job.completedAt && (
                                  <div className="flex justify-between">
                                    <dt className="text-slate-500">Completed:</dt>
                                    <dd className="text-slate-900">{formatDate(job.completedAt)}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>

                            {/* Assigned Contractor */}
                            {contractor && (
                              <div>
                                <h4 className="font-medium text-slate-900 mb-2">Assigned Contractor</h4>
                                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <span className="text-emerald-600 font-medium">
                                      {(contractor.firstName?.[0] || contractor.email[0]).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {contractor.firstName} {contractor.lastName || ''}
                                    </p>
                                    <p className="text-sm text-slate-500">{contractor.email}</p>
                                    {contractor.contractorProfile?.rating > 0 && (
                                      <p className="text-sm text-amber-600">
                                        ⭐ {contractor.contractorProfile.rating.toFixed(1)} rating
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                          {canCancel && (
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelJob(job.id);
                              }}
                              disabled={cancelling === job.id}
                            >
                              {cancelling === job.id ? 'Cancelling...' : '✕ Cancel Job'}
                            </Button>
                          )}
                          {job.status === 'COMPLETED' && (
                            <Link href="/dashboard/customer/signoffs">
                              <Button className="bg-emerald-600 hover:bg-emerald-700">
                                View Sign-off
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

