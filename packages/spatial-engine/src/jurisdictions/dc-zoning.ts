/**
 * District of Columbia — one zone's dimensional envelope, assembled.
 *
 * `dc-dimensional-standards.generated.ts` holds the TABLES of the 2016 Zoning
 * Regulations, machine-extracted. A DC zone's envelope is spread across them —
 * lot width in D § 202.1, height in D § 203.2, rear yard in D § 207.1, lot
 * occupancy in D § 210.1 — and two of the numbers a site plan needs are not in
 * any table at all. This module does the assembly and carries the prose.
 *
 * WHAT IS TRANSCRIBED BY HAND, AND FROM WHERE (Title 11 DCMR, as amended by
 * ZC 18-16, 70 DCR, 25 August 2023):
 *
 *   Side yards    D § 208.2–208.5, E § 208.2–208.3, F § 208.2, G § 208.3.
 *                 Prose keyed on STRUCTURE TYPE, not zone.
 *   Front         D § 206.2 and E § 206.2 — "within the range of existing front
 *                 setbacks of all residential buildings on the same side of the
 *                 street in the block". There is no number. It is MEASURED
 *                 (`dc-front-setback.ts`) or it is an open item. F § 206 and
 *                 G § 206 are RESERVED: no front setback is required there.
 *   Rear (MU)     G § 207.5–207.6 prose; MU-1, MU-2 and MU-7 are height
 *                 formulas and are not reduced to a number.
 *   Modifiers     Subtitle D Chapters 3–11, read chapter by chapter. Only the
 *                 provisions that change a single household dwelling's yards,
 *                 occupancy or height are encoded; the rest are named.
 *
 * WHAT IS REFUSED, DELIBERATELY
 *
 * A yard stated as a formula ("4 in. per 1 ft. of principal building height but
 * not less than 15 ft.") is not coerced to its floor. Doing so draws a rear
 * line that is correct only for a building nobody has designed. Where any yard
 * the envelope needs cannot be reduced to a cited number, the envelope is
 * returned `computable: false` with the reason, the same stance the PG path
 * takes for its legacy comprehensive-design zones.
 *
 * MACHINE-EXTRACTED TABLES, HAND-TRANSCRIBED PROSE, NEITHER VERIFIED BY A
 * REVIEWER. Every value carries its citation so the reviewer can check it.
 */

import { DC_DIMENSIONAL_TABLES, DC_ZONING_SOURCE, dcTable, dcRowsForZone } from './dc-dimensional-standards.generated'

export { DC_ZONING_SOURCE }

export type DcStructureType = 'detached' | 'semi_detached' | 'row'

/** One standard, with the words that produced it. `value` is null when the words are not a number. */
export interface DcValue {
  value: number | null
  printed: string
  citation: string
}

export interface DcFrontRule {
  /**
   *  block_range     — D/E § 206.2: within the range of the block face. Measured.
   *  block_average   — D § 702.1 (/WH): at least the block average. Measured.
   *  adjacent_match  — D § 1103.1 (R-3/GT): consistent with one adjacent house.
   *  none_required   — F § 206 / G § 206 are reserved.
   */
  mode: 'block_range' | 'block_average' | 'adjacent_match' | 'none_required'
  citation: string
  text: string
}

export interface DcZoneParts {
  raw: string
  /** "R-1B" from "R-1B/FH". */
  base: string
  /** Every geographic modifier, in order: "R-1A/TS/NO" → ["TS", "NO"]. */
  modifiers: string[]
  /** The table row family: "R-1" for R-1A and R-1B, "RF-1" for RF-1. */
  family: string
  subtitle: 'D' | 'E' | 'F' | 'G' | null
}

export interface DcEnvelope {
  zone: DcZoneParts
  structure: DcStructureType
  /** False when any yard the envelope needs is not a cited number. */
  computable: boolean
  reason: string | null
  front: DcFrontRule
  /** Each side yard, where the structure type requires one. */
  sideYard: DcValue
  /** How many side yards the structure type requires: 2, 1 or 0. */
  sideYardCount: 0 | 1 | 2
  /** Aggregate of both side yards, where a modifier sets one (/FH: 24 ft). */
  sideYardAggregate: DcValue | null
  rearYard: DcValue
  heightFt: DcValue
  stories: DcValue
  lotOccupancyPct: DcValue
  perviousPct: DcValue | null
  minLotWidthFt: DcValue | null
  minLotAreaSqFt: DcValue | null
  /** Things a reviewer must read that change the answer for some lots. */
  cautions: string[]
}

