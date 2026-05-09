/**
 * @kealee/pascal-wrapper — Geometry Utilities
 *
 * Calculates construction quantities from Pascal scene geometry.
 * Outputs feed directly into the EstimateBot and PermitBot contexts.
 */

import type { PascalSceneData, Wall, Floor, WallOpening, SceneGeometryStats, Vec2 } from '../types'

/** Distance between two points in feet */
export function wallLength(wall: Wall): number {
  const dx = wall.x2 - wall.x1
  const dy = wall.y2 - wall.y1
  return Math.sqrt(dx * dx + dy * dy)
}

/** Wall face area (one side) in sq ft, minus openings */
export function wallNetArea(wall: Wall): number {
  const length = wallLength(wall)
  const grossArea = length * wall.height
  const openingArea = wall.openings.reduce((acc, o) => acc + o.width * o.height, 0)
  return Math.max(0, grossArea - openingArea)
}

/** Polygon area via shoelace formula (sq ft) */
export function polygonArea(points: Vec2[]): number {
  if (points.length < 3) return 0
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area) / 2
}

/** Count openings of a specific type across all walls in a floor */
export function countOpenings(floor: Floor, type: WallOpening['type']): number {
  return floor.walls.reduce((acc, wall) => {
    return acc + wall.openings.filter(o => o.type === type).length
  }, 0)
}

/** Total exterior perimeter from exterior walls (feet) */
export function exteriorPerimeter(floor: Floor): number {
  return floor.walls
    .filter(w => w.type === 'exterior')
    .reduce((acc, w) => acc + wallLength(w), 0)
}

/** Calculate complete geometry stats from a scene */
export function calculateSceneStats(scene: PascalSceneData): SceneGeometryStats {
  let totalFloorAreaSqFt = 0
  let totalWallLengthFt = 0
  let totalWallAreaSqFt = 0
  let totalCeilingAreaSqFt = 0
  let totalOpenings = 0
  let doorCount = 0
  let windowCount = 0
  let roomCount = 0
  let exteriorPerimeterFt = 0

  for (const floor of scene.floors) {
    // Rooms → floor and ceiling area
    for (const room of floor.rooms) {
      const area = polygonArea(room.polygon)
      totalFloorAreaSqFt += area
      totalCeilingAreaSqFt += area
      roomCount++
    }

    // Walls → lengths, areas, openings
    for (const wall of floor.walls) {
      const len = wallLength(wall)
      totalWallLengthFt += len
      totalWallAreaSqFt += wallNetArea(wall)

      for (const o of wall.openings) {
        totalOpenings++
        if (o.type === 'door' || o.type === 'sliding_door' || o.type === 'garage_door') doorCount++
        if (o.type === 'window') windowCount++
      }
    }

    exteriorPerimeterFt += exteriorPerimeter(floor)
  }

  return {
    totalFloorAreaSqFt: Math.round(totalFloorAreaSqFt * 10) / 10,
    totalWallLengthFt: Math.round(totalWallLengthFt * 10) / 10,
    totalWallAreaSqFt: Math.round(totalWallAreaSqFt * 10) / 10,
    totalCeilingAreaSqFt: Math.round(totalCeilingAreaSqFt * 10) / 10,
    totalOpenings,
    doorCount,
    windowCount,
    roomCount,
    floorCount: scene.floors.length,
    exteriorPerimeterFt: Math.round(exteriorPerimeterFt * 10) / 10,
  }
}

/** Snap a value to nearest grid increment (feet) */
export function snapToGrid(value: number, gridSizeFt = 0.5): number {
  return Math.round(value / gridSizeFt) * gridSizeFt
}

/** Snap a Vec2 point to grid */
export function snapPoint(x: number, y: number, gridSizeFt = 0.5): { x: number; y: number } {
  return { x: snapToGrid(x, gridSizeFt), y: snapToGrid(y, gridSizeFt) }
}

/** Find the nearest wall endpoint within a threshold (for snapping walls together) */
export function findNearestEndpoint(
  px: number,
  py: number,
  walls: Wall[],
  excludeWallId: string | null,
  thresholdFt = 1,
): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null
  let bestDist = thresholdFt

  for (const wall of walls) {
    if (wall.id === excludeWallId) continue
    for (const pt of [{ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }]) {
      const dist = Math.sqrt((pt.x - px) ** 2 + (pt.y - py) ** 2)
      if (dist < bestDist) {
        bestDist = dist
        best = pt
      }
    }
  }
  return best
}

/** Convert screen pixels to feet given a zoom level and pixels-per-foot base */
export function pixelsToFeet(pixels: number, pxPerFt: number, zoom: number): number {
  return pixels / (pxPerFt * zoom)
}

/** Convert feet to screen pixels */
export function feetToPixels(feet: number, pxPerFt: number, zoom: number): number {
  return feet * pxPerFt * zoom
}

/** Format a distance for display (e.g. "12'-6"") */
export function formatFeet(feet: number): string {
  const wholeFeet = Math.floor(feet)
  const inches = Math.round((feet - wholeFeet) * 12)
  if (inches === 0) return `${wholeFeet}'`
  if (inches === 12) return `${wholeFeet + 1}'`
  return `${wholeFeet}'-${inches}"`
}

/** Midpoint of a wall segment */
export function wallMidpoint(wall: Wall): { x: number; y: number } {
  return {
    x: (wall.x1 + wall.x2) / 2,
    y: (wall.y1 + wall.y2) / 2,
  }
}

/** Perpendicular angle for dimension label placement */
export function wallPerpendicularAngle(wall: Wall): number {
  return Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) + Math.PI / 2
}
