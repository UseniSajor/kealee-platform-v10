/**
 * services/api/src/services/availability.service.ts
 *
 * Deterministic Service Availability Engine.
 * Returns GUARANTEED / TARGET / CONDITIONAL / UNAVAILABLE for any service request.
 */

import { prismaAny } from '../utils/prisma-helper.js'

export type AvailabilityDecision = 'GUARANTEED' | 'TARGET' | 'CONDITIONAL' | 'UNAVAILABLE'

export interface AvailabilityRequest {
  serviceType: string
  requestedAt?: Date
  projectAddress?: string
  hasPlans?: boolean
  projectDescription?: string
  jurisdiction?: string
  urgencyFlag?: boolean
}

export interface AvailabilityResponse {
  decision: AvailabilityDecision
  promisedStartAt: Date | null
  promisedCompleteAt: Date | null
  sameDayEligible: boolean
  confidenceScore: number
  rationale: string
  explanation: string
  missingRequirements: string[]
  turnaroundDays: number | null
}

const TURNAROUND_DAYS: Record<string, number> = {
  'permit-simple': 1,
  'permit-package': 4,
  'permit-coordination': 7,
  'permit-expediting': 0.5,
  'concept-exterior': 1,
  'concept-interior-reno': 1,
  'concept-whole-home': 2,
  'concept-garden': 1,
  'cost-estimate-ai': 2,
  'cost-estimate-detailed': 6,
  'cost-estimate-certified': 8,
  'design-starter': 7,
  'design-visualization': 10,
  'design-predesign': 14,
}

const SAME_DAY_CUTOFF_HOUR = 14

const REQUIRED_FIELDS: Record<string, string[]> = {
  'permit-simple': ['projectAddress', 'projectDescription'],
  'permit-package': ['projectAddress', 'hasPlans'],
  'permit-coordination': ['projectAddress', 'hasPlans'],
  'permit-expediting': ['projectAddress', 'hasPlans'],
  'concept-exterior': ['projectAddress'],
  'concept-interior-reno': ['projectAddress'],
  'concept-whole-home': ['projectAddress'],
  'concept-garden': ['projectAddress'],
  'cost-estimate-ai': ['projectAddress'],
  'cost-estimate-detailed': ['projectAddress', 'projectDescription'],
  'cost-estimate-certified': ['projectAddress', 'projectDescription'],
  'design-starter': ['projectAddress'],
  'design-visualization': ['projectAddress'],
  'design-predesign': ['projectAddress', 'projectDescription'],
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  const fractional = days % 1
  const fullDays = Math.floor(days)
  while (added < fullDays) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  if (fractional > 0) {
    result.setHours(result.getHours() + Math.round(fractional * 8))
  }
  return result
}

async function getCapacityStatus(serviceType: string): Promise<{ currentLoad: number; maxCapacity: number; utilizationPct: number }> {
  try {
    const profile = await prismaAny.$queryRawUnsafe(`
      SELECT current_load, max_capacity
      FROM service_capacity_profiles
      WHERE service_type = $1
      LIMIT 1
    `, serviceType) as any[]
    if (profile.length === 0) return { currentLoad: 0, maxCapacity: 10, utilizationPct: 0 }
    const { current_load, max_capacity } = profile[0]
    const utilizationPct = max_capacity > 0 ? (current_load / max_capacity) * 100 : 0
    return { currentLoad: current_load, maxCapacity: max_capacity, utilizationPct }
  } catch {
    return { currentLoad: 0, maxCapacity: 10, utilizationPct: 0 }
  }
}

async function isHoliday(date: Date): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0]
    const rows = await prismaAny.$queryRawUnsafe(`
      SELECT id FROM business_calendars WHERE date = $1 AND is_holiday = true LIMIT 1
    `, dateStr) as any[]
    return rows.length > 0
  } catch {
    return false
  }
}

