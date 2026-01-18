// ============================================================
// SUPABASE SERVER CLIENT
// ============================================================

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

// Alias for convenience
export const createClient = createServerClient;
