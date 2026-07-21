/**
 * Rule-based constraint solver for AutoCAD engine.
 * Validates dimensional, perpendicularity, and code compliance rules.
 * Phase 1: Basic dimensional constraints (perpendicular, parallel, distance).
 */

import type { GeometryModel, Wall, Constraint, ConstraintSolverResult } from './types';
import { GeometryKernel } from './geometry-kernel';

export class ConstraintSolver {
  private kernel: GeometryKernel;

  constructor(kernel: GeometryKernel) {
    this.kernel = kernel;
  }

  /**
   * Solve all constraints in the geometry model.
   * Returns satisfaction status and detailed failure report.
   */
  solve(model: GeometryModel): ConstraintSolverResult {
    const startTime = performance.now();
    const failures: Constraint[] = [];
    let metCount = 0;

    for (const constraint of model.constraints) {
      const satisfied = this.checkConstraint(model, constraint);
      constraint.satisfied = satisfied;

      if (satisfied) {
        metCount++;
      } else {
        failures.push(constraint);
      }
    }

    const executionTime = performance.now() - startTime;

    return {
      satisfied: failures.length === 0,
      constraints_met: metCount,
      constraints_failed: failures.length,
      failures,
      warnings: this.generateWarnings(model, failures),
      execution_time_ms: executionTime,
    };
  }

  /**
   * Check a single constraint.
   */
  private checkConstraint(model: GeometryModel, constraint: Constraint): boolean {
    const tolerance = constraint.tolerance ?? 0.01; // Feet (0.12 inches default)

    switch (constraint.type) {
      case 'perpendicular':
        return this.checkPerpendicular(model, constraint, tolerance);
      case 'parallel':
        return this.checkParallel(model, constraint, tolerance);
      case 'coincident':
        return this.checkCoincident(model, constraint, tolerance);
      case 'distance':
        return this.checkDistance(model, constraint, tolerance);
      case 'setback':
        return this.checkSetback(model, constraint, tolerance);
      default:
        return true;
    }
  }

  /**
   * Check if two walls are perpendicular (90 degrees).
   */
  private checkPerpendicular(
    model: GeometryModel,
    constraint: Constraint,
    tolerance: number,
  ): boolean {
    if (constraint.targets.length < 2) return false;

    const wall1 = model.walls.find(w => w.id === constraint.targets[0]);
    const wall2 = model.walls.find(w => w.id === constraint.targets[1]);

    if (!wall1 || !wall2) return false;

    const seg1 = wall1.segments[0];
    const seg2 = wall2.segments[0];
    if (!seg1 || !seg2) return false;

    const vec1 = this.kernel.vector(seg1.start, seg1.end);
    const vec2 = this.kernel.vector(seg2.start, seg2.end);

    const dot = this.kernel.dot(vec1, vec2);
    const mag1 = this.kernel.magnitude(vec1);
    const mag2 = this.kernel.magnitude(vec2);

    const angle = Math.abs(dot / (mag1 * mag2));
    return angle < tolerance / 100; // Tolerance in terms of angle
  }

  /**
   * Check if two walls are parallel (0 or 180 degrees).
   */
  private checkParallel(
    model: GeometryModel,
    constraint: Constraint,
    tolerance: number,
  ): boolean {
    if (constraint.targets.length < 2) return false;

    const wall1 = model.walls.find(w => w.id === constraint.targets[0]);
    const wall2 = model.walls.find(w => w.id === constraint.targets[1]);

    if (!wall1 || !wall2) return false;

    const seg1 = wall1.segments[0];
    const seg2 = wall2.segments[0];
    if (!seg1 || !seg2) return false;

    const vec1 = this.kernel.vector(seg1.start, seg1.end);
    const vec2 = this.kernel.vector(seg2.start, seg2.end);

    const cross = Math.abs(this.kernel.cross(vec1, vec2));
    const mag1 = this.kernel.magnitude(vec1);
    const mag2 = this.kernel.magnitude(vec2);

    return cross < tolerance;
  }

  /**
   * Check if two points (wall endpoints) are coincident.
   */
  private checkCoincident(
    model: GeometryModel,
    constraint: Constraint,
    tolerance: number,
  ): boolean {
    if (constraint.targets.length < 2) return false;

    // Find endpoints of walls
    const wall1 = model.walls.find(w => w.id === constraint.targets[0]);
    const wall2 = model.walls.find(w => w.id === constraint.targets[1]);

    if (!wall1 || !wall2) return false;

    const p1 = wall1.segments[wall1.segments.length - 1]?.end;
    const p2 = wall2.segments[0]?.start;

    if (!p1 || !p2) return false;

    return this.kernel.distance(p1, p2) < tolerance;
  }

  /**
   * Check if distance between two walls meets specification.
   */
  private checkDistance(
    model: GeometryModel,
    constraint: Constraint,
    tolerance: number,
  ): boolean {
    if (constraint.targets.length < 2 || constraint.value === undefined)
      return false;

    const wall1 = model.walls.find(w => w.id === constraint.targets[0]);
    const wall2 = model.walls.find(w => w.id === constraint.targets[1]);

    if (!wall1 || !wall2) return false;

    const seg1 = wall1.segments[0];
    const seg2 = wall2.segments[0];
    if (!seg1 || !seg2) return false;

    // Measure closest distance between line segments
    const d = this.segmentDistance(seg1.start, seg1.end, seg2.start, seg2.end);

    return Math.abs(d - constraint.value) < tolerance;
  }

  /**
   * Check setback distance from property line (simplified: from bounds).
   */
  private checkSetback(
    model: GeometryModel,
    constraint: Constraint,
    tolerance: number,
  ): boolean {
    if (constraint.value === undefined) return false;

    const wall = model.walls.find(w => w.id === constraint.targets[0]);
    if (!wall) return false;

    const minDist = Math.min(
      Math.abs(wall.segments[0]?.start.x ?? 0 - model.bounds.minX),
      Math.abs(wall.segments[0]?.start.y ?? 0 - model.bounds.minY),
    );

    return minDist >= constraint.value - tolerance;
  }

  /**
   * Calculate closest distance between two line segments.
   */
  private segmentDistance(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number },
  ): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      return Math.sqrt(
        Math.min(
          (p3.x - p1.x) ** 2 + (p3.y - p1.y) ** 2,
          (p4.x - p1.x) ** 2 + (p4.y - p1.y) ** 2,
        ),
      );
    }

    let minDist = Infinity;

    // Test start and end of second segment
    for (const p of [p3, p4]) {
      const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dist * dist)));
      const closest = { x: p1.x + t * dx, y: p1.y + t * dy };
      const d = Math.sqrt((p.x - closest.x) ** 2 + (p.y - closest.y) ** 2);
      minDist = Math.min(minDist, d);
    }

    return minDist;
  }

  /**
   * Generate warnings for non-critical issues.
   */
  private generateWarnings(
    model: GeometryModel,
    failures: Constraint[],
  ): string[] {
    const warnings: string[] = [];

    // Check for small rooms (< 50 sq ft)
    for (const room of model.rooms) {
      if (room.area_sqft < 50) {
        warnings.push(`Room ${room.name} is very small (${room.area_sqft} sq ft)`);
      }
    }

    // Check for sliver walls (< 1 foot thick)
    for (const wall of model.walls) {
      if (wall.thickness < 1) {
        warnings.push(`Wall ${wall.id} is unusually thin (${wall.thickness} ft)`);
      }
    }

    return warnings;
  }
}
