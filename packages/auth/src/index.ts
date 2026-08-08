import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

// Create the client lazily so importing this module never throws. A module-load
// throw breaks `next build` ("Failed to collect page data") in environments
// without Supabase env vars, e.g. Docker image builds.
let browserClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
    }
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
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

// Server-side auth (SSR)
export {
  createSupabaseServerClient,
  createSupabaseAdminClient,
  getCurrentUser as getServerUser,
  requireAuth,
  requireRole,
  APP_ALLOWED_ROLES,
  ROLE_APP_REDIRECT,
} from './supabase-auth';
export type { AuthUser, CookieStore } from './supabase-auth';

export {
  getAuthHubBaseUrl,
  buildAuthHubUrl,
  getKealeeCookieDomain,
  defaultHomeownerPortalNext,
} from './auth-hub';
export type { AuthHubIntent, AuthHubUrlOptions } from './auth-hub';

export { linkIntakesToUser, linkIntakeToUser } from './link-intakes';
export type { LinkIntakeResult } from './link-intakes';

export {
  entitlementsFromIntakePaths,
  canAccessApp,
} from './entitlements';
export type { KealeeAppId, EntitlementProduct, UserEntitlements } from './entitlements';

export {
  verifyCronRequest,
  verifyOpsBearer,
  getOpsSecret,
  isProductionEnv,
  hasCommandCenterApiRole,
  hasIntelligenceUiRole,
  hasOsAdminRole,
  COMMAND_CENTER_API_ROLES,
  INTELLIGENCE_UI_ROLES,
} from './ops-api-auth';

// Clerk + Supabase Unified Auth
export {
  getClerkUser,
  getSupabaseUser,
  getUnifiedUser,
  getUserFromBoth,
  isAuthenticated,
  hasRole,
  setupClerkCookies,
} from './clerk-adapter';
export type { UnifiedUser } from './clerk-adapter';

// Authorization Service (centralized permission checks)
export {
  requireAuthenticatedUser,
  requireOrganizationMember,
  requireOrganizationRole,
  requireProjectAccess,
  requirePlatformAdmin,
  canAccessResource,
  getAuditLog,
  clearAuditLog,
} from './authorization-service';
export type { AuthorizationContext, AuditLogEntry } from './authorization-service';
