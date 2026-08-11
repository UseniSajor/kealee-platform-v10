import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/backend";
import { prisma } from "@kealee/database";
import { logger } from "@kealee/observability";

const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

if (!webhookSecret) {
  throw new Error("CLERK_WEBHOOK_SIGNING_SECRET is not set");
}

interface ClerkWebhookPayload {
  data: Record<string, unknown>;
  object: string;
  type: string;
}

export async function handleClerkWebhook(
  body: string,
  headers: Record<string, string>
): Promise<void> {
  const wh = new Webhook(webhookSecret);

  let payload: WebhookEvent;
  try {
    payload = wh.verify(body, headers) as WebhookEvent;
  } catch (err) {
    logger.error("Clerk webhook signature verification failed", { error: err });
    throw new Error("Webhook signature verification failed");
  }

  logger.info("Processing Clerk webhook", {
    eventType: payload.type,
    eventId: payload.data.id,
  });

  switch (payload.type) {
    case "user.created":
      await handleUserCreated(payload.data);
      break;
    case "user.updated":
      await handleUserUpdated(payload.data);
      break;
    case "user.deleted":
      await handleUserDeleted(payload.data);
      break;
    case "organization.created":
      await handleOrgCreated(payload.data);
      break;
    case "organizationMembership.created":
      await handleOrgMembershipCreated(payload.data);
      break;
    case "organizationMembership.updated":
      await handleOrgMembershipUpdated(payload.data);
      break;
    case "organizationMembership.deleted":
      await handleOrgMembershipDeleted(payload.data);
      break;
    default:
      logger.warn("Unknown Clerk webhook event type", { type: payload.type });
  }
}

// ============================================================================
// USER EVENT HANDLERS
// ============================================================================

async function handleUserCreated(data: Record<string, unknown>): Promise<void> {
  const clerkUserId = data.id as string;
  const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]
    ?.email_address;
  const firstName = data.first_name as string | null;
  const lastName = data.last_name as string | null;
  const imageUrl = data.image_url as string | null;

  if (!email) {
    logger.error("Clerk user.created event missing email", { clerkUserId });
    return;
  }

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        externalAuthId: clerkUserId,
        authProvider: "clerk",
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        profilePicture: imageUrl || undefined,
      },
      create: {
        email,
        externalAuthId: clerkUserId,
        authProvider: "clerk",
        firstName: firstName || null,
        lastName: lastName || null,
        profilePicture: imageUrl || null,
        // Password is not used with Clerk, but Prisma may require a value
        password: "N/A",
      },
    });

    logger.info("User synced from Clerk", {
      userId: user.id,
      clerkUserId,
      email,
    });
  } catch (err) {
    logger.error("Failed to sync user from Clerk", {
      clerkUserId,
      email,
      error: err,
    });
    throw err;
  }
}

async function handleUserUpdated(data: Record<string, unknown>): Promise<void> {
  const clerkUserId = data.id as string;
  const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]
    ?.email_address;
  const firstName = data.first_name as string | null;
  const lastName = data.last_name as string | null;
  const imageUrl = data.image_url as string | null;

  if (!email) {
    logger.error("Clerk user.updated event missing email", { clerkUserId });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { externalAuthId: clerkUserId },
    });

    if (!user) {
      logger.warn("Clerk user.updated: user not found, creating", {
        clerkUserId,
      });
      await handleUserCreated(data);
      return;
    }

    // If email changed, handle email migration
    if (user.email !== email) {
      logger.info("User email changed in Clerk, updating record", {
        userId: user.id,
        oldEmail: user.email,
        newEmail: email,
      });
    }

    await prisma.user.update({
      where: { externalAuthId: clerkUserId },
      data: {
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        profilePicture: imageUrl || undefined,
      },
    });

    logger.info("User updated from Clerk", { clerkUserId, email });
  } catch (err) {
    logger.error("Failed to update user from Clerk", {
      clerkUserId,
      email,
      error: err,
    });
    throw err;
  }
}

async function handleUserDeleted(data: Record<string, unknown>): Promise<void> {
  const clerkUserId = data.id as string;

  try {
    const user = await prisma.user.findUnique({
      where: { externalAuthId: clerkUserId },
    });

    if (!user) {
      logger.warn("Clerk user.deleted: user not found", { clerkUserId });
      return;
    }

    // Deactivate instead of delete to preserve project history
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    logger.info("User deactivated after Clerk deletion", {
      userId: user.id,
      clerkUserId,
    });
  } catch (err) {
    logger.error("Failed to deactivate user from Clerk deletion", {
      clerkUserId,
      error: err,
    });
    throw err;
  }
}

// ============================================================================
// ORGANIZATION EVENT HANDLERS
// ============================================================================

async function handleOrgCreated(data: Record<string, unknown>): Promise<void> {
  const clerkOrgId = data.id as string;
  const name = data.name as string;
  const slug = data.slug as string;

  if (!name || !clerkOrgId) {
    logger.error("Clerk organization.created event missing required fields", {
      clerkOrgId,
      name,
    });
    return;
  }

  try {
    const org = await prisma.org.upsert({
      where: { externalOrgId: clerkOrgId },
      update: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      },
      create: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        externalOrgId: clerkOrgId,
      },
    });

    logger.info("Organization synced from Clerk", {
      orgId: org.id,
      clerkOrgId,
      name,
    });
  } catch (err) {
    logger.error("Failed to sync organization from Clerk", {
      clerkOrgId,
      name,
      error: err,
    });
    throw err;
  }
}

