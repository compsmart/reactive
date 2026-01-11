'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface Props {
  title?: string;
}

export default function DashboardHeader({ title }: Props) {
  const { user, logout } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'CUST_RESIDENTIAL':
        return 'Homeowner';
      case 'CUST_COMMERCIAL':
        return 'Business';
      case 'SUBCONTRACTOR':
        return 'Contractor';
      case 'EMPLOYEE':
        return 'Employee';
      default:
        return 'User';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-8 w-28">
              <Image
                src="/logo-wide.webp"
                alt="Reactive Ltd"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          {title && (
            <>
              <span className="text-slate-300">|</span>
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            </>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">{getRoleLabel(user.role)}</p>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