export async function evaluateAvailability(req: AvailabilityRequest): Promise<AvailabilityResponse> {
  const now = req.requestedAt ?? new Date()
  const serviceType = req.serviceType
  const turnaroundDays = TURNAROUND_DAYS[serviceType] ?? 3
  const required = REQUIRED_FIELDS[serviceType] ?? []
  const missingRequirements: string[] = []

  for (const field of required) {
    if (field === 'projectAddress' && !req.projectAddress) {
      missingRequirements.push('Project address is required')
    } else if (field === 'hasPlans' && req.hasPlans !== true) {
      missingRequirements.push('Permit-ready architectural plans are required for this service')
    } else if (field === 'projectDescription' && !req.projectDescription) {
      missingRequirements.push('Project description is required')
    }
  }

  const capacity = await getCapacityStatus(serviceType)
  const isOverloaded = capacity.utilizationPct >= 100
  const holiday = await isHoliday(now)

  const currentHourET = now.getUTCHours() - 5
  const sameDayEligible = (
    turnaroundDays <= 1 &&
    currentHourET < SAME_DAY_CUTOFF_HOUR &&
    !holiday &&
    !isOverloaded &&
    missingRequirements.length === 0 &&
    capacity.utilizationPct < 80
  )

  const startAt = new Date(now)
  if (startAt.getHours() > 14) startAt.setDate(startAt.getDate() + 1)
  const completeAt = turnaroundDays > 0
    ? addBusinessDays(startAt, turnaroundDays)
    : sameDayEligible ? addBusinessDays(startAt, 0.5) : addBusinessDays(startAt, 1)

  let decision: AvailabilityDecision
  let confidenceScore: number
  let rationale: string
  let explanation: string

  if (isOverloaded) {
    decision = 'UNAVAILABLE'
    confidenceScore = 0.0
    rationale = `Service capacity full (${capacity.currentLoad}/${capacity.maxCapacity} active)`
    explanation = 'This service is currently at full capacity. Please check back in 24–48 hours or contact us for priority scheduling.'
  } else if (missingRequirements.length > 0) {
    decision = 'CONDITIONAL'
    confidenceScore = 0.5
    rationale = `Missing required information: ${missingRequirements.join('; ')}`
    explanation = `We can start your order once you provide the required information. Estimated turnaround: ${turnaroundDays <= 1 ? 'same day' : `${turnaroundDays} business days`} after we receive all materials.`
  } else if (holiday) {
    decision = 'CONDITIONAL'
    confidenceScore = 0.7
    rationale = 'Today is a business holiday — processing will begin next business day'
    explanation = `Our office is closed today. Your order will begin processing on the next business day with ${turnaroundDays <= 1 ? '1-day' : `${turnaroundDays}-day`} turnaround.`
  } else if (capacity.utilizationPct >= 80) {
    decision = 'TARGET'
    confidenceScore = 0.75
    rationale = `High demand (${Math.round(capacity.utilizationPct)}% capacity utilized) — target turnaround may extend by 1 day`
    explanation = sameDayEligible
      ? 'High demand currently. We\'ll target same-day delivery but cannot guarantee it. Orders submitted before 2pm are prioritized.'
      : `We're experiencing high demand. Target delivery: ${turnaroundDays + 1} business days.`
  } else if (sameDayEligible && turnaroundDays <= 0.5) {
    decision = 'GUARANTEED'
    confidenceScore = 0.95
    rationale = 'Same-day capacity available, submitted before 2pm cutoff'
    explanation = 'Same-day delivery guaranteed — order submitted before our 2pm cutoff with capacity available.'
  } else if (turnaroundDays <= 1 && missingRequirements.length === 0) {
    decision = 'GUARANTEED'
    confidenceScore = 0.90
    rationale = `Standard ${turnaroundDays <= 1 ? '24h' : `${turnaroundDays}-day`} turnaround with full capacity available`
    explanation = turnaroundDays <= 1
      ? 'Delivery guaranteed within 24–48 hours of order confirmation.'
      : `Delivery guaranteed within ${turnaroundDays} business days of order confirmation.`
  } else {
    decision = 'TARGET'
    confidenceScore = 0.80
    rationale = `Nominal capacity available, ${turnaroundDays}-day standard turnaround`
    explanation = `Estimated delivery: ${turnaroundDays} business days after order confirmation. We'll notify you of any changes.`
  }

  return {
    decision,
    promisedStartAt: isOverloaded ? null : startAt,
    promisedCompleteAt: isOverloaded ? null : completeAt,
    sameDayEligible,
    confidenceScore,
    rationale,
    explanation,
    missingRequirements,
    turnaroundDays: isOverloaded ? null : turnaroundDays,
  }
}

export async function persistAvailabilitySnapshot(serviceRequestId: string, response: AvailabilityResponse): Promise<void> {
  try {
    await prismaAny.$queryRawUnsafe(`
      INSERT INTO availability_snapshots (
        id, service_request_id, decision, confidence_score, rationale,
        promised_start_at, promised_complete_at, same_day_eligible,
        snapshot_at, missing_requirements
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), $8::jsonb
      )
    `,
      serviceRequestId,
      response.decision,
      response.confidenceScore,
      response.rationale,
      response.promisedStartAt?.toISOString() ?? null,
      response.promisedCompleteAt?.toISOString() ?? null,
      response.sameDayEligible,
      JSON.stringify(response.missingRequirements)
    )
  } catch {
    // Non-critical
  }
}
