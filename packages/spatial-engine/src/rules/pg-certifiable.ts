/**
 * Converts the Prince George's County rule pack into certifiable rules.
 *
 * The Phase 3B pack was a flat list of 51 rows with one confidence number and a
 * `humanReviewRequired` flag. This lifts each one into the Phase 3C model:
 * separate confidence dimensions, an authority classification taken from the
 * source type, provenance detailed enough to relocate the governing language,
 * a modelled applicability condition, and a lifecycle state.
 *
 * Everything starts EXTRACTED. Nothing here certifies anything — certification
 * is a human act performed through the reviewer API, and this file exists to
 * make that act possible exactly once per rule rather than once per project.
 */

import type { RuleVersionRow } from '../persistence/store'
import { buildPgRulePack, PG_JURISDICTION_CODE, PG_AGENCY } from '../persistence/rule-pack'
import { PG_ZONE_DIMENSIONAL_TABLES } from '../jurisdictions/pg-dimensional-standards.generated'
import { PG_ZONES_2022, PG_ZONING_ORDINANCE_2022_EFFECTIVE } from '../jurisdictions/prince-georges-md'
import type { CertifiableRule } from './certification'
import { reconcileSources } from './certification'
import type { RuleProvenance, SourceAuthority, ExtractionMethod, RuleConfidence } from './model'
import { authorityProfile, ruleIdentity, freshnessConfidence } from './model'
import type { ApplicabilityModel, Condition, RuleFootnote } from './applicability'

export const PG_PACK_VERSION = '2022.1'
export const PG_PARSER_VERSION = 'kealee-rules-1.0.0'

/**
 * Rules the package genuinely cannot be produced without. Everything else is
 * supporting — useful, sometimes important, but not a gate on drafting a plan.
 */
export const PG_CORE_RULE_KEYS: string[] = [
  'crs.reference',
  'gis.layers',
  'zoning.zone_registry_2022',
  'zoning.dimensional.RSF-65',
  'zoning.dimensional.RSF-95',
  'zoning.dimensional.RMF-20',
  'environment.stream_buffers',
  'subdivision.procedures',
  'process.review_model',
]

/**
 * Which authority each rule family rests on. This is a claim about the DOCUMENT
 * and is the only input to authority confidence — a parser cannot raise it.
 */
function authorityFor(ruleKey: string): SourceAuthority {
  if (ruleKey.startsWith('zoning.dimensional.') || ruleKey.startsWith('zoning.overlay.')) return 'OFFICIAL_CODE'
  if (ruleKey === 'zoning.zone_registry_2022') return 'OFFICIAL_CODE'
  if (ruleKey.startsWith('gis.') || ruleKey === 'crs.reference') return 'OFFICIAL_GIS'
  if (ruleKey === 'flood.fema_zones') return 'OFFICIAL_AGENCY_REGULATION'
  if (ruleKey.startsWith('subdivision.') || ruleKey.startsWith('environment.')) return 'OFFICIAL_CODE'
  // The Landscape Manual is adopted by reference but paraphrases Subtitle 25 —
  // it is a manual, not the code, and §25-128 Table 1 is not in it at all.
  if (ruleKey.startsWith('landscape.')) return 'OFFICIAL_AGENCY_MANUAL'
  // Kealee's own compiled description of the review process, informed by DPIE's
  // published practice but not published by anyone with authority over it.
  if (ruleKey === 'process.review_model') return 'SECONDARY_SOURCE'
  return 'SECONDARY_SOURCE'
}

function extractionMethodFor(ruleKey: string): ExtractionMethod {
  if (ruleKey.startsWith('zoning.dimensional.')) return 'html_table_parser'
  if (ruleKey.startsWith('gis.') || ruleKey === 'crs.reference' || ruleKey === 'zoning.zone_registry_2022') return 'gis_query'
  return 'manual_entry'
}

/**
 * Rule families that state no requirement the county reviews against.
 *
 * `reference.source` names the GIS endpoint and CRS to query; `process.model`
 * is Kealee's own description of who drafts and who seals. Getting either wrong
 * breaks the drawing, not the entitlement — and neither is something a DPIE
 * reviewer would ever look for on a sheet. They inform, they do not gate.
 */
const ADVISORY_RULE_TYPES = new Set(['reference.source', 'process.model'])

/** Rule type family, used for reviewer authority and review routing. */
function ruleTypeFor(ruleKey: string): string {
  if (ruleKey.startsWith('zoning.dimensional.')) return 'dimensional.standards'
  if (ruleKey.startsWith('zoning.overlay.')) return 'overlay.standards'
  if (ruleKey.startsWith('zoning.')) return 'zoning.registry'
  if (ruleKey.startsWith('subdivision.')) return 'subdivision.procedure'
  if (ruleKey.startsWith('environment.')) return 'environmental.buffer'
  if (ruleKey.startsWith('landscape.')) return 'landscape.requirement'
  if (ruleKey.startsWith('flood.')) return 'flood.designation'
  if (ruleKey.startsWith('gis.') || ruleKey === 'crs.reference') return 'reference.source'
  return 'process.model'
}

