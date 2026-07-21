import { isGardenLandscapeScope } from './scope-rules'
import { inferFloorplanScope, type V30FloorplanScope } from './floorplan-pricing'
import type { V30IntakeFormAnswers } from './types'

export interface FloorplanRoomSummary {
  name: string
  widthFt?: number
  lengthFt?: number
  areaSqft?: number
}

/** Layout-heavy concept services that get FloorplanBot + optional lot GIS. */
export function shouldResolveLotGis(projectPath?: string, primaryScope?: string): boolean {
  if (isGardenLandscapeScope(projectPath, primaryScope ? { primaryScope } : undefined)) {
    return true
  }
  const scope = `${projectPath ?? ''} ${primaryScope ?? ''}`.toLowerCase()
  return (
    scope.includes('kitchen') ||
    scope.includes('bath') ||
    scope.includes('addition') ||
    scope.includes('adu') ||
    scope.includes('expansion') ||
    scope.includes('whole') ||
    scope.includes('whole_home') ||
    scope.includes('whole-house') ||
    scope.includes('interior') ||
    scope.includes('basement') ||
    scope.includes('remodel') ||
    scope.includes('facade') ||
    scope.includes('exterior') ||
    scope.includes('deck') ||
    scope.includes('patio') ||
    scope.includes('new_construction') ||
    scope.includes('new-construction')
  )
}

export function floorplanScopeLabel(scope: V30FloorplanScope): string {
  const labels: Record<V30FloorplanScope, string> = {
    room: 'Room layout',
    kitchen: 'Kitchen layout',
    bath: 'Bathroom layout',
    addition: 'Addition site plan',
    whole_house: 'Whole-home floor plan',
    garden_landscape: 'Landscape site plan',
    exterior: 'Exterior / site plan',
  }
  return labels[scope] ?? 'Floor plan'
}

/** Recraft / plan-sheet prompt by inferred scope. */
export function buildFloorplanSheetPrompt(
  floorplan: Record<string, unknown>,
  projectPath: string,
  lotNote?: string,
  answers?: V30IntakeFormAnswers,
): string {
  const scope = inferFloorplanScope(
    answers ?? {
      primaryScope: projectPath,
      squareFeet: 0,
      propertyType: 'single-family',
      budgetRange: '',
      timeline: '',
      location: '',
      yearBuilt: '',
      utilities: {},
      codeConsiderations: [],
    },
    projectPath,
  )
  const title = String(floorplan.name ?? floorplanScopeLabel(scope))
  const lot = lotNote ?? ''

  const byScope: Record<V30FloorplanScope, string> = {
    kitchen:
      'Professional kitchen floor plan, top-down orthographic, work triangle, cabinets, island, appliance labels, dimensions in feet, clean vector lines on white, concept sheet',
    bath: 'Professional bathroom floor plan, top-down, fixture layout (tub/shower, vanity, toilet), wet zone zoning, door swings, dimensions, clean vector on white, concept sheet',
    addition:
      'Architectural site plan top-down, existing house footprint, proposed addition outline, setbacks, driveway, dimension strings, satellite-aligned lot context, concept sheet',
    whole_house:
      'Whole-house floor plan, top-down, labeled rooms, stairs, doors, overall dimensions, multi-room residential layout, clean architectural concept sheet on white',
    garden_landscape:
      'Professional landscape site plan, top-down, planting zones, hardscape paths, lot boundaries, clean vector style, white background',
    exterior:
      'Exterior site plan, top-down, building footprint, decks, walkways, grading notes, concept sheet',
    room: 'Interior room floor plan, top-down, furniture layout, dimensions, doors and windows, concept visualization sheet',
  }

  return `${byScope[scope]}. Title: ${title}.${lot}`
}

/** Pull room list from FloorplanBot JSON for workspace UI. */
export function extractFloorplanRoomSummary(
  floorplanOutput?: Record<string, unknown> | null,
): FloorplanRoomSummary[] {
  if (!floorplanOutput) return []
  const fp = (floorplanOutput.floorplan ?? floorplanOutput) as Record<string, unknown>
  const rooms = Array.isArray(fp.rooms) ? (fp.rooms as Record<string, unknown>[]) : []
  return rooms.map(r => ({
    name: String(r.name ?? r.label ?? 'Room'),
    widthFt: numOrUndef(r.width ?? r.widthFt),
    lengthFt: numOrUndef(r.length ?? r.lengthFt),
    areaSqft: numOrUndef(r.area ?? r.areaSqft ?? r.squareFeet),
  }))
}

function numOrUndef(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}