const SUBTITLE_FOR: Record<string, DcZoneParts['subtitle']> = {
  R: 'D', RF: 'E', RA: 'F', MU: 'G',
}

/**
 * Splits a map zone code into its parts.
 *
 * The map carries both spellings: ZR16 as adopted wrote "R-1-B"; ZC 18-16
 * (2023) renamed it "R-1B". Both are accepted and normalised to the current
 * form, because the tables use the current form.
 */
export function parseDcZone(raw: string): DcZoneParts {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '')
  const [head, ...modifiers] = cleaned.split('/')
  const base = head.replace(/^(R-1)-([AB])$/, '$1$2').replace(/^(MU-\d+)-([AB])$/, '$1$2')
  const prefix = base.match(/^([A-Z]+)-/)?.[1] ?? ''
  const family =
    /^R-1[AB]$/.test(base) ? 'R-1'
    : base
  return { raw, base, modifiers, family, subtitle: SUBTITLE_FOR[prefix] ?? null }
}

function num(printed: string | null | undefined): number | null {
  if (!printed) return null
  const s = printed.replace(/,/g, '').replace(/\s*ft\.?$/i, '').trim()
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : null
}

function tableValue(
  citation: string, zone: DcZoneParts, column: number,
  structurePick?: (label: string) => boolean,
): DcValue | null {
  const t = dcTable(citation)
  if (!t) return null
  let rows = dcRowsForZone(t, zone.base)
  if (!rows.length) rows = dcRowsForZone(t, zone.family)
  if (!rows.length) return null
  const row = structurePick
    ? rows.find(r => structurePick(r[1] ?? '')) ?? null
    : rows[0]
  if (!row) return null
  const printed = (row[column] ?? '').trim()
  return { value: num(printed), printed, citation: `11-${t.table}` }
}

const stated = (value: number | null, printed: string, citation: string): DcValue =>
  ({ value, printed, citation })

/** Row picker for "type of structure" columns, most specific first. */
function structureRow(structure: DcStructureType, kind: 'lot' | 'occupancy') {
  return (label: string) => {
    const l = label.toLowerCase()
    if (kind === 'occupancy') {
      if (/public recreation|places of worship|public library|school/.test(l)) return false
      if (structure === 'row' && /row/.test(l)) return true
      if (/single household dwellings/.test(l)) return true
      return /all other structures|all structures/.test(l)
    }
    if (structure === 'row' && /^row$/.test(l)) return true
    if (structure === 'semi_detached' && /semi-detached/.test(l)) return true
    if (structure === 'detached' && /^detached$/.test(l)) return true
    return /all other structures|all structures/.test(l)
  }
}

/**
 * Two-pass occupancy pick: a row-specific row wins for row buildings, otherwise
 * the general row. A single pass that accepts "All Other Structures" first
 * hands a row building the 40% general figure where D § 210.1 gives it 60%.
 */
function occupancy(citation: string, zone: DcZoneParts, structure: DcStructureType): DcValue | null {
  if (structure === 'row') {
    const specific = tableValue(citation, zone, 2, l => /row/i.test(l) && !/all other/i.test(l))
    if (specific) return specific
  }
  const sfd = tableValue(citation, zone, 2, l => /single household dwellings/i.test(l))
  return sfd ?? tableValue(citation, zone, 2, structureRow(structure, 'occupancy'))
}

