import type { PrismaClient } from '@prisma/client'
import catalog from '../../../../docs/white-label/product-templates.v1.json'

/**
 * Runtime-owned, idempotent seed for the commercial white-label catalog.
 * The JSON file is the reviewed catalog input; ModuleEntitlement remains the
 * runtime authorization authority after a product is assigned.
 */
export async function seedWhiteLabelProductTemplates(prisma: PrismaClient): Promise<number> {
  const client = prisma as any
  for (const product of catalog.products) {
    const data = {
      name: product.name,
      description: product.capabilities.map((capability) => capability.replace(/_/g, ' ')).join(', '),
      enabledModuleKeys: product.modules,
      navigationConfig: { sections: product.modules },
      workflowBlueprint: { capabilities: product.capabilities },
      defaultAssistantConfig: {
        audience: product.audience,
        humanReviewRequired: true,
      },
      version: catalog.catalogVersion,
      isActive: true,
    }
    await client.whiteLabelProductTemplate.upsert({
      where: { key: product.key },
      create: { key: product.key, ...data },
      update: data,
    })
  }
  return catalog.products.length
}
