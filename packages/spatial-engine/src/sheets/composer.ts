/**
 * Dynamic sheet composition.
 *
 * A twelve-sheet set is right for a subdivision and absurd for a rear addition
 * on a 6,500 sq ft lot. Prince George's County does not require C-000 through
 * L-100 as separate pages; it requires the content, legibly, at a scale a
 * reviewer can scale off.
 *
 * So the composer decides how many sheets the package actually needs, by asking
 * whether the content fits at a legible scale — not by counting disciplines. It
 * never splits a sheet to give a second seal its own page: responsibility is
 * divided in the title block instead (see review/content-scope.ts).
 */

import type { SiteFeature } from '../site-plan/site-twin'
import type { SheetId } from './sheet-template'
import { SHEET_TITLES } from './sheet-template'
import { ARCH_D, ANSI_B, boundsOf, fitViewport, type SheetSize, type Bounds, type StandardScale } from './viewport'
import type { ContentSubject } from '../review/content-scope'
import { subjectForFeature } from '../review/content-scope'

/**
 * Content groups that may share a sheet. Grouping follows how a reviewer reads
 * a drawing: existing conditions together, proposed site work together,
 * grading with drainage, landscape with tree conservation.
 */
export interface ContentBlock {
  id: string
  label: string
  /** Sheet it would occupy in a full set, for cross-reference and file naming. */
  canonicalSheet: SheetId
  subjects: ContentSubject[]
  /** Objects drawn in this block. */
  features: SiteFeature[]
  /** Notes, tables and schedules that must accompany it. */
  annotations: string[]
  /** Blocks that must not share a page with this one, and why. */
  incompatibleWith?: { block: string; reason: string }[]
}

export interface ComposedSheet {
  /** Sheet number in the composed set, e.g. "C-1 of 2". */
  number: string
  /** Canonical sheets whose content this page carries. */
  covers: SheetId[]
  title: string
  blocks: ContentBlock[]
  scaleFtPerIn: StandardScale
  scaleLabel: string
  sheetSize: SheetSize
  bounds: Bounds
  /** Set when the composer had to drop to a smaller scale to fit. */
  legibilityNote?: string
}

export interface CompositionResult {
  sheets: ComposedSheet[]
  /** Why the set came out at this size. */
  rationale: string
  /** Blocks that could not be placed legibly and need their own page. */
  forcedSeparations: { block: string; reason: string }[]
}

/**
 * Below this scale a residential site plan stops being reviewable — dimensions
 * collide and a reviewer cannot scale off it. 1" = 60' is the practical floor
 * for lot-level work; anything smaller belongs on a key map, not a site plan.
 */
export const LEGIBLE_FLOOR_FT_PER_IN: StandardScale = 60

/**
 * Content density per sheet, in objects. Beyond this a page is technically
 * legible but practically unreadable, which is a different failure and just as
 * real.
 */
export const MAX_OBJECTS_PER_SHEET = 400

export interface ComposeOptions {
  blocks: ContentBlock[]
  sheetSize?: SheetSize
  /** Force the full canonical set regardless of fit — for a submission that asks for it. */
  forceFullSet?: boolean
  /** Maximum number of composed sheets before the composer stops merging. */
  maxSheets?: number
  paddingFt?: number
}

function blockBounds(blocks: ContentBlock[]): Bounds {
  const rings = blocks.flatMap(b =>
    b.features.flatMap(f => ('ring' in f && f.ring ? [f.ring] : [])),
  )
  if (rings.length > 0) return boundsOf(rings)

  // Fall back to lines and points when nothing has a ring.
  const pts: [number, number][] = []
  for (const b of blocks) for (const f of b.features) {
    if ('line' in f && f.line) for (const p of f.line) pts.push([p[0], p[1]])
    if ('point' in f && f.point) pts.push([f.point[0], f.point[1]])
    if (f.kind === 'BoundarySegment') { pts.push([f.from[0], f.from[1]]); pts.push([f.to[0], f.to[1]]) }
  }
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  return {
    minX: Math.min(...pts.map(p => p[0])), minY: Math.min(...pts.map(p => p[1])),
    maxX: Math.max(...pts.map(p => p[0])), maxY: Math.max(...pts.map(p => p[1])),
  }
}

