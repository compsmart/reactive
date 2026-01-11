'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Assignment {
  id: number;
  userId: number;
  user: {
    id: number;
    email: string;
  };
}

interface Job {
  id: number;
  title: string;
  description: string;
  location: string | null;
  budget: number | null;
  status: string;
  assignments: Assignment[];
  _count: {
    bids: number;
  };
}

export default function ContractorDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [biddingJob, setBiddingJob] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'SUBCONTRACTOR') {
      router.push('/auth/login');
      return;
    }
    fetchJobs();
  }, [user, authLoading, router, fetchJobs]);

  const handleBid = async (jobId: number) => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.post(`/jobs/${jobId}/bid`, { amount: parseFloat(bidAmount) });
      setBiddingJob(null);
      setBidAmount('');
      fetchJobs();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to place bid';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if current user is assigned to a specific job
  const isAssignedToMe = (job: Job): boolean => {
    if (!user) return false;
    return job.assignments.some(assignment => assignment.userId === user.id);
  };

  // Get the job status label for display
  const getJobStatusLabel = (job: Job): { label: string; className: string } => {
    if (isAssignedToMe(job)) {
      return {
        label: 'Assigned to Me',
        className: 'bg-green-100 text-green-800'
      };
    }
    
    if (job.status === 'ASSIGNED') {
      return {
        label: 'Assigned to Another',
        className: 'bg-gray-100 text-gray-600'
      };
    }

    if (job.status === 'OPEN') {
      return {
        label: 'Open for Bids',
        className: 'bg-blue-100 text-blue-800'
      };
    }

    return {
      label: job.status,
      className: 'bg-slate-100 text-slate-600'
    };
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contractor Portal</h1>
          <p className="text-slate-500">Welcome, {user?.email}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/contractor/jobs')}>
            📋 My Jobs
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/contractor/calendar')}>
            📅 My Calendar
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/contractor/earnings')}>
            💰 Earnings
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/contractor/profile')}>
            👤 Profile
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/contractor/subscription')}>
            ⭐ Subscription
          </Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available & Assigned Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => {
                const statusLabel = getJobStatusLabel(job);
                const canBid = job.status === 'OPEN' && !isAssignedToMe(job);
                
                return (
                  <div 
                    key={job.id} 
                    className="p-4 border rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-slate-600 mb-2 line-clamp-2">{job.description}</p>
                        <p className="text-sm text-slate-500">
                          {job.location && <span>📍 {job.location} • </span>}
                          {job.budget && <span>💰 ${job.budget}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-block text-xs px-2 py-1 rounded ${statusLabel.className}`}>
                            {statusLabel.label}
                          </span>
                          {job._count.bids > 0 && job.status === 'OPEN' && (
                            <span className="text-xs text-slate-500">
                              {job._count.bids} bid{job._count.bids !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {canBid && (
                        <div className="ml-4">
                          {biddingJob === job.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="$"
                                className="w-24"
                                value={bidAmount}
                                onChange={e => setBidAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                disabled={submitting}
                              />
                              <Button 
                                onClick={() => handleBid(job.id)} 
                                disabled={submitting}
                              >
                                {submitting ? '...' : 'Submit'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                onClick={() => {
                                  setBiddingJob(null);
                                  setBidAmount('');
                                }}
                                disabled={submitting}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => setBiddingJob(job.id)}>
                              Place Bid
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {jobs.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No jobs available at the moment. Check back later!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
