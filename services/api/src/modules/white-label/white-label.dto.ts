import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit hex color')
const optionalUrl = z.string().url().optional().nullable()

export const whiteLabelTierSchema = z.enum([
  'MANAGED_BRANDED',
  'FULL_WHITE_LABEL',
  'PRIVATE_ENTERPRISE',
])

export const whiteLabelStatusSchema = z.enum([
  'DRAFT',
  'PROVISIONING',
  'ACTIVE',
  'SUSPENDED',
  'ARCHIVED',
])

export const createWhiteLabelTenantSchema = z.object({
  orgId: z.string().uuid(),
  companyName: z.string().trim().min(2).max(160),
  productName: z.string().trim().min(2).max(160).optional(),
  tier: whiteLabelTierSchema.default('MANAGED_BRANDED'),
  productKeys: z.array(z.string().trim().min(1)).max(12).default([]),
  planKey: z.string().trim().min(1).default('kealee-branded-starter'),
  planName: z.string().trim().min(1).default('Kealee Branded Starter'),
  baseMonthlyAmountCents: z.number().int().nonnegative().default(150000),
})

export const updateWhiteLabelProfileSchema = z.object({
  tier: whiteLabelTierSchema.optional(),
  status: whiteLabelStatusSchema.optional(),
  companyName: z.string().trim().min(2).max(160).optional(),
  productName: z.string().trim().min(2).max(160).optional().nullable(),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  accentColor: hexColor.optional(),
  emailFromName: z.string().trim().max(160).optional().nullable(),
  emailFromAddress: z.string().email().optional().nullable(),
  emailReplyToAddress: z.string().email().optional().nullable(),
  reportHeader: z.string().max(500).optional().nullable(),
  reportFooter: z.string().max(1000).optional().nullable(),
  legalDisclaimer: z.string().max(10000).optional().nullable(),
  supportName: z.string().max(160).optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),
  supportPhone: z.string().max(40).optional().nullable(),
  supportUrl: optionalUrl,
  locale: z.string().min(2).max(20).optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()).optional(),
  timeZone: z.string().min(1).max(80).optional(),
  navigationConfig: z.record(z.unknown()).optional().nullable(),
  documentBranding: z.record(z.unknown()).optional().nullable(),
  emailBranding: z.record(z.unknown()).optional().nullable(),
  kealeeBrandingVisible: z.boolean().optional(),
  clientAdminEnabled: z.boolean().optional(),
}).strict()

export const updateTenantAdminProfileSchema = updateWhiteLabelProfileSchema.pick({
  companyName: true,
  productName: true,
  logoUrl: true,
  faviconUrl: true,
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  emailFromName: true,
  emailReplyToAddress: true,
  reportHeader: true,
  reportFooter: true,
  supportName: true,
  supportEmail: true,
  supportPhone: true,
  supportUrl: true,
  locale: true,
  currency: true,
  timeZone: true,
  navigationConfig: true,
})

export const createTenantDomainSchema = z.object({
  hostname: z.string().trim().min(3).max(253),
  isPrimary: z.boolean().default(false),
})

export const updateTenantDomainSchema = z.object({
  status: z.enum(['PENDING', 'VERIFYING', 'ACTIVE', 'FAILED']).optional(),
  isPrimary: z.boolean().optional(),
  failureReason: z.string().max(1000).optional().nullable(),
}).strict()

export const updateTenantProductsSchema = z.object({
  products: z.array(z.object({
    productKey: z.string().trim().min(1),
    enabled: z.boolean().default(true),
    displayName: z.string().trim().max(160).optional().nullable(),
    configuration: z.record(z.unknown()).optional().nullable(),
  })).max(20),
})

