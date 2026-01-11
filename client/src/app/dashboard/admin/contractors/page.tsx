'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import ContractorDetailPanel from '@/components/ContractorDetailPanel';
import api from '@/lib/api';
import Link from 'next/link';

interface Contractor {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  contractorProfile?: {
    isVerified: boolean;
    rating: number;
    skills: string[];
    hourlyRate: number | null;
  };
  _count: {
    assignedJobs: number;
  };
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    fetchContractors();
    fetchPendingCount();
  }, []);

  const fetchContractors = async () => {
    try {
      const res = await api.get('/admin/users?role=SUBCONTRACTOR&status=ACTIVE');
      setContractors(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/admin/contractors/pending');
      setPendingCount(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVerification = async (contractorId: number) => {
    try {
      await api.post(`/admin/contractors/${contractorId}/verify`);
      fetchContractors();
    } catch (err) {
      alert('Error updating verification status');
    }
  };

  const filteredContractors = contractors.filter(c => {
    if (filter === 'verified') return c.contractorProfile?.isVerified;
    if (filter === 'unverified') return !c.contractorProfile?.isVerified;
    return true;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        {showPanel && (
          <ContractorDetailPanel
            contractorId={showPanel}
            onClose={() => setShowPanel(null)}
          />
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contractors</h1>
            <p className="text-slate-500">Manage contractor accounts and verification</p>
          </div>
          {pendingCount > 0 && (
            <Link href="/dashboard/admin/contractors/requests">
              <Button className="bg-orange-500 hover:bg-orange-600">
                {pendingCount} Pending Requests →
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer" onClick={() => setFilter('all')}>
            <CardContent className={`p-4 ${filter === 'all' ? 'bg-blue-50' : ''}`}>
              <p className="text-sm text-slate-500">Total Contractors</p>
              <p className="text-2xl font-bold">{contractors.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFilter('verified')}>
            <CardContent className={`p-4 ${filter === 'verified' ? 'bg-green-50' : ''}`}>
              <p className="text-sm text-slate-500">Verified</p>
              <p className="text-2xl font-bold text-green-600">
                {contractors.filter(c => c.contractorProfile?.isVerified).length}
              </p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFilter('unverified')}>
            <CardContent className={`p-4 ${filter === 'unverified' ? 'bg-yellow-50' : ''}`}>
              <p className="text-sm text-slate-500">Unverified</p>
              <p className="text-2xl font-bold text-yellow-600">
                {contractors.filter(c => !c.contractorProfile?.isVerified).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contractors List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' ? 'All' : filter === 'verified' ? 'Verified' : 'Unverified'} Contractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredContractors.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No contractors found</p>
            ) : (
              <div className="space-y-4">
                {filteredContractors.map((contractor) => (
                  <div
                    key={contractor.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPanel(contractor.id)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {contractor.firstName} {contractor.lastName || contractor.email}
                        </button>
                        {contractor.contractorProfile?.isVerified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{contractor.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        {contractor.contractorProfile?.hourlyRate && (
                          <span>${contractor.contractorProfile.hourlyRate}/hr</span>
                        )}
                        {(contractor.contractorProfile?.rating ?? 0) > 0 && (
                          <span>⭐ {contractor.contractorProfile?.rating?.toFixed(1)}</span>
                        )}
                        <span>{contractor._count.assignedJobs} jobs</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {contractor.contractorProfile?.skills?.slice(0, 4).map((skill) => (
                          <span key={skill} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                        {(contractor.contractorProfile?.skills?.length || 0) > 4 && (
                          <span className="text-xs text-slate-500">
                            +{(contractor.contractorProfile?.skills?.length || 0) - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPanel(contractor.id)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant={contractor.contractorProfile?.isVerified ? 'ghost' : 'default'}
                        size="sm"
                        onClick={() => handleToggleVerification(contractor.id)}
                      >
                        {contractor.contractorProfile?.isVerified ? 'Unverify' : 'Verify'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