/** The dimensional envelope for a single household dwelling of this structure type. */
export function dcEnvelope(
  zoneCode: string,
  opts: { structure?: DcStructureType; lotAreaSqFt?: number | null } = {},
): DcEnvelope {
  const zone = parseDcZone(zoneCode)
  const structure = opts.structure ?? 'detached'
  const cautions: string[] = []
  const none = (why: string): DcValue => ({ value: null, printed: why, citation: '' })

  const base: Omit<DcEnvelope, 'computable' | 'reason'> = {
    zone, structure,
    front: { mode: 'none_required', citation: '', text: '' },
    sideYard: none('not determined'), sideYardCount: 0, sideYardAggregate: null,
    rearYard: none('not determined'),
    heightFt: none('not determined'), stories: none('not determined'),
    lotOccupancyPct: none('not determined'),
    perviousPct: null, minLotWidthFt: null, minLotAreaSqFt: null,
    cautions,
  }

  switch (zone.subtitle) {
    case 'D': {
      base.front = {
        mode: 'block_range', citation: '11-D § 206.2',
        text: 'Within the range of existing front setbacks of all residential buildings on the ' +
              'same side of the street in the block.',
      }
      if (structure === 'detached') {
        base.sideYardCount = 2
        base.sideYard = stated(8, '8 ft. each, two side yards', '11-D § 208.2')
      } else if (structure === 'semi_detached') {
        base.sideYardCount = 1
        base.sideYard = zone.family === 'R-3'
          ? stated(5, '5 ft., one side yard', '11-D § 208.4')
          : stated(8, '8 ft., one side yard', '11-D § 208.3')
      } else {
        base.sideYard = stated(0, 'No side yards are required for row buildings', '11-D § 208.5')
      }
      base.rearYard = tableValue('D § 207.1', zone, 1) ?? none('no row for this zone in D § 207.1')
      base.heightFt = tableValue('D § 203.2', zone, 1) ?? none('no row in D § 203.2')
      base.stories = tableValue('D § 203.2', zone, 2) ?? none('no row in D § 203.2')
      base.lotOccupancyPct = occupancy('D § 210.1', zone, structure) ?? none('no row in D § 210.1')
      base.perviousPct = tableValue('D § 211.1', zone, 2, l => !/public recreation/i.test(l))
      base.minLotWidthFt = tableValue('D § 202.1', zone, 2, structureRow(structure, 'lot'))
      base.minLotAreaSqFt = tableValue('D § 202.1', zone, 3, structureRow(structure, 'lot'))
      applyResidentialHouseModifiers(base, opts.lotAreaSqFt ?? null)
      break
    }
    case 'E': {
      base.front = {
        mode: 'block_range', citation: '11-E § 206.2',
        text: 'Within the range of existing front setbacks of all residential buildings on the ' +
              'same side of the street in the block.',
      }
      base.sideYardCount = structure === 'detached' ? 2 : structure === 'semi_detached' ? 1 : 0
      base.sideYard = structure === 'row'
        ? stated(0, 'No side yards are required for row buildings', '11-E § 208.2')
        : stated(5, 'Any side yard provided shall be a minimum of 5 ft.', '11-E § 208.3')
      base.rearYard = tableValue('E § 207.1', zone, 1) ?? none('no row in E § 207.1')
      const ht = (l: string) => structure === 'row' ? /row|all structures/i.test(l) : /detached|all structures/i.test(l)
      base.heightFt = tableValue('E § 203.2', zone, 2, ht) ?? none('no row in E § 203.2')
      base.stories = tableValue('E § 203.2', zone, 3, ht) ?? none('no row in E § 203.2')
      base.lotOccupancyPct = occupancy('E § 210.1', zone, structure) ?? none('no row in E § 210.1')
      base.minLotWidthFt = tableValue('E § 202.1', zone, 2, structureRow(structure, 'lot'))
      base.minLotAreaSqFt = tableValue('E § 202.1', zone, 3, structureRow(structure, 'lot'))
      if (zone.modifiers.length) {
        cautions.push(
          `${zone.raw}: Subtitle E, Chapter ${zone.modifiers.includes('DC') ? 3 : 4} modifies ` +
          'height and penthouse limits for non-residential and PUD cases only; the base RF-1 ' +
          'standards govern a single household dwelling.')
      }
      break
    }
    case 'F': {
      base.front = { mode: 'none_required', citation: '11-F § 206', text: 'Reserved — no front setback required.' }
      base.sideYardCount = structure === 'row' ? 0 : structure === 'semi_detached' ? 1 : 2
      base.sideYard = structure === 'row'
        ? stated(0, 'No side yards are required for a row building containing one or two dwelling units', '11-F § 208.2')
        : stated(8, '8 ft. for a detached or semi-detached building containing one or two dwelling units', '11-F § 208.2')
      base.rearYard = tableValue('F § 207.1', zone, 1) ?? none('no row in F § 207.1')
      base.heightFt = tableValue('F § 203.2', zone, 1) ?? none('no row in F § 203.2')
      base.stories = tableValue('F § 203.2', zone, 2) ?? none('no row in F § 203.2')
      base.lotOccupancyPct = occupancy('F § 210.1', zone, structure) ?? none('no row in F § 210.1')
      if (zone.modifiers.length) {
        cautions.push(`${zone.raw}: the geographic modifier changes HEIGHT; read Subtitle F for ${zone.modifiers.join('/')}.`)
      }
      break
    }
    case 'G': {
      base.front = { mode: 'none_required', citation: '11-G § 206', text: 'Reserved — no front setback required.' }
      if (structure === 'row') {
        base.sideYard = stated(0, 'No side yard is required for a building other than a detached or semi-detached single household dwelling', '11-G § 208.2')
      } else {
        base.sideYardCount = structure === 'detached' ? 2 : 1
        base.sideYard = stated(8, 'A minimum side yard of 8 ft. for a detached or semi-detached single household dwelling', '11-G § 208.3')
      }
      const n = Number(zone.base.match(/^MU-(\d+)/)?.[1] ?? NaN)
      if (n === 3) base.rearYard = stated(20, '20 ft.', '11-G § 207.5')
      else if (n >= 4 && n <= 6) base.rearYard = stated(15, '15 ft.', '11-G § 207.6')
      else base.rearYard = none(`the ${zone.base} rear yard is a height formula (G § 207); it is not reduced to a number`)
      if (n === 11 || n >= 12) {
        base.sideYard = none(`${zone.base} side yards are set by G § 208.4–208.5, not the single-dwelling rule`)
      }
      base.heightFt = tableValue('G § 203.2', zone, 1) ?? none('no row in G § 203.2')
      base.stories = tableValue('G § 203.2', zone, 2) ?? none('no row in G § 203.2')
      base.lotOccupancyPct = tableValue('G § 210.1', zone, 1) ?? none('no row in G § 210.1')
      if (zone.modifiers.length) {
        cautions.push(`${zone.raw}: the geographic modifier may change the standards; read Subtitle G for ${zone.modifiers.join('/')}.`)
      }
      break
    }
    default:
      return {
        ...base, computable: false,
        reason:
          `${zone.raw} is not a Residential House, Flat, Apartment or Mixed-Use zone. Its standards ` +
          'are in Subtitles H–K and are not assembled here.',
      }
  }

  // Heights, occupancies and FARs printed as "75 80 (IZ)" are a base figure and
  // an Inclusionary Zoning figure in one cell. The base is the matter-of-right
  // number for a project that is not an IZ development, and it is the smaller.
  for (const k of ['heightFt', 'lotOccupancyPct'] as const) {
    const v = base[k]
    const iz = v.printed.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*\(IZ\)$/i)
    if (iz) {
      base[k] = { ...v, value: Number(iz[1]) }
      cautions.push(
        `${k === 'heightFt' ? 'Height' : 'Lot occupancy'} is printed "${v.printed}" (${v.citation}): ` +
        `${iz[1]} as a matter of right, ${iz[2]} only for an Inclusionary Zoning development. ${iz[1]} is used.`)
    }
  }

  const missing: string[] = []
  if (base.sideYard.value === null) missing.push(`side yard — ${base.sideYard.printed}`)
  if (base.rearYard.value === null) missing.push(`rear yard — ${base.rearYard.printed}`)
  if (base.lotOccupancyPct.value === null) missing.push(`lot occupancy — ${base.lotOccupancyPct.printed}`)
  return {
    ...base,
    computable: missing.length === 0,
    reason: missing.length ? `Not reduced to a cited number: ${missing.join('; ')}.` : null,
  }
}

