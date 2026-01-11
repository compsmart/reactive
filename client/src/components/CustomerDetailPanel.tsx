'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';

interface Customer {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  customerProfile?: {
    companyName?: string;
    address?: string;
    type: string;
  };
}

interface CustomerJob {
  id: number;
  title: string;
  status: string;
  budget: number;
  createdAt: string;
}

interface Props {
  customerId: number;
  onClose: () => void;
}

export default function CustomerDetailPanel({ customerId, onClose }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<CustomerJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      const [customerRes, jobsRes] = await Promise.all([
        api.get(`/users/${customerId}`),
        api.get(`/jobs?customerId=${customerId}`)
      ]);
      setCustomer(customerRes.data);
      setJobs(jobsRes.data || []);
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

  if (!customer) {
    return (
      <div className="fixed inset-0 bg-white z-50 p-6">
        <Button variant="ghost" onClick={onClose}>← Back</Button>
        <p className="mt-4">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onClose} className="text-lg">
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Customer Details</h1>
          <div></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-500">Name</label>
                <p className="font-medium">
                  {customer.firstName && customer.lastName 
                    ? `${customer.firstName} ${customer.lastName}`
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Email</label>
                <p className="font-medium">{customer.email}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Phone</label>
                <p className="font-medium">{customer.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Type</label>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  customer.customerProfile?.type === 'Commercial' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {customer.customerProfile?.type || 'Residential'}
                </span>
              </div>
              {customer.customerProfile?.companyName && (
                <div>
                  <label className="text-sm text-slate-500">Company</label>
                  <p className="font-medium">{customer.customerProfile.companyName}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-slate-500">Address</label>
                <p className="font-medium">{customer.customerProfile?.address || 'Not provided'}</p>
              </div>

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

          {/* Job History */}
          <Card>
            <CardHeader>
              <CardTitle>Job History ({jobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-slate-500">No jobs yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            job.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                            job.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {job.status}
                          </span>
                          <p className="text-sm font-medium mt-1">${job.budget}</p>
                        </div>
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

