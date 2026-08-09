/**
 * AutoCAD-level floor plan geometry types.
 * Phase 1: Core geometry, constraints, DXF export.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  dx: number;
  dy: number;
}

export interface LineSegment {
  id: string;
  start: Point;
  end: Point;
  type: 'wall' | 'door-opening' | 'window-opening' | 'dimension-line';
  thickness?: number; // Wall thickness in feet
  isExternal: boolean;
  layer: string;
}

export interface Wall {
  id: string;
  segments: LineSegment[];
  thickness: number; // Feet (typically 0.33 for 4" studs)
  isExternal: boolean;
  height: number; // Floor-to-ceiling in feet (typically 9 or 10)
  layer: string;
  constraints: Constraint[];
}

export interface Door {
  id: string;
  location: Point;
  direction: number; // Radians, 0 = east
  width: number; // Feet
  swing: 'left' | 'right' | 'bifold' | 'sliding';
  type: 'entry' | 'interior' | 'patio' | 'garage';
  layer: string;
}

export interface Window {
  id: string;
  location: Point;
  width: number; // Feet
  height: number; // Feet
  sill_height: number; // From floor in feet
  type: 'single' | 'double' | 'picture' | 'bay';
  layer: string;
}

export interface Dimension {
  id: string;
  type: 'linear' | 'radius' | 'angular';
  value: number;
  unit: 'ft' | 'in';
  start: Point;
  end: Point;
  label: string;
  layer: string;
}

export interface Constraint {
  id: string;
  type:
    | 'perpendicular'
    | 'parallel'
    | 'coincident'
    | 'distance'
    | 'angle'
    | 'symmetry'
    | 'setback';
  targets: string[]; // IDs of walls/elements
  value?: number; // Distance in feet or angle in degrees
  tolerance?: number;
  satisfied: boolean;
  reason?: string; // Why it failed
}

export interface Room {
  id: string;
  name: string;
  polygon: Point[]; // Vertices in CCW order
  area_sqft: number;
  type: string; // 'living', 'kitchen', 'bedroom', etc.
  layer: string;
  wallIds: string[];
}

export interface GeometryModel {
  id: string;
  name: string;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  dimensions: Dimension[];
  rooms: Room[];
  constraints: Constraint[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  grid_spacing: number; // Feet (0.01 for sub-inch precision)
  created_at: string;
}

export interface DXFExportOptions {
  include_dimensions?: boolean;
  include_doors?: boolean;
  include_windows?: boolean;
  include_rooms?: boolean;
  precision?: number; // Decimal places (3 = 0.001 ft)
  layer_prefix?: string;
}

export type DXFEntity =
  | { type: 'LINE'; start: Point; end: Point; layer: string }
  | { type: 'CIRCLE'; center: Point; radius: number; layer: string }
  | { type: 'ARC'; center: Point; radius: number; start_angle: number; end_angle: number; layer: string }
  | { type: 'TEXT'; position: Point; text: string; height: number; layer: string }
  | { type: 'POLYLINE'; vertices: Point[]; layer: string; closed: boolean };

export interface ConstraintSolverResult {
  satisfied: boolean;
  constraints_met: number;
  constraints_failed: number;
  failures: Constraint[];
  warnings: string[];
  execution_time_ms: number;
}
