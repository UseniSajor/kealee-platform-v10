/**
 * Kealee platform access roles and API scopes.
 * Used by intelligence-auth and marketing API authorization.
 */

export type KealeeAccessRole =
  | 'owner'
  | 'administrator'
  | 'project_manager'
  | 'marketing_partner'
  | 'marketing_agency'
  | 'ops'

export type ApiScope =
  | 'read:marketing'
  | 'read:marketing_assets'
  | 'write:marketing_assets'
  | 'read:marketing_analytics'
  | 'read:marketing_leads_summary'
  | 'write:marketing_content_draft'
  | 'read:intelligence'
  | 'write:intelligence'
  | 'read:command_center'
  | 'admin:all'

export const ROLE_SCOPES: Record<KealeeAccessRole, ApiScope[]> = {
  owner: ['admin:all', 'read:marketing', 'read:marketing_assets', 'read:marketing_analytics', 'read:marketing_leads_summary', 'write:marketing_content_draft', 'write:marketing_assets', 'read:intelligence', 'write:intelligence', 'read:command_center'],
  administrator: ['admin:all', 'read:marketing', 'read:marketing_assets', 'read:marketing_analytics', 'read:marketing_leads_summary', 'write:marketing_content_draft', 'write:marketing_assets', 'read:intelligence', 'write:intelligence', 'read:command_center'],
  project_manager: ['read:command_center', 'read:intelligence', 'read:marketing', 'read:marketing_leads_summary'],
  /** @deprecated Use marketing_agency — intelligence access removed for external partners */
  marketing_partner: ['read:marketing_analytics', 'read:marketing_leads_summary', 'read:marketing_assets'],
  marketing_agency: [
    'read:marketing_assets',
    'write:marketing_assets',
    'read:marketing_analytics',
    'read:marketing_leads_summary',
    'write:marketing_content_draft',
  ],
  ops: ['admin:all', 'read:marketing', 'read:marketing_assets', 'read:marketing_analytics', 'read:marketing_leads_summary', 'write:marketing_content_draft', 'write:marketing_assets', 'read:intelligence', 'write:intelligence', 'read:command_center'],
}

/** Roles that must never access intelligence or admin twin APIs */
export const EXTERNAL_MARKETING_ROLES: KealeeAccessRole[] = ['marketing_partner', 'marketing_agency']

export function isExternalMarketingRole(role: KealeeAccessRole | null): boolean {
  return role !== null && EXTERNAL_MARKETING_ROLES.includes(role)
}

/** UI surfaces each role should use (login vs ops secret) */
export const ROLE_PORTAL_MAP: Record<
  KealeeAccessRole,
  { surfaces: string[]; authMethod: 'supabase_login' | 'ops_secret' | 'api_key' }
> = {
  owner: {
    authMethod: 'supabase_login',
    surfaces: ['/admin/intelligence', '/app/command-center', '/api/admin/marketing/dashboard'],
  },
  administrator: {
    authMethod: 'supabase_login',
    surfaces: ['/admin/intelligence', '/app/command-center', '/api/admin/marketing/dashboard'],
  },
  project_manager: {
    authMethod: 'supabase_login',
    surfaces: ['/app/command-center/intakes', '/admin/intelligence/projects', '/admin/intelligence/leads'],
  },
  marketing_partner: {
    authMethod: 'api_key',
    surfaces: ['/api/marketing/*', '/marketing/workspace'],
  },
  marketing_agency: {
    authMethod: 'supabase_login',
    surfaces: ['/marketing/workspace', '/api/marketing/*'],
  },
  ops: {
    authMethod: 'ops_secret',
    surfaces: ['/admin/intelligence', '/api/intelligence/*', '/api/admin/intelligence/*'],
  },
}

export function parseMarketingApiKeys(): Array<{ key: string; role: KealeeAccessRole; label?: string }> {
  const raw = process.env.MARKETING_API_KEYS
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{ key: string; role: KealeeAccessRole; label?: string }>
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function resolveRoleFromApiKey(provided: string): KealeeAccessRole | null {
  const single = process.env.MARKETING_PARTNER_API_KEY
  if (single && provided === single) return 'marketing_agency'
  const match = parseMarketingApiKeys().find((e) => e.key === provided)
  return match?.role ?? null
}

export function roleHasScope(role: KealeeAccessRole, scope: ApiScope): boolean {
  const scopes = ROLE_SCOPES[role]
  return scopes.includes('admin:all') || scopes.includes(scope)
}

/** Supabase app_metadata roles allowed for marketing workspace UI */
export const MARKETING_WORKSPACE_ROLES = new Set([
  'marketing_agency',
  'zem_marketing',
  'admin',
  'super_admin',
  'marketing_admin',
])

export function canAccessMarketingWorkspace(appRole: string | undefined | null): boolean {
  if (!appRole) return false
  return MARKETING_WORKSPACE_ROLES.has(appRole.toLowerCase())
}

export function canApproveMarketingContent(appRole: string | undefined | null): boolean {
  if (!appRole) return false
  return ['admin', 'super_admin', 'marketing_admin', 'owner'].includes(appRole.toLowerCase())
}
