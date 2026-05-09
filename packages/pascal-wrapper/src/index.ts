/**
 * @kealee/pascal-wrapper
 *
 * Pascal Editor integration layer for the Kealee construction platform.
 *
 * Visual spatial design engine providing:
 * - 2D SVG floor plan drawing
 * - 3D Three.js / React Three Fiber scene rendering
 * - PBR material rendering (sketch / standard / realistic / cinematic)
 * - Element library (furniture, fixtures, appliances, cabinets)
 * - Scene persistence and versioning
 * - AI geometry extraction → EstimateBot / PermitBot context
 * - DigitalTwin spatial data bridge
 *
 * Pipeline integration:
 *   PascalScene → sceneToEstimateInput() → EstimateBot prompt
 *   PascalScene → PermitBot dimensional context
 *   PascalScene → DigitalTwin geometry layer
 */

// Main editor component
export { PascalEditor } from './PascalEditor'
export type { PascalEditorProps } from './PascalEditor'

// Scene context / state management
export {
  EditorProvider,
  useEditorStore,
  useActiveFloor,
  useSceneStats,
  createDefaultScene,
} from './SceneContext'

// Individual components (for embedding in other layouts)
export { FloorPlanCanvas } from './components/FloorPlanCanvas'
export { SceneViewer3D } from './components/SceneViewer3D'
export { EditorToolBar } from './components/EditorToolBar'
export { ElementLibrary } from './components/ElementLibrary'
export { PropertiesPanel } from './components/PropertiesPanel'

// Types
export type {
  PascalSceneData,
  Floor,
  Wall,
  WallOpening,
  Room,
  FurnitureElement,
  ProjectType,
  ToolMode,
  ViewMode,
  RenderMode,
  MaterialPreset,
  DesignStyle,
  SceneGeometryStats,
  SceneMaterials,
  Vec2,
  Vec3,
  RoomType,
  WallType,
  OpeningType,
  FurnitureCategory,
} from './types'

export {
  SCENE_UNIT_FEET,
  GRID_SNAP_FT,
  DEFAULT_WALL_THICKNESS_FT,
  DEFAULT_CEILING_HEIGHT_FT,
  PascalSceneDataSchema,
} from './types'

// Constants and catalog
export {
  FURNITURE_CATALOG,
  PROJECT_TYPE_CONFIG,
  ROOM_COLORS,
  MATERIAL_LABELS,
  CONSTRUCTION_REELS,
  CONSULTATION_GATE_PRODUCTS,
} from './constants'

// Geometry utilities
export {
  wallLength,
  wallNetArea,
  polygonArea,
  calculateSceneStats,
  snapToGrid,
  snapPoint,
  findNearestEndpoint,
  formatFeet,
  wallMidpoint,
} from './utils/geometry'

// Estimate bridge (feeds EstimateBot)
export {
  sceneToEstimateInput,
  formatQuantitiesForPrompt,
} from './utils/scene-to-estimate'

export type { EstimateQuantity, SceneEstimateInput } from './utils/scene-to-estimate'
