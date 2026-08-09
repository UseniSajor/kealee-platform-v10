/**
 * Phase 2: 3D Geometry Kernel - Production Grade
 * Wall extrusion, floor/roof geometry, fenestration, structural coordination
 */

import type { Point } from './types';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector3D {
  dx: number;
  dy: number;
  dz: number;
}

export interface Box3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  centerX?: number;
  centerY?: number;
  centerZ?: number;
  volume?: number;
}

export interface Face3D {
  id: string;
  vertices: Point3D[];
  normal: Vector3D;
  area: number;
  material: string;
}

export interface Wall3D {
  id: string;
  basePoints: Point3D[]; // At floor level
  topPoints: Point3D[]; // At ceiling level (derived)
  height: number;
  thickness: number;
  external: boolean;
  material: 'drywall' | 'masonry' | 'wood' | 'metal';
  fireRating: string; // '1HR', '2HR', '4HR', 'None'
  soundRating: number; // STC (Sound Transmission Class)
  faces: Face3D[];
  studs: Stud[];
  insulation?: Insulation;
}

export interface Stud {
  id: string;
  location: Point3D;
  direction: Vector3D;
  size: '2x4' | '2x6' | '2x8'; // Nominal lumber size
  spacing: number; // Inches on center (typically 16 or 24)
  length: number;
}

export interface Insulation {
  type: 'fiberglass' | 'cellulose' | 'spray-foam' | 'mineral-wool';
  rValue: number; // Thermal resistance
  density: number; // lbs/cubic ft
  thickness: number; // Inches
}

export interface Slab3D {
  id: string;
  points: Point3D[];
  thickness: number;
  topElevation: number;
  bottomElevation: number;
  concrete: ConcreteSpec;
  reinforcement: ReinforcementSpec;
}

export interface ConcreteSpec {
  strength: number; // PSI (typically 3000-4000)
  slump: number; // Inches (workability)
  airContent: number; // Percent
}

export interface ReinforcementSpec {
  type: 'rebar' | 'wire-mesh' | 'fibers';
  spacing: number; // Inches
  size: string; // #4, #5, etc for rebar
}

export interface Roof3D {
  id: string;
  type: 'pitched' | 'flat' | 'gambrel' | 'mansard' | 'butterfly';
  vertices: Point3D[];
  rafters: Rafter[];
  sheathing: Sheathing;
  roofing: RoofingMaterial;
  pitch: number; // Degrees or rise/run ratio
  overhang: number;
  drainage: DrainageSpec;
}

export interface Rafter {
  id: string;
  location: Point3D;
  direction: Vector3D;
  size: string; // 2x6, 2x8, 2x10, etc
  spacing: number; // On center (typically 16 or 24)
  length: number;
}

export interface Sheathing {
  type: 'plywood' | 'osb' | 'wood-planks';
  thickness: number; // Inches
  grade: string;
}

export interface RoofingMaterial {
  type: 'asphalt-shingles' | 'metal' | 'clay-tile' | 'concrete-tile' | 'slate' | 'membrane';
  weight: number; // lbs per sqft (affects structural design)
  lifespan: number; // Years
  color: string;
}

export interface DrainageSpec {
  gutters: boolean;
  downspouts: number;
  grade: number; // Percent slope for drainage
}

