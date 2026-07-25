import { getSupabaseClient } from '../../utils/supabase-client'

/**
 * Staff access (os-admin / Command Center login gating) is read/written
 * directly against the Supabase-hosted Postgres via supabase-js, not via
 * prismaAny — this repo's DATABASE_URL currently points at a separate,
 * disconnected Railway Postgres instance (no `auth` schema, near-empty
 * `User` table), while the real production data — including auth.users and
 * the roles/permissions/role_permissions tables the RBAC UI manages — lives
 * on Supabase. See packages/database/prisma/migrations/20260725120000_staff_role_assignments.
 * Once DATABASE_URL is repointed at the real database, this can move to
 * prismaAny.staffRoleAssignment like the rest of RBACService.
 */

export interface StaffRoleAssignment {
  id: string
  authUserId: string
  email: string
  roleKey: string
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

function requireSupabaseAdminEnv(): { url: string; serviceKey: string } {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are not configured')
  }
  return { url, serviceKey }
}

// The supabase-js SDK's admin.listUsers() only supports page/perPage, not a
// direct email filter — GoTrue's admin REST endpoint does, so we call it directly.
async function resolveAuthUserId(email: string): Promise<string | null> {
  const { url, serviceKey } = requireSupabaseAdminEnv()

  const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to look up auth user for ${email}: ${res.status} ${await res.text()}`)
  }
  const body = (await res.json()) as { users?: Array<{ id: string; email?: string }> }
  const match = body.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  return match?.id ?? null
}

async function getRolePermissionKeys(roleKey: string): Promise<string[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissionKey')
    .eq('roleKey', roleKey)
  if (error) throw new Error(`Failed to load permissions for role ${roleKey}: ${error.message}`)
  return (data ?? []).map((row: { permissionKey: string }) => row.permissionKey)
}

// Recomputes and writes the effective permission set for a staff user into
// their Supabase app_metadata — this is what ops-api-auth's role checks
// actually read at request time. Pass roleKey: null to clear access (revoke).
export async function syncStaffAccessToSupabase(authUserId: string, roleKey: string | null): Promise<void> {
  const supabase = getSupabaseClient()
  const permissions = roleKey ? await getRolePermissionKeys(roleKey) : []

  const { data: existing, error: fetchErr } = await supabase.auth.admin.getUserById(authUserId)
  if (fetchErr || !existing.user) {
    throw new Error(`Failed to fetch auth user ${authUserId}: ${fetchErr?.message ?? 'not found'}`)
  }

  const { error } = await supabase.auth.admin.updateUserById(authUserId, {
    app_metadata: { ...(existing.user.app_metadata ?? {}), permissions },
  })
  if (error) throw new Error(`Failed to sync app_metadata for ${authUserId}: ${error.message}`)
}

export async function listStaffAssignments(): Promise<StaffRoleAssignment[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('staff_role_assignments')
    .select('*')
    .order('email', { ascending: true })
  if (error) throw new Error(`Failed to list staff assignments: ${error.message}`)
  return (data ?? []) as StaffRoleAssignment[]
}

export async function assignStaffRole(
  email: string,
  roleKey: string,
  createdBy?: string,
): Promise<StaffRoleAssignment> {
  const supabase = getSupabaseClient()

  const { data: role, error: roleErr } = await supabase
    .from('roles')
    .select('key')
    .eq('key', roleKey)
    .maybeSingle()
  if (roleErr) throw new Error(`Failed to look up role ${roleKey}: ${roleErr.message}`)
  if (!role) throw new Error(`Role not found: ${roleKey}`)

  const authUserId = await resolveAuthUserId(email)
  if (!authUserId) {
    throw new Error(`No account found for ${email} — they must sign up/sign in at least once first`)
  }

  const { data, error } = await supabase
    .from('staff_role_assignments')
    .upsert(
      {
        id: crypto.randomUUID(),
        authUserId,
        email,
        roleKey,
        updatedAt: new Date().toISOString(),
        createdBy: createdBy ?? null,
      },
      { onConflict: 'authUserId' },
    )
    .select('*')
    .single()
  if (error) throw new Error(`Failed to assign staff role: ${error.message}`)

  await syncStaffAccessToSupabase(authUserId, roleKey)

  return data as StaffRoleAssignment
}

export async function revokeStaffRole(authUserId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('staff_role_assignments').delete().eq('authUserId', authUserId)
  if (error) throw new Error(`Failed to revoke staff role: ${error.message}`)

  await syncStaffAccessToSupabase(authUserId, null)
}

// A role's permission set can change after staff are already assigned to it
// (e.g. editing role_permissions in the /rbac UI) — re-sync everyone on that role.
export async function resyncStaffForRole(roleKey: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('staff_role_assignments')
    .select('authUserId')
    .eq('roleKey', roleKey)
  if (error) throw new Error(`Failed to load staff for role ${roleKey}: ${error.message}`)
  for (const row of (data ?? []) as Array<{ authUserId: string }>) {
    await syncStaffAccessToSupabase(row.authUserId, roleKey)
  }
}
