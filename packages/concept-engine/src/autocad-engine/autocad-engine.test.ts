/**
 * Phase 1 AutoCAD engine tests.
 * Validates geometry kernel, constraint solver, and DXF export.
 */

import { describe, it, expect } from '@jest/globals';
import { GeometryKernel } from './geometry-kernel';
import { ConstraintSolver } from './constraint-solver';
import { DXFWriter } from './dxf-writer';
import { AutoCADConverter } from './autocad-converter';
import { AutoCADOrchestrator } from './autocad-orchestrator';
import type { FloorPlanJson, FloorPlanRoomJson } from '../floorplan/types';
import type { GeometryModel, Wall, Room } from './types';

describe('GeometryKernel', () => {
  let kernel: GeometryKernel;

  beforeEach(() => {
    kernel = new GeometryKernel();
  });

  it('calculates distance between points', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(kernel.distance(p1, p2)).toBeCloseTo(5);
  });

  it('calculates angle between points', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 1, y: 0 };
    expect(kernel.angle(p1, p2)).toBeCloseTo(0); // East
  });

  it('creates vector from two points', () => {
    const vec = kernel.vector({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(vec.dx).toBe(3);
    expect(vec.dy).toBe(4);
  });

  it('normalizes vectors', () => {
    const vec = { dx: 3, dy: 4 };
    const normalized = kernel.normalize(vec);
    expect(kernel.magnitude(normalized)).toBeCloseTo(1);
  });

  it('calculates dot product', () => {
    const v1 = { dx: 1, dy: 0 };
    const v2 = { dx: 1, dy: 0 };
    expect(kernel.dot(v1, v2)).toBe(1);
  });

  it('detects perpendicular vectors via cross product', () => {
    const v1 = { dx: 1, dy: 0 };
    const v2 = { dx: 0, dy: 1 };
    expect(kernel.cross(v1, v2)).toBeCloseTo(1);
  });

  it('calculates polygon area (Shoelace formula)', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(kernel.polygonArea(square)).toBe(100);
  });

  it('detects points inside polygon', () => {
    const polygon = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(kernel.pointInPolygon({ x: 5, y: 5 }, polygon)).toBe(true);
    expect(kernel.pointInPolygon({ x: 15, y: 15 }, polygon)).toBe(false);
  });

  it('detects line segment intersection', () => {
    const intersects = kernel.segmentsIntersect(
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    );
    expect(intersects).toBe(true);
  });

  it('offsets line segments', () => {
    const [p1, p2] = kernel.offsetSegment(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      1, // 1 foot offset
    );
    expect(p1.y).toBeCloseTo(1); // Offset perpendicular
    expect(p2.y).toBeCloseTo(1);
  });
});

describe('ConstraintSolver', () => {
  let solver: ConstraintSolver;
  let kernel: GeometryKernel;

  beforeEach(() => {
    kernel = new GeometryKernel();
    solver = new ConstraintSolver(kernel);
  });

  it('validates perpendicular constraints', () => {
    const model: GeometryModel = {
      id: 'test',
      name: 'test',
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
            },
          ],
          thickness: 0.33,
          isExternal: true,
          height: 9,
          layer: 'A-WALL',
          constraints: [],
        },
        {
          id: 'w2',
          segments: [
            {
              id: 's2',
              start: { x: 10, y: 0 },
              end: { x: 10, y: 10 },
              type: 'wall',
              isExternal: true,
              layer: 'A-WALL',
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
      rooms: [],
      constraints: [
        {
          id: 'perp1',
          type: 'perpendicular',
          targets: ['w1', 'w2'],
          satisfied: false,
        },
      ],
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      grid_spacing: 0.01,
      created_at: new Date().toISOString(),
    };

    const result = solver.solve(model);
    expect(result.satisfied).toBe(true);
    expect(result.constraints_met).toBeGreaterThan(0);
  });

  it('reports constraint failures', () => {
    const model: GeometryModel = {
      id: 'test',
      name: 'test',
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
      rooms: [],
      constraints: [
        {
          id: 'dist1',
          type: 'distance',
          targets: ['w1'],
          value: 100, // Impossible distance
          satisfied: false,
        },
      ],
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      grid_spacing: 0.01,
      created_at: new Date().toISOString(),
    };

    const result = solver.solve(model);
    expect(result.constraints_failed).toBeGreaterThan(0);
  });
});

