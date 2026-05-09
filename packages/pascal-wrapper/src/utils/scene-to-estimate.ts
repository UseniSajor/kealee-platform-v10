/**
 * @kealee/pascal-wrapper — Scene → Estimate Bridge
 *
 * Converts Pascal scene geometry into structured quantity data
 * that feeds Kealee's EstimateBot and estimating engine.
 *
 * Pipeline: PascalScene → SceneQuantities → EstimateBot prompt context
 */

import { calculateSceneStats } from './geometry'
import type { PascalSceneData, ProjectType } from '../types'

export interface EstimateQuantity {
  csiCode: string      // CSI MasterFormat division
  description: string
  quantity: number
  unit: string         // 'sf', 'lf', 'ea', 'ls', 'cf'
  notes?: string
}

export interface SceneEstimateInput {
  quantities: EstimateQuantity[]
  projectType: ProjectType
  totalSqFt: number
  summary: string      // human-readable for bot prompt
}

/**
 * Convert a Pascal scene into structured estimate quantities.
 * These quantities are injected into the EstimateBot's system prompt
 * to dramatically improve estimate accuracy.
 */
export function sceneToEstimateInput(scene: PascalSceneData): SceneEstimateInput {
  const stats = calculateSceneStats(scene)
  const quantities: EstimateQuantity[] = []

  // Division 03 — Concrete (foundation/slab for additions/new construction)
  if (scene.projectType === 'addition' || scene.projectType === 'new_construction') {
    quantities.push({
      csiCode: '03 30 00',
      description: 'Cast-in-Place Concrete Slab',
      quantity: stats.totalFloorAreaSqFt,
      unit: 'sf',
      notes: 'Includes sub-base, vapor barrier, and 4" slab',
    })
  }

  // Division 06 — Wood Framing (all wood-framed scope)
  quantities.push({
    csiCode: '06 11 00',
    description: 'Wood Framing — Wall Plates and Studs',
    quantity: stats.totalWallLengthFt,
    unit: 'lf',
    notes: `${stats.floorCount} floor(s); includes top/bottom plates and studs @ 16" OC`,
  })

  // Division 08 — Doors & Windows
  if (stats.doorCount > 0) {
    quantities.push({
      csiCode: '08 14 16',
      description: 'Interior Flush Wood Doors',
      quantity: stats.doorCount,
      unit: 'ea',
    })
  }
  if (stats.windowCount > 0) {
    quantities.push({
      csiCode: '08 51 13',
      description: 'Aluminum Windows — Double-Pane',
      quantity: stats.windowCount,
      unit: 'ea',
    })
  }

  // Division 09 — Finishes
  quantities.push({
    csiCode: '09 29 00',
    description: 'Gypsum Board — Walls',
    quantity: stats.totalWallAreaSqFt * 2, // both sides
    unit: 'sf',
    notes: '1/2" gypsum board, taped and finished; assumes both wall faces',
  })
  quantities.push({
    csiCode: '09 29 00',
    description: 'Gypsum Board — Ceilings',
    quantity: stats.totalCeilingAreaSqFt,
    unit: 'sf',
  })

  // Floor materials based on rooms
  if (stats.totalFloorAreaSqFt > 0) {
    quantities.push({
      csiCode: '09 65 13',
      description: 'Floor Finish',
      quantity: stats.totalFloorAreaSqFt,
      unit: 'sf',
      notes: 'See material schedule; allowance-based pricing',
    })
  }

  // Division 22 — Plumbing (bath/kitchen fixtures)
  const kitchenFloors = scene.floors.flatMap(f => f.rooms.filter(r => r.type === 'kitchen'))
  const bathFloors = scene.floors.flatMap(f => f.rooms.filter(r => r.type === 'bathroom' || r.type === 'half_bath'))

  if (kitchenFloors.length > 0) {
    quantities.push({
      csiCode: '22 40 00',
      description: 'Kitchen Plumbing Fixtures — Rough-In and Trim',
      quantity: kitchenFloors.length,
      unit: 'ea',
      notes: 'Includes sink, DW, and disposal rough-in; fixture allowance separate',
    })
  }
  if (bathFloors.length > 0) {
    quantities.push({
      csiCode: '22 40 00',
      description: 'Bathroom Plumbing — Rough-In and Trim',
      quantity: bathFloors.length,
      unit: 'ea',
      notes: 'Per bathroom; includes shower/tub, toilet, and vanity sink',
    })
  }

  // Division 23 — HVAC (per floor / zone)
  quantities.push({
    csiCode: '23 00 00',
    description: 'HVAC — Ductwork and Distribution',
    quantity: stats.totalFloorAreaSqFt,
    unit: 'sf',
    notes: 'Allowance-based; varies by system type',
  })

  // Division 26 — Electrical
  quantities.push({
    csiCode: '26 05 00',
    description: 'Electrical Rough-In and Devices',
    quantity: stats.totalFloorAreaSqFt,
    unit: 'sf',
    notes: 'Includes panels, wiring, outlets, switches, and lighting rough-in',
  })

  // Build human-readable summary for bot context injection
  const summary = buildSummaryText(scene, stats)

  return {
    quantities,
    projectType: scene.projectType,
    totalSqFt: stats.totalFloorAreaSqFt,
    summary,
  }
}

function buildSummaryText(
  scene: PascalSceneData,
  stats: ReturnType<typeof calculateSceneStats>,
): string {
  const roomList = scene.floors
    .flatMap(f => f.rooms.map(r => `${r.name} (${Math.round(r.areaSqFt)} sf)`))
    .join(', ')

  return `
Pascal Scene Geometry Context:
- Project Type: ${scene.projectType.replace(/_/g, ' ')}
- Total Floors: ${stats.floorCount}
- Total Floor Area: ${stats.totalFloorAreaSqFt} sf
- Total Wall Length: ${stats.totalWallLengthFt} lf
- Total Wall Area (net): ${stats.totalWallAreaSqFt} sf
- Ceiling Area: ${stats.totalCeilingAreaSqFt} sf
- Room Count: ${stats.roomCount}
- Rooms: ${roomList || 'none defined'}
- Doors: ${stats.doorCount}
- Windows: ${stats.windowCount}
- Exterior Perimeter: ${stats.exteriorPerimeterFt} lf
- Scene Name: ${scene.name}
`.trim()
}

/**
 * Format quantities into a string for LLM prompt injection.
 * Used by EstimateBot to produce accurate line items.
 */
export function formatQuantitiesForPrompt(input: SceneEstimateInput): string {
  const lines = input.quantities.map(q =>
    `  ${q.csiCode} — ${q.description}: ${q.quantity} ${q.unit}${q.notes ? ` (${q.notes})` : ''}`
  )
  return `
Measured Quantities from Pascal Scene:
${lines.join('\n')}

Summary:
${input.summary}
`.trim()
}
