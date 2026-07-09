/**
 * Phase 2: 3D geometry kernel
 * Extrusion, z-depth, roof geometry
 */

import type { Point } from './types';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Box3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface Wall3D {
  id: string;
  basePoints: Point3D[];
  height: number;
  thickness: number;
}

export interface Slab3D {
  id: string;
  points: Point3D[];
  thickness: number; // Typically 4-8 inches
}

export interface Roof3D {
  id: string;
  points: Point3D[]; // Ridge/peak points
  pitch: number; // Degrees (typically 4-12/12 = 18-45°)
  overhang: number; // Feet (typically 1-2)
}

export class Geometry3D {
  /**
   * Extrude 2D wall to 3D with height and base elevation.
   */
  static extrudeWall(
    baseSegments: any[],
    height: number,
    baseElevation: number = 0,
  ): Wall3D[] {
    return baseSegments.map((seg, i) => ({
      id: `wall3d_${i}`,
      basePoints: [
        { x: seg.start.x, y: seg.start.y, z: baseElevation },
        { x: seg.end.x, y: seg.end.y, z: baseElevation },
        { x: seg.end.x, y: seg.end.y, z: baseElevation + height },
        { x: seg.start.x, y: seg.start.y, z: baseElevation + height },
      ],
      height,
      thickness: seg.thickness || 0.33,
    }));
  }

  /**
   * Create slab at elevation z.
   */
  static createSlab(polygon: Point[], elevation: number = 0, thickness: number = 0.33): Slab3D {
    return {
      id: `slab_${Date.now()}`,
      points: polygon.map(p => ({ x: p.x, y: p.y, z: elevation })),
      thickness,
    };
  }

  /**
   * Generate pitched roof from 2D footprint.
   * Simplified: ridge runs along building length, 6/12 pitch.
   */
  static createPitchedRoof(
    polygon: Point[],
    floorElevation: number,
    wallHeight: number,
    pitch: number = 26.57, // 6/12 pitch in degrees
  ): Roof3D {
    // Find centroid
    const cx = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
    const cy = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;

    const ridegeElevation = floorElevation + wallHeight + 2; // 2 ft rise
    return {
      id: `roof_${Date.now()}`,
      points: [
        { x: cx - 5, y: cy, z: ridegeElevation },
        { x: cx + 5, y: cy, z: ridegeElevation },
      ],
      pitch,
      overhang: 1.5,
    };
  }

  /**
   * Calculate 3D bounds.
   */
  static calculateBounds3D(
    walls: Wall3D[],
    slabs: Slab3D[] = [],
    roofs: Roof3D[] = [],
  ): Box3D {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const wall of walls) {
      for (const pt of wall.basePoints) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
        minZ = Math.min(minZ, pt.z);
        maxZ = Math.max(maxZ, pt.z);
      }
    }

    for (const slab of slabs) {
      for (const pt of slab.points) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
        minZ = Math.min(minZ, pt.z);
        maxZ = Math.max(maxZ, pt.z);
      }
    }

    for (const roof of roofs) {
      for (const pt of roof.points) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
        minZ = Math.min(minZ, pt.z);
        maxZ = Math.max(maxZ, pt.z);
      }
    }

    return { minX, minY, minZ, maxX, maxY, maxZ };
  }

  /**
   * Generate plan view elevation lines (simplified).
   */
  static generateElevationView(walls: Wall3D[], elevation: number): any[] {
    return walls
      .map(w => {
        const pts = w.basePoints.filter(p => Math.abs(p.z - elevation) < 0.1);
        if (pts.length >= 2) {
          return {
            start: { x: pts[0].x, y: pts[0].y },
            end: { x: pts[1].x, y: pts[1].y },
          };
        }
        return null;
      })
      .filter(Boolean);
  }
}
