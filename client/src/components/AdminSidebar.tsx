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
  badge?: number;
}

interface Props {
  pendingCount?: number;
}

export default function AdminSidebar({ pendingCount = 0 }: Props) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
    { name: 'Users', href: '/dashboard/admin/users', icon: '👥' },
    { name: 'Contractors', href: '/dashboard/admin/contractors', icon: '🔧', badge: pendingCount },
    { name: 'Employees', href: '/dashboard/admin/employees', icon: '👷' },
    { name: 'Customers', href: '/dashboard/admin/customers', icon: '🏠' },
    { name: 'Jobs', href: '/dashboard/admin/jobs', icon: '📋' },
    { name: 'Disputes', href: '/dashboard/admin/disputes', icon: '⚠️' },
    { name: 'Payments', href: '/dashboard/admin/payments', icon: '💳' },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="relative h-8 w-28 mb-1">
          <Image
            src="/logo-wide.webp"
            alt="Reactive Ltd"
            fill
            className="object-contain"
          />
        </div>
        <p className="text-sm text-slate-400">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
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

