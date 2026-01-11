'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from './AdminSidebar';
import api from '@/lib/api';

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPendingCount();
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/admin/contractors/pending');
      setPendingCount(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