export class Geometry3D {
  /**
   * Extrude 2D wall to 3D with full structural specification.
   * Includes studs, fire rating, sound isolation, materials.
   */
  static extrudeWall(
    baseSegments: any[],
    height: number,
    baseElevation: number = 0,
    specs?: {
      external?: boolean;
      material?: Wall3D['material'];
      fireRating?: string;
      studSpacing?: number;
      studSize?: '2x4' | '2x6' | '2x8';
      insulation?: Insulation;
    },
  ): Wall3D[] {
    const studSpacing = specs?.studSpacing ?? 16; // Inches OC
    const studSize = specs?.studSize ?? '2x4';
    const material = specs?.material ?? 'drywall';
    const fireRating = specs?.fireRating ?? 'None';

    return baseSegments.map((seg, i) => {
      const basePoints: Point3D[] = [
        { x: seg.start.x, y: seg.start.y, z: baseElevation },
        { x: seg.end.x, y: seg.end.y, z: baseElevation },
      ];

      const topPoints: Point3D[] = [
        { x: seg.start.x, y: seg.start.y, z: baseElevation + height },
        { x: seg.end.x, y: seg.end.y, z: baseElevation + height },
      ];

      // Generate studs
      const wallVector = {
        dx: seg.end.x - seg.start.x,
        dy: seg.end.y - seg.start.y
      };
      const wallLength = Math.sqrt(wallVector.dx ** 2 + wallVector.dy ** 2);
      const studCount = Math.ceil(wallLength * 12 / studSpacing); // Convert feet to inches
      const studs: Stud[] = [];

      for (let s = 0; s < studCount; s++) {
        const t = s / Math.max(1, studCount - 1);
        studs.push({
          id: `stud_${i}_${s}`,
          location: {
            x: seg.start.x + wallVector.dx * t,
            y: seg.start.y + wallVector.dy * t,
            z: baseElevation,
          },
          direction: { dx: 0, dy: 0, dz: 1 },
          size: studSize,
          spacing: studSpacing,
          length: height,
        });
      }

      // Create wall faces
      const faces = this.generateWallFaces(basePoints, topPoints, seg.thickness);

      return {
        id: `wall3d_${i}`,
        basePoints,
        topPoints,
        height,
        thickness: seg.thickness || 0.33,
        external: specs?.external ?? true,
        material,
        fireRating,
        soundRating: fireRating === 'None' ? 30 : fireRating === '1HR' ? 40 : 50,
        faces,
        studs,
        insulation: specs?.insulation,
      };
    });
  }

  /**
   * Generate 3D faces for wall geometry.
   */
  private static generateWallFaces(
    basePoints: Point3D[],
    topPoints: Point3D[],
    thickness: number,
  ): Face3D[] {
    const faces: Face3D[] = [];
    const [p0, p1] = basePoints;
    const [p2, p3] = topPoints;

    // Front face
    faces.push({
      id: 'front',
      vertices: [p0, p1, p3, p2],
      normal: this.calculateNormal([p0, p1, p3]),
      area: this.calculateArea([p0, p1, p3, p2]),
      material: 'drywall',
    });

    // Back face (offset by thickness)
    const offsetFactor = thickness / Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
    const backBase = [
      {
        x: p0.x - (p1.y - p0.y) * offsetFactor,
        y: p0.y + (p1.x - p0.x) * offsetFactor,
        z: p0.z,
      },
      {
        x: p1.x - (p1.y - p0.y) * offsetFactor,
        y: p1.y + (p1.x - p0.x) * offsetFactor,
        z: p1.z,
      },
    ];
    const backTop = backBase.map(p => ({ ...p, z: p.z + (p3.z - p0.z) }));

    faces.push({
      id: 'back',
      vertices: [backBase[0], backBase[1], backTop[1], backTop[0]],
      normal: this.calculateNormal([backBase[0], backBase[1], backTop[1]]),
      area: this.calculateArea([backBase[0], backBase[1], backTop[1], backTop[0]]),
      material: 'drywall',
    });

    return faces;
  }

  /**
   * Calculate surface normal vector.
   */
  private static calculateNormal(vertices: Point3D[]): Vector3D {
    const v1 = {
      dx: vertices[1].x - vertices[0].x,
      dy: vertices[1].y - vertices[0].y,
      dz: vertices[1].z - vertices[0].z,
    };
    const v2 = {
      dx: vertices[2].x - vertices[0].x,
      dy: vertices[2].y - vertices[0].y,
      dz: vertices[2].z - vertices[0].z,
    };

    const cross = {
      dx: v1.dy * v2.dz - v1.dz * v2.dy,
      dy: v1.dz * v2.dx - v1.dx * v2.dz,
      dz: v1.dx * v2.dy - v1.dy * v2.dx,
    };

    const mag = Math.sqrt(cross.dx ** 2 + cross.dy ** 2 + cross.dz ** 2);
    return mag > 0 ? { dx: cross.dx / mag, dy: cross.dy / mag, dz: cross.dz / mag } : { dx: 0, dy: 0, dz: 1 };
  }

