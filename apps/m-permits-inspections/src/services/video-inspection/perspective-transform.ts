/**
 * Perspective Transform Utilities
 * For dimension measurement with perspective correction
 */

export interface Point {
  x: number;
  y: number;
}

export interface PerspectiveTransform {
  matrix: number[][];
  inverseMatrix: number[][];
}

/**
 * Calculate perspective transform matrix from 4 point correspondences
 * Uses the Direct Linear Transform (DLT) algorithm
 */
export function calculatePerspectiveTransform(
  sourcePoints: Point[],
  destinationPoints: Point[]
): PerspectiveTransform {
  if (sourcePoints.length !== 4 || destinationPoints.length !== 4) {
    throw new Error('Perspective transform requires exactly 4 points');
  }

  // Build coefficient matrix A for Ax = 0
  const A: number[][] = [];
  
  for (let i = 0; i < 4; i++) {
    const {x: x1, y: y1} = sourcePoints[i];
    const {x: x2, y: y2} = destinationPoints[i];
    
    // Two equations per point
    A.push([
      x1, y1, 1, 0, 0, 0,
      -x2 * x1, -x2 * y1, -x2
    ]);
    A.push([
      0, 0, 0, x1, y1, 1,
      -y2 * x1, -y2 * y1, -y2
    ]);
  }

  // Solve using SVD (Singular Value Decomposition)
  // For simplicity, we'll use a simplified approach
  // In production, use a proper linear algebra library
  
  const h = solveHomogeneousSystem(A);
  
  // Reshape into 3x3 matrix
  const matrix = [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], h[8]]
  ];

  // Calculate inverse matrix
  const inverseMatrix = invertMatrix3x3(matrix);

  return {matrix, inverseMatrix};
}

/**
 * Apply perspective transform to a point
 */
export function applyPerspectiveTransform(
  point: Point,
  transform: PerspectiveTransform
): Point {
  const {x, y} = point;
  const [a, b, c] = transform.matrix[0];
  const [d, e, f] = transform.matrix[1];
  const [g, h, i] = transform.matrix[2];

  const w = g * x + h * y + i;
  
  return {
    x: (a * x + b * y + c) / w,
    y: (d * x + e * y + f) / w,
  };
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
  );
}

/**
 * Solve homogeneous system Ax = 0 using SVD
 * Simplified implementation - in production use a proper linear algebra library
 */
function solveHomogeneousSystem(A: number[][]): number[] {
  // For a proper implementation, use SVD
  // This is a simplified version using least squares
  
  // Normalize the system
  const n = A.length;
  const m = A[0].length;
  
  // Use QR decomposition or SVD
  // For now, use a simplified approach
  // In production, use a library like ml-matrix or numeric.js
  
  // Simplified: return unit vector in null space
  // This is a placeholder - replace with proper SVD
  const h = new Array(m).fill(0);
  h[m - 1] = 1; // Last element is 1 (homogeneous coordinate)
  
  // Normalize
  const norm = Math.sqrt(h.reduce((sum, val) => sum + val * val, 0));
  return h.map(val => val / norm);
}

/**
 * Invert 3x3 matrix
 */
function invertMatrix3x3(matrix: number[][]): number[][] {
  const [a, b, c] = matrix[0];
  const [d, e, f] = matrix[1];
  const [g, h, i] = matrix[2];

  // Calculate determinant
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

  if (Math.abs(det) < 1e-10) {
    throw new Error('Matrix is singular and cannot be inverted');
  }

  // Calculate adjugate matrix
  const adj = [
    [e * i - f * h, c * h - b * i, b * f - c * e],
    [f * g - d * i, a * i - c * g, c * d - a * f],
    [d * h - e * g, b * g - a * h, a * e - b * d]
  ];

  // Multiply by 1/det
  return adj.map(row => row.map(val => val / det));
}

/**
 * Calculate scale factor from reference object
 */
export function calculateScaleFactor(
  referencePixelLength: number,
  referenceRealLength: number
): number {
  if (referencePixelLength === 0) {
    throw new Error('Reference pixel length cannot be zero');
  }
  return referenceRealLength / referencePixelLength;
}