// ============================================================================
// ORGANIZATION MEMBERSHIP EVENT HANDLERS
// ============================================================================

async function handleOrgMembershipCreated(
  data: Record<string, unknown>
): Promise<void> {
  const clerkUserId = data.public_user_data?.user_id as string | undefined;
  const clerkOrgId = data.organization_id as string;
  const role = data.role as string;

  if (!clerkUserId || !clerkOrgId) {
    logger.error("Clerk organizationMembership.created missing required fields", {
      clerkUserId,
      clerkOrgId,
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { externalAuthId: clerkUserId },
    });

    const org = await prisma.org.findUnique({
      where: { externalOrgId: clerkOrgId },
    });

    if (!user || !org) {
      logger.warn("Clerk organizationMembership.created: user or org not found", {
        clerkUserId,
        clerkOrgId,
        userFound: !!user,
        orgFound: !!org,
      });
      return;
    }

    // Map Clerk organization roles to Kealee roles
    const mappedRole = mapClerkRoleToKealee(role);

    // Check if membership already exists
    const existingMembership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId: user.id,
          orgId: org.id,
        },
      },
    });

    if (existingMembership) {
      logger.info("Organization membership already exists, updating role", {
        userId: user.id,
        orgId: org.id,
        oldRole: existingMembership.roleKey,
        newRole: mappedRole,
      });

      await prisma.orgMember.update({
        where: {
          userId_orgId: {
            userId: user.id,
            orgId: org.id,
          },
        },
        data: {
          roleKey: mappedRole,
        },
      });
    } else {
      await prisma.orgMember.create({
        data: {
          userId: user.id,
          orgId: org.id,
          roleKey: mappedRole,
        },
      });

      logger.info("Organization membership created from Clerk", {
        userId: user.id,
        orgId: org.id,
        role: mappedRole,
      });
    }
  } catch (err) {
    logger.error("Failed to create organization membership from Clerk", {
      clerkUserId,
      clerkOrgId,
      error: err,
    });
    throw err;
  }
}

async function handleOrgMembershipUpdated(
  data: Record<string, unknown>
): Promise<void> {
  const clerkUserId = data.public_user_data?.user_id as string | undefined;
  const clerkOrgId = data.organization_id as string;
  const role = data.role as string;

  if (!clerkUserId || !clerkOrgId) {
    logger.error("Clerk organizationMembership.updated missing required fields", {
      clerkUserId,
      clerkOrgId,
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { externalAuthId: clerkUserId },
    });

    const org = await prisma.org.findUnique({
      where: { externalOrgId: clerkOrgId },
    });

    if (!user || !org) {
      logger.warn("Clerk organizationMembership.updated: user or org not found", {
        clerkUserId,
        clerkOrgId,
      });
      return;
    }

    const mappedRole = mapClerkRoleToKealee(role);

    await prisma.orgMember.update({
      where: {
        userId_orgId: {
          userId: user.id,
          orgId: org.id,
        },
      },
      data: {
        roleKey: mappedRole,
      },
    });

    logger.info("Organization membership role updated from Clerk", {
      userId: user.id,
      orgId: org.id,
      newRole: mappedRole,
    });
  } catch (err) {
    logger.error("Failed to update organization membership from Clerk", {
      clerkUserId,
      clerkOrgId,
      error: err,
    });
    throw err;
  }
}

async function handleOrgMembershipDeleted(
  data: Record<string, unknown>
): Promise<void> {
  const clerkUserId = data.public_user_data?.user_id as string | undefined;
  const clerkOrgId = data.organization_id as string;

  if (!clerkUserId || !clerkOrgId) {
    logger.error("Clerk organizationMembership.deleted missing required fields", {
      clerkUserId,
      clerkOrgId,
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { externalAuthId: clerkUserId },
    });

    const org = await prisma.org.findUnique({
      where: { externalOrgId: clerkOrgId },
    });

    if (!user || !org) {
      logger.warn("Clerk organizationMembership.deleted: user or org not found", {
        clerkUserId,
        clerkOrgId,
      });
      return;
    }

    // Soft delete the membership
    await prisma.orgMember.delete({
      where: {
        userId_orgId: {
          userId: user.id,
          orgId: org.id,
        },
      },
    });

    logger.info("Organization membership removed from Clerk", {
      userId: user.id,
      orgId: org.id,
    });
  } catch (err) {
    logger.error("Failed to remove organization membership from Clerk", {
      clerkUserId,
      clerkOrgId,
      error: err,
    });
    throw err;
  }
}

// ============================================================================
// ROLE MAPPING
// ============================================================================

function mapClerkRoleToKealee(clerkRole: string): string {
  // Map Clerk organization roles to Kealee role keys
  // Clerk roles: admin, basic_member, guest_member
  const roleMap: Record<string, string> = {
    admin: "owner",
    basic_member: "project_manager",
    guest_member: "viewer",
  };

  return roleMap[clerkRole] || "viewer";
}
