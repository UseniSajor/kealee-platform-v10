/**
 * AutoCAD engine - Phase 1
 * Converts concept layouts to DXF with dimensional constraints.
 *
 * Public API:
 * - convertFloorplanToDXF(floorplan, options) → DXF string + metadata
 * - AutoCADOrchestrator for advanced usage
 */

export { AutoCADOrchestrator, convertFloorplanToDXF } from './autocad-orchestrator';
export type { AutoCADConversionResult } from './autocad-orchestrator';

export { GeometryKernel } from './geometry-kernel';
export { ConstraintSolver } from './constraint-solver';
export { DXFWriter } from './dxf-writer';
export { AutoCADConverter } from './autocad-converter';

export type {
  Point,
  Vector,
  LineSegment,
  Wall,
  Door,
  Window,
  Dimension,
  Room,
  GeometryModel,
  DXFExportOptions,
  DXFEntity,
  Constraint,
  ConstraintSolverResult,
} from './types';
