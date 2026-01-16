// ============================================================
// HOME PAGE
// Redirects to dashboard or login
// ============================================================

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  redirect('/dashboard');
}
