// ============================================================
// DASHBOARD LAYOUT
// Role-based layout with navigation
// ============================================================

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DashboardNav } from '@/components/layout/dashboard-nav';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Get user role from metadata or user table
  // For now, default to CLIENT
  const role = 'CLIENT'; // TODO: Fetch from user metadata

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role={role} />
      <div className="flex">
        <DashboardNav role={role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
