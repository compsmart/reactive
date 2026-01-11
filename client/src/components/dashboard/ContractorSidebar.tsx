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

export default function ContractorSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard/contractor', icon: '📊' },
    { name: 'Available Jobs', href: '/dashboard/contractor/jobs', icon: '📋' },
    { name: 'My Calendar', href: '/dashboard/contractor/calendar', icon: '📅' },
    { name: 'Earnings', href: '/dashboard/contractor/earnings', icon: '💰' },
    { name: 'Profile', href: '/dashboard/contractor/profile', icon: '👤' },
    { name: 'Subscription', href: '/dashboard/contractor/subscription', icon: '⭐' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/contractor') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard/contractor">
          <div className="relative h-8 w-28 mb-1">
            <Image
              src="/logo-wide.webp"
              alt="Reactive Ltd"
              fill
              className="object-contain"
            />
          </div>
        </Link>
        <p className="text-sm text-slate-400">Contractor Portal</p>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 py-4 border-b border-slate-700">
          <p className="text-sm font-medium text-white truncate">{user.email}</p>
          <p className="text-xs text-slate-400">Contractor</p>
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
                    ? 'bg-[#E86A33] text-white'
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
        <Link href="/contractors/join#pricing" className="block mb-2">
          <Button
            variant="outline"
            className="w-full text-amber-400 border-amber-400/50 hover:bg-amber-400/10 hover:border-amber-400"
          >
            ⭐ Upgrade Plan
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