/**
 * Extraction confidence by method. This measures how reliably a value was READ,
 * nothing else. A colspan/rowspan HTML grid parse of a nested Transit-Oriented
 * table is genuinely less certain than a GIS domain enumeration.
 */
function extractionConfidenceFor(ruleKey: string, method: ExtractionMethod): number {
  if (method === 'gis_query') return 0.99
  if (method === 'manual_entry') return 0.95
  // Nested Core/Edge headers over use types; RTO-L and RTO-H share one table.
  const nested = /^zoning\.dimensional\.(RTO|TAC|LTO|NAC|LMUTC)/.test(ruleKey)
  return nested ? 0.72 : 0.88
}

/** The applicability condition for a rule, modelled rather than assumed. */
function applicabilityFor(ruleKey: string, payload: unknown): ApplicabilityModel {
  // Dimensional standards apply to their zone, and are displaced by any overlay
  // carrying its own standards.
  const dimensional = ruleKey.match(/^zoning\.dimensional\.(.+)$/)
  if (dimensional && dimensional[1] !== 'absent') {
    const zone = dimensional[1]
    return {
      condition: {
        kind: 'allOf',
        conditions: [
          { kind: 'equals', field: 'zone', value: zone, description: `zone is ${zone}` },
          { kind: 'effectiveOn', onOrAfter: PG_ZONING_ORDINANCE_2022_EFFECTIVE, description: 'application on or after the 2022 ordinance' },
        ],
      },
      overriddenBy: [
        {
          ruleIdentity: `${PG_JURISDICTION_CODE}|SUBTITLE27-TDO|overlay.standards|`,
          condition: { kind: 'includesAny', field: 'overlays', values: ['T-D-O', 'TDO'], description: 'a Transit District Overlay applies' },
          reason:
            'A Transit District Development Plan supersedes underlying base-zone standards. The base ' +
            'table is not the requirement inside a TDO.',
        },
      ],
      footnotes: footnotesFor(zone, payload),
    }
  }

  if (ruleKey === 'zoning.dimensional.absent') {
    const zones = (payload as { zones?: string[] })?.zones ?? []
    return {
      condition: { kind: 'oneOf', field: 'zone', values: zones, description: `zone has no published dimensional table` },
      incompleteReason:
        'These legacy comprehensive-design zones are governed by their prior approved plans. The ' +
        'envelope comes from the approval document, which is per-parcel and cannot be modelled from the code.',
    }
  }

  if (ruleKey.startsWith('zoning.overlay.')) {
    const code = ruleKey.replace('zoning.overlay.', '')
    return {
      condition: { kind: 'includes', field: 'overlays', value: code, description: `${code} overlay applies` },
      incompleteReason:
        'Overlay standards are set by the adopted plan for the specific district, not by the ordinance ' +
        'text alone. The governing plan and its resolution must be identified per project.',
    }
  }

  if (ruleKey === 'environment.stream_buffers') {
    return {
      condition: {
        kind: 'includesAny', field: 'environmentalOverlays',
        values: ['REGULATED_STREAM', 'STREAM', 'WETLAND', 'PMA'],
        description: 'a regulated stream, wetland or PMA is present',
      },
      footnotes: [{
        id: 'toc-buffer',
        marker: '(TOC)',
        text:
          'The buffer is 75 ft within a Transit-Oriented / Activity Center and 100 ft outside one ' +
          '(Table 24-4303(c)).',
        effect: 'replaces_value',
        value: '75',
        condition: {
          kind: 'includesAny', field: 'overlays', values: ['TOC', 'T-D-O', 'LTO', 'RTO', 'NAC', 'TAC'],
          description: 'site lies within a Transit-Oriented or Activity Center',
        },
        mandatory: true,
      }],
    }
  }

  if (ruleKey === 'landscape.tree_canopy') {
    return {
      condition: { kind: 'always', description: 'applies to development subject to Subtitle 25' },
      incompleteReason:
        'The coverage percentages live in §25-128 Table 1, which is not reproduced in any retrievable ' +
        'publication. Applicability is known; the requirement is not.',
    }
  }

  if (ruleKey === 'flood.fema_zones') {
    return {
      condition: {
        kind: 'includesAny', field: 'environmentalOverlays',
        values: ['FLOODPLAIN', 'SFHA', 'AE', 'A', 'AO', 'AH', 'VE'],
        description: 'the parcel touches a mapped flood zone',
      },
      incompleteReason:
        'The effective FIRM panel and its date govern. A zone letter alone is not a floodplain determination.',
    }
  }

  if (ruleKey === 'subdivision.procedures') {
    return {
      condition: {
        kind: 'notOneOf', field: 'subdivisionStatus', values: ['not_required'],
        description: 'subdivision approval is in play',
      },
    }
  }

  // Reference and process rules apply to every project in the jurisdiction.
  return { condition: { kind: 'always', description: 'applies jurisdiction-wide' } }
}

