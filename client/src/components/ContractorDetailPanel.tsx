'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';

interface Contractor {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  mobile?: string;
  contractorProfile?: {
    skills: string[];
    hourlyRate: number;
    rating: number;
    isVerified: boolean;
    bio?: string;
  };
}

interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface TimeBlock {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
}

interface JobHistory {
  id: number;
  title: string;
  status: string;
  scheduledDate?: string;
  createdAt: string;
  customer: {
    email: string;
  };
}

interface Props {
  contractorId: number;
  onClose: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ContractorDetailPanel({ contractorId, onClose }: Props) {
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractorDetails();
  }, [contractorId]);

  const fetchContractorDetails = async () => {
    try {
      const [contractorRes, availabilityRes, timeBlocksRes, jobsRes] = await Promise.all([
        api.get(`/users/${contractorId}`),
        api.get(`/users/${contractorId}/availability`),
        api.get(`/users/${contractorId}/timeblocks`),
        api.get(`/users/${contractorId}/jobs`)
      ]);
      setContractor(contractorRes.data);
      setAvailability(availabilityRes.data || []);
      setTimeBlocks(timeBlocksRes.data || []);
      setJobHistory(jobsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="fixed inset-0 bg-white z-50 p-6">
        <Button variant="ghost" onClick={onClose}>← Back</Button>
        <p className="mt-4">Contractor not found</p>
      </div>
    );
  }

  const profile = contractor.contractorProfile;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onClose} className="text-lg">
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Contractor Details</h1>
          <div></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Profile</CardTitle>
                {profile?.isVerified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-500">Name</label>
                <p className="font-medium">
                  {contractor.firstName && contractor.lastName 
                    ? `${contractor.firstName} ${contractor.lastName}`
                    : contractor.email}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Email</label>
                <p className="font-medium">{contractor.email}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Phone</label>
                <p className="font-medium">{contractor.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Mobile</label>
                <p className="font-medium">{contractor.mobile || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Hourly Rate</label>
                <p className="font-medium text-lg text-green-600">
                  ${profile?.hourlyRate || 0}/hr
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Rating</label>
                <p className="font-medium">
                  {'⭐'.repeat(Math.round(profile?.rating || 0))} 
                  <span className="text-slate-500 ml-1">({profile?.rating?.toFixed(1) || '0.0'})</span>
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Skills</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile?.skills?.map((skill) => (
                    <span key={skill} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {(!profile?.skills || profile.skills.length === 0) && (
                    <span className="text-slate-500">No skills listed</span>
                  )}
                </div>
              </div>
              {profile?.bio && (
                <div>
                  <label className="text-sm text-slate-500">Bio</label>
                  <p className="text-slate-600 mt-1">{profile.bio}</p>
                </div>
              )}

              <div className="pt-4 flex gap-2">
                <Button className="flex-1">
                  <span className="mr-2">📧</span> Email
                </Button>
                <Button variant="outline" className="flex-1">
                  <span className="mr-2">📞</span> Call
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Availability Schedule */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
              </CardHeader>
              <CardContent>
                {availability.length === 0 ? (
                  <p className="text-slate-500">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {DAYS.map((day, idx) => {
                      const dayAvail = availability.find(a => a.dayOfWeek === idx);
                      return (
                        <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="font-medium">{day}</span>
                          {dayAvail && dayAvail.isActive ? (
                            <span className="text-green-600">
                              {dayAvail.startTime} - {dayAvail.endTime}
                            </span>
                          ) : (
                            <span className="text-slate-400">Unavailable</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Time Blocks */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Unavailability</CardTitle>
              </CardHeader>
              <CardContent>
                {timeBlocks.length === 0 ? (
                  <p className="text-slate-500">No blocked times</p>
                ) : (
                  <div className="space-y-2">
                    {timeBlocks.slice(0, 5).map((block) => (
                      <div key={block.id} className="p-2 bg-red-50 rounded border border-red-100">
                        <div className="flex justify-between">
                          <span className="font-medium text-red-800">{block.reason}</span>
                          <span className="text-sm text-red-600">
                            {new Date(block.startDate).toLocaleDateString()} - {new Date(block.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {block.notes && (
                          <p className="text-sm text-red-600 mt-1">{block.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job History */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Job History ({jobHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {jobHistory.length === 0 ? (
                <p className="text-slate-500">No job history yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {jobHistory.map((job) => (
                    <div key={job.id} className="p-3 bg-slate-50 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-slate-500">
                            Customer: {job.customer?.email || 'N/A'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {job.scheduledDate 
                              ? `Scheduled: ${new Date(job.scheduledDate).toLocaleDateString()}`
                              : `Posted: ${new Date(job.createdAt).toLocaleDateString()}`
                            }
                          </p>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          job.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          job.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

