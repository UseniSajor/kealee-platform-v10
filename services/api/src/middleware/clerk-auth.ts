import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "@clerk/backend";
import { prisma } from "@kealee/database";
import { logger } from "@kealee/observability";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  throw new Error("CLERK_SECRET_KEY environment variable is required");
}

export interface AuthenticatedRequest extends FastifyRequest {
  auth: {
    userId: string;
    clerkUserId: string;
    orgId?: string;
    user: any;
    org?: any;
    membership?: any;
  };
}

/**
 * Middleware to verify Clerk session and attach authenticated user to request
 */
export async function verifyClerkSession(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Missing or invalid authorization header", {
      path: request.url,
    });
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });

    const clerkUserId = decoded.sub;

    if (!clerkUserId) {
      logger.warn("Clerk token missing user ID", { token: token.substring(0, 20) });
      reply.code(401).send({ error: "Invalid token" });
      return;
    }

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { externalAuthId: clerkUserId },
      include: {
        orgMembers: {
          include: {
            org: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn("Clerk user not found in database", { clerkUserId });
      reply.code(401).send({ error: "User not found" });
      return;
    }

    if (user.isDeleted) {
      logger.warn("Attempted access by deleted user", {
        userId: user.id,
        clerkUserId,
      });
      reply.code(403).send({ error: "User account is deactivated" });
      return;
    }

    // Extract org_id from request query/body if provided
    const orgId =
      (request.query as any)?.org_id ||
      (request.body as any)?.org_id ||
      user.orgMembers[0]?.orgId;

    let org = null;
    let membership = null;

    if (orgId) {
      membership = user.orgMembers.find((m) => m.orgId === orgId);
      if (membership) {
        org = membership.org;
      }
    }

    // Attach auth context to request
    (request as AuthenticatedRequest).auth = {
      userId: user.id,
      clerkUserId,
      orgId: org?.id,
      user,
      org: org || null,
      membership: membership || null,
    };

    logger.debug("Clerk session verified", {
      userId: user.id,
      clerkUserId,
      orgId: org?.id,
    });
  } catch (err) {
    logger.warn("Clerk token verification failed", { error: err });
    reply.code(401).send({ error: "Invalid or expired token" });
    return;
  }
}

/**
 * Middleware to enforce platform admin role
 */
export async function requirePlatformAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const auth = (request as AuthenticatedRequest).auth;

  if (!auth) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  // Check if user has platform admin role
  const hasAdminRole = await prisma.orgMember.findFirst({
    where: {
      userId: auth.userId,
      org: {
        isPlatformAdmin: true,
      },
      roleKey: { in: ["platform_owner", "super_admin", "ops_admin"] },
    },
  });

  if (!hasAdminRole) {
    logger.warn("Non-admin user attempted platform admin operation", {
      userId: auth.userId,
      path: request.url,
    });
    reply.code(403).send({ error: "Insufficient permissions" });
    return;
  }
}

/**
 * Middleware to enforce organization membership
 */
export async function requireOrgMembership(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const auth = (request as AuthenticatedRequest).auth;

  if (!auth || !auth.orgId) {
    reply.code(401).send({ error: "Organization context required" });
    return;
  }

  // Verify membership is still active
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: auth.userId,
        orgId: auth.orgId,
      },
    },
  });

  if (!membership) {
    logger.warn("Non-member user attempted organization access", {
      userId: auth.userId,
      orgId: auth.orgId,
      path: request.url,
    });
    reply.code(403).send({ error: "Not a member of this organization" });
    return;
  }
}

/**
 * Middleware to enforce specific organization role
 */
export function requireOrgRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = (request as AuthenticatedRequest).auth;

    if (!auth || !auth.orgId) {
      reply.code(401).send({ error: "Organization context required" });
      return;
    }

    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId: auth.userId,
          orgId: auth.orgId,
        },
      },
    });

    if (!membership || !roles.includes(membership.roleKey)) {
      logger.warn("User attempted operation without required role", {
        userId: auth.userId,
        orgId: auth.orgId,
        requiredRoles: roles,
        userRole: membership?.roleKey,
        path: request.url,
      });
      reply.code(403).send({ error: "Insufficient permissions for this operation" });
      return;
    }
  };
}

/**
 * Middleware to enforce project membership
 */
export async function requireProjectAccess(projectId: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = (request as AuthenticatedRequest).auth;

    if (!auth) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    // Check if user is member of the project's organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { org: true },
    });

    if (!project) {
      reply.code(404).send({ error: "Project not found" });
      return;
    }

    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId: auth.userId,
          orgId: project.orgId,
        },
      },
    });

    if (!membership) {
      logger.warn("Non-member attempted project access", {
        userId: auth.userId,
        projectId,
        orgId: project.orgId,
      });
      reply.code(403).send({ error: "Access denied to this project" });
      return;
    }

    // Attach project to auth context
    (request as AuthenticatedRequest).auth.orgId = project.orgId;
  };
}
