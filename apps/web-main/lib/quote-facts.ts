/**
 * Intake answers → quoting facts.
 *
 * The bridge between what a customer told us and what the quoting engine
 * prices. Everything here is a plain mapping: no model output becomes a price,
 * and a classification the model produced is only ever used to set a boolean
 * this table already knows how to charge for.
 */

import type { QuoteFacts, DrawingClass, SiteConditionFacts } from '@kealee/core-rules'

export interface QuoteFactsInput {
  answers?: {
    primaryScope?: string
    propertyType?: string
    squareFeet?: number
    timeline?: string
    location?: string
    codeConsiderations?: string[]
  }
  /** Raw intake form_data, when quoting outside the v30 answer shape. */
  formData?: Record<string, unknown>
  projectPath?: string
  /** IntakeBot's scope classification — used only as a structural-change signal. */
  scopeComplexity?: 'simple' | 'moderate' | 'complex'
  /** Lot/GIS context resolved from the address. */
  lotContext?: Record<string, unknown> | null
  selectedAddOns?: string[]
  rush?: boolean
}

/** Structural work is what moves a concept package up; detect it conservatively. */
const STRUCTURAL_PATTERNS = /wall removal|remove a wall|open up|structural|load[- ]bearing|new opening|bump[- ]?out|raise the ceiling|addition/i

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    // Intake offers brackets like "1500-2500"; price from the upper bound so a
    // quote is never lower than the work the customer described.
    const numbers = value.match(/\d[\d,]*/g)?.map(n => Number(n.replace(/,/g, ''))) ?? []
    if (numbers.length) return Math.max(...numbers)
  }
  return undefined
}

/** Site conditions come from the GIS lookup, never from free text. */
export function siteConditionsFromLotContext(lotContext?: Record<string, unknown> | null): SiteConditionFacts {
  if (!lotContext) return {}
  const flag = (...keys: string[]) => keys.some(k => lotContext[k] === true)
  return {
    chesapeakeBayCriticalArea: flag('chesapeakeBayCriticalArea', 'criticalArea'),
    femaFloodplain: flag('femaFloodplain', 'floodplain', 'inFloodplain'),
    steepSlope: flag('steepSlope', 'slopeOver15'),
    streamOrWetlandBuffer: flag('streamBuffer', 'wetlandBuffer', 'streamOrWetlandBuffer'),
    historicOrOverlayDistrict: flag('historicDistrict', 'overlayDistrict'),
    peStampRequired: flag('peStampRequired', 'requiresPE'),
  }
}

export function drawingClassFor(projectPath?: string, squareFeet?: number, scope?: string): DrawingClass {
  const text = `${projectPath ?? ''} ${scope ?? ''}`.toLowerCase()
  if (/whole|new[_ -]?construction|commercial|mixed[_ -]?use|multi[_ -]?unit|subdivision/.test(text)) {
    return 'whole_home_new_commercial'
  }
  if (/addition|adu|expansion/.test(text)) return 'addition_adu'
  if ((squareFeet ?? 0) > 2_000) return 'whole_home_new_commercial'
  return 'limited_renovation'
}

export function quoteFactsFromIntake(input: QuoteFactsInput): QuoteFacts {
  const fd = input.formData ?? {}
  const scope = input.answers?.primaryScope ?? String(fd.description ?? fd.primaryScope ?? '')
  const squareFeet =
    input.answers?.squareFeet ??
    parseNumber(fd.squareFootage) ??
    parseNumber(fd.squareFeet)
  const timeline = input.answers?.timeline ?? String(fd.timeline ?? '')

  const structuralFromText = STRUCTURAL_PATTERNS.test(scope)
  const structuralFromScope = input.scopeComplexity === 'complex'

  return {
    squareFeet,
    lotAcres: parseNumber(fd.lotAcres) ?? parseNumber((input.lotContext ?? {}).lotAcres),
    units: parseNumber(fd.units),
    structuralChange: structuralFromText || structuralFromScope || fd.structuralChange === true,
    drawingClass: drawingClassFor(input.projectPath, squareFeet, scope),
    siteConditions: siteConditionsFromLotContext(input.lotContext),
    jurisdictionCount: parseNumber(fd.jurisdictionCount) ?? 1,
    jurisdictionSupported: fd.jurisdictionSupported === false ? false : true,
    addOns: input.selectedAddOns ?? (Array.isArray(fd.addOns) ? (fd.addOns as string[]) : undefined),
    extraRenderViews: parseNumber(fd.extraRenderViews),
    extraRevisionRounds: parseNumber(fd.extraRevisionRounds),
    rush: input.rush ?? /asap|urgent|rush/i.test(timeline),
  }
}