function objectCount(blocks: ContentBlock[]): number {
  return blocks.reduce((n, b) => n + b.features.length, 0)
}

/** True when this set of blocks fits on one page at a legible scale. */
export function fitsOnOneSheet(
  blocks: ContentBlock[],
  sheetSize: SheetSize,
  paddingFt: number,
): { fits: boolean; scale: StandardScale; reason: string } {
  const bounds = blockBounds(blocks)
  const vp = fitViewport(bounds, sheetSize, paddingFt)
  const count = objectCount(blocks)

  if (vp.scaleFtPerIn > LEGIBLE_FLOOR_FT_PER_IN) {
    return {
      fits: false,
      scale: vp.scaleFtPerIn,
      reason:
        `The content only fits at 1" = ${vp.scaleFtPerIn}', below the 1" = ${LEGIBLE_FLOOR_FT_PER_IN}' ` +
        'floor for reviewable site work.',
    }
  }
  if (count > MAX_OBJECTS_PER_SHEET) {
    return {
      fits: false,
      scale: vp.scaleFtPerIn,
      reason: `${count} objects exceeds the ${MAX_OBJECTS_PER_SHEET}-object density limit for one page.`,
    }
  }
  const incompatible = blocks.flatMap(b =>
    (b.incompatibleWith ?? []).filter(x => blocks.some(o => o.id === x.block)),
  )
  if (incompatible.length > 0) {
    return { fits: false, scale: vp.scaleFtPerIn, reason: incompatible[0].reason }
  }
  return { fits: true, scale: vp.scaleFtPerIn, reason: `Fits at 1" = ${vp.scaleFtPerIn}'.` }
}

/**
 * Merge order. Existing conditions and proposed layout are the two things a
 * reviewer compares side by side, so they separate first when a page splits.
 */
const MERGE_PRIORITY: SheetId[] = [
  'C-000', 'C-100', 'C-200', 'C-300', 'C-800', 'C-400', 'C-500', 'C-600', 'C-700', 'L-100', 'TCP-NRI', 'C-900',
]

