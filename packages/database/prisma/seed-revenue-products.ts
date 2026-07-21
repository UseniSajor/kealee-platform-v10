import { PrismaClient } from '@prisma/client'
import { REVENUE_PRODUCTS } from '../schema-src/payments/revenue-product-seed-data'

const prisma = new PrismaClient()

export async function seedRevenueProducts(client: PrismaClient = prisma) {
  for (const product of Object.values(REVENUE_PRODUCTS)) {
    await client.revenueProduct.upsert({
      where: { productKey: product.productKey },
      update: product,
      create: product,
    })
  }
}

if (require.main === module) {
  seedRevenueProducts()
    .finally(() => prisma.$disconnect())
}

