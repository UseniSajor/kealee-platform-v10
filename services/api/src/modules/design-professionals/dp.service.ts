/**
 * dp.service.ts — Design Professionals Service
 * Uses DesignProfessional additive model.
 * Falls back gracefully if model not yet migrated.
 */
import { prisma } from '../../lib/prisma'
import type { RegisterDPBody, UpdateDPProfile, DPProfileDto, DPAssignmentDto } from './dp.dto'

const db = prisma as any

export async function registerDesignProfessional(userId: string, body: RegisterDPBody): Promise<DPProfileDto> {
  // Check if already registered
  const existing = await db.designProfessional?.findUnique({ where: { userId } })
  if (existing) throw Object.assign(new Error('Design professional profile already exists'), { statusCode: 409 })

  const profile = await db.designProfessional.create({
    data: {
      userId,
      role: body.role,
      licenseNumber: body.licenseNumber,
      licenseState: body.licenseState,
      licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : undefined,
      firmName: body.firmName,
      portfolioUrl: body.portfolioUrl,
      specialties: body.specialties ?? [],
      bio: body.bio,
      yearsExperience: body.yearsExperience,
      jurisdictions: body.jurisdictions ?? [],
      status: 'PENDING_REVIEW',
    },
    include: { user: { select: { name: true, email: true } } },
  })

  return _mapProfile(profile)
}

export async function getDPProfile(userId: string): Promise<DPProfileDto | null> {
  const profile = await db.designProfessional?.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true } } },
  })
  return profile ? _mapProfile(profile) : null
}

export async function updateDPProfile(userId: string, body: UpdateDPProfile): Promise<DPProfileDto> {
  const existing = await db.designProfessional?.findUnique({ where: { userId } })
  if (!existing) throw Object.assign(new Error('Profile not found'), { statusCode: 404 })

  const updated = await db.designProfessional.update({
    where: { userId },
    data: {
      ...(body.licenseNumber !== undefined && { licenseNumber: body.licenseNumber }),
      ...(body.licenseState !== undefined && { licenseState: body.licenseState }),
      ...(body.licenseExpiry && { licenseExpiry: new Date(body.licenseExpiry) }),
      ...(body.firmName !== undefined && { firmName: body.firmName }),
      ...(body.portfolioUrl !== undefined && { portfolioUrl: body.portfolioUrl }),
      ...(body.specialties && { specialties: body.specialties }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.yearsExperience !== undefined && { yearsExperience: body.yearsExperience }),
      ...(body.jurisdictions && { jurisdictions: body.jurisdictions }),
    },
    include: { user: { select: { name: true, email: true } } },
  })

  return _mapProfile(updated)
}

export async function listDesignProfessionals(opts: {
  role?: string
  status?: string
  jurisdiction?: string
  page?: number
  limit?: number
}) {
  const { role, status = 'VERIFIED', jurisdiction, page = 1, limit = 20 } = opts

  const where: any = { status }
  if (role) where.role = role
  if (jurisdiction) where.jurisdictions = { has: jurisdiction }

  const [profiles, total] = await Promise.all([
    db.designProfessional?.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }) ?? [],
    db.designProfessional?.count({ where }) ?? 0,
  ])

  return {
    profiles: (profiles as any[]).map(_mapProfile),
    total,
    page,
    limit,
  }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function assignDP(
  projectId: string,
  professionalId: string,
  role: string,
  requesterId: string
): Promise<DPAssignmentDto> {
  // Verify project access
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: requesterId }, { memberships: { some: { userId: requesterId, role: 'OWNER' } } }],
    },
    select: { id: true },
  })
  if (!project) throw Object.assign(new Error('Project not found or access denied'), { statusCode: 404 })

  // Verify professional exists
  const professional = await db.designProfessional?.findUnique({ where: { id: professionalId } })
  if (!professional) throw Object.assign(new Error('Professional not found'), { statusCode: 404 })

  const assignment = await db.designProfessionalAssignment.create({
    data: {
      projectId,
      professionalId,
      role,
      status: 'INVITED',
    },
  })

  return _mapAssignment(assignment)
}

export async function listProjectAssignments(projectId: string): Promise<DPAssignmentDto[]> {
  const assignments = await db.designProfessionalAssignment?.findMany({
    where: { projectId },
    orderBy: { invitedAt: 'desc' },
  }) ?? []
  return assignments.map(_mapAssignment)
}

export async function updateAssignment(
  assignmentId: string,
  userId: string,
  status: string
): Promise<DPAssignmentDto> {
  const assignment = await db.designProfessionalAssignment?.findFirst({
    where: {
      id: assignmentId,
      professional: { userId },
    },
  })
  if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 })

  const updated = await db.designProfessionalAssignment.update({
    where: { id: assignmentId },
    data: {
      status,
      ...(status === 'ACTIVE' && { acceptedAt: new Date() }),
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
    },
  })

  return _mapAssignment(updated)
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminVerifyDP(professionalId: string, adminId: string): Promise<DPProfileDto> {
  const profile = await db.designProfessional?.findUnique({
    where: { id: professionalId },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!profile) throw Object.assign(new Error('Profile not found'), { statusCode: 404 })

  const updated = await db.designProfessional.update({
    where: { id: professionalId },
    data: { status: 'VERIFIED', verifiedAt: new Date() },
    include: { user: { select: { name: true, email: true } } },
  })

  return _mapProfile(updated)
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function _mapProfile(p: any): DPProfileDto {
  return {
    id: p.id,
    userId: p.userId,
    role: p.role,
    status: p.status,
    firmName: p.firmName ?? null,
    licenseNumber: p.licenseNumber ?? null,
    licenseState: p.licenseState ?? null,
    licenseExpiry: p.licenseExpiry?.toISOString() ?? null,
    portfolioUrl: p.portfolioUrl ?? null,
    specialties: p.specialties ?? [],
    bio: p.bio ?? null,
    yearsExperience: p.yearsExperience ?? null,
    jurisdictions: p.jurisdictions ?? [],
    verifiedAt: p.verifiedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    user: { name: p.user?.name ?? null, email: p.user?.email ?? '' },
  }
}

function _mapAssignment(a: any): DPAssignmentDto {
  return {
    id: a.id,
    projectId: a.projectId,
    professionalId: a.professionalId,
    role: a.role,
    status: a.status,
    invitedAt: a.invitedAt.toISOString(),
    acceptedAt: a.acceptedAt?.toISOString() ?? null,
    completedAt: a.completedAt?.toISOString() ?? null,
  }
}
