// ============================================================
// DASHBOARD NAVIGATION
// Role-based sidebar navigation
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
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <ul className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