/**
 * Subtitle D, Chapters 3–11. Each geographic modifier changes named standards;
 * everything not named here is the base R-zone standard.
 */
function applyResidentialHouseModifiers(env: Omit<DcEnvelope, 'computable' | 'reason'>, lotAreaSqFt: number | null) {
  const m = env.zone.modifiers
  const has = (x: string) => m.includes(x)
  const c = env.cautions

  if (has('TS') && !has('NO')) {
    env.lotOccupancyPct = stated(30, '30%', '11-D § 302.1')
    c.push('Tree and Slope Protection (/TS): the tree protection regulations of Subtitle C, Chapter 4 apply (D § 301.1).')
  }
  if (has('TS') && has('NO')) {
    env.heightFt = stated(40, '40 ft., measured from the curb opposite the middle of the front of the building', '11-D § 502.1')
    env.stories = stated(3, '3', '11-D § 502.1')
    env.lotOccupancyPct = stated(30, '30%', '11-D § 504.1')
    c.push('R-1A/TS/NO: height is measured from the CURB opposite the middle of the front (D § 502.2), not from grade.')
  }
  if (has('NO') && !has('TS')) {
    env.heightFt = stated(40, '40 ft., measured from the curb opposite the middle of the front of the building', '11-D § 601.1')
    env.stories = stated(3, '3', '11-D § 601.1')
    c.push(`${env.zone.raw}: height is measured from the CURB opposite the middle of the front (D § 601.2), not from grade.`)
  }
  if (has('FH')) {
    if (env.sideYardCount > 0) {
      env.sideYardAggregate = stated(24, '24 ft. in the aggregate, no single side yard less than 8 ft.', '11-D § 403.1')
    }
    env.lotOccupancyPct = stated(30, '30%', '11-D § 404.1')
    env.perviousPct = stated(50, '50%', '11-D § 405.1')
    c.push('Forest Hills (/FH): side yards total 24 ft. (D § 403.1). The engine draws 12 ft. each side unless a placement is stated.')
  }
  if (has('WH')) {
    env.front = {
      mode: 'block_average', citation: '11-D § 702.1',
      text: 'At least the average setback of all structures on the same side of the street in the ' +
            'block, as depicted on the Office of Zoning map "Required Front Yard Setbacks".',
    }
    env.lotOccupancyPct = stated(30, '30% (smaller lots may occupy more — D § 703.1(a))', '11-D § 703.1')
    c.push(
      'Wesley Heights (/WH): GFA may not exceed 2,000 sq. ft. plus 40% of lot area (D § 701.1). The ' +
      'required front setback is the one DEPICTED on the Office of Zoning map; a measured block ' +
      'average is a check against it, not a substitute. 30% occupancy is drawn; D § 703.1(a) allows ' +
      'more on lots under 6,667 sq. ft., which a reviewer may apply.')
  }
  if (has('CBUT')) {
    if (lotAreaSqFt === null) {
      env.lotOccupancyPct = { value: null, printed: 'set by lot area (D § 1002.1–1002.3); lot area unknown', citation: '11-D § 1002' }
    } else if (lotAreaSqFt < 6500) {
      env.lotOccupancyPct = stated(40, '40% (lot under 6,500 sq. ft.)', '11-D § 1002.1')
    } else if (lotAreaSqFt < 9000) {
      env.lotOccupancyPct = stated(35, '35%, but not less than 2,600 sq. ft. (lot 6,500–8,999 sq. ft.)', '11-D § 1002.2')
    } else {
      env.lotOccupancyPct = stated(30, '30%, but not less than 3,150 sq. ft. (lot 9,000 sq. ft. or more)', '11-D § 1002.3')
    }
    env.perviousPct = stated(50, '50%', '11-D § 1003.1')
  }
  if (has('GT')) {
    if (env.zone.family === 'R-3') {
      env.front = {
        mode: 'adjacent_match', citation: '11-D § 1103.1',
        text: 'Consistent with at least one of the immediately adjacent properties on either side.',
      }
      if (env.structure === 'detached') env.sideYard = stated(5, '5 ft. each, two side yards', '11-D § 1104.1')
    }
    c.push(
      'Georgetown (/GT): the lot is in the Georgetown Historic District. The Old Georgetown Act ' +
      'requires Commission of Fine Arts review of exterior work visible from a public space.')
  }
  if (has('SH') || has('FB')) {
    c.push(`${env.zone.raw}: the modifier chapter changes use permissions or PUD limits only; the base standards govern.`)
  }
  const known = new Set(['TS', 'NO', 'FH', 'WH', 'CBUT', 'GT', 'SH', 'FB'])
  const unknown = m.filter(x => !known.has(x))
  if (unknown.length) {
    c.push(`Modifier ${unknown.join('/')} is not encoded. Read its chapter of Subtitle D before relying on these values.`)
  }
}

