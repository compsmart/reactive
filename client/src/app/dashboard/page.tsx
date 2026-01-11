'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Redirect based on role
    switch (user.role) {
      case 'ADMIN':
        router.push('/dashboard/admin');
        break;
      case 'CUST_RESIDENTIAL':
      case 'CUST_COMMERCIAL':
        router.push('/dashboard/customer');
        break;
      case 'SUBCONTRACTOR':
        router.push('/dashboard/contractor');
        break;
      case 'EMPLOYEE':
        router.push('/dashboard/employee');
        break;
      default:
        // Unknown role, stay on generic dashboard
        break;
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-pulse text-lg mb-2">Loading dashboard...</div>
        <p className="text-sm text-slate-500">Redirecting you to the right place</p>
      </div>
    </div>
  );
}