/**
 * Footnotes carried by a zone's dimensional table.
 *
 * Phase 3B deliberately kept footnote markers inside the value strings — "45 (4)"
 * is not the number 45. Here those markers become structured footnotes with
 * `discretionary` conditions, because the footnote TEXT is not in the extracted
 * table. That is honest: we know a footnote modifies the value and we do not
 * know when, so the rule cannot certify on its base value.
 */
function footnotesFor(zone: string, payload: unknown): RuleFootnote[] {
  const table = (payload as { rows?: { standard: string; values: string[] }[] })?.rows ?? []
  const markers = new Set<string>()
  for (const row of table) {
    for (const v of row.values ?? []) {
      for (const m of String(v).matchAll(/\((\d+)\)/g)) markers.add(m[1])
    }
  }
  return [...markers].sort((a, b) => Number(a) - Number(b)).map<RuleFootnote>(n => ({
    id: `${zone}-fn-${n}`,
    marker: `(${n})`,
    text:
      `Footnote ${n} to the ${zone} intensity and dimensional standards table. The footnote text was not ` +
      'captured with the table and must be read from the ordinance before the base value is relied on.',
    effect: 'modifies_value',
    condition: {
      kind: 'discretionary',
      description: `whether footnote (${n}) applies to this project — the footnote text has not been captured`,
      resolvedBy: 'land_use_planner',
    },
    mandatory: true,
  }))
}

function provenanceFor(row: RuleVersionRow, retrievedAt: string): RuleProvenance {
  const authority = authorityFor(row.ruleKey)
  const dimensional = row.ruleKey.match(/^zoning\.dimensional\.(.+)$/)
  const table = dimensional && dimensional[1] !== 'absent'
    ? (PG_ZONE_DIMENSIONAL_TABLES[dimensional[1]] as { section?: string } | undefined)
    : undefined

  const gaps: string[] = []
  const isWholeTable = Boolean(dimensional && dimensional[1] !== 'absent')
  if (isWholeTable) {
    gaps.push(
      'This rule carries an entire dimensional table rather than one cell, so row and column are ' +
      'recorded per lookup rather than on the rule.',
    )
  }

  return {
    jurisdiction: PG_JURISDICTION_CODE,
    agency: PG_AGENCY,
    sourceType: authority,
    granularity: isWholeTable ? 'table' : authority === 'OFFICIAL_GIS' ? 'document' : 'section',
    sourceTitle: authority === 'OFFICIAL_AGENCY_MANUAL'
      ? "Prince George's County Landscape Manual"
      : "Prince George's County Code of Ordinances",
    sourceUrl: row.sourceUrl,
    sourceDocumentId: null,
    codeTitle: row.ruleKey.startsWith('subdivision.') ? 'Subtitle 24' :
               row.ruleKey.startsWith('landscape.') ? 'Subtitle 25' : 'Subtitle 27',
    codeSection: row.section,
    table: table?.section ? `Table under ${table.section}` : null,
    row: null,
    column: null,
    effectiveDate: row.effectiveDate,
    retrievedAt,
    // Populated by the maintenance workflow when the source is fetched and
    // hashed. Absent here on purpose: a rule with no source hash cannot certify,
    // and pretending otherwise would defeat the entire mechanism.
    sourceHash: null,
    sourceVersion: null,
    extractionMethod: extractionMethodFor(row.ruleKey),
    pageNumber: null,
    parserVersion: PG_PARSER_VERSION,
    gaps: gaps.length ? gaps : undefined,
  }
}

export interface ToCertifiableOptions {
  retrievedAt?: string
  /** Source hash per rule key, from a completed source-refresh run. */
  sourceHashes?: Record<string, { hash: string; version: string }>
  now?: Date
}

