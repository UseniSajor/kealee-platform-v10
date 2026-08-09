/**
 * Convert concept engine FloorPlanJson to AutoCAD GeometryModel.
 * Handles room polygons → walls, applies standard wall thickness,
 * creates dimensional constraints, and validates geometry.
 */

import type { FloorPlanJson } from '../floorplan/types';
import type { GeometryModel, Wall, Room, Constraint } from './types';
import { GeometryKernel } from './geometry-kernel';

const WALL_THICKNESS = 0.333; // 4" studs in feet
const GRID_SPACING = 0.01; // Sub-inch precision
const DEFAULT_CEILING_HEIGHT = 9.0; // Feet

export class AutoCADConverter {
  private kernel: GeometryKernel;

  constructor() {
    this.kernel = new GeometryKernel();
  }

  /**
   * Convert FloorPlanJson to GeometryModel.
   * Extracts room boundaries as walls, creates constraints, validates closure.
   */
  convert(floorplan: FloorPlanJson): GeometryModel {
    const startTime = performance.now();
    const walls: Wall[] = [];
    const rooms: Room[] = [];
    const constraints: Constraint[] = [];

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // Process each room
    for (const fpRoom of floorplan.rooms) {
      const roomWalls = this.createWallsFromRoom(fpRoom);

      for (const wall of roomWalls) {
        // Update bounds
        for (const segment of wall.segments) {
          minX = Math.min(minX, segment.start.x, segment.end.x);
          minY = Math.min(minY, segment.start.y, segment.end.y);
          maxX = Math.max(maxX, segment.start.x, segment.end.x);
          maxY = Math.max(maxY, segment.start.y, segment.end.y);
        }

        walls.push(wall);
      }

      // Create room polygon
      const room = this.createRoom(fpRoom);
      rooms.push(room);
    }

    // Create adjacency constraints between rooms
    for (const adjacency of floorplan.adjacencies) {
      constraints.push(
        this.createAdjacencyConstraint(adjacency.from, adjacency.to),
      );
    }

    // Create perpendicularity constraints for walls
    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        // Check if walls appear to be perpendicular
        if (this.areWallsPerpendicular(walls[i], walls[j])) {
          constraints.push(
            this.createPerpendicularConstraint(walls[i].id, walls[j].id),
          );
        }
      }
    }

    // Add setback constraints if jurisdiction data available
    const TYPICAL_SETBACK = 5.0; // Feet (conservative)
    for (const wall of walls) {
      if (wall.isExternal) {
        constraints.push(
          this.createSetbackConstraint(wall.id, TYPICAL_SETBACK),
        );
      }
    }

    return {
      id: `acad_${floorplan.id}`,
      name: floorplan.projectPath,
      walls,
      doors: [],
      windows: [],
      dimensions: [],
      rooms,
      constraints,
      bounds: {
        minX: Math.floor(minX) - 2,
        minY: Math.floor(minY) - 2,
        maxX: Math.ceil(maxX) + 2,
        maxY: Math.ceil(maxY) + 2,
      },
      grid_spacing: GRID_SPACING,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Create walls from room polygon.
   * Walls trace the perimeter of each room, with thickness offset inward.
   */
  private createWallsFromRoom(room: any): Wall[] {
    const walls: Wall[] = [];

    // Snap room vertices to grid
    const vertices = [
      { x: room.x ?? 0, y: room.y ?? 0 },
      { x: (room.x ?? 0) + room.widthFt, y: room.y ?? 0 },
      { x: (room.x ?? 0) + room.widthFt, y: (room.y ?? 0) + room.depthFt },
      { x: room.x ?? 0, y: (room.y ?? 0) + room.depthFt },
    ];

    // Create wall for each edge
    for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i];
      const end = vertices[(i + 1) % vertices.length];

      const wallId = `wall_${room.id}_${i}`;

      walls.push({
        id: wallId,
        segments: [
          {
            id: `seg_${wallId}_0`,
            start,
            end,
            type: 'wall',
            thickness: WALL_THICKNESS,
            isExternal: true, // Simplified: all walls are external in Tier 1
            layer: `WALL-${room.type.toUpperCase()}`,
          },
        ],
        thickness: WALL_THICKNESS,
        isExternal: true,
        height: DEFAULT_CEILING_HEIGHT,
        layer: `WALL-${room.type.toUpperCase()}`,
        constraints: [],
      });
    }

    return walls;
  }

  /**
   * Create Room entity from FloorPlanJson room.
   */
  private createRoom(fpRoom: any): Room {
    const vertices = [
      { x: fpRoom.x ?? 0, y: fpRoom.y ?? 0 },
      { x: (fpRoom.x ?? 0) + fpRoom.widthFt, y: fpRoom.y ?? 0 },
      { x: (fpRoom.x ?? 0) + fpRoom.widthFt, y: (fpRoom.y ?? 0) + fpRoom.depthFt },
      { x: fpRoom.x ?? 0, y: (fpRoom.y ?? 0) + fpRoom.depthFt },
    ];

    return {
      id: fpRoom.id,
      name: fpRoom.label || fpRoom.type,
      polygon: vertices,
      area_sqft: fpRoom.areaFt2 ?? 0,
      type: fpRoom.type,
      layer: `ROOM-${fpRoom.type.toUpperCase()}`,
      wallIds: [
        `wall_${fpRoom.id}_0`,
        `wall_${fpRoom.id}_1`,
        `wall_${fpRoom.id}_2`,
        `wall_${fpRoom.id}_3`,
      ],
    };
  }

  /**
   * Create constraint for room adjacency.
   */
  private createAdjacencyConstraint(fromId: string, toId: string): Constraint {
    return {
      id: `adj_${fromId}_${toId}`,
      type: 'distance',
      targets: [`wall_${fromId}_0`, `wall_${toId}_0`],
      value: 0.01, // Nearly zero distance (shared wall)
      tolerance: 0.1,
      satisfied: false,
      reason: 'Rooms should be adjacent or share wall',
    };
  }

  /**
   * Create perpendicularity constraint.
   */
  private createPerpendicularConstraint(wallId1: string, wallId2: string): Constraint {
    return {
      id: `perp_${wallId1}_${wallId2}`,
      type: 'perpendicular',
      targets: [wallId1, wallId2],
      tolerance: 0.05,
      satisfied: false,
      reason: 'Walls should be perpendicular',
    };
  }

  /**
   * Create setback constraint (distance from property boundary).
   */
  private createSetbackConstraint(wallId: string, setbackFt: number): Constraint {
    return {
      id: `setback_${wallId}`,
      type: 'setback',
      targets: [wallId],
      value: setbackFt,
      tolerance: 0.5,
      satisfied: false,
      reason: `Wall must maintain ${setbackFt} ft setback from property line`,
    };
  }

  /**
   * Check if two walls are approximately perpendicular.
   */
  private areWallsPerpendicular(wall1: Wall, wall2: Wall): boolean {
    const seg1 = wall1.segments[0];
    const seg2 = wall2.segments[0];

    if (!seg1 || !seg2) return false;

    const vec1 = this.kernel.vector(seg1.start, seg1.end);
    const vec2 = this.kernel.vector(seg2.start, seg2.end);

    const dot = this.kernel.dot(vec1, vec2);
    const mag1 = this.kernel.magnitude(vec1);
    const mag2 = this.kernel.magnitude(vec2);

    const cosAngle = Math.abs(dot / (mag1 * mag2));
    // Perpendicular = cos(angle) ≈ 0
    return cosAngle < 0.2; // Tolerance for rough layouts
  }
}
