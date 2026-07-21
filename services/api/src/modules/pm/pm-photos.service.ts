import { prismaAny } from '../../utils/prisma-helper'

class PhotoService {
  async list(filters: { projectId?: string; category?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { projectId, category, startDate, endDate, page = 1, limit = 50 } = filters
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (category) where.category = category
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [items, total] = await Promise.all([
      prismaAny.photo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prismaAny.photo.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string) {
    return prismaAny.photo.findUnique({ where: { id } })
  }

  async create(data: any) {
    return prismaAny.photo.create({ data })
  }

  async update(id: string, data: any) {
    return prismaAny.photo.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prismaAny.photo.delete({ where: { id } })
  }

  async getTimeline(projectId: string) {
    const photos = await prismaAny.photo.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    // Group photos by date (YYYY-MM-DD)
    const grouped: Record<string, any[]> = {}
    for (const photo of photos) {
      const date = new Date(photo.createdAt).toISOString().split('T')[0]
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(photo)
    }

    return Object.entries(grouped)
      .map(([date, photos]) => ({ date, photos }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  async getCategories(projectId: string) {
    const result = await prismaAny.photo.groupBy({
      by: ['category'],
      where: { projectId },
      _count: true,
    })

    return result.map((r: any) => ({ category: r.category, count: r._count }))
  }
}

export const photoService = new PhotoService()