/** Every table the assembler reads, so a regeneration that drops one fails loudly. */
export const DC_TABLES_REQUIRED = [
  'D § 202.1', 'D § 203.2', 'D § 207.1', 'D § 210.1', 'D § 211.1',
  'E § 202.1', 'E § 203.2', 'E § 207.1', 'E § 210.1',
  'F § 203.2', 'F § 207.1', 'F § 210.1',
  'G § 203.2', 'G § 210.1',
] as const

export function dcTablesMissing(): string[] {
  const have = new Set(DC_DIMENSIONAL_TABLES.map(t => t.table))
  return DC_TABLES_REQUIRED.filter(t => !have.has(t))
}

// ── Front setback and the engine's standards rows ───────────────────────────

export interface DcBlockFaceMeasure {
  determined: boolean
  minFt: number | null
  maxFt: number | null
  meanFt: number | null
  sampleCount: number
}

export interface DcFrontDetermination {
  /** The front setback the envelope is drawn at, or null when nothing establishes one. */
  ft: number | null
  basis: string
  /** A recorded line and the zoning rule disagree. Both bind; a person decides. */
  conflict: string | null
}

/**
 * The front setback to DRAW, and why.
 *
 * Two independent sources can bind the front of a DC lot: the zoning rule
 * (blockface range, block average, or none) and a BUILDING RESTRICTION LINE
 * recorded against the lot by the Surveyor. A house must satisfy both, so the
 * drawn line is the more restrictive of the two. Where the recorded line lies
 * beyond the blockface maximum they cannot both be met; that is reported, not
 * resolved.
 */
