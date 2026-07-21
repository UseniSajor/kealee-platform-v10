/**
 * Adjacency scoring — evaluates how well a layout satisfies adjacency requirements.
 */

import type { RoomGraph, FloorPlanLayout } from './types';

export interface AdjacencyScore {
  totalScore: number;       // 0–100
  satisfiedEdges: number;
  totalEdges: number;
  violations: Array<{
    fromRoom: string;
    toRoom: string;
    type: string;
    distanceFt: number;
    maxAllowedFt: number;
  }>;
}

// Max allowed center-to-center distance in feet per adjacency type
const MAX_DISTANCE: Record<string, number> = {
  direct:       20,
  nearby:       35,
  through_hall: 50,
};

export function scoreAdjacency(
  graph: RoomGraph,
  layout: FloorPlanLayout,
): AdjacencyScore {
  const roomMap = new Map(layout.rooms.map(r => [r.id, r]));
  let satisfied = 0;
  const violations: AdjacencyScore['violations'] = [];

  for (const edge of graph.edges) {
    const from = roomMap.get(edge.fromId);
    const to   = roomMap.get(edge.toId);
    if (!from || !to || from.x === undefined || to.x === undefined) continue;

    const fromCx = from.x + from.dimensions.widthFt / 2;
    const fromCy = (from.y ?? 0) + from.dimensions.depthFt / 2;
    const toCx   = to.x   + to.dimensions.widthFt  / 2;
    const toCy   = (to.y   ?? 0) + to.dimensions.depthFt  / 2;

    const dist = Math.sqrt(Math.pow(toCx - fromCx, 2) + Math.pow(toCy - fromCy, 2));
    const max  = MAX_DISTANCE[edge.adjacencyType] ?? 30;

    if (dist <= max) {
      satisfied++;
    } else if (edge.weight >= 0.8) {
      violations.push({
        fromRoom:    from.label,
        toRoom:      to.label,
        type:        edge.adjacencyType,
        distanceFt:  Math.round(dist),
        maxAllowedFt: max,
      });
    }
  }

  const totalScore = graph.edges.length > 0
    ? Math.round((satisfied / graph.edges.length) * 100)
    : 100;

  return { totalScore, satisfiedEdges: satisfied, totalEdges: graph.edges.length, violations };
}

export function generateAdjacencyNotes(score: AdjacencyScore): string[] {
  if (score.violations.length === 0) {
    return ['All key room adjacencies are satisfied in this concept layout.'];
  }
  return score.violations.map(v =>
    `Layout note: ${v.fromRoom} and ${v.toRoom} should be closer — consider relocating ` +
    `(${v.distanceFt}ft apart, ideal under ${v.maxAllowedFt}ft).`,
  );
}
