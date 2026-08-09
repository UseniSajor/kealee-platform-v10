/**
 * AutoCAD engine orchestrator.
 * Phase 1: Converts concept layouts to DXF via geometry model.
 * Entry point: convertToDXF(floorplan) → DXF string.
 */

import type { FloorPlanJson } from '../floorplan/types';
import type { GeometryModel, DXFExportOptions, ConstraintSolverResult } from './types';
import { AutoCADConverter } from './autocad-converter';
import { GeometryKernel } from './geometry-kernel';
import { ConstraintSolver } from './constraint-solver';
import { DXFWriter } from './dxf-writer';

export interface AutoCADConversionResult {
  success: boolean;
  dxf_content: string;
  geometry_model: GeometryModel;
  constraint_report: ConstraintSolverResult;
  file_size_bytes: number;
  generation_time_ms: number;
  warnings: string[];
}

export class AutoCADOrchestrator {
  private converter: AutoCADConverter;
  private kernel: GeometryKernel;
  private solver: ConstraintSolver;

  constructor() {
    this.converter = new AutoCADConverter();
    this.kernel = new GeometryKernel();
    this.solver = new ConstraintSolver(this.kernel);
  }

  /**
   * Main entry point: convert FloorPlanJson to DXF.
   */
  convertToDXF(
    floorplan: FloorPlanJson,
    options?: DXFExportOptions,
  ): AutoCADConversionResult {
    const startTime = performance.now();
    const warnings: string[] = [];

    try {
      // Step 1: Convert to geometry model
      const geometryModel = this.converter.convert(floorplan);
      warnings.push(`Geometry model created: ${geometryModel.walls.length} walls, ${geometryModel.rooms.length} rooms`);

      // Step 2: Validate constraints
      const constraintReport = this.solver.solve(geometryModel);
      if (!constraintReport.satisfied) {
        warnings.push(`${constraintReport.constraints_failed} constraint(s) failed`);
        for (const failure of constraintReport.failures) {
          warnings.push(`  - ${failure.id}: ${failure.reason}`);
        }
      }

      // Step 3: Generate DXF
      const dxfContent = DXFWriter.generateDXF(geometryModel, options);
      const fileSizeBytes = Buffer.byteLength(dxfContent, 'utf-8');

      // Add constraint warnings to output
      for (const warning of constraintReport.warnings) {
        warnings.push(`Warning: ${warning}`);
      }

      const generationTime = performance.now() - startTime;

      return {
        success: true,
        dxf_content: dxfContent,
        geometry_model: geometryModel,
        constraint_report: constraintReport,
        file_size_bytes: fileSizeBytes,
        generation_time_ms: generationTime,
        warnings,
      };
    } catch (error) {
      const generationTime = performance.now() - startTime;
      return {
        success: false,
        dxf_content: '',
        geometry_model: {} as GeometryModel,
        constraint_report: {
          satisfied: false,
          constraints_met: 0,
          constraints_failed: 0,
          failures: [],
          warnings: [error instanceof Error ? error.message : 'Unknown error'],
          execution_time_ms: 0,
        },
        file_size_bytes: 0,
        generation_time_ms: generationTime,
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Direct geometry model export (for advanced use).
   */
  getGeometryModel(floorplan: FloorPlanJson): GeometryModel {
    return this.converter.convert(floorplan);
  }

  /**
   * Get constraint validation report for a geometry model.
   */
  validateConstraints(model: GeometryModel): ConstraintSolverResult {
    return this.solver.solve(model);
  }
}

/**
 * Convenience function for single-call DXF generation.
 */
export function convertFloorplanToDXF(
  floorplan: FloorPlanJson,
  options?: DXFExportOptions,
): AutoCADConversionResult {
  const orchestrator = new AutoCADOrchestrator();
  return orchestrator.convertToDXF(floorplan, options);
}
