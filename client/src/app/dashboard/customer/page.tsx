'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, CustomerSidebar } from '@/components/dashboard';
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
  budget: number | null;
  status: string;
  assignments: Assignment[];
}

interface FormData {
  title: string;
  description: string;
  budget: string;
  location: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  budget: '',
  location: '',
};

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/jobs', {
        title: formData.title,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        location: formData.location || undefined,
        // Note: In production, use geolocation API or address autocomplete
        latitude: 51.5074,
        longitude: -0.1278,
      });
      setShowForm(false);
      setFormData(initialFormData);
      fetchJobs();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to post job. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'OPEN': return 'text-blue-600';
      case 'ASSIGNED': return 'text-yellow-600';
      case 'IN_PROGRESS': return 'text-purple-600';
      case 'COMPLETED': return 'text-green-600';
      case 'CANCELLED': return 'text-red-600';
      default: return 'text-slate-600';
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
            <p className="text-slate-500">Manage your posted jobs and track their progress.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '➕ Post New Job'}
          </Button>
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

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="e.g., Fix Leaking Kitchen Tap"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
                  placeholder="Describe the job in detail..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="budget" className="text-sm font-medium">
                    Budget ($) <span className="text-slate-400">(optional)</span>
                  </label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="150.00"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location <span className="text-slate-400">(optional)</span>
                  </label>
                  <Input
                    id="location"
                    placeholder="123 Main St, City"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Job'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <p className="text-slate-600 mb-2 line-clamp-2">{job.description}</p>
                  <p className="text-sm text-slate-500">
                    {job.budget && <span>Budget: ${job.budget} • </span>}
                    Status: <span className={`font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </p>
                </div>
                {job.assignments.length > 0 && (
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium">Assigned to:</p>
                    <p className="text-sm text-slate-600">
                      {job.assignments[0].user.email}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {jobs.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">You haven&apos;t posted any jobs yet.</p>
            <Button onClick={() => setShowForm(true)}>Post Your First Job</Button>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
