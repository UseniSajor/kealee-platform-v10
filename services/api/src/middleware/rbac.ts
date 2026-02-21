/**
 * Role-Based Access Control (RBAC) Middleware
 * Granular permission system for authorization
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from './enhanced-auth';

// User Roles (from Prisma schema)
export enum Role {
  ADMIN = 'ADMIN',
  PROJECT_OWNER = 'PROJECT_OWNER',
  CONTRACTOR = 'CONTRACTOR',
  ARCHITECT = 'ARCHITECT',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  ENGINEER = 'ENGINEER',
  INSPECTOR = 'INSPECTOR',
}

// Permissions (granular actions)
export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_BLOCK = 'user:block',

  // Finance Management
  FINANCE_VIEW_ALL = 'finance:view:all',
  FINANCE_VIEW_OWN = 'finance:view:own',
  FINANCE_CREATE_ESCROW = 'finance:create:escrow',
  FINANCE_DEPOSIT = 'finance:deposit',
  FINANCE_RELEASE = 'finance:release',
  FINANCE_FREEZE = 'finance:freeze',
  FINANCE_VIEW_REPORTS = 'finance:view:reports',
  FINANCE_ADMIN = 'finance:admin',

  // Contract Management
  CONTRACT_CREATE = 'contract:create',
  CONTRACT_READ = 'contract:read',
  CONTRACT_UPDATE = 'contract:update',
  CONTRACT_DELETE = 'contract:delete',
  CONTRACT_SIGN = 'contract:sign',
  CONTRACT_APPROVE = 'contract:approve',

  // Project Management
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE = 'project:manage',

  // Milestone Management
  MILESTONE_CREATE = 'milestone:create',
  MILESTONE_UPDATE = 'milestone:update',
  MILESTONE_APPROVE = 'milestone:approve',
  MILESTONE_REJECT = 'milestone:reject',

  // Compliance & Oversight
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_MANAGE = 'compliance:manage',
  OVERSIGHT_ACCESS = 'oversight:access',
  AUDIT_VIEW = 'audit:view',
  AUDIT_MANAGE = 'audit:manage',

  // Analytics
  ANALYTICS_VIEW_BASIC = 'analytics:view:basic',
  ANALYTICS_VIEW_ADVANCED = 'analytics:view:advanced',

  // System Administration
  SYSTEM_CONFIGURE = 'system:configure',
  SYSTEM_LOGS = 'system:logs',
}

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Admins have all permissions
    ...Object.values(Permission),
  ],

  [Role.PROJECT_OWNER]: [
    Permission.USER_READ,
    Permission.FINANCE_VIEW_OWN,
    Permission.FINANCE_CREATE_ESCROW,
    Permission.FINANCE_DEPOSIT,
    Permission.FINANCE_VIEW_REPORTS,
    Permission.CONTRACT_CREATE,
    Permission.CONTRACT_READ,
    Permission.CONTRACT_SIGN,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_MANAGE,
    Permission.MILESTONE_APPROVE,
    Permission.MILESTONE_REJECT,
    Permission.ANALYTICS_VIEW_BASIC,
  ],

  [Role.CONTRACTOR]: [
    Permission.USER_READ,
    Permission.FINANCE_VIEW_OWN,
    Permission.FINANCE_DEPOSIT,
    Permission.CONTRACT_READ,
    Permission.CONTRACT_SIGN,
    Permission.PROJECT_READ,
    Permission.MILESTONE_CREATE,
    Permission.MILESTONE_UPDATE,
    Permission.ANALYTICS_VIEW_BASIC,
  ],

  [Role.ARCHITECT]: [
    Permission.USER_READ,
    Permission.CONTRACT_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.MILESTONE_CREATE,
    Permission.MILESTONE_UPDATE,
  ],

  [Role.PROJECT_MANAGER]: [
    Permission.USER_READ,
    Permission.CONTRACT_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_MANAGE,
    Permission.MILESTONE_CREATE,
    Permission.MILESTONE_UPDATE,
    Permission.MILESTONE_APPROVE,
    Permission.ANALYTICS_VIEW_BASIC,
  ],

  [Role.ENGINEER]: [
    Permission.USER_READ,
    Permission.CONTRACT_READ,
    Permission.PROJECT_READ,
    Permission.MILESTONE_CREATE,
    Permission.MILESTONE_UPDATE,
  ],

  [Role.INSPECTOR]: [
    Permission.USER_READ,
    Permission.CONTRACT_READ,
    Permission.PROJECT_READ,
    Permission.COMPLIANCE_VIEW,
  ],
};

/**
 * Check if role has permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role as Role];
  if (!rolePermissions) {
    return false;
  }
  return rolePermissions.includes(permission);
}

/**
 * Check if role has any of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if role has all of the specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Middleware factory: Require specific role(s)
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      request.log.warn(`Access denied: User ${user.email} (${user.role}) attempted to access resource requiring roles: ${allowedRoles.join(', ')}`);
      
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        actual: user.role,
      });
    }
  };
}

/**
 * Middleware factory: Require specific permission(s)
 */
export function requirePermission(requiredPermissions: Permission | Permission[]) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const hasAccess = hasAllPermissions(user.role, permissions);

    if (!hasAccess) {
      request.log.warn(
        `Permission denied: User ${user.email} (${user.role}) attempted to access resource requiring permissions: ${permissions.join(', ')}`
      );

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        userRole: user.role,
      });
    }
  };
}

/**
 * Middleware factory: Require any of the specified permissions
 */
export function requireAnyPermission(requiredPermissions: Permission[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const hasAccess = hasAnyPermission(user.role, requiredPermissions);

    if (!hasAccess) {
      request.log.warn(
        `Permission denied: User ${user.email} (${user.role}) attempted to access resource requiring any of: ${requiredPermissions.join(', ')}`
      );

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
        userRole: user.role,
      });
    }
  };
}

/**
 * Resource ownership check
 * Ensures user can only access their own resources
 */
export function requireOwnership(getResourceOwnerId: (request: FastifyRequest) => Promise<string>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Admins can access all resources
    if (user.role === Role.ADMIN) {
      return;
    }

    try {
      const resourceOwnerId = await getResourceOwnerId(request);

      if (resourceOwnerId !== user.id) {
        request.log.warn(`Ownership check failed: User ${user.id} attempted to access resource owned by ${resourceOwnerId}`);

        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
          code: 'NOT_RESOURCE_OWNER',
        });
      }
    } catch (error: any) {
      request.log.error('Ownership check error:', error);

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to verify resource ownership',
        code: 'OWNERSHIP_CHECK_FAILED',
      });
    }
  };
}

/**
 * Admin-only middleware (shorthand)
 */
export const requireAdmin = requireRole([Role.ADMIN]);

/**
 * Finance access middleware
 */
export const requireFinanceAccess = requireAnyPermission([
  Permission.FINANCE_VIEW_ALL,
  Permission.FINANCE_VIEW_OWN,
  Permission.FINANCE_ADMIN,
]);

/**
 * Oversight access middleware
 */
export const requireOversightAccess = requirePermission(Permission.OVERSIGHT_ACCESS);

