import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Lazy Supabase client initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkreqfpkxavqpsqexbfs.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDc3NzAsImV4cCI6MjA4Mzk4Mzc3MH0.Zszenm7LrN7eRKi3-htbsQX8h4ulNvdCT_F1s-v0YJk';

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a mock client that will fail gracefully
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables not set. Auth operations will fail.');
      // Return a minimal mock for build-time compatibility
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
          signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
          signOut: async () => ({ error: null }),
          resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase not configured') }),
          updateUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        }),
      } as unknown as SupabaseClient;
    }
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return _supabase;
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});
