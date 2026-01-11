'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import CustomerDetailPanel from '@/components/CustomerDetailPanel';
import api from '@/lib/api';

interface Customer {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  customerProfile?: {
    type: string;
    companyName: string | null;
    address: string | null;
  };
  _count: {
    jobsPosted: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'residential' | 'commercial'>('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const [residentialRes, commercialRes] = await Promise.all([
        api.get('/admin/users?role=CUST_RESIDENTIAL'),
        api.get('/admin/users?role=CUST_COMMERCIAL')
      ]);
      setCustomers([...residentialRes.data.users, ...commercialRes.data.users]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (customerId: number, status: string) => {
    try {
      await api.patch(`/admin/users/${customerId}`, { status });
      fetchCustomers();
    } catch (err) {
      alert('Error updating customer status');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (filter === 'residential') return c.customerProfile?.type === 'Residential';
    if (filter === 'commercial') return c.customerProfile?.type === 'Commercial';
    return true;
  });

  const residentialCount = customers.filter(c => c.customerProfile?.type === 'Residential').length;
  const commercialCount = customers.filter(c => c.customerProfile?.type === 'Commercial').length;

  return (
    <AdminLayout>
      <div className="p-6">
        {showPanel && (
          <CustomerDetailPanel
            customerId={showPanel}
            onClose={() => setShowPanel(null)}
          />
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-slate-500">Manage residential and commercial customer accounts</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer" onClick={() => setFilter('all')}>
            <CardContent className={`p-4 ${filter === 'all' ? 'bg-blue-50' : ''}`}>
              <p className="text-sm text-slate-500">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFilter('residential')}>
            <CardContent className={`p-4 ${filter === 'residential' ? 'bg-green-50' : ''}`}>
              <p className="text-sm text-slate-500">Residential</p>
              <p className="text-2xl font-bold text-green-600">{residentialCount}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFilter('commercial')}>
            <CardContent className={`p-4 ${filter === 'commercial' ? 'bg-purple-50' : ''}`}>
              <p className="text-sm text-slate-500">Commercial</p>
              <p className="text-2xl font-bold text-purple-600">{commercialCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' ? 'All' : filter === 'residential' ? 'Residential' : 'Commercial'} Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No customers found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Jobs</th>
                      <th className="text-left p-3">Joined</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <button
                            onClick={() => setShowPanel(customer.id)}
                            className="text-left"
                          >
                            <p className="font-medium text-blue-600 hover:underline">
                              {customer.firstName} {customer.lastName || customer.email}
                            </p>
                            <p className="text-sm text-slate-500">{customer.email}</p>
                            {customer.customerProfile?.companyName && (
                              <p className="text-sm text-slate-500">{customer.customerProfile.companyName}</p>
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            customer.customerProfile?.type === 'Commercial' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {customer.customerProfile?.type || 'Residential'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            customer.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {customer._count.jobsPosted} posted
                        </td>
                        <td className="p-3 text-sm text-slate-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPanel(customer.id)}
                            >
                              View
                            </Button>
                            {customer.status === 'ACTIVE' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(customer.id, 'SUSPENDED')}
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(customer.id, 'ACTIVE')}
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

