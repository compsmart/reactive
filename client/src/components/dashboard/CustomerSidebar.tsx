'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

export default function CustomerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isCommercial = user?.role === 'CUST_COMMERCIAL';

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard/customer', icon: '📊' },
    { name: 'My Jobs', href: '/dashboard/customer/jobs', icon: '📋' },
    { name: 'Post a Job', href: '/dashboard/customer/post-job', icon: '➕' },
    { name: 'Sign-offs', href: '/dashboard/customer/signoffs', icon: '✅' },
    ...(isCommercial ? [
      { name: 'Locations', href: '/dashboard/customer/locations', icon: '📍' },
      { name: 'Team', href: '/dashboard/customer/team', icon: '👥' },
    ] : []),
    { name: 'Settings', href: '/dashboard/customer/settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/customer') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard/customer">
          <div className="relative h-8 w-28 mb-1">
            <Image
              src="/logo-wide.webp"
              alt="Reactive Ltd"
              fill
              className="object-contain"
            />
          </div>
        </Link>
        <p className="text-sm text-slate-400">
          {isCommercial ? 'Business Portal' : 'Customer Portal'}
        </p>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 py-4 border-b border-slate-700">
          <p className="text-sm font-medium text-white truncate">{user.email}</p>
          <p className="text-xs text-slate-400">
            {isCommercial ? 'Business Account' : 'Homeowner'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-slate-700">
        <Link href="/dashboard/customer/post-job" className="block mb-2">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            ➕ Post New Job
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full text-slate-300 hover:text-white hover:bg-slate-800"
        >
          🚪 Logout
        </Button>
      </div>
    </div>
  );
}

