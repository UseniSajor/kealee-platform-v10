/**
 * Professional review, by discipline.
 *
 * Two licensed queues sit over the same site-plan workflow: the engineer's
 * (OS Engineering — site plans) and the architect's (OS Architecture — design
 * concepts and the dwelling on the site plan). Each discipline has its own
 * assignment on the workflow, its own subjects to decide, and its own route;
 * neither can decide the other's subjects.
 */
import { auth } from '@clerk/nextjs/server'
import { requireAuthenticatedUser } from '@kealee/auth'
import { prisma } from '@kealee/database'

export const reviewDb = prisma as any

export type ReviewDiscipline = 'professional_engineer' | 'architect'

export interface DisciplineConfig {
  id: ReviewDiscipline
  /** Where the queue lives. */
  path: string
  /** What the desk is called — the OS module it belongs to. */
  desk: string
  title: string
  /** The scoped subjects this licence decides on a site plan (SitePlanContentSubject values). */
  subjects: string[]
  /** `DesignProfessionalProfile.specialties` that mark a profile as this discipline. */
  specialties: string[]
  /** The specialty that identifies the discipline when reading a profile. */
  marker: string
  licenceLabel: string
  /** Audit actorType. */
  actorType: string
}

export const DISCIPLINES: Record<ReviewDiscipline, DisciplineConfig> = {
  professional_engineer: {
    id: 'professional_engineer',
    path: '/engineer/review',
    desk: 'OS Engineering',
    title: 'Site-plan review queue',
    subjects: ['ZONING_COMPLIANCE', 'SITE_LAYOUT'],
    specialties: ['CIVIL_ENGINEERING', 'SITE_PLAN_REVIEW'],
    marker: 'CIVIL_ENGINEERING',
    licenceLabel: 'PE licence number',
    actorType: 'professional_engineer',
  },
  architect: {
    id: 'architect',
    path: '/architect/review',
    desk: 'OS Architecture',
    title: 'Architectural review queue',
    // The dwelling on the site plan — footprint, finished floor, entries — is the
    // architect's subject (spatial-engine content-scope: certifiedBy 'architect').
    subjects: ['ARCHITECTURAL_FOOTPRINT'],
    specialties: ['ARCHITECTURE', 'DESIGN_CONCEPT_REVIEW', 'SITE_PLAN_REVIEW'],
    marker: 'ARCHITECTURE',
    licenceLabel: 'Architect licence number',
    actorType: 'architect',
  },
}

export function disciplineConfig(id: string): DisciplineConfig {
  const c = DISCIPLINES[id as ReviewDiscipline]
  if (!c) throw new Error(`Unknown review discipline: ${id}`)
  return c
}

/** Which discipline a profile belongs to, by its specialties. Engineer when unmarked (the profiles that predate the architect queue). */
export function disciplineOf(profile: { specialties?: string[] } | null | undefined): ReviewDiscipline {
  const sp = profile?.specialties ?? []
  return sp.includes(DISCIPLINES.architect.marker) ? 'architect' : 'professional_engineer'
}

export async function getProfessionalIdentity() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const user = await requireAuthenticatedUser(clerkUserId)
  const profile = await reviewDb.designProfessionalProfile.findUnique({
    where: { userId: user.id },
  })
  return { clerkUserId, user, profile, discipline: profile ? disciplineOf(profile) : null }
}

export function assertCurrentLicence(profile: any) {
  if (!profile?.isLicensed || !profile.licenseNumber || !profile.licenseState) {
    throw new Error('A verified professional licence is required for site-plan review.')
  }
  if (profile.licenseExpiry && new Date(profile.licenseExpiry) < new Date()) {
    throw new Error('Your professional licence is expired. Update it before reviewing a plan.')
  }
}

/** The caller's assignment on this workflow, in the discipline their profile carries. */
export async function requireAssignedReview(workflowId: string, discipline?: ReviewDiscipline) {
  const identity = await getProfessionalIdentity()
  if (!identity?.profile) throw new Error('Professional profile required.')
  const d = discipline ?? identity.discipline ?? 'professional_engineer'
  if (discipline && identity.discipline !== discipline) {
    throw new Error(`This queue is for ${disciplineConfig(discipline).desk}; your profile is registered as ${identity.discipline?.replaceAll('_', ' ')}.`)
  }

  const assignment = await reviewDb.sitePlanReviewAssignment.findFirst({
    where: { workflowId, professionalProfileId: identity.profile.id, discipline: d },
  })
  if (!assignment) throw new Error('This site plan is not assigned to you.')
  return { ...identity, assignment, discipline: d }
}

export function displayProject(metadata: unknown, fallback: string) {
  const value = (metadata ?? {}) as Record<string, unknown>
  return String(value.projectAddress ?? value.address ?? value.projectName ?? fallback)
}
