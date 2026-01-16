import { prismaAny } from '../../utils/prisma-helper'

export class RBACService {
  // Create a role
  async createRole(data: {
    key: string
    name: string
    description?: string
  }) {
    const role = await prismaAny.role.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
      },
    })

    return role
  }

  // Get role by key
  async getRoleByKey(roleKey: string) {
    const role = await prismaAny.role.findUnique({
      where: { key: roleKey },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new Error('Role not found')
    }

    return role
  }

  // List all roles
  async listRoles() {
    const roles = await prismaAny.role.findMany({
      include: {
        _count: {
          select: {
            permissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return roles
  }

  // Create a permission
  async createPermission(data: {
    key: string
    name: string
    description?: string
  }) {
    const permission = await prismaAny.permission.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
      },
    })

    return permission
  }

  // Get permission by key
  async getPermissionByKey(permissionKey: string) {
    const permission = await prismaAny.permission.findUnique({
      where: { key: permissionKey },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!permission) {
      throw new Error('Permission not found')
    }

    return permission
  }

  // List all permissions
  async listPermissions() {
    const permissions = await prismaAny.permission.findMany({
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return permissions
  }

  // Assign permission to role
  async assignPermissionToRole(roleKey: string, permissionKey: string) {
    // Check if role exists
    const role = await prismaAny.role.findUnique({
      where: { key: roleKey },
    })
    if (!role) {
      throw new Error('Role not found')
    }

    // Check if permission exists
    const permission = await prismaAny.permission.findUnique({
      where: { key: permissionKey },
    })
    if (!permission) {
      throw new Error('Permission not found')
    }

    // Create or get existing assignment
    const rolePermission = await prismaAny.rolePermission.upsert({
      where: {
        roleKey_permissionKey: {
          roleKey,
          permissionKey,
        },
      },
      create: {
        roleKey,
        permissionKey,
      },
      update: {},
    })

    return rolePermission
  }

  // Remove permission from role
  async removePermissionFromRole(roleKey: string, permissionKey: string) {
    await prismaAny.rolePermission.delete({
      where: {
        roleKey_permissionKey: {
          roleKey,
          permissionKey,
        },
      },
    })
  }

  // Get all permissions for a role
  async getRolePermissions(roleKey: string) {
    const role = await prismaAny.role.findUnique({
      where: { key: roleKey },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new Error('Role not found')
    }

    return role.permissions.map((rp) => rp.permission)
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

    return rolePermissions.map((rp) => rp.permission)
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
