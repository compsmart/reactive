'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CustomerDetailPanel from '@/components/CustomerDetailPanel';
import ContractorDetailPanel from '@/components/ContractorDetailPanel';
import JobScheduler from '@/components/JobScheduler';
import api from '@/lib/api';

interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: string;
  createdAt: string;
  scheduledDate?: string;
  bookingDeadline?: string;
  unlockFee?: number;
  quoteAmount?: number;
  quoteAccepted?: boolean;
  quoteNotes?: string;
  contractorPayType?: string;
  contractorPayRate?: number;
  customer: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    customerProfile?: {
      address: string;
      type: string;
      companyName?: string;
    };
  };
  assignments: {
    id: number;
    userId: number;
    user: {
      id: number;
      email: string;
      contractorProfile?: {
        skills: string[];
        hourlyRate: number;
        rating: number;
      };
    };
  }[];
  bids: {
    id: number;
    amount: number;
    notes: string;
    accepted: boolean;
    contractor: {
      id: number;
      email: string;
      contractorProfile?: {
        skills: string[];
        rating: number;
      };
    };
  }[];
  timesheets: {
    id: number;
    startTime: string;
    endTime: string;
    notes: string;
  }[];
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Panel states
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [showContractorPanel, setShowContractorPanel] = useState<number | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  
  // Quote form state
  const [quoteData, setQuoteData] = useState({
    quoteAmount: '',
    quoteNotes: '',
    contractorPayType: 'FIXED',
    contractorPayRate: '',
    unlockFee: ''
  });

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = () => {
    router.push(`/dashboard/admin/jobs/${id}/matches`);
  };

  const handleAcceptBid = async (bidId: number) => {
    if (!confirm('Accept this bid and assign the contractor?')) return;
    try {
      await api.post(`/jobs/${id}/bids/${bidId}/accept`);
      fetchJob();
    } catch (err) {
      alert('Error accepting bid');
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/jobs/${id}/quote`, quoteData);
      setShowQuoteForm(false);
      fetchJob();
    } catch (err) {
      alert('Error creating quote');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.patch(`/jobs/${id}/status`, { status });
      fetchJob();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleScheduled = () => {
    setShowScheduler(false);
    fetchJob();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  const isCommercial = job.customer.customerProfile?.type === 'Commercial';
  const assignedContractor = job.assignments[0]?.user;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Customer Detail Panel */}
      {showCustomerPanel && (
        <CustomerDetailPanel 
          customerId={job.customer.id} 
          onClose={() => setShowCustomerPanel(false)} 
        />
      )}

      {/* Contractor Detail Panel */}
      {showContractorPanel && (
        <ContractorDetailPanel 
          contractorId={showContractorPanel} 
          onClose={() => setShowContractorPanel(null)} 
        />
      )}

      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Job Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    {isCommercial && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        Commercial
                      </span>
                    )}
                  </div>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                    job.status === 'PENDING_QUOTE' ? 'bg-yellow-100 text-yellow-800' :
                    job.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'SCHEDULED' ? 'bg-indigo-100 text-indigo-800' :
                    job.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                    job.status === 'COMPLETED' ? 'bg-slate-100 text-slate-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-right">
                  {job.budget && (
                    <>
                      <p className="text-2xl font-bold text-green-600">${job.budget}</p>
                      <p className="text-sm text-slate-500">Customer Budget</p>
                    </>
                  )}
                  {job.quoteAmount && (
                    <>
                      <p className="text-2xl font-bold text-blue-600 mt-2">${job.quoteAmount}</p>
                      <p className="text-sm text-slate-500">
                        Quote {job.quoteAccepted ? '(Accepted)' : '(Pending)'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700">Description</h4>
                  <p className="text-slate-600 mt-1">{job.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700">Location</h4>
                  <p className="text-slate-600 mt-1">{job.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-slate-700">Posted</h4>
                    <p className="text-slate-600 mt-1">{new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                  {job.scheduledDate && (
                    <div>
                      <h4 className="font-medium text-slate-700">Scheduled</h4>
                      <p className="text-slate-600 mt-1">{new Date(job.scheduledDate).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {job.bookingDeadline && !job.scheduledDate && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800">
                      <strong>Booking Deadline:</strong> {new Date(job.bookingDeadline).toLocaleString()}
                    </p>
                  </div>
                )}
                {job.contractorPayType && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-800">
                      <strong>Contractor Pay:</strong> {job.contractorPayType === 'FIXED' ? 'Fixed' : 'Hourly'} - ${job.contractorPayRate}
                      {job.contractorPayType === 'HOURLY' && '/hr'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quote Form for Commercial Jobs */}
          {isCommercial && !job.quoteAmount && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Create Quote</CardTitle>
                  <Button onClick={() => setShowQuoteForm(!showQuoteForm)}>
                    {showQuoteForm ? 'Cancel' : 'Create Quote'}
                  </Button>
                </div>
              </CardHeader>
              {showQuoteForm && (
                <CardContent>
                  <form onSubmit={handleCreateQuote} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Quote Amount ($)</label>
                      <Input
                        type="number"
                        value={quoteData.quoteAmount}
                        onChange={(e) => setQuoteData({...quoteData, quoteAmount: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Quote Notes</label>
                      <Input
                        value={quoteData.quoteNotes}
                        onChange={(e) => setQuoteData({...quoteData, quoteNotes: e.target.value})}
                        placeholder="Details about the quote..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contractor Pay Type</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={quoteData.contractorPayType}
                        onChange={(e) => setQuoteData({...quoteData, contractorPayType: e.target.value})}
                      >
                        <option value="FIXED">Fixed Price</option>
                        <option value="HOURLY">Hourly Rate</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Contractor Rate ($){quoteData.contractorPayType === 'HOURLY' && '/hr'}
                      </label>
                      <Input
                        type="number"
                        value={quoteData.contractorPayRate}
                        onChange={(e) => setQuoteData({...quoteData, contractorPayRate: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">Send Quote to Customer</Button>
                  </form>
                </CardContent>
              )}
            </Card>
          )}

          {/* Unlock Fee for Residential Jobs */}
          {!isCommercial && job.status === 'OPEN' && !job.unlockFee && (
            <Card>
              <CardHeader>
                <CardTitle>Set Lead Unlock Fee</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api.post(`/jobs/${id}/quote`, { unlockFee: quoteData.unlockFee });
                    fetchJob();
                  } catch (err) {
                    alert('Error setting unlock fee');
                  }
                }} className="flex gap-4">
                  <Input
                    type="number"
                    placeholder="Unlock fee ($)"
                    value={quoteData.unlockFee}
                    onChange={(e) => setQuoteData({...quoteData, unlockFee: e.target.value})}
                    required
                  />
                  <Button type="submit">Set Fee</Button>
                </form>
                <p className="text-sm text-slate-500 mt-2">
                  Non-subscriber contractors will pay this fee to unlock customer contact details.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bids Section */}
          <Card>
            <CardHeader>
              <CardTitle>Bids ({job.bids.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {job.bids.length === 0 ? (
                <p className="text-slate-500">No bids yet</p>
              ) : (
                <div className="space-y-3">
                  {job.bids.map((bid) => (
                    <div key={bid.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      bid.accepted ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                    }`}>
                      <div>
                        <button 
                          onClick={() => setShowContractorPanel(bid.contractor.id)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {bid.contractor.email}
                        </button>
                        <p className="text-sm text-slate-500">{bid.notes}</p>
                        <div className="flex gap-1 mt-1">
                          {bid.contractor.contractorProfile?.skills.map((skill) => (
                            <span key={skill} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${bid.amount}</p>
                        {bid.accepted ? (
                          <span className="text-green-600 text-sm">✓ Accepted</span>
                        ) : job.status === 'OPEN' && (
                          <Button size="sm" className="mt-1" onClick={() => handleAcceptBid(bid.id)}>
                            Accept Bid
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduler */}
          {showScheduler && assignedContractor && (
            <JobScheduler
              jobId={job.id}
              contractorId={assignedContractor.id}
              onScheduled={handleScheduled}
              onClose={() => setShowScheduler(false)}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{job.customer.email}</p>
              {job.customer.firstName && (
                <p className="text-slate-600">{job.customer.firstName} {job.customer.lastName}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                {job.customer.customerProfile?.type || 'Customer'}
              </p>
              {job.customer.customerProfile?.companyName && (
                <p className="text-sm text-slate-600 mt-1">
                  {job.customer.customerProfile.companyName}
                </p>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setShowCustomerPanel(true)}
              >
                View Customer Details
              </Button>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {job.assignments.length === 0 ? (
                <div>
                  <p className="text-slate-500 mb-4">Not yet assigned</p>
                  <Button onClick={handleFindMatches} className="w-full">
                    Find Matching Contractors
                  </Button>
                </div>
              ) : (
                <div>
                  {job.assignments.map((assignment) => (
                    <div key={assignment.id}>
                      <button
                        onClick={() => setShowContractorPanel(assignment.user.id)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {assignment.user.email}
                      </button>
                      {assignment.user.contractorProfile && (
                        <>
                          <p className="text-sm text-slate-500">
                            ${assignment.user.contractorProfile.hourlyRate}/hr
                          </p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {assignment.user.contractorProfile.skills.map((skill) => (
                              <span key={skill} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => setShowContractorPanel(assignment.user.id)}
                      >
                        View Contractor Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.status === 'ASSIGNED' && !job.scheduledDate && (
                <Button className="w-full" onClick={() => setShowScheduler(true)}>
                  Schedule Job
                </Button>
              )}
              {job.status === 'SCHEDULED' && (
                <Button className="w-full" onClick={() => handleUpdateStatus('IN_PROGRESS')}>
                  Mark In Progress
                </Button>
              )}
              {job.status === 'IN_PROGRESS' && (
                <Button className="w-full" onClick={() => handleUpdateStatus('COMPLETED')}>
                  Mark Complete
                </Button>
              )}
              <Button variant="outline" className="w-full">Edit Job</Button>
              {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
                <Button 
                  variant="ghost" 
                  className="w-full text-red-600"
                  onClick={() => handleUpdateStatus('CANCELLED')}
                >
                  Cancel Job
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
