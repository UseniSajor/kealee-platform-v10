/**
 * The certifiable-rule model.
 *
 * Phase 3B established that a survey can QUALIFY for a reliability level while
 * only an explicit promotion GRANTS it. This file applies the same separation to
 * regulatory rules, because the failure mode is identical and worse: a parser
 * that reads "25 ft" out of an HTML table with 0.99 confidence has established
 * nothing about what the ordinance requires. Extraction is not certification.
 *
 * So a rule carries several INDEPENDENT confidence dimensions that are never
 * multiplied together into one number, an authority classification derived from
 * the SOURCE TYPE rather than from any model output, and provenance detailed
 * enough that a reviewer can open the ordinance and find the governing sentence
 * without asking anyone.
 */

// ── Lifecycle ───────────────────────────────────────────────────────────────

/**
 * A rule's lifecycle state.
 *
 *   EXTRACTED    parsed from a source; nobody has looked at it
 *   PROVISIONAL  structurally validated and usable for DRAFTING only
 *   VERIFIED     a human confirmed the value against the source
 *   CERTIFIED    a qualified reviewer accepted it for reuse across projects
 *   SUPERSEDED   a newer version of the source or the rule replaced it
 *   REVOKED      withdrawn — wrong, misapplied, or its source was retracted
 */
export type RuleState =
  | 'EXTRACTED'
  | 'PROVISIONAL'
  | 'VERIFIED'
  | 'CERTIFIED'
  | 'SUPERSEDED'
  | 'REVOKED'

export const RULE_STATES: RuleState[] = [
  'EXTRACTED', 'PROVISIONAL', 'VERIFIED', 'CERTIFIED', 'SUPERSEDED', 'REVOKED',
]

/** States a rule may be used from, in any capacity. */
export const ACTIVE_STATES: RuleState[] = ['EXTRACTED', 'PROVISIONAL', 'VERIFIED', 'CERTIFIED']

/** The only state a rule may be applied from without a project-level review. */
export const AUTOMATIC_STATES: RuleState[] = ['CERTIFIED']

/**
 * Legal transitions. There is deliberately no EXTRACTED -> CERTIFIED edge: a
 * rule cannot skip the human steps however good it looks.
 */
export const RULE_TRANSITIONS: Record<RuleState, RuleState[]> = {
  EXTRACTED: ['PROVISIONAL', 'REVOKED', 'SUPERSEDED'],
  // A provisional rule can fall back to EXTRACTED when a re-extraction changes
  // its structure, and forward to VERIFIED when a human confirms it.
  PROVISIONAL: ['EXTRACTED', 'VERIFIED', 'REVOKED', 'SUPERSEDED'],
  // Verification can be withdrawn back to PROVISIONAL — that is what a source
  // change does to a rule nobody has re-read yet.
  VERIFIED: ['PROVISIONAL', 'CERTIFIED', 'REVOKED', 'SUPERSEDED'],
  CERTIFIED: ['SUPERSEDED', 'REVOKED', 'PROVISIONAL'],
  // Terminal. A superseded rule is history; its replacement is a new version.
  SUPERSEDED: [],
  REVOKED: [],
}

export interface TransitionCheck {
  allowed: boolean
  from: RuleState
  to: RuleState
  reason: string
}

export function canTransition(from: RuleState, to: RuleState): TransitionCheck {
  if (from === to) {
    return { allowed: false, from, to, reason: `The rule is already ${from}.` }
  }
  const allowed = RULE_TRANSITIONS[from]?.includes(to) ?? false
  if (allowed) {
    return { allowed: true, from, to, reason: `${from} → ${to} is a permitted transition.` }
  }
  if (from === 'EXTRACTED' && to === 'CERTIFIED') {
    return {
      allowed: false, from, to,
      reason:
        'A rule cannot go straight from EXTRACTED to CERTIFIED. It must be structurally validated ' +
        '(PROVISIONAL), confirmed against the source by a human (VERIFIED), and only then certified. ' +
        'Extraction quality is not evidence of legal correctness.',
    }
  }
  if (from === 'SUPERSEDED' || from === 'REVOKED') {
    return {
      allowed: false, from, to,
      reason:
        `${from} is terminal. A ${from.toLowerCase()} rule is never reinstated — the current ` +
        'requirement is a new rule version against the current source.',
    }
  }
  return {
    allowed: false, from, to,
    reason: `${from} → ${to} is not a permitted transition. Permitted from ${from}: ` +
      `${RULE_TRANSITIONS[from]?.join(', ') || 'none'}.`,
  }
}