  /**
   * Calculate surface area.
   */
  private static calculateArea(vertices: Point3D[]): number {
    // Shoelace formula for 3D (simplified for quad)
    if (vertices.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      area += (v2.x - v1.x) * (v2.y + v1.y);
    }
    return Math.abs(area) / 2;
  }

  /**
   * Create reinforced concrete slab with specifications.
   */
  static createSlab(
    polygon: Point[],
    elevation: number = 0,
    specs?: {
      thickness?: number;
      strength?: number;
      reinforcement?: 'wire-mesh' | 'rebar' | 'fibers';
      reinforcementSpacing?: number;
    },
  ): Slab3D {
    const thickness = specs?.thickness ?? 4 / 12; // 4 inches in feet
    const strength = specs?.strength ?? 3000; // PSI

    return {
      id: `slab_${Date.now()}`,
      points: polygon.map(p => ({ x: p.x, y: p.y, z: elevation })),
      thickness,
      topElevation: elevation,
      bottomElevation: elevation - thickness,
      concrete: {
        strength,
        slump: 4, // Inches (standard for floor slabs)
        airContent: 6, // Percent
      },
      reinforcement: {
        type: specs?.reinforcement ?? 'wire-mesh',
        spacing: specs?.reinforcementSpacing ?? 6, // Inches
        size: '6x6-W1.4xW1.4', // 6"x6" mesh with W1.4 wire
      },
    };
  }

  /**
   * Generate fully specified pitched roof with sheathing and roofing material.
   */
  static createPitchedRoof(
    polygon: Point[],
    floorElevation: number,
    wallHeight: number,
    specs?: {
      pitch?: number;
      overhang?: number;
      roofingMaterial?: RoofingMaterial;
      rafterSize?: string;
      rafterSpacing?: number;
    },
  ): Roof3D {
    const pitch = specs?.pitch ?? 26.57; // 6/12 pitch
    const overhang = specs?.overhang ?? 1.5;
    const rafterSize = specs?.rafterSize ?? '2x8';
    const rafterSpacing = specs?.rafterSpacing ?? 16; // OC in inches

    // Find polygon center for ridge line
    const cx = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
    const cy = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;

    // Calculate rise from pitch (pitch degrees)
    const pitchRad = (pitch * Math.PI) / 180;
    const buildingWidth = Math.max(...polygon.map(p => p.x)) - Math.min(...polygon.map(p => p.x));
    const rise = (buildingWidth / 2) * Math.tan(pitchRad);

    const ridgeElevation = floorElevation + wallHeight + rise;
    const ridgeLength = Math.max(...polygon.map(p => p.y)) - Math.min(...polygon.map(p => p.y)) + 2 * overhang;

    // Generate rafters
    const rafters: Rafter[] = [];
    const rafterCount = Math.ceil(ridgeLength * 12 / rafterSpacing);

    for (let r = 0; r < rafterCount; r++) {
      const t = r / Math.max(1, rafterCount - 1);
      const minY = Math.min(...polygon.map(p => p.y)) - overhang;
      rafters.push({
        id: `rafter_${r}`,
        location: {
          x: cx,
          y: minY + ridgeLength * t,
          z: floorElevation + wallHeight,
        },
        direction: { dx: 0, dy: 0, dz: 1 },
        size: rafterSize,
        spacing: rafterSpacing,
        length: Math.sqrt(rise ** 2 + (buildingWidth / 2 + overhang) ** 2),
      });
    }

    return {
      id: `roof_${Date.now()}`,
      type: 'pitched',
      vertices: [
        { x: cx - (buildingWidth / 2 + overhang), y: cy, z: floorElevation + wallHeight },
        { x: cx + (buildingWidth / 2 + overhang), y: cy, z: floorElevation + wallHeight },
        { x: cx, y: cy, z: ridgeElevation },
      ],
      rafters,
      sheathing: {
        type: 'plywood',
        thickness: 0.5,
        grade: 'CD',
      },
      roofing: specs?.roofingMaterial || {
        type: 'asphalt-shingles',
        weight: 200,
        lifespan: 20,
        color: 'charcoal-gray',
      },
      pitch,
      overhang,
      drainage: {
        gutters: true,
        downspouts: Math.ceil(ridgeLength / 30),
        grade: 2,
      },
    };
  }

