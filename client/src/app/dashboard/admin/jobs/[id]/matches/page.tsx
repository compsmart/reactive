'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import ContractorDetailPanel from '@/components/ContractorDetailPanel';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

interface ContractorProfile {
  skills: string[];
  hourlyRate: number | null;
  rating: number;
  isVerified: boolean;
}

interface Contractor {
  id: number;
  email: string;
  contractorProfile: ContractorProfile;
  distance: number;
}

interface Job {
  id: number;
  title: string;
  location: string | null;
}

interface MatchesResponse {
  job: Job;
  matches: Contractor[];
  totalFound: number;
}

export default function JobMatchingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<Contractor[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showContractorPanel, setShowContractorPanel] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [jobRes, matchesRes] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get(`/jobs/${id}/matches`)
      ]);
      setJob(jobRes.data);
      const data = matchesRes.data as MatchesResponse;
      setMatches(data.matches);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || 'Failed to load job data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    fetchData();
  }, [user, authLoading, router, fetchData]);

  const assignContractor = async (contractorId: number) => {
    try {
      setAssigning(contractorId);
      setError(null);
      await api.post(`/jobs/${id}/assign`, { contractorId });
      router.push('/dashboard/admin');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to assign job';
      setError(message);
      setAssigning(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Contractor Detail Panel */}
      {showContractorPanel && (
        <ContractorDetailPanel 
          contractorId={showContractorPanel} 
          onClose={() => setShowContractorPanel(null)} 
        />
      )}

      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold mt-2">
          Find Contractor for: {job?.title}
        </h1>
        {job?.location && (
          <p className="text-slate-500">📍 {job.location}</p>
        )}
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

      <div className="grid gap-4">
        {matches.map((contractor) => (
          <Card key={contractor.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowContractorPanel(contractor.id)}
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
                  >
                    {contractor.email}
                  </button>
                  {contractor.contractorProfile?.isVerified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  📍 {contractor.distance} km away
                  {contractor.contractorProfile?.hourlyRate && (
                    <> • 💰 ${contractor.contractorProfile.hourlyRate}/hr</>
                  )}
                  {contractor.contractorProfile?.rating > 0 && (
                    <> • ⭐ {contractor.contractorProfile.rating.toFixed(1)}</>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {contractor.contractorProfile?.skills.map((skill: string) => (
                    <span 
                      key={skill} 
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowContractorPanel(contractor.id)}
                >
                  View Details
                </Button>
                <Button 
                  onClick={() => assignContractor(contractor.id)}
                  disabled={assigning !== null}
                >
                  {assigning === contractor.id ? 'Assigning...' : 'Assign Job'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-2">No matching contractors found nearby.</p>
            <p className="text-sm text-slate-400">
              Try expanding the search radius or check if contractors have registered their location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