// ── Source authority ────────────────────────────────────────────────────────

/**
 * What KIND of source a rule came from. This is a statement about the document,
 * not about how well it was parsed.
 */
export type SourceAuthority =
  | 'OFFICIAL_CODE'
  | 'OFFICIAL_AGENCY_REGULATION'
  | 'OFFICIAL_AGENCY_MANUAL'
  | 'OFFICIAL_GIS'
  | 'OFFICIAL_PDF'
  | 'ADOPTED_ORDINANCE'
  | 'SECONDARY_SOURCE'
  | 'UNKNOWN'

export interface AuthorityProfile {
  authority: SourceAuthority
  label: string
  /**
   * Authority confidence is a property of the SOURCE, fixed by this table. It
   * is never raised by a confident parser and never lowered by a shaky one.
   */
  confidence: number
  /** Whether a rule resting only on this source may ever reach CERTIFIED. */
  certifiable: boolean
  rationale: string
}

export const AUTHORITY_PROFILES: Record<SourceAuthority, AuthorityProfile> = {
  OFFICIAL_CODE: {
    authority: 'OFFICIAL_CODE',
    label: 'Official codified code of ordinances',
    confidence: 1.0,
    certifiable: true,
    rationale: 'The codified text as published by the jurisdiction is the governing language.',
  },
  ADOPTED_ORDINANCE: {
    authority: 'ADOPTED_ORDINANCE',
    label: 'Adopted ordinance or council bill',
    confidence: 1.0,
    certifiable: true,
    rationale:
      'The adopted instrument governs, and it governs sooner than the codified text — codification ' +
      'lags adoption, sometimes by months.',
  },
  OFFICIAL_AGENCY_REGULATION: {
    authority: 'OFFICIAL_AGENCY_REGULATION',
    label: 'Official agency regulation',
    confidence: 0.98,
    certifiable: true,
    rationale: 'Promulgated by the agency with jurisdiction and enforceable as written.',
  },
  OFFICIAL_PDF: {
    authority: 'OFFICIAL_PDF',
    label: 'Official PDF publication of the code or regulation',
    confidence: 0.95,
    certifiable: true,
    rationale:
      'Authoritative content, but PDF extraction is structurally lossy — table geometry is inferred ' +
      'rather than declared. Certifiable, and it carries an extraction penalty rather than an authority one.',
  },
  OFFICIAL_AGENCY_MANUAL: {
    authority: 'OFFICIAL_AGENCY_MANUAL',
    label: 'Official agency design manual or handbook',
    confidence: 0.9,
    certifiable: true,
    rationale:
      'Adopted by reference and enforced in review, but a manual frequently paraphrases the code it ' +
      'implements. Where a manual and the code disagree, the code governs.',
  },
  OFFICIAL_GIS: {
    authority: 'OFFICIAL_GIS',
    label: 'Official GIS service or published data layer',
    confidence: 0.85,
    certifiable: true,
    rationale:
      'Authoritative for WHERE something is mapped, not for what the requirement is. A GIS layer ' +
      'answers "which zone" and never "what setback".',
  },
  SECONDARY_SOURCE: {
    authority: 'SECONDARY_SOURCE',
    label: 'Secondary or third-party source',
    confidence: 0.4,
    certifiable: false,
    rationale:
      'A summary, a consultant table, a commercial database or a news article. It may be correct and ' +
      'it may be current, but it is not the governing language and cannot be certified against.',
  },
  UNKNOWN: {
    authority: 'UNKNOWN',
    label: 'Unclassified source',
    confidence: 0.0,
    certifiable: false,
    rationale: 'A source that has not been classified is treated as no source at all.',
  },
}

export function authorityProfile(a: SourceAuthority): AuthorityProfile {
  return AUTHORITY_PROFILES[a] ?? AUTHORITY_PROFILES.UNKNOWN
}

