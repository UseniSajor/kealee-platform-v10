import { z } from 'zod'
import { KEALEE_PRODUCTS } from '../constants/products.js'
import { propertyIntelligenceOutputSchema } from '../schemas/property-intelligence.js'
import { marketingIntelligenceOutputSchema } from '../schemas/marketing-intelligence.js'
import { opportunityScoringOutputSchema } from '../schemas/opportunity-scoring.js'
import { leadIntelligenceOutputSchema } from '../schemas/lead-intelligence.js'
import { capitalIntelligenceOutputSchema } from '../schemas/capital-intelligence.js'
import { projectIntelligenceOutputSchema } from '../schemas/project-intelligence.js'
import type { AgentId } from '../contracts/agents.js'

const PROHIBITED_CONTACT_ACTIONS = [
  /call\s+without\s+consent/i,
  /unsolicited\s+sms/i,
  /spam/i,
  /harass/i,
]

const CREDIT_APPROVAL_PATTERNS = [
  /credit\s+score/i,
  /pre-?approved/i,
  /guaranteed\s+approval/i,
  /loan\s+approved/i,
  /you\s+are\s+approved/i,
]

function checkCreditApprovalClaims(text: string): string[] {
  return CREDIT_APPROVAL_PATTERNS.filter((p) => p.test(text)).map(
    (p) => `Prohibited credit approval claim: ${p.source}`,
  )
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: string[]
}

function containsDbMutation(obj: unknown): boolean {
  if (obj == null || typeof obj !== 'object') return false
  const json = JSON.stringify(obj).toLowerCase()
  const mutationPatterns = [
    /\bprisma\b/,
    /\brawquery\b/,
    /\$execute/,
    /\binsert\s+into\b/,
    /\bdelete\s+from\b/,
    /"dbwrite"\s*:\s*true/,
    /"mutate"\s*:\s*true/,
  ]
  return mutationPatterns.some((p) => p.test(json))
}

function checkProhibitedContact(output: Record<string, unknown>): string[] {
  const errors: string[] = []
  const text = JSON.stringify(output)
  for (const pattern of PROHIBITED_CONTACT_ACTIONS) {
    if (pattern.test(text)) {
      errors.push(`Prohibited contact action: ${pattern.source}`)
    }
  }
  return errors
}

function checkUnsupportedProducts(products: string[]): string[] {
  const allowed = new Set<string>(KEALEE_PRODUCTS)
  return products.filter((p) => !allowed.has(p)).map((p) => `Unsupported product: ${p}`)
}

export function validatePropertyIntelligenceOutput(raw: unknown): ValidationResult<z.infer<typeof propertyIntelligenceOutputSchema>> {
  const errors: string[] = []
  const parsed = propertyIntelligenceOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => i.message) }
  }

  const data = parsed.data
  if (data.confidenceScore == null) errors.push('Missing confidenceScore')
  errors.push(...checkUnsupportedProducts(data.recommendedKealeeProducts))
  errors.push(...checkProhibitedContact(data as unknown as Record<string, unknown>))
  if (containsDbMutation(raw)) errors.push('Output attempts direct database mutation')

  return errors.length ? { success: false, errors } : { success: true, data, errors: [] }
}

export function validateMarketingIntelligenceOutput(raw: unknown): ValidationResult<z.infer<typeof marketingIntelligenceOutputSchema>> {
  const parsed = marketingIntelligenceOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => i.message) }
  }

  const errors: string[] = []
  const data = parsed.data
  if (data.confidenceScore == null) errors.push('Missing confidenceScore')
  errors.push(...checkUnsupportedProducts(data.productRouting))
  errors.push(...checkProhibitedContact(data as unknown as Record<string, unknown>))
  if (containsDbMutation(raw)) errors.push('Output attempts direct database mutation')

  return errors.length ? { success: false, errors } : { success: true, data, errors: [] }
}

export function validateOpportunityScoringOutput(raw: unknown): ValidationResult<z.infer<typeof opportunityScoringOutputSchema>> {
  const parsed = opportunityScoringOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => i.message) }
  }

  const errors: string[] = []
  const data = parsed.data
  if (data.confidenceScore == null) errors.push('Missing confidenceScore')
  if (!data.scoreExplanation?.trim()) errors.push('Missing scoreExplanation')
  if (containsDbMutation(raw)) errors.push('Output attempts direct database mutation')

  return errors.length ? { success: false, errors } : { success: true, data, errors: [] }
}

export function validateLeadIntelligenceOutput(raw: unknown): ValidationResult<z.infer<typeof leadIntelligenceOutputSchema>> {
  const parsed = leadIntelligenceOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => i.message) }
  }
  const errors: string[] = []
  const data = parsed.data
  if (!data.scoreExplanation?.trim()) errors.push('Missing scoreExplanation')
  errors.push(...checkProhibitedContact(data as unknown as Record<string, unknown>))
  if (containsDbMutation(raw)) errors.push('Output attempts direct database mutation')
  return errors.length ? { success: false, errors } : { success: true, data, errors: [] }
}

export function validateCapitalIntelligenceOutput(
  raw: unknown,
): ValidationResult<z.infer<typeof capitalIntelligenceOutputSchema>> {
  const parsed = capitalIntelligenceOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => i.message) }
  }
  const errors: string[] = []
  const data = parsed.data
  if (!data.scoreExplanation?.trim()) errors.push('Missing scoreExplanation')
  errors.push(...checkCreditApprovalClaims(JSON.stringify(data)))
  if (containsDbMutation(raw)) errors.push('Output attempts direct database mutation')
  return errors.length ? { success: false, errors } : { success: true, data, errors: [] }
}

export function validateProjectIntelligenceOutput(
  raw: unknown,
): ValidationResult<z.infer<typeof projectIntelligenceOutputSchema>> {
  const parsed = projectIntelligenceOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => i.message) }
  }
  const errors: string[] = []
  const data = parsed.data
  if (!data.scoreExplanation?.trim()) errors.push('Missing scoreExplanation')
  if (containsDbMutation(raw)) errors.push('Output attempts direct database mutation')
  return errors.length ? { success: false, errors } : { success: true, data, errors: [] }
}

export function validateAgentOutput(agentId: AgentId, raw: unknown): ValidationResult<unknown> {
  switch (agentId) {
    case 'PropertyIntelligenceAgent':
      return validatePropertyIntelligenceOutput(raw)
    case 'MarketingIntelligenceAgent':
      return validateMarketingIntelligenceOutput(raw)
    case 'OpportunityScoringAgent':
      return validateOpportunityScoringOutput(raw)
    case 'LeadIntelligenceAgent':
      return validateLeadIntelligenceOutput(raw)
    case 'CapitalIntelligenceAgent':
      return validateCapitalIntelligenceOutput(raw)
    case 'ProjectIntelligenceEngine':
      return validateProjectIntelligenceOutput(raw)
    default:
      return { success: false, errors: [`Unknown agent: ${agentId}`] }
  }
}
