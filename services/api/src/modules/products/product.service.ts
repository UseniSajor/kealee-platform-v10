import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError, ConflictError } from '../../errors/app.error'
import { Decimal } from '@prisma/client/runtime/library'

export const productService = {
  /**
   * Create a new product in the catalog
   */
  async createProduct(data: {
    name: string
    description?: string
    sku: string
    category: string
    brand?: string
    manufacturer?: string
    unitPrice: number
    unitOfMeasure?: string
    leadTimeDays?: number
    supplier?: string
    imageUrl?: string
    arModelUrl?: string
    dimensions?: any
    specifications?: any
  }) {
    // Check SKU uniqueness
    const existing = await prismaAny.product.findUnique({ where: { sku: data.sku } })
    if (existing) {
      throw new ConflictError(`Product with SKU ${data.sku} already exists`)
    }

    return prismaAny.product.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        sku: data.sku,
        category: data.category,
        brand: data.brand ?? null,
        manufacturer: data.manufacturer ?? null,
        unitPrice: new Decimal(data.unitPrice),
        unitOfMeasure: data.unitOfMeasure ?? null,
        leadTimeDays: data.leadTimeDays ?? null,
        supplier: data.supplier ?? null,
        imageUrl: data.imageUrl ?? null,
        arModelUrl: data.arModelUrl ?? null,
        dimensions: data.dimensions ?? null,
        specifications: data.specifications ?? null,
      },
    })
  },

  /**
   * Get products with optional category/search filters
   */
  async getProducts(filters?: { category?: string; search?: string; page?: number; limit?: number }) {
    const where: any = {}
    if (filters?.category) where.category = filters.category
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 50
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prismaAny.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prismaAny.product.count({ where }),
    ])

    return { products, total, page, limit }
  },

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string) {
    const product = await prismaAny.product.findUnique({
      where: { id: productId },
      include: { projectItems: { select: { id: true, projectId: true, quantity: true } } },
    })

    if (!product) throw new NotFoundError('Product', productId)
    return product
  },

  /**
   * Add items to a project from the product catalog
   */
  async addProjectItems(
    projectId: string,
    items: Array<{ productId: string; quantity: number }>,
    userId: string
  ) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, memberships: { select: { userId: true } } },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    const isMember =
      project.ownerId === userId ||
      project.memberships?.some((m: any) => m.userId === userId)
    if (!isMember) {
      throw new AuthorizationError('Only project members can add items')
    }

    // Fetch products to get prices
    const productIds = items.map((i) => i.productId)
    const products = await prismaAny.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]))

    const projectItems = items.map((item) => {
      const product = productMap.get(item.productId)
      if (!product) throw new NotFoundError('Product', item.productId)
      const unitPrice = Number(product.unitPrice)
      return {
        projectId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: new Decimal(unitPrice),
        totalPrice: new Decimal(unitPrice * item.quantity),
        installed: false,
      }
    })

    await prismaAny.projectItem.createMany({ data: projectItems })

    return prismaAny.projectItem.findMany({
      where: { projectId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Get project items
   */
  async getProjectItems(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, memberships: { select: { userId: true } } },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    const isMember =
      project.ownerId === userId ||
      project.memberships?.some((m: any) => m.userId === userId)
    if (!isMember) {
      throw new AuthorizationError('Only project members can view items')
    }

    return prismaAny.projectItem.findMany({
      where: { projectId },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    })
  },

  /**
   * Update a project item (quantity, installed status)
   */
  async updateProjectItem(
    projectId: string,
    itemId: string,
    data: { quantity?: number; installed?: boolean },
    userId: string
  ) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, memberships: { select: { userId: true } } },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    const isMember =
      project.ownerId === userId ||
      project.memberships?.some((m: any) => m.userId === userId)
    if (!isMember) {
      throw new AuthorizationError('Only project members can update items')
    }

    const item = await prismaAny.projectItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    })

    if (!item || item.projectId !== projectId) {
      throw new NotFoundError('ProjectItem', itemId)
    }

    const updateData: any = {}
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity
      updateData.totalPrice = new Decimal(Number(item.unitPrice) * data.quantity)
    }
    if (data.installed !== undefined) {
      updateData.installed = data.installed
      if (data.installed) updateData.installedAt = new Date()
    }

    return prismaAny.projectItem.update({
      where: { id: itemId },
      data: updateData,
      include: { product: true },
    })
  },
}
