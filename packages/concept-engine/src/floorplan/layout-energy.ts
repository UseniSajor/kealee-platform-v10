/**
 * Layout energy function for the simulated annealing optimizer.
 *
 * Energy = weighted sum of penalties. Lower energy = better layout.
 * Each component is normalized to [0, 1] before weighting.
 */

import type { RoomNode, RoomEdge } from './types';
import { EXTERIOR_PREFERRED } from './layout-constraints';

// Max center-to-center distances per adjacency type (mirrors build-adjacency.ts)
const MAX_DISTANCE: Record<string, number> = {
  direct:       20,
  nearby:       35,
  through_hall: 50,
};

export interface EnergyWeights {
  /** Penalty for adjacency requirements not met (room pairs too far apart) */
  adjacency: number;
  /** Penalty for room overlaps (hard — should always be high) */
  overlap: number;
  /** Penalty for habitable rooms without exterior wall access */
  naturalLight: number;
  /** Penalty for inefficient circulation paths */
  circulation: number;
  /** Penalty for spread-out footprint (prefer compact) */
  compactness: number;
}

/** Variant A — Open Flow: prioritize adjacency and circulation */
export const WEIGHTS_OPEN_FLOW: EnergyWeights = {
  adjacency:   2.0,
  overlap:     3.0,
  naturalLight:1.0,
  circulation: 2.0,
  compactness: 0.5,
};

/** Variant B — Private & Defined: maximize privacy separation and perimeter light */
export const WEIGHTS_PRIVATE: EnergyWeights = {
  adjacency:   0.8,
  overlap:     3.0,
  naturalLight:2.0,
  circulation: 0.8,
  compactness: 1.5,
};

/** Variant C — Efficient: maximize space efficiency and minimize footprint */
export const WEIGHTS_EFFICIENT: EnergyWeights = {
  adjacency:   1.2,
  overlap:     3.0,
  naturalLight:1.0,
  circulation: 1.5,
  compactness: 2.0,
};

export interface LayoutState {
  rooms: RoomNode[];
  totalWidthFt: number;
  totalDepthFt: number;
}

export function computeEnergy(state: LayoutState, edges: RoomEdge[], weights: EnergyWeights): number {
  const adjacencyPenalty  = computeAdjacencyPenalty(state.rooms, edges);
  const overlapPenalty    = computeOverlapPenalty(state.rooms);
  const lightPenalty      = computeLightPenalty(state.rooms, state.totalWidthFt, state.totalDepthFt);
  const circulationPenalty = computeCirculationPenalty(state.rooms, edges);
  const compactnessPenalty = computeCompactnessPenalty(state.rooms, state.totalWidthFt, state.totalDepthFt);

  return (
    adjacencyPenalty   * weights.adjacency   +
    overlapPenalty     * weights.overlap     +
    lightPenalty       * weights.naturalLight +
    circulationPenalty * weights.circulation +
    compactnessPenalty * weights.compactness
  );
}

// ── Individual penalty functions ─────────────────────────────────────────────

function computeAdjacencyPenalty(rooms: RoomNode[], edges: RoomEdge[]): number {
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  let penalty = 0;

  for (const edge of edges) {
    const from = roomMap.get(edge.fromId);
    const to   = roomMap.get(edge.toId);
    if (!from || !to || from.x === undefined || to.x === undefined) continue;

    const dist = centerDistance(from, to);
    const maxDist = MAX_DISTANCE[edge.adjacencyType] ?? 30;
    const excess = Math.max(0, dist - maxDist);

    // Scale by edge weight — strong adjacencies cost more when violated
    penalty += (excess / maxDist) * edge.weight;
  }

  return edges.length > 0 ? penalty / edges.length : 0;
}

function computeOverlapPenalty(rooms: RoomNode[]): number {
  let totalOverlap = 0;
  const totalArea = rooms.reduce((s, r) => s + r.dimensions.areaFt2, 0);

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      if (a.x === undefined || b.x === undefined) continue;

      const overlapX = Math.max(0, Math.min(a.x + a.dimensions.widthFt, b.x + b.dimensions.widthFt) - Math.max(a.x, b.x));
      const overlapY = Math.max(0, Math.min((a.y ?? 0) + a.dimensions.depthFt, (b.y ?? 0) + b.dimensions.depthFt) - Math.max(a.y ?? 0, b.y ?? 0));
      totalOverlap += overlapX * overlapY;
    }
  }

  return totalArea > 0 ? Math.min(10, totalOverlap / totalArea) : 0;
}