export const updateTenantPlanSchema = z.object({
  planKey: z.string().trim().min(1).max(100),
  planName: z.string().trim().min(1).max(160),
  baseMonthlyAmountCents: z.number().int().nonnegative(),
  supportTier: z.string().trim().min(1).max(80).default('STANDARD'),
  includedUsage: z.record(z.number().nonnegative()).optional().nullable(),
  overageRates: z.record(z.number().nonnegative()).optional().nullable(),
  billingStatus: z.string().trim().min(1).max(80).optional(),
  stripeCustomerId: z.string().max(255).optional().nullable(),
  stripeSubscriptionId: z.string().max(255).optional().nullable(),
  stripeBasePriceId: z.string().max(255).optional().nullable(),
  stripeMeterPriceIds: z.record(z.string()).optional().nullable(),
  currentPeriodStart: z.coerce.date().optional().nullable(),
  currentPeriodEnd: z.coerce.date().optional().nullable(),
  cancelAtPeriodEnd: z.boolean().optional(),
}).strict()

export const recordTenantUsageSchema = z.object({
  metric: z.enum([
    'AI_INPUT_TOKEN', 'AI_OUTPUT_TOKEN', 'AGENT_RUN', 'IMAGE_GENERATION',
    'VIDEO_GENERATION_SECOND', 'DOCUMENT_PROCESSED', 'REPORT_GENERATED',
    'PROPERTY_EVALUATED', 'STORAGE_GB_HOUR', 'EMAIL_SENT', 'NOTIFICATION_SENT',
    'API_CALL', 'BACKGROUND_JOB_SECOND', 'THIRD_PARTY_DATA_CENT',
  ]),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1).max(80),
  provider: z.string().max(120).optional(),
  model: z.string().max(160).optional(),
  resourceType: z.string().max(120).optional(),
  resourceId: z.string().max(255).optional(),
  idempotencyKey: z.string().trim().min(8).max(255),
  occurredAt: z.coerce.date().optional(),
  unitCostCents: z.number().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const usageQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  metric: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const reconcileUsageSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
})

export const updateDeploymentSchema = z.object({
  mode: z.enum(['SHARED', 'DEDICATED_KEALEE', 'CUSTOMER_CLOUD']).optional(),
  environmentKey: z.string().max(160).optional().nullable(),
  databaseRef: z.string().max(255).optional().nullable(),
  storageNamespace: z.string().min(1).max(255).optional(),
  vectorNamespace: z.string().min(1).max(255).optional(),
  queueNamespace: z.string().min(1).max(255).optional(),
  region: z.string().max(80).optional().nullable(),
  dataRetentionDays: z.number().int().positive().max(3650).optional().nullable(),
  backupPolicy: z.record(z.unknown()).optional().nullable(),
  securityControls: z.record(z.unknown()).optional().nullable(),
  customerCloudMetadata: z.record(z.unknown()).optional().nullable(),
  serviceLevel: z.string().min(1).max(80).optional(),
}).strict()

export const createEvaluationSuiteSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().max(5000).optional(),
  moduleKey: z.string().max(120).optional(),
  accuracyThreshold: z.number().min(0).max(1).optional(),
  humanReviewPolicy: z.record(z.unknown()).optional(),
  promptVersion: z.string().max(120).optional(),
  modelVersion: z.string().max(160).optional(),
  cases: z.array(z.object({
    name: z.string().trim().min(1).max(160),
    input: z.record(z.unknown()),
    expectedOutput: z.unknown().optional(),
    assertions: z.record(z.unknown()),
  })).max(250).default([]),
})

export const createSupportAccessSchema = z.object({
  reason: z.string().trim().min(10).max(5000),
  permissions: z.array(z.string().trim().min(1)).min(1).max(30),
  expiresAt: z.coerce.date(),
})

export const updateSupportAccessSchema = z.object({
  action: z.enum(['APPROVE', 'DENY', 'ACTIVATE', 'REVOKE']),
  reason: z.string().trim().max(5000).optional(),
})

export type CreateWhiteLabelTenantInput = z.infer<typeof createWhiteLabelTenantSchema>
export type UpdateWhiteLabelProfileInput = z.infer<typeof updateWhiteLabelProfileSchema>
export type UpdateTenantProductsInput = z.infer<typeof updateTenantProductsSchema>
export type UpdateTenantPlanInput = z.infer<typeof updateTenantPlanSchema>
export type RecordTenantUsageInput = z.infer<typeof recordTenantUsageSchema>
export type UpdateDeploymentInput = z.infer<typeof updateDeploymentSchema>
export type CreateEvaluationSuiteInput = z.infer<typeof createEvaluationSuiteSchema>
