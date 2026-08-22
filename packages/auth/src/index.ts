// Browser authentication is intentionally exported only from `@kealee/auth/client`.
// Keeping this root barrel server-safe prevents client identity code entering RSC bundles.

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
  getUnifiedUser,
  isAuthenticated,
  hasRole,
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
