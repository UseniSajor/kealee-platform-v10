import { prisma } from "@kealee/database";
import { logger } from "@kealee/observability";

/**
 * Centralized authorization helpers for Clerk + Kealee RBAC
 * These validate against the database, not browser-supplied values
 */

export interface AuthContext {
  userId: string;
  clerkUserId: string;
  orgId?: string;
}

// ============================================================================
// BASIC AUTHORIZATION CHECKS
// ============================================================================

export async function canAccessOrganization(
  context: AuthContext,
  orgId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: context.userId,
        orgId,
      },
    },
  });

  return !!membership;
}

export async function canAccessProject(
  context: AuthContext,
  projectId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return false;
  }

  return canAccessOrganization(context, project.orgId);
}

export async function getUserRole(
  context: AuthContext,
  orgId: string
): Promise<string | null> {
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: context.userId,
        orgId,
      },
    },
  });

  return membership?.roleKey || null;
}

export async function isPlatformAdmin(context: AuthContext): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const admin = await prisma.orgMember.findFirst({
    where: {
      userId: context.userId,
      org: {
        isPlatformAdmin: true,
      },
      roleKey: {
        in: [
          "platform_owner",
          "super_admin",
          "ops_admin",
          "finance_admin",
          "permit_admin",
          "support_admin",
        ],
      },
    },
  });

  return !!admin;
}

// ============================================================================
// PROJECT-SPECIFIC AUTHORIZATION
// ============================================================================

export async function canViewProject(
  context: AuthContext,
  projectId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  // Platform admins can view all projects
  if (await isPlatformAdmin(context)) {
    return true;
  }

  return canAccessProject(context, projectId);
}

export async function canEditProject(
  context: AuthContext,
  projectId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      org: true,
    },
  });

  if (!project) {
    return false;
  }

  // Platform admins can edit all projects
  if (await isPlatformAdmin(context)) {
    return true;
  }

  // Check org membership and role
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: context.userId,
        orgId: project.orgId,
      },
    },
  });

  if (!membership) {
    return false;
  }

  // Can edit if owner or project manager
  return ["owner", "project_manager", "estimator"].includes(membership.roleKey);
}

export async function canDeleteProject(
  context: AuthContext,
  projectId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return false;
  }

  // Platform admins can delete all projects
  if (await isPlatformAdmin(context)) {
    return true;
  }

  // Check org membership and role (owner only)
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: context.userId,
        orgId: project.orgId,
      },
    },
  });

  if (!membership) {
    return false;
  }

  return membership.roleKey === "owner";
}

// ============================================================================
// ESTIMATE-SPECIFIC AUTHORIZATION
// ============================================================================

export async function canViewEstimate(
  context: AuthContext,
  estimateId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      project: true,
    },
  });

  if (!estimate || !estimate.project) {
    return false;
  }

  return canViewProject(context, estimate.project.id);
}

export async function canEditEstimate(
  context: AuthContext,
  estimateId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      project: true,
    },
  });

  if (!estimate || !estimate.project) {
    return false;
  }

  return canEditProject(context, estimate.project.id);
}

export async function canApproveEstimate(
  context: AuthContext,
  estimateId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      project: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!estimate || !estimate.project) {
    return false;
  }

  // Platform admins can approve all estimates
  if (await isPlatformAdmin(context)) {
    return true;
  }

  // Check org membership and role (owner, finance admin)
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: context.userId,
        orgId: estimate.project.orgId,
      },
    },
  });

  if (!membership) {
    return false;
  }

  return ["owner", "finance_admin"].includes(membership.roleKey);
}

// ============================================================================
// PAYMENT-SPECIFIC AUTHORIZATION
// ============================================================================

export async function canViewPayment(
  context: AuthContext,
  paymentId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      project: true,
    },
  });

  if (!payment || !payment.project) {
    return false;
  }

  // Platform admins can view all payments
  if (await isPlatformAdmin(context)) {
    return true;
  }

  return canAccessProject(context, payment.project.id);
}

export async function canRefundPayment(
  context: AuthContext,
  paymentId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      project: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!payment || !payment.project) {
    return false;
  }

  // Platform admins can refund all payments
  if (await isPlatformAdmin(context)) {
    return true;
  }

  // Check org membership and role (owner, finance admin)
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: context.userId,
        orgId: payment.project.orgId,
      },
    },
  });

  if (!membership) {
    return false;
  }

  return ["owner", "finance_admin"].includes(membership.roleKey);
}

// ============================================================================
// USER MANAGEMENT AUTHORIZATION
// ============================================================================

export async function canManageUsers(
  context: AuthContext,
  targetOrgId: string
): Promise<boolean> {
  if (!context.userId) {
    return false;
  }

  // Platform admins can manage all users
  if (await isPlatformAdmin(context)) {
    return true;
  }

  // Check org membership and role (owner, admin)
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: context.userId,
        orgId: targetOrgId,
      },
    },
  });

  if (!membership) {
    return false;
  }

  return ["owner", "admin"].includes(membership.roleKey);
}

export async function canChangeUserRole(
  context: AuthContext,
  targetUserId: string,
  targetOrgId: string
): Promise<boolean> {
  if (!context.userId || context.userId === targetUserId) {
    // Users cannot change their own role
    return false;
  }

  return canManageUsers(context, targetOrgId);
}

export async function canDeleteUser(
  context: AuthContext,
  targetUserId: string,
  targetOrgId: string
): Promise<boolean> {
  if (!context.userId || context.userId === targetUserId) {
    // Users cannot delete themselves
    return false;
  }

  // Only platform admins can delete users
  return isPlatformAdmin(context);
}

// ============================================================================
// AUDIT & LOGGING
// ============================================================================

export async function logAuthorizationCheck(
  context: AuthContext,
  action: string,
  resource: string,
  allowed: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  if (!allowed) {
    logger.warn("Authorization check failed", {
      userId: context.userId,
      action,
      resource,
      ...metadata,
    });
  }
}