/** Sources whose content is the governing language, as opposed to a depiction of it. */
export const CERTIFIABLE_AUTHORITIES: SourceAuthority[] =
  (Object.keys(AUTHORITY_PROFILES) as SourceAuthority[]).filter(a => AUTHORITY_PROFILES[a].certifiable)

// ── Provenance ──────────────────────────────────────────────────────────────

export type ExtractionMethod =
  | 'html_table_parser'
  | 'pdf_text_extraction'
  | 'pdf_ocr'
  | 'gis_query'
  | 'manual_entry'
  | 'api_response'
  | 'llm_assisted'

/**
 * Where a rule came from, in enough detail that a reviewer can independently
 * locate the governing language. "Subtitle 27" is not provenance; "Subtitle 27,
 * Sec. 27-4205, Table 27-4205(b), row 'Front yard depth', column 'Single-family
 * detached'" is.
 */
/**
 * How narrowly the rule is cut out of its source. A rule that carries an entire
 * dimensional table is located perfectly well by the table citation; demanding a
 * row and column of it would be demanding coordinates for something that has
 * none. A rule that carries ONE cell must cite that cell.
 */
export type ProvenanceGranularity = 'document' | 'section' | 'table' | 'cell'

export interface RuleProvenance {
  jurisdiction: string
  agency: string
  sourceType: SourceAuthority
  /** Defaults to 'cell' — the strictest reading — when not stated. */
  granularity?: ProvenanceGranularity
  sourceTitle: string
  sourceUrl: string | null
  /** Storage id of the retrieved document, when one was captured. */
  sourceDocumentId?: string | null
  codeTitle?: string | null
  codeSection: string | null
  subsection?: string | null
  table?: string | null
  row?: string | null
  column?: string | null
  footnote?: string | null
  appendix?: string | null
  publicationDate?: string | null
  effectiveDate: string | null
  retrievedAt: string
  /** SHA-256 of the NORMALIZED source region. */
  sourceHash: string | null
  sourceVersion: string | null
  extractionMethod: ExtractionMethod
  pageNumber?: number | null
  /** Character offsets or a bounding box in the source, where available. */
  textLocation?: { start: number; end: number } | { page: number; bbox: [number, number, number, number] } | null
  parserVersion: string
  /** Why any of the above is missing, when it legitimately is. */
  gaps?: string[]
}

export interface ProvenanceRequirement {
  field: string
  present: boolean
  detail: string
  /** Required for certification, as opposed to merely desirable. */
  mandatory: boolean
}

export interface ProvenanceAssessment {
  sufficient: boolean
  requirements: ProvenanceRequirement[]
  missing: string[]
  /** Enough to find the governing language by hand. */
  locatable: boolean
}

/**
 * Whether provenance is good enough to certify against.
 *
 * The bar is not "we filled in some fields". It is: can a reviewer, holding
 * only this record, open the source and read the sentence the rule came from,
 * and can we later prove the source has not changed underneath us.
 */
