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

  // Get user role from Supabase user metadata, app_metadata, or fall back to CLIENT
  const userMetadata = session.user.user_metadata || {};
  const appMetadata = session.user.app_metadata || {};
  const role = (
    appMetadata.role ||
    userMetadata.role ||
    appMetadata.user_role ||
    userMetadata.user_role ||
    'CLIENT'
  ) as string;

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
