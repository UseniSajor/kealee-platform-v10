import { z } from 'zod'

export const MARKETING_APPROVAL_STATUSES = [
  'draft',
  'submitted',
  'needs_revision',
  'approved',
  'rejected',
  'published',
] as const

export type MarketingApprovalStatus = (typeof MARKETING_APPROVAL_STATUSES)[number]

export const MARKETING_ASSET_TYPES = [
  'logo',
  'service_image',
  'concept_photo',
  'before_after_simulation',
  'video_script',
  'reel_script',
  'ad_copy',
  'social_caption',
  'landing_section',
  'pdf',
  'case_study_template',
] as const

export type MarketingAssetType = (typeof MARKETING_ASSET_TYPES)[number]

export const SERVICE_TYPES = [
  'ADU',
  'kitchen_remodel',
  'bathroom_remodel',
  'basement',
  'exterior_redesign',
  'deck',
  'yard_design',
  'water_mitigation',
  'multifamily_turnover',
  'commercial_renovation',
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

export const PROPERTY_TYPES = [
  'single_family',
  'townhouse',
  'condo',
  'multifamily',
  'commercial',
] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const PROPERTY_STYLES = [
  'modern',
  'traditional',
  'craftsman',
  'colonial',
  'contemporary',
  'farmhouse',
  'mid_century',
] as const

export type PropertyStyle = (typeof PROPERTY_STYLES)[number]

export const MarketingAgencyAssetSchema = z.object({
  id: z.string().uuid(),
  asset_type: z.enum(MARKETING_ASSET_TYPES),
  service_type: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  campaign: z.string().nullable().optional(),
  approval_status: z.enum(MARKETING_APPROVAL_STATUSES),
  generated_by_ai: z.boolean(),
  public_safe: z.boolean(),
  contains_customer_data: z.boolean(),
  created_by: z.string().uuid(),
  approved_by: z.string().uuid().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  storage_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  revision_notes: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type MarketingAgencyAsset = z.infer<typeof MarketingAgencyAssetSchema>

export const ProposeAssetInputSchema = z.object({
  asset_type: z.enum(MARKETING_ASSET_TYPES),
  service_type: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  campaign: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  storage_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  generated_by_ai: z.boolean().optional(),
  public_safe: z.boolean().optional(),
  contains_customer_data: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
  submit: z.boolean().optional(),
})

export const ConceptVisualInputSchema = z.object({
  service_type: z.enum(SERVICE_TYPES),
  property_type: z.enum(PROPERTY_TYPES),
  property_style: z.enum(PROPERTY_STYLES),
  city: z.string().optional(),
  county: z.string().optional(),
  campaign: z.string().optional(),
  variant: z.enum(['before', 'after', 'hero']).default('after'),
})

export type ConceptVisualInput = z.infer<typeof ConceptVisualInputSchema>

/** Agency cannot set these statuses directly. */
export const AGENCY_FORBIDDEN_STATUS_TRANSITIONS = new Set([
  'approved',
  'rejected',
  'published',
])

export function canAgencyTransitionStatus(
  from: MarketingApprovalStatus,
  to: MarketingApprovalStatus,
): boolean {
  if (AGENCY_FORBIDDEN_STATUS_TRANSITIONS.has(to)) return false
  if (from === 'draft' && to === 'submitted') return true
  if (from === 'needs_revision' && to === 'submitted') return true
  if (from === 'draft' && to === 'draft') return true
  if (from === 'needs_revision' && to === 'draft') return true
  return false
}

export function canAdminTransitionStatus(
  from: MarketingApprovalStatus,
  to: MarketingApprovalStatus,
): boolean {
  const allowed: Record<MarketingApprovalStatus, MarketingApprovalStatus[]> = {
    draft: ['submitted', 'rejected'],
    submitted: ['approved', 'rejected', 'needs_revision'],
    needs_revision: ['approved', 'rejected'],
    approved: ['published', 'needs_revision'],
    rejected: ['needs_revision'],
    published: ['needs_revision'],
  }
  return allowed[from]?.includes(to) ?? false
}
