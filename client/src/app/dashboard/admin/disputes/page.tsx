'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Signoff {
  id: number;
  status: string;
  disputeReason: string | null;
  disputedAt: string | null;
  customerNotes: string | null;
}

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface Assignment {
  id: number;
  user: User;
}

interface Job {
  id: number;
  title: string;
  description: string;
  location: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  completionPhotos: string[];
  signoff: Signoff;
  customer: User;
  assignments: Assignment[];
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Job | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/signoff/disputed');
      setDisputes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (jobId: number, resolution: 'approved' | 'rejected') => {
    setSubmitting(true);
    try {
      await api.post(`/signoff/jobs/${jobId}/resolve`, {
        resolution,
        resolutionNotes,
        finalStatus: resolution === 'approved' ? 'COMPLETED' : 'IN_PROGRESS'
      });
      setSelectedDispute(null);
      setResolutionNotes('');
      fetchDisputes();
    } catch (err) {
      alert('Error resolving dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Job Disputes</h1>
          <p className="text-slate-500">Review and resolve disputed job completions</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : disputes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500 text-lg">No active disputes</p>
              <p className="text-slate-400 mt-2">All job completions have been resolved</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {disputes.map((job) => {
              const contractor = job.assignments[0]?.user;
              return (
                <Card key={job.id} className="border-2 border-red-200">
                  <CardHeader className="bg-red-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          Disputed on {job.signoff.disputedAt 
                            ? new Date(job.signoff.disputedAt).toLocaleDateString() 
                            : 'Unknown date'}
                        </p>
                      </div>
                      <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">
                        DISPUTED
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Left: Job & Dispute Info */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-slate-700 mb-1">Job Description</h4>
                          <p className="text-slate-600 text-sm">{job.description}</p>
                        </div>

                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-medium text-red-700 mb-2">Dispute Reason</h4>
                          <p className="text-red-800">{job.signoff.disputeReason}</p>
                        </div>

                        {job.completionNotes && (
                          <div>
                            <h4 className="font-medium text-slate-700 mb-1">Contractor's Completion Notes</h4>
                            <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded">
                              {job.completionNotes}
                            </p>
                          </div>
                        )}

                        {/* Completion Photos */}
                        {job.completionPhotos && job.completionPhotos.length > 0 && (
                          <div>
                            <h4 className="font-medium text-slate-700 mb-2">Work Photos</h4>
                            <div className="flex gap-2 overflow-x-auto">
                              {job.completionPhotos.map((photo, idx) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt={`Work photo ${idx + 1}`}
                                  className="w-20 h-20 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Parties & Resolution */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-700 text-sm mb-1">Customer</h4>
                            <p className="font-medium">{job.customer.firstName || job.customer.email}</p>
                            <p className="text-sm text-slate-500">{job.customer.email}</p>
                          </div>
                          {contractor && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <h4 className="font-medium text-green-700 text-sm mb-1">Contractor</h4>
                              <p className="font-medium">{contractor.firstName || contractor.email}</p>
                              <p className="text-sm text-slate-500">{contractor.email}</p>
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium text-slate-700 mb-2">Resolution</h4>
                          <textarea
                            className="w-full p-2 border rounded-md text-sm"
                            rows={3}
                            placeholder="Add resolution notes..."
                            value={selectedDispute?.id === job.id ? resolutionNotes : ''}
                            onChange={(e) => {
                              setSelectedDispute(job);
                              setResolutionNotes(e.target.value);
                            }}
                            onFocus={() => setSelectedDispute(job)}
                          />
                          <div className="flex gap-2 mt-3">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleResolve(job.id, 'approved')}
                              disabled={submitting}
                            >
                              ✓ Approve Completion
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                              onClick={() => handleResolve(job.id, 'rejected')}
                              disabled={submitting}
                            >
                              ↩ Send Back
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            "Approve" marks job as complete. "Send Back" returns it to contractor.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

