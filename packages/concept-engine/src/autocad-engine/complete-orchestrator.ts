/**
 * Complete AutoCAD engine orchestrator (Phases 1-4)
 * Entry point for full CAD generation pipeline
 */

import type { FloorPlanJson } from '../floorplan/types';
import type { GeometryModel, DXFExportOptions } from './types';
import type { MEPReport } from './mep-coordinator';
import type { Wall3D, Slab3D, Roof3D, Box3D } from './geometry-3d';
import { AutoCADOrchestrator } from './autocad-orchestrator';
import { Geometry3D } from './geometry-3d';
import { MEPCoordinator } from './mep-coordinator';
import { AdvancedExporter, TitleBlockInfo } from './advanced-export';
import { DXFWriter } from './dxf-writer';

export interface CompleteCADOutput {
  // Phase 1: Core DXF
  dxf_r12: string;
  geometry_model: GeometryModel;

  // Phase 2: 3D
  dxf_r2000_3d: string;
  walls_3d: Wall3D[];
  slab_3d: Slab3D;
  roof_3d: Roof3D;
  bounds_3d: Box3D;

  // Phase 3: MEP
  mep_report: MEPReport;
  code_compliance_score: number;

  // Phase 4: Advanced
  pdf_annotations: any[];
  ifc_json: any;

  // Metadata
  generation_time_ms: number;
  file_sizes: {
    dxf_r12_bytes: number;
    dxf_r2000_bytes: number;
    mep_report_bytes: number;
    ifc_bytes: number;
  };
  warnings: string[];
}

export class CompleteCADOrchestrator {
  /**
   * Generate complete CAD package (Phases 1-4) from floorplan.
   */
  static generateComplete(
    floorplan: FloorPlanJson,
    titleBlock?: TitleBlockInfo,
    options?: DXFExportOptions,
  ): CompleteCADOutput {
    const startTime = performance.now();
    const warnings: string[] = [];

    try {
      // PHASE 1: Core geometry
      const phase1 = new AutoCADOrchestrator();
      const dxfR12Result = phase1.convertToDXF(floorplan, options);

      if (!dxfR12Result.success) {
        throw new Error('Phase 1 failed: ' + dxfR12Result.warnings.join(', '));
      }

      const geometryModel = dxfR12Result.geometry_model;
      warnings.push(...dxfR12Result.warnings);

      // PHASE 2: 3D conversion
      const walls3D = Geometry3D.extrudeWall(
        geometryModel.walls.flatMap(w => w.segments),
        9.0, // Default ceiling height
        0, // Base elevation
      );

      const slab3D = Geometry3D.createSlab(
        geometryModel.rooms.length > 0 ? geometryModel.rooms[0].polygon : [],
        0,
        0.33,
      );

      const roof3D =
        geometryModel.rooms.length > 0
          ? Geometry3D.createPitchedRoof(geometryModel.rooms[0].polygon, 0, 9, 26.57)
          : ({
              id: 'roof_empty',
              type: 'flat',
              vertices: [],
              rafters: [],
              sheathing: { type: 'plywood', thickness: 0, grade: 'N/A' },
              roofing: { type: 'asphalt-shingles', weight: 0, lifespan: 0, color: 'N/A' },
              pitch: 0,
              overhang: 0,
              drainage: { gutters: false, downspouts: 0, grade: 0 },
            } as Roof3D);

      const bounds3D = Geometry3D.calculateBounds3D(walls3D, [slab3D], [roof3D]);

      // Generate R2000 DXF with 3D data
      const dxfR2000 = AdvancedExporter.generateDXFR2000(geometryModel);

      // PHASE 3: MEP Coordination
      const mepReport = MEPCoordinator.coordinate(geometryModel);
      const complianceScore = mepReport.compliance_score;

      if (mepReport.code_issues.length > 0) {
        warnings.push(
          `Code issues: ${mepReport.code_issues.filter(i => i.severity === 'error').length} errors, ${mepReport.code_issues.filter(i => i.severity === 'warning').length} warnings`,
        );
      }

      // PHASE 4: Advanced Export
      const pdfAnnotations = AdvancedExporter.generatePDFAnnotations(geometryModel, mepReport);
      const ifcJson = AdvancedExporter.generateIFCJSON(geometryModel, walls3D, [slab3D]);

      // R2000 with MEP and title block
      const dxfR2000Enhanced = AdvancedExporter.generateDXFR2000(
        geometryModel,
        mepReport,
        titleBlock,
      );

      // Calculate file sizes
      const fileSizes = {
        dxf_r12_bytes: Buffer.byteLength(dxfR12Result.dxf_content, 'utf-8'),
        dxf_r2000_bytes: Buffer.byteLength(dxfR2000Enhanced, 'utf-8'),
        mep_report_bytes: Buffer.byteLength(JSON.stringify(mepReport), 'utf-8'),
        ifc_bytes: Buffer.byteLength(JSON.stringify(ifcJson), 'utf-8'),
      };

      const generationTime = performance.now() - startTime;

      return {
        dxf_r12: dxfR12Result.dxf_content,
        geometry_model: geometryModel,
        dxf_r2000_3d: dxfR2000Enhanced,
        walls_3d: walls3D,
        slab_3d: slab3D,
        roof_3d: roof3D,
        bounds_3d: bounds3D,
        mep_report: mepReport,
        code_compliance_score: complianceScore,
        pdf_annotations: pdfAnnotations,
        ifc_json: ifcJson,
        generation_time_ms: generationTime,
        file_sizes: fileSizes,
        warnings,
      };
    } catch (error) {
      const generationTime = performance.now() - startTime;
      return {
        dxf_r12: '',
        geometry_model: {} as GeometryModel,
        dxf_r2000_3d: '',
        walls_3d: [],
        slab_3d: {} as Slab3D,
        roof_3d: {} as Roof3D,
        bounds_3d: {} as Box3D,
        mep_report: {
          electrical_fixtures: [],
          hvac_ducts: [],
          plumbing_fixtures: [],
          code_issues: [],
          compliance_score: 0,
        },
        code_compliance_score: 0,
        pdf_annotations: [],
        ifc_json: {},
        generation_time_ms: generationTime,
        file_sizes: {
          dxf_r12_bytes: 0,
          dxf_r2000_bytes: 0,
          mep_report_bytes: 0,
          ifc_bytes: 0,
        },
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Quick export with custom title block.
   */
  static exportWithTitleBlock(
    floorplan: FloorPlanJson,
    projectName: string,
    address: string,
    clientName: string,
  ): CompleteCADOutput {
    const titleBlock: TitleBlockInfo = {
      project_name: projectName,
      address: address,
      client: clientName,
      date: new Date().toISOString().split('T')[0],
      scale: '1/4" = 1\'-0"',
      revision: 1,
      drawn_by: 'Kealee Platform',
      checked_by: 'Automated',
    };

    return this.generateComplete(floorplan, titleBlock);
  }
}