export function composeSheets(opts: ComposeOptions): CompositionResult {
  const sheetSize = opts.sheetSize ?? ARCH_D
  const paddingFt = opts.paddingFt ?? 20
  const maxSheets = opts.maxSheets ?? 12
  const blocks = [...opts.blocks].sort(
    (a, b) => MERGE_PRIORITY.indexOf(a.canonicalSheet) - MERGE_PRIORITY.indexOf(b.canonicalSheet),
  )
  const forcedSeparations: { block: string; reason: string }[] = []

  if (opts.forceFullSet) {
    const sheets = blocks.map((b, i) => {
      const bounds = blockBounds([b])
      const vp = fitViewport(bounds, sheetSize, paddingFt)
      return {
        number: `${b.canonicalSheet}`,
        covers: [b.canonicalSheet],
        title: SHEET_TITLES[b.canonicalSheet],
        blocks: [b],
        scaleFtPerIn: vp.scaleFtPerIn,
        scaleLabel: vp.label,
        sheetSize,
        bounds,
        legibilityNote: i >= 0 && vp.scaleFtPerIn > LEGIBLE_FLOOR_FT_PER_IN
          ? `Drawn at 1" = ${vp.scaleFtPerIn}', below the legible floor. A match line or key map is required.`
          : undefined,
      } satisfies ComposedSheet
    })
    return {
      sheets,
      rationale: 'The full canonical set was requested explicitly; no merging was attempted.',
      forcedSeparations,
    }
  }

  // Greedy merge: keep adding the next block to the current page while it fits.
  const pages: ContentBlock[][] = []
  let current: ContentBlock[] = []

  for (const b of blocks) {
    const trial = [...current, b]
    const fit = fitsOnOneSheet(trial, sheetSize, paddingFt)
    if (fit.fits || current.length === 0) {
      if (!fit.fits && current.length === 0) {
        // A single block that does not fit still gets its own page — the note
        // says so rather than the composer silently drawing it too small.
        forcedSeparations.push({ block: b.id, reason: fit.reason })
      }
      current = trial
      continue
    }
    pages.push(current)
    forcedSeparations.push({ block: b.id, reason: fit.reason })
    current = [b]
    if (pages.length >= maxSheets - 1) break
  }
  if (current.length) pages.push(current)

  const sheets: ComposedSheet[] = pages.map((pageBlocks, i) => {
    const bounds = blockBounds(pageBlocks)
    const vp = fitViewport(bounds, sheetSize, paddingFt)
    const covers = [...new Set(pageBlocks.map(b => b.canonicalSheet))]
    return {
      number: `C-${i + 1}`,
      covers,
      title: covers.length === 1
        ? SHEET_TITLES[covers[0]]
        : pageBlocks.map(b => b.label).join(', '),
      blocks: pageBlocks,
      scaleFtPerIn: vp.scaleFtPerIn,
      scaleLabel: vp.label,
      sheetSize,
      bounds,
      legibilityNote: vp.scaleFtPerIn > LEGIBLE_FLOOR_FT_PER_IN
        ? `Drawn at 1" = ${vp.scaleFtPerIn}', below the 1" = ${LEGIBLE_FLOOR_FT_PER_IN}' legible floor. ` +
          'An enlarged detail or key map is required.'
        : undefined,
    }
  })

  const canonicalCount = new Set(blocks.map(b => b.canonicalSheet)).size
  return {
    sheets,
    forcedSeparations,
    rationale:
      sheets.length < canonicalCount
        ? `${canonicalCount} canonical sheets of content were composed onto ${sheets.length} page(s), all at ` +
          `1" = ${Math.max(...sheets.map(s => s.scaleFtPerIn))}' or better. Separate pages are not required ` +
          'when the content is legible together, and each professional\'s scope is divided in the title block.'
        : `${sheets.length} page(s) were required: the content does not fit legibly on fewer.`,
  }
}

/**
 * Convenience for lot-scale infill: the common case where a whole civil package
 * fits on one or two ARCH D sheets.
 */
export function composeInfillPackage(blocks: ContentBlock[]): CompositionResult {
  return composeSheets({ blocks, sheetSize: ARCH_D })
}

/** Builds content blocks from twin features, grouped as a reviewer reads them. */
export function blocksFromFeatures(features: SiteFeature[]): ContentBlock[] {
  const groups: { id: string; label: string; sheet: SheetId; subjects: ContentSubject[] }[] = [
    { id: 'existing', label: 'Existing Conditions and Boundary', sheet: 'C-100',
      subjects: ['boundary_determination', 'topographic_survey', 'easement_depiction', 'existing_improvements'] },
    { id: 'site', label: 'Site and Zoning', sheet: 'C-200',
      subjects: ['zoning_compliance', 'site_layout', 'architectural_footprint'] },
    { id: 'demo', label: 'Demolition', sheet: 'C-300', subjects: ['demolition'] },
    { id: 'grading', label: 'Grading, Drainage and Sediment Control', sheet: 'C-400',
      subjects: ['grading_design', 'stormwater_design', 'sediment_control'] },
    { id: 'utility', label: 'Utilities', sheet: 'C-500', subjects: ['utility_design'] },
    { id: 'paving', label: 'Driveway and Paving', sheet: 'C-800', subjects: ['roadway_design'] },
    { id: 'landscape', label: 'Landscape and Tree Conservation', sheet: 'L-100',
      subjects: ['planting_design', 'tree_conservation'] },
  ]

  const out: ContentBlock[] = []
  for (const g of groups) {
    const mine = features.filter(f => g.subjects.includes(subjectForFeature(f)))
    if (mine.length === 0) continue
    out.push({
      id: g.id,
      label: g.label,
      canonicalSheet: g.sheet,
      subjects: g.subjects,
      features: mine,
      annotations: [],
    })
  }
  return out
}

export { ANSI_B }
