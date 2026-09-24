/**
 * Prompt grounding, enforced rather than requested.
 *
 * KEALEE.md is unambiguous: every AI generation prompt that produces platform
 * content MUST be grounded in platform data, and generic prompts are
 * forbidden. It lists four sources and requires at least one.
 *
 * The rule was being honoured on a technicality. `buildVisualPromptBundle`
 * grounds on `projectPath` and `stylePreferences` and nothing else — no
 * zoning, no parcel, no floor area, and no reference to what the customer was
 * actually sold. `zoningData` is resolved by the orchestrator one call up the
 * stack and simply not passed down. The result is a prompt that knows the
 * service is a kitchen remodel and knows the customer likes "transitional",
 * and is otherwise the generic prompt the rule exists to forbid.
 *
 * This module makes the rule checkable. `assertGrounded()` REFUSES a prompt
 * that carries no platform data, and `describeGrounding()` reports which of
 * the four sources are present so a thin prompt is visible before it ships
 * rather than after a customer receives a render of somebody else's house.
 */

/** The four sources KEALEE.md names. */
export type GroundingSource =
  | 'service_type'      // 1. schema / service type
  | 'product_rules'     // 2. what the customer was SOLD: PRODUCT_PRICING.included
  | 'jurisdiction'      // 3. ZoningProfile / Jurisdiction / ParcelData
  | 'form_data'         // 4. sqft, rooms, property type, address, style

export interface GroundingInputs {
  /** e.g. `kitchen_remodel`, `addition_expansion`. From services-config or projectPath. */
  serviceType?: string | null
  /** From PRODUCT_PRICING in @kealee/core-rules — the only source of what was sold. */
  productIncludes?: string[] | null
  productDeliveryDays?: string | null
  /** Jurisdiction and site facts. */
  zoneCode?: string | null
  jurisdiction?: string | null
  parcelAreaSqFt?: number | null
  maxLotCoveragePercent?: number | null
  /** Intake form data. */
  floorAreaSqFt?: number | null
  roomCount?: number | null
  propertyType?: string | null
  address?: string | null
  stylePreferences?: string[] | null
}

export interface GroundingReport {
  present: GroundingSource[]
  missing: GroundingSource[]
  /** Facts actually available to put into the prompt. */
  facts: string[]
  /** True when the prompt satisfies the KEALEE.md minimum. */
  grounded: boolean
  /**
   * True when only the service type is present — technically compliant and
   * substantively the generic prompt the rule forbids.
   */
  thin: boolean
  warning: string | null
}

export function describeGrounding(i: GroundingInputs): GroundingReport {
  const present: GroundingSource[] = []
  const facts: string[] = []

  if (i.serviceType) {
    present.push('service_type')
    facts.push(`Service: ${i.serviceType.replace(/_/g, ' ')}`)
  }

  if (i.productIncludes?.length) {
    present.push('product_rules')
    facts.push(`Deliverables sold: ${i.productIncludes.join('; ')}`)
    if (i.productDeliveryDays) facts.push(`Delivery: ${i.productDeliveryDays}`)
  }

  const juris: string[] = []
  if (i.zoneCode) juris.push(`zone ${i.zoneCode}`)
  if (i.jurisdiction) juris.push(i.jurisdiction)
  if (i.parcelAreaSqFt) juris.push(`${i.parcelAreaSqFt.toLocaleString()} sq ft lot`)
  if (i.maxLotCoveragePercent) juris.push(`${i.maxLotCoveragePercent}% maximum lot coverage`)
  if (juris.length) {
    present.push('jurisdiction')
    facts.push(`Site: ${juris.join(', ')}`)
  }

  const form: string[] = []
  if (i.floorAreaSqFt) form.push(`${i.floorAreaSqFt.toLocaleString()} sq ft`)
  if (i.roomCount) form.push(`${i.roomCount} rooms`)
  if (i.propertyType) form.push(i.propertyType.replace(/_/g, ' '))
  if (i.stylePreferences?.length) form.push(`${i.stylePreferences.join(', ')} style`)
  if (form.length) {
    present.push('form_data')
    facts.push(`Project: ${form.join(', ')}`)
  }

  const all: GroundingSource[] = ['service_type', 'product_rules', 'jurisdiction', 'form_data']
  const missing = all.filter(s => !present.includes(s))
  const grounded = present.length > 0
  // Style alone is a preference, not platform data about THIS site. A prompt
  // with service type plus a style keyword is the generic prompt wearing a hat.
  const substantive = present.filter(s => s !== 'service_type').length > 0
  const thin = grounded && !substantive

  return {
    present, missing, facts, grounded, thin,
    warning: !grounded
      ? 'This prompt carries NO platform data. KEALEE.md forbids it.'
      : thin
      ? 'This prompt carries only the service type. It is technically grounded and ' +
        'substantively generic — no site, no zoning, no floor area, and no reference to ' +
        'what the customer was sold.'
      : null,
  }
}

export class UngroundedPromptError extends Error {
  readonly report: GroundingReport
  constructor(report: GroundingReport, context: string) {
    super(
      `Refusing to issue an ungrounded prompt for ${context}. ${report.warning} ` +
      `Missing sources: ${report.missing.join(', ')}. ` +
      'Supply at least one of service type, product rules, jurisdiction data or form data.',
    )
    this.name = 'UngroundedPromptError'
    this.report = report
  }
}

/**
 * Throws unless the prompt is grounded.
 *
 * `allowThin` exists for the one honest case: an order whose intake genuinely
 * carries nothing but a service type. It must be passed DELIBERATELY, and the
 * report still records the thinness so it shows up rather than disappearing.
 */
export function assertGrounded(
  i: GroundingInputs,
  context: string,
  opts: { allowThin?: boolean } = {},
): GroundingReport {
  const report = describeGrounding(i)
  if (!report.grounded) throw new UngroundedPromptError(report, context)
  if (report.thin && !opts.allowThin) throw new UngroundedPromptError(report, context)
  return report
}

/**
 * The grounding block to prepend to any generation prompt.
 *
 * Deliberately plain sentences, not JSON: these go to a language model and the
 * facts must read as constraints, not as a payload to be summarised.
 */
export function buildGroundingBlock(i: GroundingInputs, context: string, opts: { allowThin?: boolean } = {}): {
  block: string
  report: GroundingReport
} {
  const report = assertGrounded(i, context, opts)
  const lines = [
    'GROUND THIS IN THE FOLLOWING PLATFORM DATA. Do not invent facts about the property.',
    ...report.facts.map(f => `- ${f}`),
  ]
  if (i.maxLotCoveragePercent && i.parcelAreaSqFt) {
    const maxFootprint = Math.round(i.parcelAreaSqFt * (i.maxLotCoveragePercent / 100))
    lines.push(
      `- Any proposed footprint must stay within ${maxFootprint.toLocaleString()} sq ft ` +
      `(${i.maxLotCoveragePercent}% of the lot).`,
    )
  }
  if (report.missing.length) {
    lines.push(
      `- NOT ESTABLISHED: ${report.missing.join(', ')}. Do not depict or assert anything ` +
      'that would depend on them.',
    )
  }
  return { block: lines.join('\n'), report }
}
