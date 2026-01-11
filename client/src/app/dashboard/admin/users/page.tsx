'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  contractorProfile?: {
    isVerified: boolean;
    rating: number;
  };
  customerProfile?: {
    type: string;
    companyName: string | null;
  };
  _count: {
    assignedJobs: number;
    jobsPosted: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(pagination.page));
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }));
    fetchUsers();
  };

  const handleUpdateUser = async (userId: number, data: Partial<User>) => {
    try {
      await api.patch(`/admin/users/${userId}`, data);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'EMPLOYEE': return 'bg-blue-100 text-blue-800';
      case 'SUBCONTRACTOR': return 'bg-green-100 text-green-800';
      case 'CUST_RESIDENTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'CUST_COMMERCIAL': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-slate-500">Manage all users in the system</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Search</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Email, name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>Search</Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="SUBCONTRACTOR">Contractor</option>
                  <option value="CUST_RESIDENTIAL">Residential Customer</option>
                  <option value="CUST_COMMERCIAL">Commercial Customer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">User</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Joined</th>
                        <th className="text-left p-3">Activity</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{user.email}</p>
                              <p className="text-sm text-slate-500">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded ${getRoleColor(user.role)}`}>
                              {user.role.replace('CUST_', '').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-sm text-slate-500">
                            {user.role === 'SUBCONTRACTOR' || user.role === 'EMPLOYEE' ? (
                              <span>{user._count.assignedJobs} jobs</span>
                            ) : user.role.startsWith('CUST') ? (
                              <span>{user._count.jobsPosted} posted</span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                Edit
                              </Button>
                              {user.status === 'ACTIVE' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateUser(user.id, { status: 'SUSPENDED' })}
                                >
                                  Suspend
                                </Button>
                              )}
                              {user.status === 'SUSPENDED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateUser(user.id, { status: 'ACTIVE' })}
                                >
                                  Activate
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={editingUser.email} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={editingUser.firstName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={editingUser.lastName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="SUBCONTRACTOR">Contractor</option>
                    <option value="CUST_RESIDENTIAL">Residential Customer</option>
                    <option value="CUST_COMMERCIAL">Commercial Customer</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button className="flex-1" onClick={() => handleUpdateUser(editingUser.id, editingUser)}>
                  Save Changes
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
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

