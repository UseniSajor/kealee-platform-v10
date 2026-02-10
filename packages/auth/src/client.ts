/**
 * Client-safe auth exports.
 *
 * Use `import { ... } from '@kealee/auth/client'` in 'use client' components.
 * This avoids pulling in server-side Prisma dependencies through the barrel export.
 */

import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase-client';

export { supabase };

// Auth functions (all client-safe — only use Supabase JS client)
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata || {} },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
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
  const { data, error } = await supabase.auth.updateUser({ data: metadata });
  if (error) throw error;
  return data;
}

// React hooks (all client-safe)
export { useAuth } from './hooks/useAuth';
export { useRequireAuth } from './hooks/useRequireAuth';
export { useProfile } from './hooks/useProfile';
export type { Profile } from './hooks/useProfile';
