import { prisma } from '@kealee/database'
import { NotFoundError } from '../../errors/app.error'

export type CreatePropertyInput = {
  orgId?: string | null
  address: string
  address2?: string | null
  city: string
  state: string
  zip: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  lotNumber?: string | null
  parcelNumber?: string | null
  lotSizeSqFt?: number | null
  yearBuilt?: number | null
}

export const propertyService = {
  async createProperty(input: CreatePropertyInput) {
    // Avoid duplicate properties for identical normalized address.
    const existing = await prisma.property.findFirst({
      where: {
        address: { equals: input.address, mode: 'insensitive' },
        city: { equals: input.city, mode: 'insensitive' },
        state: { equals: input.state, mode: 'insensitive' },
        zip: { equals: input.zip, mode: 'insensitive' },
      },
    })

    if (existing) {
      return { property: existing, created: false as const }
    }

    const property = await prisma.property.create({
      data: {
        orgId: input.orgId ?? null,
        address: input.address,
        address2: input.address2 ?? null,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country ?? 'US',
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        lotNumber: input.lotNumber ?? null,
        parcelNumber: input.parcelNumber ?? null,
        lotSizeSqFt: input.lotSizeSqFt ?? null,
        yearBuilt: input.yearBuilt ?? null,
      },
    })

    return { property, created: true as const }
  },

  async getProperty(id: string) {
    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) throw new NotFoundError('Property', id)
    return property
  },

  async searchProperties(q: string, orgId?: string, limit: number = 10) {
    return prisma.property.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
        OR: [
          { address: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
          { zip: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: Math.min(limit, 50),
      orderBy: { updatedAt: 'desc' },
    })
  },

  async validateAddress(address: string, city: string, state: string, zip: string) {
    const existingProperty = await prisma.property.findFirst({
      where: {
        address: { equals: address, mode: 'insensitive' },
        city: { equals: city, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
        zip: { equals: zip, mode: 'insensitive' },
      },
      select: { id: true },
    })

    if (!existingProperty) return { propertyId: null as string | null, existingProjects: 0 }

    const existingProjects = await prisma.project.count({
      where: { propertyId: existingProperty.id },
    })

    return { propertyId: existingProperty.id, existingProjects }
  },
}

