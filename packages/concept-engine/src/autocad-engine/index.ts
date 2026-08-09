/**
 * AutoCAD engine - Phases 1-4
 * Converts concept layouts to CAD with MEP coordination and code compliance.
 *
 * Public API:
 * - convertFloorplanToDXF(floorplan, options) → Phase 1 DXF
 * - CompleteCADOrchestrator.generateComplete(floorplan) → Phases 1-4 complete package
 * - Specialized classes for each phase
 */

// Phase 1: Core
export { AutoCADOrchestrator, convertFloorplanToDXF } from './autocad-orchestrator';
export type { AutoCADConversionResult } from './autocad-orchestrator';

export { GeometryKernel } from './geometry-kernel';
export { ConstraintSolver } from './constraint-solver';
export { DXFWriter } from './dxf-writer';
export { AutoCADConverter } from './autocad-converter';

// Phase 2: 3D Kernel
export { Geometry3D } from './geometry-3d';
export type { Point3D, Box3D, Wall3D, Slab3D, Roof3D } from './geometry-3d';

// Phase 3: MEP Coordination
export { MEPCoordinator } from './mep-coordinator';
export type {
  ElectricalFixture,
  HVACDuct,
  PlumbingFixture,
  CodeComplianceIssue,
  MEPReport,
} from './mep-coordinator';

// Phase 4: Advanced Export
export { AdvancedExporter } from './advanced-export';
export type { TitleBlockInfo, PDFAnnotation } from './advanced-export';

// Complete Pipeline
export { CompleteCADOrchestrator } from './complete-orchestrator';
export type { CompleteCADOutput } from './complete-orchestrator';

// Type Definitions
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
