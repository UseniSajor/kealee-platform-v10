// ============================================================
// DASHBOARD HEADER
// ============================================================

'use client';

import { User } from '@supabase/supabase-js';
import { UserRole } from '@permits/src/types';
import { Button } from '@permits/src/components/ui/button';
import { createClient } from '@permits/src/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  user: User;
  role: UserRole;
}

export function DashboardHeader({ user, role }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permits & Inspections</h1>
          <p className="text-sm text-gray-500">Role: {role}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