export function dcFrontSetback(
  env: DcEnvelope, measured: DcBlockFaceMeasure | null, recordedBrlFt: number | null,
): DcFrontDetermination {
  const brl = recordedBrlFt != null && recordedBrlFt > 0 ? recordedBrlFt : null
  const brlText = brl != null ? `; recorded building restriction line ${brl} ft` : ''
  switch (env.front.mode) {
    case 'none_required':
      return {
        ft: brl ?? 0,
        basis: `${env.front.citation}: no front setback required${brlText}`,
        conflict: null,
      }
    case 'block_range':
    case 'block_average': {
      if (!measured?.determined || measured.minFt == null || measured.maxFt == null) {
        return {
          ft: brl,
          basis:
            `${env.front.citation}: blockface not measurable (${measured?.sampleCount ?? 0} buildings)` +
            (brl != null ? `; drawn at the recorded building restriction line ${brl} ft` : '; open item'),
          conflict: null,
        }
      }
      const zoningFt = env.front.mode === 'block_average' ? (measured.meanFt ?? measured.minFt) : measured.minFt
      const ft = Math.max(zoningFt, brl ?? 0)
      const range = `${measured.minFt}–${measured.maxFt} ft over ${measured.sampleCount} buildings`
      const conflict = brl != null && brl > measured.maxFt
        ? `The recorded building restriction line (${brl} ft) lies beyond the blockface maximum ` +
          `(${measured.maxFt} ft). A house cannot satisfy both; the Zoning Administrator decides.`
        : null
      return {
        ft,
        basis: env.front.mode === 'block_average'
          ? `${env.front.citation}: at least the block average, measured ${measured.meanFt} ft (${range})${brlText}; drawn at ${ft} ft`
          : `${env.front.citation}: within the blockface range, measured ${range}${brlText}; drawn at ${ft} ft`,
        conflict,
      }
    }
    case 'adjacent_match':
      return {
        ft: brl,
        basis: `${env.front.citation}: consistent with an immediately adjacent property — measure the ` +
               `neighbours' setbacks${brl != null ? `; drawn at the recorded line ${brl} ft` : '; open item'}`,
        conflict: null,
      }
  }
}

/** One standards row, in the shape the envelope reader consumes. */
export interface DcStandardRow {
  standard: string
  useColumn: string
  printed: string
  numeric: number | null
  footnotes: string[]
}

/**
 * The envelope as the engine's standards rows.
 *
 * `useColumn` is the engine's single-family column name so the shared reader
 * picks these rows; `printed` carries the DC structure type and citation.
 */
export function dcStandardRows(env: DcEnvelope, front: DcFrontDetermination): DcStandardRow[] {
  const use = 'Single-Family Detached Dwelling'
  const kind = env.structure.replace('_', '-')
  const row = (standard: string, v: DcValue | null, printedOverride?: string): DcStandardRow | null =>
    v ? { standard, useColumn: use, printed: printedOverride ?? `${v.printed} (${v.citation})`, numeric: v.value, footnotes: [] } : null
  const side: DcValue = env.sideYardAggregate?.value != null && env.sideYardCount === 2
    ? { value: Math.max(env.sideYard.value ?? 0, env.sideYardAggregate.value / 2),
        printed: `${env.sideYardAggregate.printed}; drawn equal`, citation: env.sideYardAggregate.citation }
    : env.sideYard
  return [
    { standard: 'Front yard depth', useColumn: use, printed: front.basis, numeric: front.ft, footnotes: [] },
    row('Side yard depth', side, `${side.printed} — ${kind} (${side.citation})`),
    row('Rear yard depth', env.rearYard),
    row('Lot coverage (lot occupancy)', env.lotOccupancyPct),
    row('Maximum height (ft)', env.heightFt),
    row('Maximum stories', env.stories),
    row('Minimum pervious surface (%)', env.perviousPct),
    row('Minimum lot width (ft)', env.minLotWidthFt),
    row('Minimum lot area (sq ft)', env.minLotAreaSqFt),
  ].filter((r): r is DcStandardRow => r !== null)
}
