'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  Package,
  Database,
  Ruler,
  BarChart3,
  Settings,
  Calculator,
  Wand2,
  Brain,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Estimates', href: '/estimates', icon: FileText },
  { name: 'Assemblies', href: '/assemblies', icon: Package },
  { name: 'Cost Database', href: '/cost-database', icon: Database },
  { name: 'Takeoff', href: '/takeoff', icon: Ruler },
  { name: 'AI Takeoff', href: '/ai-takeoff', icon: Wand2 },
  { name: 'AI Tools', href: '/ai-tools', icon: Brain },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <img
          src="/kealee-logo-300w.png"
          alt="Kealee"
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>v1.0.0</p>
      </div>
    </aside>
  );
}