export function assessProvenance(p: RuleProvenance): ProvenanceAssessment {
  const reqs: ProvenanceRequirement[] = []
  const need = (field: string, present: boolean, detail: string, mandatory = true) =>
    reqs.push({ field, present, detail, mandatory })

  need('jurisdiction', Boolean(p.jurisdiction), p.jurisdiction || 'Not recorded.')
  need('agency', Boolean(p.agency), p.agency || 'Not recorded.')
  need('sourceType', p.sourceType !== 'UNKNOWN',
    p.sourceType === 'UNKNOWN' ? 'The source has not been classified.' : authorityProfile(p.sourceType).label)
  need('sourceTitle', Boolean(p.sourceTitle), p.sourceTitle || 'Not recorded.')

  // Either a URL or a captured document — something a reviewer can open.
  const retrievable = Boolean(p.sourceUrl || p.sourceDocumentId)
  need('sourceUrl or sourceDocumentId', retrievable,
    retrievable
      ? (p.sourceUrl ?? `document ${p.sourceDocumentId}`)
      : 'Neither a URL nor a captured document. The source cannot be opened.')

  // A code section is what locates language in an ordinance. A GIS service has
  // no sections — it is located by its endpoint and layer — so demanding one
  // of it would block a perfectly traceable source for a field it cannot have.
  const isCodeText = p.sourceType === 'OFFICIAL_CODE' || p.sourceType === 'ADOPTED_ORDINANCE'
    || p.sourceType === 'OFFICIAL_AGENCY_REGULATION' || p.sourceType === 'OFFICIAL_AGENCY_MANUAL'
    || p.sourceType === 'OFFICIAL_PDF'
  if (isCodeText) {
    need('codeSection', Boolean(p.codeSection),
      p.codeSection ?? 'No section citation. A rule with no section cannot be checked against the ordinance.')
  } else {
    need('codeSection', true,
      `Not applicable to a ${authorityProfile(p.sourceType).label.toLowerCase()}; located by source URL instead.`,
      false)
  }

  need('effectiveDate', Boolean(p.effectiveDate),
    p.effectiveDate ?? 'No effective date. Without it there is no way to know which ordinance version applies.')

  need('sourceHash', Boolean(p.sourceHash),
    p.sourceHash
      ? `${p.sourceHash.slice(0, 16)}…`
      : 'No source hash. A certification that cannot be bound to exact source content is not a certification.')

  need('sourceVersion', Boolean(p.sourceVersion),
    p.sourceVersion ?? 'No source version recorded.')

  need('retrievedAt', Boolean(p.retrievedAt), p.retrievedAt || 'Not recorded.')
  need('extractionMethod', Boolean(p.extractionMethod), p.extractionMethod || 'Not recorded.')
  need('parserVersion', Boolean(p.parserVersion), p.parserVersion || 'Not recorded.')

  // A single value taken out of a table needs its coordinates within that
  // table, otherwise "which number did you read" is unanswerable. A rule that
  // carries the whole table is located by the table citation alone.
  const granularity = p.granularity ?? 'cell'
  if (p.table && granularity === 'cell') {
    need('row', Boolean(p.row), p.row ?? 'A table cell is cited but not the row within it.')
    need('column', Boolean(p.column), p.column ?? 'A table cell is cited but not the column within it.')
  } else if (p.table) {
    need('row/column', true,
      `Rule is ${granularity}-level: it carries the whole of ${p.table}, so row and column are ` +
      'resolved per lookup rather than fixed on the rule.', false)
  }

  // PDF-sourced rules need a page; otherwise a reviewer searches a 400-page document.
  if (p.sourceType === 'OFFICIAL_PDF' || p.extractionMethod === 'pdf_text_extraction' || p.extractionMethod === 'pdf_ocr') {
    need('pageNumber', p.pageNumber != null, p.pageNumber != null ? `p. ${p.pageNumber}` : 'No page number on a PDF-sourced rule.')
  }

  const missing = reqs.filter(r => r.mandatory && !r.present).map(r => r.field)
  const locatable = Boolean(retrievable && (p.codeSection || !isCodeText))

  return { sufficient: missing.length === 0, requirements: reqs, missing, locatable }
}

// ── Confidence dimensions ───────────────────────────────────────────────────

/**
 * Confidence, kept in separate dimensions on purpose.
 *
 * Collapsing these into one score is how a beautifully parsed number from a
 * blog post ends up outranking a slightly messy table in the actual code. Each
 * dimension gates independently; none of them substitutes for another and none
 * of them substitutes for a human.
 */
export interface RuleConfidence {
  /** How reliably the value was read out of the source document. */
  extractionConfidence: number
  /** How authoritative the source is. Derived from source type, not from a model. */
  authorityConfidence: number
  /** How completely the rule's applicability conditions are modelled. */
  applicabilityConfidence: number
  /** Agreement across independently retrieved representations, when checked. */
  consistencyConfidence?: number
  /** How recently the source was retrieved and confirmed current. */
  sourceFreshnessConfidence?: number
}

export interface ConfidenceThresholds {
  extraction: number
  authority: number
  applicability: number
  consistency: number
  freshness: number
}

/**
 * Certification thresholds.
 *
 * Authority is set at 0.85 so that OFFICIAL_GIS scrapes through and
 * SECONDARY_SOURCE (0.4) cannot, regardless of extraction quality — which is
 * the specific behaviour section 4 requires.
 */
export const CERTIFICATION_THRESHOLDS: ConfidenceThresholds = {
  extraction: 0.9,
  authority: 0.85,
  applicability: 0.9,
  consistency: 0.95,
  freshness: 0.5,
}

