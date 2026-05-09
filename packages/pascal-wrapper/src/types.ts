/**
 * @kealee/pascal-wrapper — Scene Types
 *
 * Core data model for Pascal Editor scenes within Kealee.
 * Designed to feed: estimating engine, permit workflows, DigitalTwin.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export interface Vec2 { x: number; y: number }
export interface Vec3 { x: number; y: number; z: number }

// ---------------------------------------------------------------------------
// Scene constants
// ---------------------------------------------------------------------------

/** 1 scene unit = 1 foot. Grid snap at 0.5ft (6 inches). */
export const SCENE_UNIT_FEET = 1
export const GRID_SNAP_FT = 0.5
export const DEFAULT_WALL_THICKNESS_FT = 0.5  // 6-inch wall
export const DEFAULT_CEILING_HEIGHT_FT = 9

// ---------------------------------------------------------------------------
// Element catalog types
// ---------------------------------------------------------------------------

export type ProjectType =
  | 'addition'
  | 'kitchen_remodel'
  | 'bath_remodel'
  | 'whole_house'
  | 'basement'
  | 'adu'
  | 'garage'
  | 'deck'
  | 'new_construction'
  | 'commercial'
  | 'exterior'
  | 'interior_reno'

export type ToolMode =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'room'
  | 'furniture'
  | 'measure'
  | 'pan'

export type ViewMode = '2d' | '3d' | 'walkthrough' | 'render'

export type RenderMode = 'sketch' | 'standard' | 'realistic' | 'cinematic'

export type MaterialPreset =
  | 'hardwood'
  | 'tile'
  | 'carpet'
  | 'concrete'
  | 'marble'
  | 'laminate'
  | 'vinyl'
  | 'white_shaker'
  | 'dark_shaker'
  | 'glass'
  | 'brick'
  | 'stone'
  | 'drywall'
  | 'wood_panel'

export type DesignStyle =
  | 'modern'
  | 'farmhouse'
  | 'contemporary'
  | 'transitional'
  | 'traditional'
  | 'industrial'
  | 'luxury'
  | 'minimalist'
  | 'coastal'

// ---------------------------------------------------------------------------
// Scene element types
// ---------------------------------------------------------------------------

export type WallType = 'exterior' | 'interior' | 'load_bearing' | 'partition' | 'foundation'

export interface Wall {
  id: string
  x1: number; y1: number   // start point (feet)
  x2: number; y2: number   // end point (feet)
  thickness: number         // feet (default 0.5)
  height: number            // feet (default 9)
  type: WallType
  material: MaterialPreset
  floorId: string
  /** Doors and windows cut into this wall */
  openings: WallOpening[]
}

export type OpeningType = 'door' | 'window' | 'opening' | 'garage_door' | 'sliding_door'

export interface WallOpening {
  id: string
  type: OpeningType
  /** Position along wall as fraction 0–1 */
  position: number
  /** Width in feet */
  width: number
  /** Height in feet */
  height: number
  /** Sill height from floor (windows) */
  sillHeight?: number
  /** Door swing angle in degrees (doors) */
  swingAngle?: number
  /** Swing side: 'left' | 'right' */
  swingSide?: 'left' | 'right'
}

export type RoomType =
  | 'living'
  | 'dining'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'half_bath'
  | 'office'
  | 'garage'
  | 'basement'
  | 'utility'
  | 'hallway'
  | 'closet'
  | 'mud_room'
  | 'foyer'
  | 'sunroom'
  | 'game_room'
  | 'gym'
  | 'studio'
  | 'deck'
  | 'patio'
  | 'other'

export interface Room {
  id: string
  name: string
  type: RoomType
  /** Polygon outline as array of [x,y] foot coordinates */
  polygon: Vec2[]
  /** Calculated area in sq ft (derived from polygon) */
  areaSqFt: number
  floorMaterial: MaterialPreset
  ceilingHeight: number  // feet
  color: string          // display color for 2D
  floorId: string
  level: number
}

export type FurnitureCategory =
  | 'seating'
  | 'table'
  | 'storage'
  | 'kitchen_appliance'
  | 'bath_fixture'
  | 'bed'
  | 'lighting'
  | 'kitchen_cabinet'
  | 'countertop'
  | 'island'
  | 'stairs'
  | 'fireplace'
  | 'hvac'
  | 'other'

export interface FurnitureElement {
  id: string
  catalogId: string    // references FURNITURE_CATALOG
  label: string
  category: FurnitureCategory
  /** Center position in feet */
  x: number; y: number
  /** Rotation in degrees */
  rotation: number
  /** Width × depth in feet */
  width: number; depth: number
  height: number
  material?: MaterialPreset
  color?: string
  floorId: string
}

export interface Floor {
  id: string
  name: string        // 'Ground Floor', 'Second Floor', 'Basement'
  level: number       // 0 = ground, 1 = second, -1 = basement
  elevation: number   // feet above grade
  walls: Wall[]
  rooms: Room[]
  furniture: FurnitureElement[]
}

// ---------------------------------------------------------------------------
// Scene metadata and estimates
// ---------------------------------------------------------------------------

export interface SceneGeometryStats {
  totalFloorAreaSqFt: number
  totalWallLengthFt: number
  totalWallAreaSqFt: number
  totalCeilingAreaSqFt: number
  totalOpenings: number
  doorCount: number
  windowCount: number
  roomCount: number
  floorCount: number
  /** Estimated exterior wall length for roofing calc */
  exteriorPerimeterFt: number
}

export interface SceneMaterials {
  floorMaterials: Record<MaterialPreset, number>  // material → sq ft
  wallMaterial: MaterialPreset
  style: DesignStyle
}

export interface PascalSceneData {
  id: string
  name: string
  projectType: ProjectType
  floors: Floor[]
  /** Camera state for 3D view */
  camera?: {
    position: Vec3
    target: Vec3
    zoom: number
  }
  /** 2D viewport state */
  viewport?: {
    offsetX: number
    offsetY: number
    zoom: number
  }
  materials: SceneMaterials
  stats?: SceneGeometryStats
  metadata: {
    address?: string
    projectId?: string
    userId?: string
    style?: DesignStyle
    notes?: string
    createdAt?: string
    updatedAt?: string
  }
}

// ---------------------------------------------------------------------------
// Zod validation
// ---------------------------------------------------------------------------

export const Vec2Schema = z.object({ x: z.number(), y: z.number() })

export const WallOpeningSchema = z.object({
  id: z.string(),
  type: z.enum(['door', 'window', 'opening', 'garage_door', 'sliding_door']),
  position: z.number().min(0).max(1),
  width: z.number().positive(),
  height: z.number().positive(),
  sillHeight: z.number().optional(),
  swingAngle: z.number().optional(),
  swingSide: z.enum(['left', 'right']).optional(),
})

export const PascalSceneDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectType: z.string(),
  floors: z.array(z.any()),
  metadata: z.object({
    address: z.string().optional(),
    projectId: z.string().optional(),
    userId: z.string().optional(),
  }),
})