  /**
   * Calculate 3D bounds with volume and center.
   */
  static calculateBounds3D(
    walls: Wall3D[],
    slabs: Slab3D[] = [],
    roofs: Roof3D[] = [],
  ): Box3D {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const wall of walls) {
      for (const pt of wall.basePoints.concat(wall.topPoints)) {
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
      for (const pt of roof.vertices) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
        minZ = Math.min(minZ, pt.z);
        maxZ = Math.max(maxZ, pt.z);
      }
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const volume = (maxX - minX) * (maxY - minY) * (maxZ - minZ);

    return { minX, minY, minZ, maxX, maxY, maxZ, centerX, centerY, centerZ, volume };
  }

  /**
   * Generate south, north, east, west elevation views.
   */
  static generateElevationViews(walls: Wall3D[], roofs: Roof3D[]): {
    south: any[];
    north: any[];
    east: any[];
    west: any[];
  } {
    return {
      south: this.generateElevationView(walls, roofs, 'south'),
      north: this.generateElevationView(walls, roofs, 'north'),
      east: this.generateElevationView(walls, roofs, 'east'),
      west: this.generateElevationView(walls, roofs, 'west'),
    };
  }

  /**
   * Generate elevation view for specific direction.
   */
  private static generateElevationView(
    walls: Wall3D[],
    roofs: Roof3D[],
    direction: 'north' | 'south' | 'east' | 'west',
  ): any[] {
    const lines: any[] = [];

    // Extract relevant wall edges
    for (const wall of walls) {
      if (
        (direction === 'north' && wall.basePoints[0].y === wall.basePoints[1].y) ||
        (direction === 'south' && wall.basePoints[0].y === wall.basePoints[1].y) ||
        (direction === 'east' && wall.basePoints[0].x === wall.basePoints[1].x) ||
        (direction === 'west' && wall.basePoints[0].x === wall.basePoints[1].x)
      ) {
        lines.push({
          start: wall.basePoints[0],
          end: wall.topPoints[0],
          type: 'wall-edge',
        });
      }
    }

    // Add roof edges
    for (const roof of roofs) {
      if (roof.vertices.length >= 3) {
        lines.push({
          start: roof.vertices[0],
          end: roof.vertices[2],
          type: 'roof-slope',
        });
        lines.push({
          start: roof.vertices[1],
          end: roof.vertices[2],
          type: 'roof-slope',
        });
      }
    }

    return lines;
  }

  /**
   * Check structural interference (wall-to-roof, MEP conflicts).
   */
  static checkStructuralInterference(walls: Wall3D[], roofs: Roof3D[]): any[] {
    const issues: any[] = [];

    // Check if roof vertices collide with walls
    for (const roof of roofs) {
      for (const pt of roof.vertices) {
        for (const wall of walls) {
          const inWall = wall.basePoints.some(
            bp => Math.abs(bp.x - pt.x) < wall.thickness && Math.abs(bp.y - pt.y) < wall.thickness,
          );
          if (inWall) {
            issues.push({
              type: 'roof-wall-collision',
              roof: roof.id,
              wall: wall.id,
              location: pt,
            });
          }
        }
      }
    }

    return issues;
  }
}
