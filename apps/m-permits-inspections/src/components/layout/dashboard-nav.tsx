// ============================================================
// DASHBOARD NAVIGATION
// Icon-only sidebar navigation with tooltips
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  MapPin,
  Settings,
  PlusCircle,
  UserCircle2,
} from 'lucide-react';

interface DashboardNavProps {
  role: UserRole;
}

const clientNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/permits', label: 'Permits', icon: FileText },
  { href: '/dashboard/permits/new', label: 'New Application', icon: PlusCircle },
  { href: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const pmNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/permits', label: 'All Permits', icon: FileText },
  { href: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/dashboard/jurisdictions', label: 'Jurisdictions', icon: MapPin },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/permits', label: 'All Permits', icon: FileText },
  { href: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/dashboard/jurisdictions', label: 'Jurisdictions', icon: MapPin },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems =
    role === 'CLIENT'
      ? clientNavItems
      : role === 'PM'
      ? pmNavItems
      : adminNavItems;

  return (
    <nav className="w-20 bg-white border-r border-gray-200 min-h-screen flex flex-col py-4">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Link
          href="/"
          className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          aria-label="Kealee Permits"
        >
          K
        </Link>
      </div>

      {/* Navigation */}
      <ul className="flex-1 flex flex-col items-center gap-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all',
                  isActive
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                )}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />

                {/* Tooltip */}
                <div className="
                  absolute left-full ml-3 px-3 py-1.5
                  bg-gray-900 text-white text-sm font-medium
                  rounded-lg whitespace-nowrap
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200
                  z-50
                ">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* User Avatar */}
      <div className="border-t border-gray-100 pt-4 flex justify-center">
        <button className="relative group">
          <UserCircle2 className="h-10 w-10 text-gray-400 hover:text-gray-600 transition-colors" />

          {/* Tooltip */}
          <div className="
            absolute left-full ml-3 px-3 py-1.5
            bg-gray-900 text-white text-sm font-medium
            rounded-lg whitespace-nowrap
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200
            z-50
          ">
            {role === 'CLIENT' ? 'Client' : role === 'PM' ? 'Project Manager' : 'Admin'}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </button>
      </div>
    </nav>
  );
}
