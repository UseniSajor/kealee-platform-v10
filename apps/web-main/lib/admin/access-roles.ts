/**
 * Kealee platform access roles and API scopes.
 * Used by intelligence-auth and marketing API authorization.
 */

export type KealeeAccessRole =
  | 'owner'
  | 'administrator'
  | 'project_manager'
  | 'marketing_partner'
  | 'ops'

export type ApiScope =
  | 'read:marketing'
  | 'read:intelligence'
  | 'write:intelligence'
  | 'read:command_center'
  | 'admin:all'

export const ROLE_SCOPES: Record<KealeeAccessRole, ApiScope[]> = {
  owner: ['admin:all', 'read:marketing', 'read:intelligence', 'write:intelligence', 'read:command_center'],
  administrator: ['admin:all', 'read:marketing', 'read:intelligence', 'write:intelligence', 'read:command_center'],
  project_manager: ['read:command_center', 'read:intelligence', 'read:marketing'],
  marketing_partner: ['read:marketing', 'read:intelligence'],
  ops: ['admin:all', 'read:marketing', 'read:intelligence', 'write:intelligence', 'read:command_center'],
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
    surfaces: ['/api/admin/marketing/dashboard', '/api/admin/intelligence/assignments', '/api/admin/intelligence/opportunities'],
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
  if (single && provided === single) return 'marketing_partner'
  const match = parseMarketingApiKeys().find((e) => e.key === provided)
  return match?.role ?? null
}

export function roleHasScope(role: KealeeAccessRole, scope: ApiScope): boolean {
  const scopes = ROLE_SCOPES[role]
  return scopes.includes('admin:all') || scopes.includes(scope)
}
