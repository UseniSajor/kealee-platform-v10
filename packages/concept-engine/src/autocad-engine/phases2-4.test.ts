/**
 * Tests for Phases 2-4: 3D, MEP, Advanced Export
 */

import { describe, it, expect } from '@jest/globals';
import { Geometry3D } from './geometry-3d';
import { MEPCoordinator } from './mep-coordinator';
import { AdvancedExporter } from './advanced-export';
import { CompleteCADOrchestrator } from './complete-orchestrator';
import type { GeometryModel } from './types';
import type { FloorPlanJson, FloorPlanRoomJson } from '../floorplan/types';

const mockModel: GeometryModel = {
  id: 'test',
  name: 'test-layout',
  walls: [
    {
      id: 'w1',
      segments: [
        {
          id: 's1',
          start: { x: 0, y: 0 },
          end: { x: 10, y: 0 },
          type: 'wall',
          isExternal: true,
          layer: 'A-WALL',
          thickness: 0.33,
        },
      ],
      thickness: 0.33,
      isExternal: true,
      height: 9,
      layer: 'A-WALL',
      constraints: [],
    },
  ],
  doors: [],
  windows: [],
  dimensions: [],
  rooms: [
    {
      id: 'room_1',
      name: 'Kitchen',
      polygon: [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 14 },
        { x: 0, y: 14 },
      ],
      area_sqft: 168,
      type: 'kitchen',
      layer: 'A-ROOM',
      wallIds: ['w1'],
    },
    {
      id: 'room_2',
      name: 'Bedroom',
      polygon: [
        { x: 13, y: 0 },
        { x: 24, y: 0 },
        { x: 24, y: 14 },
        { x: 13, y: 14 },
      ],
      area_sqft: 154,
      type: 'bedroom',
      layer: 'A-ROOM',
      wallIds: [],
    },
    {
      id: 'room_3',
      name: 'Bathroom',
      polygon: [
        { x: 25, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 8 },
        { x: 25, y: 8 },
      ],
      area_sqft: 40,
      type: 'bathroom',
      layer: 'A-ROOM',
      wallIds: [],
    },
  ],
  constraints: [],
  bounds: { minX: 0, minY: 0, maxX: 30, maxY: 14 },
  grid_spacing: 0.01,
  created_at: new Date().toISOString(),
};

describe('Phase 2: Geometry3D', () => {
  it('extrudes walls to 3D', () => {
    const walls3D = Geometry3D.extrudeWall(
      mockModel.walls[0].segments,
      9,
      0,
    );

    expect(walls3D).toHaveLength(1);
    expect(walls3D[0].basePoints).toHaveLength(4); // Quad (rectangle)
    expect(walls3D[0].height).toBe(9);
  });

  it('creates floor slabs', () => {
    const slab = Geometry3D.createSlab(mockModel.rooms[0].polygon, 0, 0.33);

    expect(slab.id).toBeDefined();
    expect(slab.points).toHaveLength(4);
    expect(slab.thickness).toBe(0.33);
  });

  it('generates pitched roofs', () => {
    const roof = Geometry3D.createPitchedRoof(
      mockModel.rooms[0].polygon,
      0,
      9,
      26.57,
    );

    expect(roof.id).toBeDefined();
    expect(roof.points.length).toBeGreaterThan(0);
    expect(roof.pitch).toBeCloseTo(26.57);
  });

  it('calculates 3D bounds', () => {
    const walls3D = Geometry3D.extrudeWall(
      mockModel.walls[0].segments,
      9,
      0,
    );
    const slab = Geometry3D.createSlab(mockModel.rooms[0].polygon, 0);
    const roof = Geometry3D.createPitchedRoof(mockModel.rooms[0].polygon, 0, 9);

    const bounds = Geometry3D.calculateBounds3D(walls3D, [slab], [roof]);

    expect(bounds.minX).toBeLessThanOrEqual(0);
    expect(bounds.maxZ).toBeGreaterThan(9);
  });

  it('generates elevation views', () => {
    const walls3D = Geometry3D.extrudeWall(
      mockModel.walls[0].segments,
      9,
      0,
    );
    const elev = Geometry3D.generateElevationView(walls3D, 0);

    expect(Array.isArray(elev)).toBe(true);
  });
});

describe('Phase 3: MEPCoordinator', () => {
  it('generates electrical layout', () => {
    const fixtures = MEPCoordinator.generateElectricalLayout(mockModel);

    expect(fixtures.length).toBeGreaterThan(0);
    expect(fixtures.some(f => f.type === 'outlet')).toBe(true);
    expect(fixtures.some(f => f.type === 'switch')).toBe(true);
  });

  it('generates HVAC ductwork', () => {
    const ducts = MEPCoordinator.generateHVACLayout(mockModel);

    expect(ducts.length).toBeGreaterThan(0);
    expect(ducts.some(d => d.supply)).toBe(true);
    expect(ducts.some(d => !d.supply)).toBe(true);
  });

  it('places plumbing fixtures', () => {
    const fixtures = MEPCoordinator.generatePlumbingLayout(mockModel);

    expect(fixtures.some(f => f.type === 'sink')).toBe(true);
    expect(fixtures.some(f => f.type === 'toilet')).toBe(true);
    expect(fixtures.some(f => f.type === 'shower')).toBe(true);
  });

  it('validates code compliance', () => {
    const issues = MEPCoordinator.validateCodeCompliance(mockModel);

    expect(Array.isArray(issues)).toBe(true);
    // Bathroom without window should have warning
    expect(
      issues.some(
        i => i.type === 'ventilation' && i.severity === 'warning',
      ),
    ).toBe(true);
  });

  it('generates complete MEP report', () => {
    const report = MEPCoordinator.coordinate(mockModel);

    expect(report.electrical_fixtures.length).toBeGreaterThan(0);
    expect(report.hvac_ducts.length).toBeGreaterThan(0);
    expect(report.plumbing_fixtures.length).toBeGreaterThan(0);
    expect(report.code_issues).toBeDefined();
    expect(report.compliance_score).toBeGreaterThanOrEqual(0);
    expect(report.compliance_score).toBeLessThanOrEqual(100);
  });
});

