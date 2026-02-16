/**
 * Client-safe Supabase instance.
 *
 * This file intentionally does NOT import any server-side modules (Prisma, etc.)
 * so it can be safely used in 'use client' React components.
 *
 * Uses @supabase/ssr's createBrowserClient in browser contexts, which stores
 * sessions in cookies — matching the middleware's createMiddlewareClient format.
 * Falls back to @supabase/supabase-js createClient for non-browser (SSR) contexts.
 *
 * The client is lazily initialized to avoid errors during SSR/build when
 * NEXT_PUBLIC_SUPABASE_URL may not be available.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
      );
    }
    // Use createBrowserClient (cookie-based) in browser for middleware compat
    if (typeof window !== 'undefined') {
      _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    } else {
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
