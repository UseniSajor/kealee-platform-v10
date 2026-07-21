/**
 * Safe Supabase Client Helper
 * Prevents app crashes when Supabase credentials are not configured
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY are not set');
    console.error('   Please add these to your Railway environment variables');
    console.error('   The API will start but Supabase-dependent features will be disabled');

    // Return a mock Supabase instance that throws helpful errors when used
    return new Proxy({} as SupabaseClient, {
      get: () => {
        throw new Error(
          'Supabase is not configured. Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY environment variables.'
        );
      },
    });
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

export function getSupabaseClientSafe(): SupabaseClient | null {
  try {
    return getSupabaseClient();
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}
