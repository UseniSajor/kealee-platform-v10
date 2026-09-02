import { auth } from '@clerk/nextjs/server'
import { requireAuthenticatedUser } from '@kealee/auth'
import { prisma } from '@kealee/database'

export const reviewDb = prisma as any

export async function getEngineerIdentity() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const user = await requireAuthenticatedUser(clerkUserId)
  const profile = await reviewDb.designProfessionalProfile.findUnique({
    where: { userId: user.id },
  })
  return { clerkUserId, user, profile }
}

export function assertCurrentLicence(profile: any) {
  if (!profile?.isLicensed || !profile.licenseNumber || !profile.licenseState) {
    throw new Error('A verified professional licence is required for site-plan review.')
  }
  if (profile.licenseExpiry && new Date(profile.licenseExpiry) < new Date()) {
    throw new Error('Your professional licence is expired. Update it before reviewing a plan.')
  }
}

export async function requireAssignedReview(workflowId: string) {
  const identity = await getEngineerIdentity()
  if (!identity?.profile) throw new Error('Professional profile required.')

  const assignment = await reviewDb.sitePlanReviewAssignment.findFirst({
    where: { workflowId, professionalProfileId: identity.profile.id },
  })
  if (!assignment) throw new Error('This site plan is not assigned to you.')
  return { ...identity, assignment }
}

export function displayProject(metadata: unknown, fallback: string) {
  const value = (metadata ?? {}) as Record<string, unknown>
  return String(value.projectAddress ?? value.address ?? value.projectName ?? fallback)
}
