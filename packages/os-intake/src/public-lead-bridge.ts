import { prisma } from '@kealee/database'
import type { V30IntakeFormAnswers } from '@kealee/kealee-agent-stack'
import { processV30ProjectIntake } from './process-project-intake'

export interface PublicIntakeV30BridgeInput {
  intakeLeadId: string
  projectPath: string
  clientName: string
  contactEmail: string
  projectAddress: string
  answers: V30IntakeFormAnswers
  features: string[]
  /** Resolved v30 guest user for public_intake_leads (env KEALEE_V30_PUBLIC_USER_ID). */
  userId: string
}

export interface PublicIntakeV30BridgeResult {
  projectId: string
  packageId: string
}

/**
 * Link a paid public_intake_leads row to Prisma Project + v30 package (zip2 os-intake flow).
 */
export async function ensureV30ProjectFromPublicIntake(
  input: PublicIntakeV30BridgeInput,
): Promise<PublicIntakeV30BridgeResult> {
  const existing = await prisma.project.findFirst({
    where: {
      description: { contains: input.intakeLeadId },
    },
    select: { id: true },
  })

  let projectId = existing?.id

  if (projectId) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        categoryMetadata: {
          intakeLeadId: input.intakeLeadId,
          v30: true,
        },
      },
    }).catch(() => undefined)
  }

  if (!projectId) {
    const project = await prisma.project.create({
      data: {
        name: `${input.clientName} — ${input.projectPath}`,
        description: `v30 public intake ${input.intakeLeadId}`,
        ownerId: input.userId,
        status: 'INTAKE',
        address: input.projectAddress,
        category: input.projectPath,
        categoryMetadata: {
          intakeLeadId: input.intakeLeadId,
          v30: true,
        },
      },
    })
    projectId = project.id
  }

  const result = await processV30ProjectIntake({
    projectId,
    userId: input.userId,
    answers: input.answers,
    selectedFeatures: input.features,
  })

  await prisma.v30CustomPackage.update({
    where: { id: result.packageId },
    data: { status: 'PAID', paidAt: new Date() },
  }).catch(() => undefined)

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'GENERATING' },
  })

  return { projectId, packageId: result.packageId }
}

export function resolveV30PublicUserId(): string | null {
  const id = process.env.KEALEE_V30_PUBLIC_USER_ID?.trim()
  return id && id.length > 0 ? id : null
}
