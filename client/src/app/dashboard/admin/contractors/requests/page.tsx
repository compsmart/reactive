'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface PendingContractor {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  contractorProfile?: {
    skills: string[];
    bio: string | null;
    hourlyRate: number | null;
  };
}

export default function ContractorRequestsPage() {
  const router = useRouter();
  const [contractors, setContractors] = useState<PendingContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingContractors();
  }, []);

  const fetchPendingContractors = async () => {
    try {
      const res = await api.get('/admin/contractors/pending');
      setContractors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contractorId: number) => {
    try {
      setProcessing(contractorId);
      await api.post(`/admin/contractors/${contractorId}/approve`);
      setContractors(contractors.filter(c => c.id !== contractorId));
    } catch (err) {
      alert('Error approving contractor');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (contractorId: number) => {
    try {
      setProcessing(contractorId);
      await api.post(`/admin/contractors/${contractorId}/reject`, { reason: rejectReason });
      setContractors(contractors.filter(c => c.id !== contractorId));
      setShowRejectModal(null);
      setRejectReason('');
    } catch (err) {
      alert('Error rejecting contractor');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard/admin/contractors')}>
            ← Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pending Contractor Requests</h1>
            <p className="text-slate-500">Review and approve new contractor registrations</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : contractors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-4xl mb-4">✅</p>
              <p className="text-xl font-medium">All caught up!</p>
              <p className="text-slate-500">No pending contractor requests to review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contractors.map((contractor) => (
              <Card key={contractor.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {contractor.firstName} {contractor.lastName || 'No name provided'}
                      </h3>
                      <p className="text-slate-600">{contractor.email}</p>
                      {contractor.phone && (
                        <p className="text-sm text-slate-500">📞 {contractor.phone}</p>
                      )}
                      <p className="text-sm text-slate-500">
                        Applied: {new Date(contractor.createdAt).toLocaleDateString()}
                      </p>

                      {contractor.contractorProfile && (
                        <div className="mt-4">
                          {contractor.contractorProfile.hourlyRate && (
                            <p className="text-sm">
                              <strong>Hourly Rate:</strong> ${contractor.contractorProfile.hourlyRate}/hr
                            </p>
                          )}
                          {contractor.contractorProfile.bio && (
                            <p className="text-sm mt-2">
                              <strong>Bio:</strong> {contractor.contractorProfile.bio}
                            </p>
                          )}
                          {contractor.contractorProfile.skills?.length > 0 && (
                            <div className="mt-3">
                              <strong className="text-sm">Skills:</strong>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {contractor.contractorProfile.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleApprove(contractor.id)}
                        disabled={processing === contractor.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === contractor.id ? 'Processing...' : '✓ Approve'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectModal(contractor.id)}
                        disabled={processing === contractor.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Reject Contractor</h2>
              <p className="text-slate-600 mb-4">
                Please provide a reason for rejecting this application:
              </p>
              <Input
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectReason.trim() || processing === showRejectModal}
                >
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