describe('DXFWriter', () => {
  it('generates valid DXF header', () => {
    const model: GeometryModel = {
      id: 'test',
      name: 'test-layout',
      walls: [],
      doors: [],
      windows: [],
      dimensions: [],
      rooms: [],
      constraints: [],
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      grid_spacing: 0.01,
      created_at: new Date().toISOString(),
    };

    const dxf = DXFWriter.generateDXF(model);
    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('HEADER');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('EOF');
  });

  it('exports walls as line entities', () => {
    const model: GeometryModel = {
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
              layer: 'WALL',
            },
          ],
          thickness: 0.33,
          isExternal: true,
          height: 9,
          layer: 'WALL',
          constraints: [],
        },
      ],
      doors: [],
      windows: [],
      dimensions: [],
      rooms: [],
      constraints: [],
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      grid_spacing: 0.01,
      created_at: new Date().toISOString(),
    };

    const dxf = DXFWriter.generateDXF(model);
    expect(dxf).toContain('LINE');
  });

  it('respects DXF export options', () => {
    const model: GeometryModel = {
      id: 'test',
      name: 'test-layout',
      walls: [],
      doors: [
        {
          id: 'd1',
          location: { x: 5, y: 5 },
          direction: 0,
          width: 3,
          swing: 'right',
          type: 'entry',
          layer: 'DOOR',
        },
      ],
      windows: [],
      dimensions: [],
      rooms: [],
      constraints: [],
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      grid_spacing: 0.01,
      created_at: new Date().toISOString(),
    };

    const dxfWithDoors = DXFWriter.generateDXF(model, { include_doors: true });
    const dxfNoDoors = DXFWriter.generateDXF(model, { include_doors: false });

    expect(dxfWithDoors).toContain('CIRCLE'); // Door swing
    expect(dxfNoDoors).not.toContain('CIRCLE');
  });
});

describe('AutoCADConverter', () => {
  let converter: AutoCADConverter;

  beforeEach(() => {
    converter = new AutoCADConverter();
  });

  it('converts simple rectangular room to walls', () => {
    const floorplan: FloorPlanJson = {
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

    const model = converter.convert(floorplan);

    expect(model.rooms).toHaveLength(1);
    expect(model.walls.length).toBeGreaterThan(0);
    expect(model.bounds.maxX).toBeGreaterThan(0);
    expect(model.bounds.maxY).toBeGreaterThan(0);
  });

  it('creates perpendicularity constraints for rectangular rooms', () => {
    const floorplan: FloorPlanJson = {
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

    const model = converter.convert(floorplan);

    // Rectangular rooms should have perpendicular constraints
    const perpConstraints = model.constraints.filter(c => c.type === 'perpendicular');
    expect(perpConstraints.length).toBeGreaterThan(0);
  });
});

describe('AutoCADOrchestrator', () => {
  let orchestrator: AutoCADOrchestrator;

  beforeEach(() => {
    orchestrator = new AutoCADOrchestrator();
  });

  it('converts floorplan to valid DXF', () => {
    const floorplan: FloorPlanJson = {
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

    const result = orchestrator.convertToDXF(floorplan);

    expect(result.success).toBe(true);
    expect(result.dxf_content).toContain('SECTION');
    expect(result.file_size_bytes).toBeGreaterThan(0);
    expect(result.generation_time_ms).toBeGreaterThan(0);
  });

  it('includes geometry model in result', () => {
    const floorplan: FloorPlanJson = {
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

    const result = orchestrator.convertToDXF(floorplan);

    expect(result.geometry_model.id).toBeDefined();
    expect(result.geometry_model.walls.length).toBeGreaterThan(0);
  });

  it('provides constraint validation report', () => {
    const floorplan: FloorPlanJson = {
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

    const result = orchestrator.convertToDXF(floorplan);

    expect(result.constraint_report).toBeDefined();
    expect(result.constraint_report.constraints_met).toBeGreaterThanOrEqual(0);
    expect(result.constraint_report.constraints_failed).toBeGreaterThanOrEqual(0);
  });
});
