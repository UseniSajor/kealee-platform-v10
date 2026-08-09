import { prisma, Prisma } from '@kealee/database'
import type { LeadTwinService, LeadTwinUpsertInput } from './interfaces.js'
import type { LeadTwinSnapshot } from '../schemas/twins.js'

function toSnapshot(row: {
  id: string
  propertyTwinId: string | null
  crmContactId: string | null
  email: string | null
  phone: string | null
  name: string | null
  leadType: string | null
  segment: string | null
  crmStatus: string | null
  sourceChannel: string | null
  complianceFlags: string[]
}): LeadTwinSnapshot {
  return {
    id: row.id,
    propertyTwinId: row.propertyTwinId ?? undefined,
    crmContactId: row.crmContactId ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    name: row.name ?? undefined,
    leadType: row.leadType ?? undefined,
    segment: row.segment ?? undefined,
    crmStatus: row.crmStatus ?? undefined,
    sourceChannel: row.sourceChannel ?? undefined,
    complianceFlags: row.complianceFlags,
  }
}

export class PrismaLeadTwinService implements LeadTwinService {
  async getById(id: string): Promise<LeadTwinSnapshot | null> {
    const row = await prisma.leadTwin.findUnique({ where: { id } })
    return row ? toSnapshot(row) : null
  }

  async upsert(input: LeadTwinUpsertInput): Promise<LeadTwinSnapshot> {
    const existing = input.crmContactId
      ? await prisma.leadTwin.findFirst({ where: { crmContactId: input.crmContactId } })
      : input.email
        ? await prisma.leadTwin.findFirst({ where: { email: input.email } })
        : null

    const data: Prisma.LeadTwinCreateInput = {
      orgId: input.orgId,
      propertyTwin: input.propertyTwinId
        ? { connect: { id: input.propertyTwinId } }
        : undefined,
      crmContactId: input.crmContactId,
      email: input.email,
      phone: input.phone,
      name: input.name,
      leadType: input.leadType,
      segment: input.segment,
      crmStatus: input.crmStatus,
      sourceChannel: input.sourceChannel,
      interactionHistory: input.interactionHistory as Prisma.InputJsonValue | undefined,
      complianceFlags: input.complianceFlags ?? [],
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    }

    const row = existing
      ? await prisma.leadTwin.update({
          where: { id: existing.id },
          data: {
            orgId: input.orgId,
            crmContactId: input.crmContactId,
            email: input.email,
            phone: input.phone,
            name: input.name,
            leadType: input.leadType,
            segment: input.segment,
            crmStatus: input.crmStatus,
            sourceChannel: input.sourceChannel,
            interactionHistory: input.interactionHistory as Prisma.InputJsonValue | undefined,
            complianceFlags: input.complianceFlags ?? [],
            metadata: input.metadata as Prisma.InputJsonValue | undefined,
            ...(input.propertyTwinId
              ? { propertyTwin: { connect: { id: input.propertyTwinId } } }
              : {}),
          },
        })
      : await prisma.leadTwin.create({ data })

    return toSnapshot(row)
  }

  async applyAgentOutput(
    leadTwinId: string,
    output: {
      leadSegment: string
      intentScore: number
      engagementScore: number
      salesPriority: string
      crmTags: string[]
      complianceFlags: string[]
    },
  ): Promise<LeadTwinSnapshot> {
    const row = await prisma.leadTwin.update({
      where: { id: leadTwinId },
      data: {
        segment: output.leadSegment,
        crmStatus: output.salesPriority,
        complianceFlags: output.complianceFlags,
        metadata: {
          intentScore: output.intentScore,
          engagementScore: output.engagementScore,
          crmTags: output.crmTags,
        } as Prisma.InputJsonValue,
      },
    })
    return toSnapshot(row)
  }
}

export const prismaLeadTwinService = new PrismaLeadTwinService()