export interface ConfidenceGateResult {
  passed: boolean
  dimensions: { dimension: string; value: number | null; threshold: number; passed: boolean; detail: string }[]
  failures: string[]
}

/**
 * Evaluates each dimension against its own threshold.
 *
 * Deliberately NOT an average: a rule with perfect extraction and no authority
 * fails, and a rule with perfect authority and unreadable extraction fails. An
 * average would let either one hide behind the other.
 */
export function evaluateConfidence(
  c: RuleConfidence,
  thresholds: ConfidenceThresholds = CERTIFICATION_THRESHOLDS,
): ConfidenceGateResult {
  const dims: ConfidenceGateResult['dimensions'] = []
  const check = (dimension: string, value: number | null, threshold: number, whenLow: string) => {
    // An unmeasured optional dimension does not fail the gate; it is reported.
    if (value == null) {
      dims.push({ dimension, value: null, threshold, passed: true, detail: 'Not measured.' })
      return
    }
    const passed = value >= threshold
    dims.push({
      dimension, value, threshold, passed,
      detail: passed ? `${value.toFixed(2)} ≥ ${threshold}` : `${value.toFixed(2)} < ${threshold}. ${whenLow}`,
    })
  }

  check('extractionConfidence', c.extractionConfidence, thresholds.extraction,
    'The value could not be read out of the source reliably enough to certify.')
  check('authorityConfidence', c.authorityConfidence, thresholds.authority,
    'The source is not authoritative enough to certify against, however cleanly it parsed.')
  check('applicabilityConfidence', c.applicabilityConfidence, thresholds.applicability,
    'The conditions under which this rule applies are not modelled completely enough.')
  check('consistencyConfidence', c.consistencyConfidence ?? null, thresholds.consistency,
    'Independently retrieved representations of this rule disagree.')
  check('sourceFreshnessConfidence', c.sourceFreshnessConfidence ?? null, thresholds.freshness,
    'The source has not been confirmed current recently enough.')

  const failures = dims.filter(d => !d.passed).map(d => `${d.dimension}: ${d.detail}`)
  return { passed: failures.length === 0, dimensions: dims, failures }
}

/**
 * Freshness as a function of age. A rule verified two years ago against a code
 * that is amended annually is not fresh, whatever it says.
 */
export function freshnessConfidence(retrievedAt: string, now: Date = new Date(), halfLifeDays = 180): number {
  const ageDays = (now.getTime() - Date.parse(retrievedAt)) / 86_400_000
  if (!Number.isFinite(ageDays)) return 0
  if (ageDays <= 0) return 1
  return Number(Math.pow(0.5, ageDays / halfLifeDays).toFixed(4))
}

// ── Rule identity ───────────────────────────────────────────────────────────

/**
 * The stable scope of a rule, independent of any project.
 *
 * This is what makes certification reusable: two projects on different parcels
 * in the same zone resolve to the SAME rule identity and therefore the same
 * certification. That is the entire point of Phase 3C.
 */
export interface RuleScope {
  jurisdiction: string
  codeSection: string
  /** e.g. 'dimensional.front_yard_depth', 'landscape.tree_canopy'. */
  ruleType: string
  /** Zone, use, overlay and any other scoping dimension. Order-insensitive. */
  scopeKey: Record<string, string>
  /** The ordinance version this rule is stated against. */
  effectiveVersion: string
}

/**
 * Deterministic identity string. Keys are sorted so `{zone, use}` and
 * `{use, zone}` produce the same identity — otherwise the same rule would
 * certify twice and reuse would silently fail.
 */
export function ruleIdentity(scope: RuleScope): string {
  const entries = Object.entries(scope.scopeKey)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => [k.trim().toLowerCase(), String(v).trim().toUpperCase()] as const)
    .sort(([a], [b]) => a.localeCompare(b))
  const scopePart = entries.map(([k, v]) => `${k}=${v}`).join(';')
  return [
    scope.jurisdiction.trim().toLowerCase(),
    scope.codeSection.trim().toUpperCase().replace(/\s+/g, ''),
    scope.ruleType.trim().toLowerCase(),
    scopePart,
    scope.effectiveVersion.trim(),
  ].join('|')
}

export function sameScope(a: RuleScope, b: RuleScope): boolean {
  return ruleIdentity(a) === ruleIdentity(b)
}
