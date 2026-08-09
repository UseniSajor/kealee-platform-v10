/**
 * Core geometry operations for AutoCAD engine.
 * Handles vertex snapping, wall construction, intersection detection, area calculation.
 */

import type { Point, Vector, LineSegment, Wall, Room } from './types';

const SNAP_TOLERANCE = 0.001; // Feet (0.012 inches)

export class GeometryKernel {
  private vertices: Map<string, Point> = new Map();
  private nextVertexId = 0;

  /**
   * Add or snap a vertex to the nearest existing vertex within tolerance.
   */
  addVertex(point: Point): string {
    const existing = this.findNearbyVertex(point);
    if (existing) return existing;

    const id = `v${this.nextVertexId++}`;
    this.vertices.set(id, { x: point.x, y: point.y });
    return id;
  }

  /**
   * Find vertex within snap tolerance.
   */
  private findNearbyVertex(point: Point): string | null {
    for (const [id, v] of this.vertices.entries()) {
      if (this.distance(v, point) < SNAP_TOLERANCE) {
        return id;
      }
    }
    return null;
  }

  /**
   * Calculate Euclidean distance between two points.
   */
  distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  /**
   * Calculate angle from p1 to p2 in radians (0 = East, π/2 = North).
   */
  angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
   * Get vector from p1 to p2.
   */
  vector(p1: Point, p2: Point): Vector {
    return { dx: p2.x - p1.x, dy: p2.y - p1.y };
  }

  /**
   * Vector magnitude.
   */
  magnitude(v: Vector): number {
    return Math.sqrt(v.dx * v.dx + v.dy * v.dy);
  }

  /**
   * Normalize vector to unit length.
   */
  normalize(v: Vector): Vector {
    const mag = this.magnitude(v);
    return mag === 0 ? { dx: 0, dy: 0 } : { dx: v.dx / mag, dy: v.dy / mag };
  }

  /**
   * Dot product of two vectors.
   */
  dot(v1: Vector, v2: Vector): number {
    return v1.dx * v2.dx + v1.dy * v2.dy;
  }

  /**
   * Cross product (returns scalar for 2D).
   */
  cross(v1: Vector, v2: Vector): number {
    return v1.dx * v2.dy - v1.dy * v2.dx;
  }

  /**
   * Check if two line segments intersect.
   */
  segmentsIntersect(
    s1Start: Point,
    s1End: Point,
    s2Start: Point,
    s2End: Point,
  ): boolean {
    const d1 = this.vector(s1Start, s1End);
    const d2 = this.vector(s2Start, s2End);
    const d3 = this.vector(s1Start, s2Start);

    const cross1 = this.cross(d1, d2);
    if (Math.abs(cross1) < 1e-10) return false; // Parallel

    const t1 = this.cross(d3, d2) / cross1;
    const t2 = this.cross(d3, d1) / cross1;

    return t1 > 0 && t1 < 1 && t2 > 0 && t2 < 1;
  }

  /**
   * Find intersection point of two lines (not segments).
   */
  lineIntersection(
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point,
  ): Point | null {
    const d1 = this.vector(p1, p2);
    const d2 = this.vector(p3, p4);
    const d3 = this.vector(p1, p3);

    const cross = this.cross(d1, d2);
    if (Math.abs(cross) < 1e-10) return null; // Parallel

    const t = this.cross(d3, d2) / cross;
    return {
      x: p1.x + d1.dx * t,
      y: p1.y + d1.dy * t,
    };
  }

  /**
   * Calculate area of a polygon (Shoelace formula).
   * Points should be in CCW order.
   */
  polygonArea(points: Point[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Check if point is inside a polygon (ray casting).
   */
  pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Offset a line segment perpendicular to its direction.
   * Positive offset = left side (CCW).
   */
  offsetSegment(start: Point, end: Point, distance: number): [Point, Point] {
    const vec = this.vector(start, end);
    const normal = this.normalize({ dx: -vec.dy, dy: vec.dx });

    return [
      { x: start.x + normal.dx * distance, y: start.y + normal.dy * distance },
      { x: end.x + normal.dx * distance, y: end.y + normal.dy * distance },
    ];
  }

  /**
   * Perpendicularly offset a polygon (for wall thickness).
   */
  offsetPolygon(polygon: Point[], distance: number): Point[] {
    const result: Point[] = [];

    for (let i = 0; i < polygon.length; i++) {
      const p0 = polygon[(i - 1 + polygon.length) % polygon.length];
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];

      const [, e1] = this.offsetSegment(p0, p1, distance);
      const [e2, ] = this.offsetSegment(p1, p2, distance);

      const intersection = this.lineIntersection(
        p0,
        e1,
        p1,
        e2,
      );

      result.push(intersection || e1);
    }

    return result;
  }

  /**
   * Get vertex by ID.
   */
  getVertex(id: string): Point | undefined {
    return this.vertices.get(id);
  }

  /**
   * Get all vertices.
   */
  getAllVertices(): Map<string, Point> {
    return new Map(this.vertices);
  }
}