function computeLightPenalty(rooms: RoomNode[], totalW: number, totalD: number): number {
  const threshold = 6; // ft from edge to count as exterior
  let penalty = 0;
  let preferredCount = 0;

  for (const room of rooms) {
    if (!EXTERIOR_PREFERRED.has(room.type) || room.x === undefined) continue;
    preferredCount++;

    const nearLeft   = room.x < threshold;
    const nearRight  = (room.x + room.dimensions.widthFt) > totalW - threshold;
    const nearTop    = (room.y ?? 0) < threshold;
    const nearBottom = ((room.y ?? 0) + room.dimensions.depthFt) > totalD - threshold;

    if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
      penalty += 1; // fully interior habitable room
    }
  }

  return preferredCount > 0 ? penalty / preferredCount : 0;
}

function computeCirculationPenalty(rooms: RoomNode[], edges: RoomEdge[]): number {
  const roomMap = new Map(rooms.map(r => [r.id, r]));

  // Find kitchen (public zone anchor)
  const kitchen = rooms.find(r => r.type === 'kitchen');
  // Find primary bedroom (private zone anchor)
  const primaryBed = rooms.find(r => r.type === 'primary_bedroom');

  if (!kitchen || !primaryBed || kitchen.x === undefined || primaryBed.x === undefined) {
    return 0;
  }

  // Kitchen↔bedroom should be separated (private vs public zones)
  const kitchenBedDist = centerDistance(kitchen, primaryBed);
  // Ideal: >20ft apart (zone separation), penalty if too close
  const separationPenalty = Math.max(0, 20 - kitchenBedDist) / 20;

  // Find hallways and check they connect to bedrooms efficiently
  let hallwayPenalty = 0;
  const hallways = rooms.filter(r => r.type === 'hallway' || r.type === 'connecting_hall');
  for (const hall of hallways) {
    if (hall.x === undefined) continue;
    // Hallways should be centrally located (close to average of all rooms)
    const avgX = rooms.reduce((s, r) => s + (r.x ?? 0) + r.dimensions.widthFt / 2, 0) / rooms.length;
    const avgY = rooms.reduce((s, r) => s + (r.y ?? 0) + r.dimensions.depthFt / 2, 0) / rooms.length;
    const hallCx = hall.x + hall.dimensions.widthFt / 2;
    const hallCy = (hall.y ?? 0) + hall.dimensions.depthFt / 2;
    const distFromCenter = Math.sqrt(Math.pow(hallCx - avgX, 2) + Math.pow(hallCy - avgY, 2));
    hallwayPenalty += distFromCenter / 30; // normalize against 30ft
  }

  const hallNorm = hallways.length > 0 ? hallwayPenalty / hallways.length : 0;
  return (separationPenalty + hallNorm) / 2;
}

function computeCompactnessPenalty(rooms: RoomNode[], totalW: number, totalD: number): number {
  const totalRoomArea = rooms.reduce((s, r) => s + r.dimensions.areaFt2, 0);
  const footprintArea = totalW * totalD;
  if (footprintArea === 0) return 0;

  // Efficiency = room area / footprint area (gaps are wasted)
  const efficiency = totalRoomArea / footprintArea;
  // Penalty = 1 - efficiency (0 = perfect, 1 = all wasted)
  return Math.max(0, 1 - efficiency);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function centerDistance(a: RoomNode, b: RoomNode): number {
  const ax = (a.x ?? 0) + a.dimensions.widthFt / 2;
  const ay = (a.y ?? 0) + a.dimensions.depthFt / 2;
  const bx = (b.x ?? 0) + b.dimensions.widthFt / 2;
  const by = (b.y ?? 0) + b.dimensions.depthFt / 2;
  return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
}

