import { prismaAny } from '../../utils/prisma-helper'
import { getSupabaseClient } from '../../utils/supabase-client'
import { resyncStaffForRole } from './staff-access.service'

// Role/Permission/RolePermission reads & writes go through Supabase directly
// (not prismaAny) — this repo's DATABASE_URL currently points at a separate,
// disconnected Railway Postgres, while the real data (including what the
// os-admin /rbac UI actually needs to manage) lives on Supabase. See
// packages/database/prisma/migrations/20260725120000_staff_role_assignments
// and staff-access.service.ts for the same reasoning. Org-scoped permission
// checks below (userHasPermission etc.) are unrelated to the /rbac UI and are
// left on prismaAny/OrgMember as before.

export class RBACService {
  // Create a role
  async createRole(data: { key: string; name: string; description?: string }) {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        id: crypto.randomUUID(),
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return role
  }

  // Get role by key
  async getRoleByKey(roleKey: string) {
    const supabase = getSupabaseClient()
    const { data: role, error } = await supabase.from('roles').select('*').eq('key', roleKey).maybeSingle()
    if (error) throw new Error(error.message)
    if (!role) throw new Error('Role not found')

    const { data: rolePermissions, error: rpError } = await supabase
      .from('role_permissions')
      .select('permissionKey, permissions(*)')
      .eq('roleKey', roleKey)
    if (rpError) throw new Error(rpError.message)

    return { ...role, permissions: rolePermissions ?? [] }
  }

  // List all roles
  async listRoles() {
    const supabase = getSupabaseClient()
    const { data: roles, error } = await supabase.from('roles').select('*').order('createdAt', { ascending: false })
    if (error) throw new Error(error.message)

    const { data: rolePermissions, error: rpError } = await supabase.from('role_permissions').select('roleKey')
    if (rpError) throw new Error(rpError.message)

    const counts = new Map<string, number>()
    for (const rp of (rolePermissions ?? []) as Array<{ roleKey: string }>) {
      counts.set(rp.roleKey, (counts.get(rp.roleKey) ?? 0) + 1)
    }

    return (roles ?? []).map((role: { key: string }) => ({
      ...role,
      _count: { permissions: counts.get(role.key) ?? 0 },
    }))
  }

  // Create a permission
  async createPermission(data: { key: string; name: string; description?: string }) {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const { data: permission, error } = await supabase
      .from('permissions')
      .insert({
        id: crypto.randomUUID(),
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return permission
  }

  // Get permission by key
  async getPermissionByKey(permissionKey: string) {
    const supabase = getSupabaseClient()
    const { data: permission, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('key', permissionKey)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!permission) throw new Error('Permission not found')

    const { data: rolePermissions, error: rpError } = await supabase
      .from('role_permissions')
      .select('roleKey, roles(*)')
      .eq('permissionKey', permissionKey)
    if (rpError) throw new Error(rpError.message)

    return { ...permission, roles: rolePermissions ?? [] }
  }

  // List all permissions
  async listPermissions() {
    const supabase = getSupabaseClient()
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('createdAt', { ascending: false })
    if (error) throw new Error(error.message)

    const { data: rolePermissions, error: rpError } = await supabase.from('role_permissions').select('permissionKey')
    if (rpError) throw new Error(rpError.message)

    const counts = new Map<string, number>()
    for (const rp of (rolePermissions ?? []) as Array<{ permissionKey: string }>) {
      counts.set(rp.permissionKey, (counts.get(rp.permissionKey) ?? 0) + 1)
    }

    return (permissions ?? []).map((permission: { key: string }) => ({
      ...permission,
      _count: { roles: counts.get(permission.key) ?? 0 },
    }))
  }

  // Assign permission to role
  async assignPermissionToRole(roleKey: string, permissionKey: string) {
    const supabase = getSupabaseClient()

    const { data: role, error: roleErr } = await supabase.from('roles').select('key').eq('key', roleKey).maybeSingle()
    if (roleErr) throw new Error(roleErr.message)
    if (!role) throw new Error('Role not found')

    const { data: permission, error: permErr } = await supabase
      .from('permissions')
      .select('key')
      .eq('key', permissionKey)
      .maybeSingle()
    if (permErr) throw new Error(permErr.message)
    if (!permission) throw new Error('Permission not found')

    const { data: rolePermission, error } = await supabase
      .from('role_permissions')
      .upsert(
        { id: crypto.randomUUID(), roleKey, permissionKey, createdAt: new Date().toISOString() },
        { onConflict: 'roleKey,permissionKey' },
      )
      .select('*')
      .single()
    if (error) throw new Error(error.message)

    // A role's permission set can change after staff are already assigned to
    // it — keep their app_metadata in sync.
    await resyncStaffForRole(roleKey).catch((err) => {
      console.error(`[rbac] resyncStaffForRole(${roleKey}) failed after permission assign:`, err)
    })

    return rolePermission
  }

  // Remove permission from role
  async removePermissionFromRole(roleKey: string, permissionKey: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('roleKey', roleKey)
      .eq('permissionKey', permissionKey)
    if (error) throw new Error(error.message)

    await resyncStaffForRole(roleKey).catch((err) => {
      console.error(`[rbac] resyncStaffForRole(${roleKey}) failed after permission remove:`, err)
    })
  }

  // Get all permissions for a role
  async getRolePermissions(roleKey: string) {
    const supabase = getSupabaseClient()
    const { data: role, error: roleErr } = await supabase.from('roles').select('key').eq('key', roleKey).maybeSingle()
    if (roleErr) throw new Error(roleErr.message)
    if (!role) throw new Error('Role not found')

    const { data: rolePermissions, error } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .eq('roleKey', roleKey)
    if (error) throw new Error(error.message)

    return (rolePermissions ?? []).map((rp: { permissions: unknown }) => rp.permissions)
  }

  // Check if user has permission (via their org role)
  async userHasPermission(
    userId: string,
    orgId: string,
    permissionKey: string
  ): Promise<boolean> {
    // Get user's role in the organization
    const membership = await prismaAny.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    })

    if (!membership) {
      return false
    }

    // Check if the role has the permission
    const rolePermission = await prismaAny.rolePermission.findUnique({
      where: {
        roleKey_permissionKey: {
          roleKey: membership.roleKey,
          permissionKey,
        },
      },
    })

    return !!rolePermission
  }

  // Get all permissions for a user in an organization
  async getUserPermissions(userId: string, orgId: string) {
    const membership = await prismaAny.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    })

    if (!membership) {
      return []
    }

    const rolePermissions = await prismaAny.rolePermission.findMany({
      where: {
        roleKey: membership.roleKey,
      },
      include: {
        permission: true,
      },
    })

    return rolePermissions.map((rp: any) => rp.permission)
  }

  // Check if user has any of the specified permissions
  async userHasAnyPermission(
    userId: string,
    orgId: string,
    permissionKeys: string[]
  ): Promise<boolean> {
    const membership = await prismaAny.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    })

    if (!membership) {
      return false
    }

    const count = await prismaAny.rolePermission.count({
      where: {
        roleKey: membership.roleKey,
        permissionKey: {
          in: permissionKeys,
        },
      },
    })

    return count > 0
  }

  // Get user's role in organization
  async getUserRole(userId: string, orgId: string) {
    const membership = await prismaAny.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!membership) {
      return null
    }

    const role = await prismaAny.role.findUnique({
      where: { key: membership.roleKey },
    })

    return {
      ...membership,
      role,
    }
  }
}

export const rbacService = new RBACService()
