'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, ContractorSidebar } from '@/components/dashboard';
import AvailabilityEditor from '@/components/AvailabilityEditor';
import TimeBlockManager from '@/components/TimeBlockManager';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ScheduledJob {
  id: number;
  title: string;
  scheduledDate: string;
  location: string;
  status: string;
}

export default function ContractorCalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'SUBCONTRACTOR') {
      router.push('/auth/login');
      return;
    }
    fetchScheduledJobs();
  }, [user]);

  const fetchScheduledJobs = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/users/${user.id}/calendar`);
      setScheduledJobs(res.data.scheduledJobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout sidebar={<ContractorSidebar />} allowedRoles={['SUBCONTRACTOR']}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Calendar</h1>
          <p className="text-slate-600">Manage your availability and scheduled jobs.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
        {/* Availability Editor */}
        <AvailabilityEditor userId={user.id} />

        {/* Time Block Manager */}
        <TimeBlockManager userId={user.id} />
      </div>

      {/* Scheduled Jobs */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : scheduledJobs.length === 0 ? (
              <p className="text-slate-500">No jobs scheduled yet</p>
            ) : (
              <div className="space-y-3">
                {scheduledJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-slate-600">{job.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">
                        {new Date(job.scheduledDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(job.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
}

