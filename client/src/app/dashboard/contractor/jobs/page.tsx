'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, ContractorSidebar } from '@/components/dashboard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Job {
  id: number;
  title: string;
  description: string;
  location: string | null;
  status: string;
  scheduledDate: string | null;
  contractorPayType: string | null;
  contractorPayRate: number | null;
  customer: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
}

export default function ContractorJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get('/jobs');
      // Filter to only show jobs assigned to this contractor
      const myJobs = res.data.filter((job: Job) => 
        ['ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(job.status)
      );
      setJobs(myJobs);
    } catch (err) {
      console.error(err);
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

  const handleStartJob = async (jobId: number) => {
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: 'IN_PROGRESS' });
      fetchJobs();
    } catch (err) {
      alert('Error starting job');
    }
  };

  const handleCompleteJob = async () => {
    if (!selectedJob) return;
    setSubmitting(true);
    try {
      await api.post(`/signoff/jobs/${selectedJob.id}/complete`, {
        completionNotes,
        completionPhotos: [] // In production, would include uploaded photo URLs
      });
      setShowCompleteModal(false);
      setSelectedJob(null);
      setCompletionNotes('');
      fetchJobs();
      alert('Job completion submitted! Waiting for customer sign-off.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error completing job');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'assigned') return job.status === 'ASSIGNED' || job.status === 'SCHEDULED';
    if (filter === 'in_progress') return job.status === 'IN_PROGRESS';
    if (filter === 'completed') return job.status === 'COMPLETED';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'SCHEDULED': return 'bg-indigo-100 text-indigo-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-slate-500">Manage your assigned and completed jobs.</p>
        </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'assigned', 'in_progress', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'All' : 
             f === 'assigned' ? 'Assigned' : 
             f === 'in_progress' ? 'In Progress' : 'Completed'}
            <span className="ml-2 opacity-70">
              ({jobs.filter(j => {
                if (f === 'all') return true;
                if (f === 'assigned') return j.status === 'ASSIGNED' || j.status === 'SCHEDULED';
                if (f === 'in_progress') return j.status === 'IN_PROGRESS';
                if (f === 'completed') return j.status === 'COMPLETED';
                return false;
              }).length})
            </span>
          </button>
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500 text-lg">No jobs found</p>
            <p className="text-slate-400 mt-2">
              {filter === 'all' 
                ? 'You have no assigned jobs yet. Browse available jobs to get started!'
                : `No jobs in "${filter.replace('_', ' ')}" status`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3 line-clamp-2">{job.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {job.location && (
                        <div>
                          <span className="text-slate-500">📍 Location:</span>
                          <span className="ml-1">{job.location}</span>
                        </div>
                      )}
                      {job.scheduledDate && (
                        <div>
                          <span className="text-slate-500">📅 Scheduled:</span>
                          <span className="ml-1">{new Date(job.scheduledDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {job.contractorPayRate && (
                        <div>
                          <span className="text-slate-500">💰 Pay:</span>
                          <span className="ml-1 text-green-600 font-medium">
                            ${job.contractorPayRate}
                            {job.contractorPayType === 'HOURLY' && '/hr'}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">👤 Customer:</span>
                        <span className="ml-1">
                          {job.customer.firstName || job.customer.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {job.status === 'ASSIGNED' && (
                      <Button size="sm" onClick={() => handleStartJob(job.id)}>
                        Start Job
                      </Button>
                    )}
                    {job.status === 'SCHEDULED' && (
                      <Button size="sm" onClick={() => handleStartJob(job.id)}>
                        Start Job
                      </Button>
                    )}
                    {job.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowCompleteModal(true);
                        }}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {job.status === 'COMPLETED' && (
                      <span className="text-green-600 text-sm">✓ Completed</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Job Modal */}
      {showCompleteModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Submit Job Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  You are about to mark <strong>{selectedJob.title}</strong> as complete. 
                  The customer will be notified to review and sign off on the work.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Completion Notes
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    placeholder="Describe the work completed, any notes for the customer..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                  <p className="font-medium mb-1">📸 Photo Evidence</p>
                  <p>In the full version, you can upload photos of the completed work here.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleCompleteJob}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Completion'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCompleteModal(false);
                      setSelectedJob(null);
                      setCompletionNotes('');
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}

