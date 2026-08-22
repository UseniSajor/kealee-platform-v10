'use client';

import { useUser } from '@clerk/nextjs';

export interface AuthState {
  user: { id: string } | null;
  loading: boolean;
}

/** Shared client auth state. Clerk is the identity provider; Supabase is data only. */
export function useAuth(): AuthState {
  const { isLoaded, user } = useUser();
  return { user: user ?? null, loading: !isLoaded };
}
