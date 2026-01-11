'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Customer {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface Contractor {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface Assignment {
  id: number;
  user: Contractor;
}

interface Job {
  id: number;
  title: string;
  description: string;
  location: string | null;
  status: string;
  budget: number | null;
  scheduledDate: string | null;
  createdAt: string;
  customer: Customer;
  assignments: Assignment[];
  _count: {
    bids: number;
  };
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_QUOTE', label: 'Pending Quote' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, search, statusFilter]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let result = [...jobs];

    if (statusFilter) {
      result = result.filter(job => job.status === statusFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.customer.email.toLowerCase().includes(searchLower) ||
        job.customer.firstName?.toLowerCase().includes(searchLower) ||
        job.customer.lastName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredJobs(result);
    setPage(1);
  };

  const handleCancelJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: 'CANCELLED' });
      fetchJobs();
    } catch (err) {
      alert('Error cancelling job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-800';
      case 'PENDING_QUOTE': return 'bg-orange-100 text-orange-800';
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'SCHEDULED': return 'bg-indigo-100 text-indigo-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const paginatedJobs = filteredJobs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  // Stats
  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'OPEN').length,
    inProgress: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length,
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">All Jobs</h1>
          <p className="text-slate-500">Manage and monitor all jobs in the system</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Jobs</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Open</p>
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[250px]">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search by title, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs ({filteredJobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No jobs found</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Job</th>
                        <th className="text-left p-3">Customer</th>
                        <th className="text-left p-3">Contractor</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Bids</th>
                        <th className="text-left p-3">Created</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedJobs.map((job) => {
                        const contractor = job.assignments[0]?.user;
                        return (
                          <tr key={job.id} className="border-b hover:bg-slate-50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{job.title}</p>
                                {job.location && (
                                  <p className="text-sm text-slate-500">📍 {job.location}</p>
                                )}
                                {job.budget && (
                                  <p className="text-sm text-green-600">${job.budget}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <p className="font-medium">
                                {job.customer.firstName || job.customer.email}
                              </p>
                              <p className="text-sm text-slate-500">{job.customer.email}</p>
                            </td>
                            <td className="p-3">
                              {contractor ? (
                                <div>
                                  <p className="font-medium">
                                    {contractor.firstName || contractor.email}
                                  </p>
                                  <p className="text-sm text-slate-500">{contractor.email}</p>
                                </div>
                              ) : (
                                <span className="text-slate-400">Unassigned</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(job.status)}`}>
                                {job.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {job._count.bids > 0 ? (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {job._count.bids}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3 text-sm text-slate-500">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/admin/jobs/${job.id}`)}
                                >
                                  View
                                </Button>
                                {job.status === 'OPEN' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/admin/jobs/${job.id}/matches`)}
                                  >
                                    Match
                                  </Button>
                                )}
                                {!['COMPLETED', 'CANCELLED'].includes(job.status) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => handleCancelJob(job.id)}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
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

