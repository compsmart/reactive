'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, CustomerSidebar } from '@/components/dashboard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Contractor {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  contractorProfile?: {
    rating: number;
  };
}

interface Assignment {
  id: number;
  user: Contractor;
}

interface Signoff {
  id: number;
  status: string;
  customerNotes: string | null;
}

interface Job {
  id: number;
  title: string;
  description: string;
  location: string | null;
  completedAt: string;
  completionNotes: string | null;
  completionPhotos: string[];
  signoff: Signoff;
  assignments: Assignment[];
}

export default function CustomerSignoffsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.role.startsWith('CUST')) {
      router.push('/auth/login');
      return;
    }
    fetchPendingSignoffs();
  }, [user, authLoading, router]);

  const fetchPendingSignoffs = async () => {
    try {
      const res = await api.get('/signoff/pending');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedJob) return;
    setSubmitting(true);
    try {
      await api.post(`/signoff/jobs/${selectedJob.id}/approve`, {
        customerNotes,
        rating,
        reviewComment
      });
      setShowReviewModal(false);
      setSelectedJob(null);
      setRating(5);
      setReviewComment('');
      setCustomerNotes('');
      fetchPendingSignoffs();
    } catch (err) {
      alert('Error approving job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!selectedJob) return;
    if (disputeReason.trim().length < 10) {
      alert('Please provide a detailed reason for the dispute');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/signoff/jobs/${selectedJob.id}/dispute`, {
        disputeReason
      });
      setShowDisputeModal(false);
      setSelectedJob(null);
      setDisputeReason('');
      fetchPendingSignoffs();
    } catch (err) {
      alert('Error submitting dispute');
    } finally {
      setSubmitting(false);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Jobs Awaiting Sign-off</h1>
          <p className="text-slate-500">Review and approve completed work from contractors.</p>
        </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500 text-lg">No jobs awaiting your approval</p>
            <p className="text-slate-400 mt-2">When contractors complete jobs, they will appear here for your sign-off</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => {
            const contractor = job.assignments[0]?.user;
            return (
              <Card key={job.id} className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        Completed on {new Date(job.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-medium">
                      Awaiting Sign-off
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Contractor Info */}
                    {contractor && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {(contractor.firstName?.[0] || contractor.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {contractor.firstName} {contractor.lastName || contractor.email}
                          </p>
                          {(contractor.contractorProfile?.rating ?? 0) > 0 && (
                            <p className="text-sm text-yellow-600">
                              ⭐ {contractor.contractorProfile?.rating?.toFixed(1)} rating
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Completion Notes */}
                    {job.completionNotes && (
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">Contractor Notes</h4>
                        <p className="text-slate-600 bg-white p-3 rounded-lg">{job.completionNotes}</p>
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
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowReviewModal(true);
                        }}
                      >
                        ✓ Approve & Sign Off
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDisputeModal(true);
                        }}
                      >
                        ✗ Raise Dispute
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {showReviewModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Approve Job Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rate the Contractor</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-slate-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Review Comment (Optional)</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Share your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Additional Notes (Optional)</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={2}
                    placeholder="Any notes for your records..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Confirm Approval'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedJob(null);
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

      {/* Dispute Modal */}
      {showDisputeModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Raise Dispute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Please explain why you are not satisfied with the completed work. 
                  An administrator will review your dispute.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Dispute *</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    placeholder="Please describe the issue in detail (minimum 10 characters)..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={handleDispute}
                    disabled={submitting || disputeReason.trim().length < 10}
                  >
                    {submitting ? 'Submitting...' : 'Submit Dispute'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDisputeModal(false);
                      setSelectedJob(null);
                      setDisputeReason('');
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

