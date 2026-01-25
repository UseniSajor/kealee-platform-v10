import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

// Lazy Supabase client initialization
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        }
      } as unknown as SupabaseClient;
    }
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});

// Auth functions
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {}
    }
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`
  });
  
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function updateUserMetadata(metadata: Record<string, any>) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata
  });
  
  if (error) throw error;
  return data;
}

// React hooks
export { useAuth } from './hooks/useAuth';
export { useRequireAuth } from './hooks/useRequireAuth';
export { useProfile } from './hooks/useProfile';
export type { Profile } from './hooks/useProfile';