describe('Phase 4: AdvancedExporter', () => {
  it('generates DXF R2000 format', () => {
    const dxf = AdvancedExporter.generateDXFR2000(mockModel);

    expect(dxf).toContain('AC1021'); // R2000 version
    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('BLOCKS');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('EOF');
  });

  it('includes MEP data in R2000 export', () => {
    const mepReport = MEPCoordinator.coordinate(mockModel);
    const dxf = AdvancedExporter.generateDXFR2000(mockModel, mepReport);

    expect(dxf).toContain('INSERT'); // Block references for MEP
    expect(dxf).toContain('LWPOLYLINE'); // HVAC ducts
    expect(dxf).toContain('CIRCLE'); // Plumbing fixtures
  });

  it('adds title block to export', () => {
    const titleBlock = {
      project_name: 'Test House',
      address: '123 Main St',
      client: 'Test Client',
      date: '2026-07-08',
      scale: '1/4" = 1\'-0"',
      revision: 1,
      drawn_by: 'Test',
      checked_by: 'Test',
    };

    const dxf = AdvancedExporter.generateDXFR2000(mockModel, undefined, titleBlock);

    expect(dxf).toContain('Test House');
    expect(dxf).toContain('123 Main St');
  });

  it('generates PDF annotations', () => {
    const mepReport = MEPCoordinator.coordinate(mockModel);
    const annotations = AdvancedExporter.generatePDFAnnotations(mockModel, mepReport);

    expect(Array.isArray(annotations)).toBe(true);
    expect(annotations.length).toBeGreaterThan(0);
  });

  it('exports IFC JSON for BIM integration', () => {
    const ifcJson = AdvancedExporter.generateIFCJSON(mockModel);

    expect(ifcJson.ifcType).toBe('IfcBuilding');
    expect(ifcJson.name).toBe(mockModel.name);
    expect(ifcJson.walls).toBeDefined();
    expect(ifcJson.slabs).toBeDefined();
  });
});

describe('Complete Pipeline: Phases 1-4', () => {
  const mockFloorplan: FloorPlanJson = {
    id: 'fp_1',
    intakeId: 'intake_1',
    projectPath: 'kitchen_remodel',
    version: 1,
    rooms: [
      {
        id: 'room_1',
        type: 'kitchen',
        label: 'Kitchen',
        widthFt: 12,
        depthFt: 14,
        areaFt2: 168,
        x: 0,
        y: 0,
        captureZone: 'main',
        notes: [],
        issues: [],
      } as unknown as FloorPlanRoomJson,
    ],
    adjacencies: [],
    totalAreaFt2: 168,
    totalWidthFt: 12,
    totalDepthFt: 14,
    layoutIssues: [],
    generatedAt: new Date().toISOString(),
  };

  it('generates complete CAD package', () => {
    const result = CompleteCADOrchestrator.generateComplete(mockFloorplan);

    expect(result.dxf_r12).toBeTruthy();
    expect(result.dxf_r2000_3d).toBeTruthy();
    expect(result.geometry_model).toBeDefined();
    expect(result.walls_3d.length).toBeGreaterThan(0);
    expect(result.mep_report).toBeDefined();
    expect(result.pdf_annotations).toBeDefined();
    expect(result.ifc_json).toBeDefined();
  });

  it('includes all file sizes in output', () => {
    const result = CompleteCADOrchestrator.generateComplete(mockFloorplan);

    expect(result.file_sizes.dxf_r12_bytes).toBeGreaterThan(0);
    expect(result.file_sizes.dxf_r2000_bytes).toBeGreaterThan(0);
    expect(result.file_sizes.mep_report_bytes).toBeGreaterThan(0);
    expect(result.file_sizes.ifc_bytes).toBeGreaterThan(0);
  });

  it('measures generation time', () => {
    const result = CompleteCADOrchestrator.generateComplete(mockFloorplan);

    expect(result.generation_time_ms).toBeGreaterThan(0);
    expect(result.generation_time_ms).toBeLessThan(10000); // Should be fast
  });

  it('exports with custom title block', () => {
    const result = CompleteCADOrchestrator.exportWithTitleBlock(
      mockFloorplan,
      'Test Project',
      '123 Main St',
      'Test Client',
    );

    expect(result.dxf_r2000_3d).toContain('Test Project');
    expect(result.dxf_r2000_3d).toContain('123 Main St');
  });

  it('includes MEP and code compliance data', () => {
    const result = CompleteCADOrchestrator.generateComplete(mockFloorplan);

    expect(result.mep_report.electrical_fixtures.length).toBeGreaterThan(0);
    expect(result.mep_report.hvac_ducts.length).toBeGreaterThan(0);
    expect(result.code_compliance_score).toBeGreaterThanOrEqual(0);
  });

  it('generates warnings for issues', () => {
    const result = CompleteCADOrchestrator.generateComplete(mockFloorplan);

    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
