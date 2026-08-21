/**
 * Configurable county sheet-template engine.
 *
 * Every sheet in the set carries the same frame: title block, project identity,
 * scale and graphic scale, north arrow, coordinate and datum notes, revision
 * table, source-data notes, legend, approval block where required, and a status
 * watermark. Those are defined once here so a sheet cannot be issued missing one.
 *
 * Sheets are drawn from the digital site twin and record the twin revision they
 * came from, which is what makes "regenerate every affected sheet after one
 * source-model change" auditable.
 */

import type { SiteTwin } from '../site-plan/site-twin'
import type { ReliabilityLevel } from '../site-plan/reliability'

export type SheetId =
  | 'C-000' | 'C-100' | 'C-200' | 'C-300' | 'C-400'
  | 'C-500' | 'C-600' | 'C-700' | 'C-800' | 'C-900'
  | 'L-100' | 'TCP-NRI'

export const SHEET_TITLES: Record<SheetId, string> = {
  'C-000': 'Cover Sheet, Approvals and General Notes',
  'C-100': 'Existing Conditions and Boundary Plan',
  'C-200': 'Overall Site and Zoning Plan',
  'C-300': 'Demolition Plan',
  'C-400': 'Grading and Drainage Plan',
  'C-500': 'Utility Plan',
  'C-600': 'Stormwater Management Plan',
  'C-700': 'Sediment and Erosion Control Plan',
  'C-800': 'Road, Driveway and Paving Plan',
  'C-900': 'Civil Details',
  'L-100': 'Landscape and Tree Canopy Plan',
  'TCP-NRI': 'Tree Conservation Plan / Natural Resource Inventory Coordination',
}

/**
 * Which discipline is responsible for the content of each sheet. Drives the
 * professional responsibility matrix on C-000 and the review routing.
 */
export const SHEET_DISCIPLINE: Record<SheetId, string> = {
  'C-000': 'Kealee (coordination)',
  'C-100': 'Maryland Licensed Surveyor',
  'C-200': 'Maryland Professional Engineer',
  'C-300': 'Maryland Professional Engineer',
  'C-400': 'Maryland Professional Engineer',
  'C-500': 'Maryland Professional Engineer',
  'C-600': 'Maryland Professional Engineer',
  'C-700': 'Maryland Professional Engineer',
  'C-800': 'Maryland Professional Engineer',
  'C-900': 'Maryland Professional Engineer',
  'L-100': 'Landscape Architect / Qualified Professional',
  'TCP-NRI': 'Qualified Environmental Professional',
}

export type SheetStatus = 'PRELIMINARY' | 'FOR_REVIEW' | 'PERMIT_SET' | 'NOT_FOR_CONSTRUCTION'

export interface RevisionEntry {
  number: number
  date: string
  description: string
  by: string
}

export interface SheetContext {
  sheet: SheetId
  twin: SiteTwin
  /** Twin revision this sheet was generated from. */
  twinRevision: number
  status: SheetStatus
  scale: string
  revisions: RevisionEntry[]
  reliabilityLevel: ReliabilityLevel
  /** Fixed disclosure text for the governing reliability level. */
  disclosure: string | null
  projectName: string
  preparedFor?: string
  sheetIndex: number
  sheetCount: number
  /** Stated design assumptions printed on the sheet, as a drafter would note them. */
  assumptions?: string[]
}

/** Every sheet frame element the brief requires. Used as an issuance checklist. */
export const REQUIRED_FRAME_ELEMENTS = [
  'titleBlock',
  'projectNameAndAddress',
  'taxAccountLotBlockParcel',
  'professionalReviewStatus',
  'sheetTitleAndNumber',
  'scaleAndGraphicScale',
  'northArrow',
  'coordinateAndDatumNotes',
  'revisionTable',
  'sourceDataNotes',
  'legendAndAbbreviations',
  'statusWatermark',
] as const

export type FrameElement = (typeof REQUIRED_FRAME_ELEMENTS)[number]

export interface FrameAudit {
  present: FrameElement[]
  missing: FrameElement[]
  complete: boolean
}

/**
 * Confirms a sheet context can populate every required frame element. A sheet
 * that cannot is blocked from issuance rather than printed incomplete.
 */
export function auditSheetFrame(ctx: SheetContext): FrameAudit {
  const present: FrameElement[] = []
  const missing: FrameElement[] = []

  const check = (el: FrameElement, ok: boolean) => (ok ? present : missing).push(el)

  check('titleBlock', Boolean(ctx.projectName))
  check('projectNameAndAddress', Boolean(ctx.twin.address))
  // Tax account / lot / block / parcel come off the Parcel feature.
  const parcel = ctx.twin.features.find(f => f.kind === 'Parcel') as
    | { parcelId?: string | null; taxAccount?: string; lot?: string; block?: string }
    | undefined
  check('taxAccountLotBlockParcel', Boolean(parcel?.parcelId || parcel?.taxAccount || parcel?.lot))
  check('professionalReviewStatus', Boolean(ctx.status))
  check('sheetTitleAndNumber', Boolean(SHEET_TITLES[ctx.sheet]))
  check('scaleAndGraphicScale', Boolean(ctx.scale))
  check('northArrow', true) // drawn unconditionally
  check('coordinateAndDatumNotes', Boolean(ctx.twin.crs))
  check('revisionTable', Array.isArray(ctx.revisions))
  check('sourceDataNotes', ctx.twin.sources.length > 0)
  check('legendAndAbbreviations', true)
  check('statusWatermark', ctx.status !== 'PERMIT_SET' ? Boolean(ctx.disclosure ?? ctx.status) : true)

  return { present, missing, complete: missing.length === 0 }
}

/** Sheets applicable to a project, given what the classification found. */
export function applicableSheets(input: {
  requiresSedimentAndStormwater: boolean
  hasDemolition: boolean
  hasRoadWork: boolean
  hasLandscapeRequirement: boolean
  hasWoodlandOrNri: boolean
}): SheetId[] {
  const sheets: SheetId[] = ['C-000', 'C-100', 'C-200']
  if (input.hasDemolition) sheets.push('C-300')
  sheets.push('C-400', 'C-500')
  if (input.requiresSedimentAndStormwater) sheets.push('C-600', 'C-700')
  if (input.hasRoadWork) sheets.push('C-800')
  sheets.push('C-900')
  if (input.hasLandscapeRequirement) sheets.push('L-100')
  if (input.hasWoodlandOrNri) sheets.push('TCP-NRI')
  return sheets
}
