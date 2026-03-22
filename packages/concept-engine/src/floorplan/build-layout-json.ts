/**
 * Build a floor plan layout: place rooms on a 2D grid, then produce FloorPlanJson.
 * Uses a greedy row-packing algorithm with adjacency-guided ordering.
 */

import type {
  RoomGraph,
  RoomNode,
  FloorPlanLayout,
  FloorPlanJson,
  ConceptIntakeInput,
} from './types';
import { scoreAdjacency, generateAdjacencyNotes } from './build-adjacency';

const GRID_PAD   = 4;  // feet of outer padding
const ROOM_GAP   = 4;  // feet gap between rooms

export function buildLayoutJson(
  graph: RoomGraph,
  input: ConceptIntakeInput,
): { layout: FloorPlanLayout; json: FloorPlanJson } {
  const placed = placeRooms(graph);

  let maxX = 0;
  let maxY = 0;
  for (const r of placed) {
    if (r.x !== undefined && r.y !== undefined) {
      maxX = Math.max(maxX, r.x + r.dimensions.widthFt);
      maxY = Math.max(maxY, r.y + r.dimensions.depthFt);
    }
  }

  const totalWidthFt = maxX + GRID_PAD;
  const totalDepthFt = maxY + GRID_PAD;

  const layout: FloorPlanLayout = {
    rooms: placed,
    totalWidthFt,
    totalDepthFt,
    scale: 6, // 6 px per foot → readable SVG
    layoutIssues: [],
  };

  const adjScore = scoreAdjacency(graph, layout);
  layout.layoutIssues = generateAdjacencyNotes(adjScore).filter(n => n.startsWith('Layout note:'));

  const totalAreaFt2 = placed.reduce((sum, r) => sum + r.dimensions.areaFt2, 0);

  const json: FloorPlanJson = {
    id: `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    intakeId: input.intakeId,
    projectPath: input.projectPath,
    version: 1,
    rooms: placed.map(r => ({
      id:          r.id,
      type:        r.type,
      label:       r.label,
      widthFt:     r.dimensions.widthFt,
      depthFt:     r.dimensions.depthFt,
      areaFt2:     r.dimensions.areaFt2,
      x:           r.x ?? 0,
      y:           r.y ?? 0,
      captureZone: r.captureZone,
      notes:       r.notes,
      issues:      r.issues,
    })),
    adjacencies: graph.edges.map(e => ({
      from: e.fromId,
      to:   e.toId,
      type: e.adjacencyType,
    })),
    totalAreaFt2,
    totalWidthFt,
    totalDepthFt,
    layoutIssues: layout.layoutIssues,
    generatedAt: new Date().toISOString(),
  };

  return { layout, json };
}

// ── Room placement ───────────────────────────────────────────────────────────

function placeRooms(graph: RoomGraph): RoomNode[] {
  if (graph.rooms.length === 0) return [];

  const rooms = graph.rooms.map(r => ({ ...r, placed: false }));
  const ordered = sortByConnectionStrength(rooms, graph);

  // Row-packing with a target row width
  const rowWidth = estimateRowWidth(ordered);
  let curX = GRID_PAD;
  let curY = GRID_PAD;
  let rowH = 0;

  for (const room of ordered) {
    if (curX + room.dimensions.widthFt > rowWidth + GRID_PAD && curX > GRID_PAD) {
      curX  = GRID_PAD;
      curY += rowH + ROOM_GAP;
      rowH  = 0;
    }
    room.x      = curX;
    room.y      = curY;
    room.placed = true;
    curX       += room.dimensions.widthFt + ROOM_GAP;
    rowH        = Math.max(rowH, room.dimensions.depthFt);
  }

  return ordered;
}

function estimateRowWidth(rooms: RoomNode[]): number {
  const total = rooms.reduce((s, r) => s + r.dimensions.widthFt + ROOM_GAP, 0);
  // Target roughly square-ish aspect (3:2)
  return Math.max(40, Math.ceil(Math.sqrt(total * 1.5) * 2));
}

function sortByConnectionStrength(rooms: RoomNode[], graph: RoomGraph): RoomNode[] {
  const scores = new Map<string, number>();
  for (const room of rooms) {
    let score = 0;
    for (const edge of graph.edges) {
      if (edge.fromId === room.id || edge.toId === room.id) score += edge.weight;
    }
    scores.set(room.id, score);
  }
  return [...rooms].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
}
