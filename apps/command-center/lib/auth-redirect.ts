import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kealee/database";
import { redirect } from "next/navigation";

/**
 * Determines where to redirect a user after login based on their role and org membership
 */
export async function getPostLoginRedirect(): Promise<string> {
  const clerkAuth = auth();
  const userId = clerkAuth.userId;

  if (!userId) {
    return "/sign-in";
  }

  try {
    const user = await prisma.user.findUnique({
      where: { externalAuthId: userId },
      include: {
        orgMembers: {
          include: {
            org: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return "/sign-in";
    }

    if (user.isDeleted) {
      return "/account-suspended";
    }

    if (!user.orgMembers || user.orgMembers.length === 0) {
      return "/onboarding";
    }

    const membership = user.orgMembers[0];
    const org = membership.org;
    const role = membership.roleKey;

    // Platform admin routes
    if (org.isPlatformAdmin) {
      if (role.includes("admin")) {
        return "/admin";
      }
      if (role === "ops_admin" || role === "finance_admin") {
        return "/ops";
      }
    }

    // Owner portal routes
    if (role === "owner") {
      return "/owner-portal";
    }

    // Contractor portal routes
    if (role === "contractor") {
      return "/contractor-portal";
    }

    // Developer portal routes
    if (role === "developer") {
      return "/developer-portal";
    }

    // Project manager / estimator routes
    if (role === "project_manager" || role === "estimator") {
      return "/projects";
    }

    // Default to dashboard for other roles
    return "/dashboard";
  } catch (err) {
    console.error("Error determining post-login redirect:", err);
    return "/";
  }
}

/**
 * Middleware helper to enforce authentication and redirect unauthenticated users
 */
export async function requireAuth(): Promise<void> {
  const clerkAuth = auth();

  if (!clerkAuth.userId) {
    redirect("/sign-in");
  }
}