/** Lifts the Phase 3B rule rows into Phase 3C certifiable rules. */
export function toCertifiableRules(
  rows: RuleVersionRow[],
  opts: ToCertifiableOptions = {},
): CertifiableRule[] {
  const retrievedAt = opts.retrievedAt ?? new Date().toISOString()
  const now = opts.now ?? new Date()

  return rows.map(row => {
    const provenance = provenanceFor(row, retrievedAt)
    const hash = opts.sourceHashes?.[row.ruleKey]
    if (hash) {
      provenance.sourceHash = hash.hash
      provenance.sourceVersion = hash.version
    }

    const ruleType = ruleTypeFor(row.ruleKey)
    const applicability = applicabilityFor(row.ruleKey, row.payload)
    const extractionConfidence = extractionConfidenceFor(row.ruleKey, provenance.extractionMethod)
    const authority = authorityProfile(provenance.sourceType)

    // Applicability confidence reflects how completely the conditions are
    // modelled, before any project is seen.
    const applicabilityConfidence = applicability.incompleteReason
      ? 0.4
      : (applicability.footnotes ?? []).some(f => f.mandatory && f.condition.kind === 'discretionary')
        ? 0.5
        : 0.95

    const confidence: RuleConfidence = {
      extractionConfidence,
      // Never taken from the parser. This is a property of the document.
      authorityConfidence: authority.confidence,
      applicabilityConfidence,
      sourceFreshnessConfidence: freshnessConfidence(retrievedAt, now),
    }

    const sourceIssues: string[] = []
    if (row.ruleKey === 'landscape.tree_canopy') {
      sourceIssues.push(
        'Subtitle 25 §25-128 Table 1 could not be retrieved from any published source (EncodePlus viewer, ' +
        'Municode API, the TCC bulletin PDF, eCode360, and all 121 Landscape Manual tables were checked). ' +
        'The canopy coverage percentages are therefore unknown. No fallback value exists and none may be ' +
        'inferred — certification is prohibited until the authoritative table is obtained.',
      )
    }
    if (row.ruleKey === 'zoning.dimensional.absent') {
      sourceIssues.push(
        'Sec. 27-4205 publishes no dimensional table for these zones. This is an absence of a table, not ' +
        'an absence of a requirement — the envelope comes from each parcel\'s prior approved plan.',
      )
    }

    const identity = ruleIdentity({
      jurisdiction: PG_JURISDICTION_CODE,
      codeSection: row.section ?? row.ruleKey,
      ruleType,
      scopeKey: scopeKeyFor(row.ruleKey),
      effectiveVersion: row.effectiveDate ?? PG_ZONING_ORDINANCE_2022_EFFECTIVE,
    })

    const humanReviewReasons: string[] = []
    if (!provenance.sourceHash) {
      humanReviewReasons.push('No source hash — the rule has not been bound to retrieved source content.')
    }
    if (applicability.incompleteReason) humanReviewReasons.push(applicability.incompleteReason)
    if ((applicability.footnotes ?? []).some(f => f.mandatory)) {
      humanReviewReasons.push('Mandatory footnotes are unresolved; the base table value is not the requirement.')
    }
    if (!authority.certifiable) humanReviewReasons.push(authority.rationale)
    humanReviewReasons.push(...sourceIssues)

    return {
      identity,
      scope: {
        jurisdiction: PG_JURISDICTION_CODE,
        codeSection: row.section ?? row.ruleKey,
        ruleType,
        scopeKey: scopeKeyFor(row.ruleKey),
        effectiveVersion: row.effectiveDate ?? PG_ZONING_ORDINANCE_2022_EFFECTIVE,
      },
      ruleKey: row.ruleKey,
      version: row.version,
      // Everything begins here. No rule is born certified.
      state: 'EXTRACTED',
      value: null,
      payload: row.payload,
      provenance,
      confidence,
      applicability,
      reconciliation: reconcileSources({
        // Dimensional standards are the high-risk family: a wrong setback moves
        // a building. They get dual-source treatment.
        dualSourceRequired: row.ruleKey.startsWith('zoning.dimensional.') && row.ruleKey !== 'zoning.dimensional.absent',
        sourceA: null,
        sourceB: null,
        now: retrievedAt,
      }),
      certification: null,
      gating: !ADVISORY_RULE_TYPES.has(ruleType),
      advisoryReason: ADVISORY_RULE_TYPES.has(ruleType)
        ? 'Source registry / process reference: it states no requirement the county reviews against.'
        : undefined,
      sourceIssues,
      humanReviewRequired: true,
      humanReviewReasons,
    }
  })
}

function scopeKeyFor(ruleKey: string): Record<string, string> {
  const dimensional = ruleKey.match(/^zoning\.dimensional\.(.+)$/)
  if (dimensional && dimensional[1] !== 'absent') return { zone: dimensional[1] }
  const overlay = ruleKey.match(/^zoning\.overlay\.(.+)$/)
  if (overlay) return { overlay: overlay[1] }
  return {}
}

/** Builds the PG certifiable rule set from the Phase 3B pack in one call. */
export function buildPgCertifiableRules(opts: ToCertifiableOptions = {}): CertifiableRule[] {
  return toCertifiableRules(buildPgRulePack({ verifiedAt: opts.retrievedAt }), opts)
}

export { PG_JURISDICTION_CODE, PG_ZONES_2022 }
