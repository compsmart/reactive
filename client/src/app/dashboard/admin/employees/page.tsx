'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Employee {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  _count: {
    assignedJobs: number;
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/users?role=EMPLOYEE');
      setEmployees(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', {
        ...newEmployee,
        role: 'EMPLOYEE'
      });
      setShowAddModal(false);
      setNewEmployee({ email: '', firstName: '', lastName: '', phone: '', password: '' });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding employee');
    }
  };

  const handleStatusChange = async (employeeId: number, status: string) => {
    try {
      await api.patch(`/admin/users/${employeeId}`, { status });
      fetchEmployees();
    } catch (err) {
      alert('Error updating employee status');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Employees</h1>
            <p className="text-slate-500">Manage internal employees</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>+ Add Employee</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Employees ({employees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No employees yet</p>
                <Button onClick={() => setShowAddModal(true)}>Add First Employee</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Employee</th>
                      <th className="text-left p-3">Contact</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Jobs</th>
                      <th className="text-left p-3">Joined</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-slate-500">{employee.email}</p>
                        </td>
                        <td className="p-3 text-sm text-slate-600">
                          {employee.phone || '-'}
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            employee.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {employee._count.assignedJobs} assigned
                        </td>
                        <td className="p-3 text-sm text-slate-500">
                          {new Date(employee.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            {employee.status === 'ACTIVE' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(employee.id, 'SUSPENDED')}
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(employee.id, 'ACTIVE')}
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

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    required
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      value={newEmployee.firstName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={newEmployee.lastName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    required
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Add Employee</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

