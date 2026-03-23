/**
 * Build a floor plan layout using the constraint optimizer.
 * Produces three layout variants (A/B/C) via simulated annealing.
 * Falls back to the recommended variant for single-layout consumers.
 */

import type {
  RoomGraph,
  RoomNode,
  FloorPlanLayout,
  FloorPlanJson,
  FloorPlanVariant,
  ConceptIntakeInput,
} from './types';
import { optimizeLayout } from './layout-optimizer';
import { renderSvgFloorplan } from './render-svg-floorplan';
import { scoreAdjacency, generateAdjacencyNotes } from './build-adjacency';

const VARIANTS = ['A', 'B', 'C'] as const;

/** Generate all 3 layout variants and pick the recommended one. */
export function buildLayoutVariants(
  graph: RoomGraph,
  input: ConceptIntakeInput,
): { variants: FloorPlanVariant[]; recommended: FloorPlanVariant } {
  const variants: FloorPlanVariant[] = VARIANTS.map(variantId => {
    const optimized = optimizeLayout(graph.rooms, graph.edges, variantId);

    const layout: FloorPlanLayout = {
      rooms: optimized.rooms,
      totalWidthFt: optimized.totalWidthFt,
      totalDepthFt: optimized.totalDepthFt,
      scale: 6,
      layoutIssues: optimized.layoutIssues,
    };

    const svgString = renderSvgFloorplan(layout);

    const json: FloorPlanJson = {
      id: `fp_${variantId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      intakeId: input.intakeId,
      projectPath: graph.projectPath,
      version: 1,
      rooms: optimized.rooms.map(r => ({
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
      totalAreaFt2:  optimized.rooms.reduce((s, r) => s + r.dimensions.areaFt2, 0),
      totalWidthFt:  optimized.totalWidthFt,
      totalDepthFt:  optimized.totalDepthFt,
      layoutIssues:  optimized.layoutIssues,
      generatedAt:   new Date().toISOString(),
    };

    return {
      variantId,
      variantLabel: optimized.variantLabel,
      floorplanJson: json,
      svgString,
      score: optimized.score,
      primaryDifferentiator: optimized.primaryDifferentiator,
    };
  });

  // Recommend the variant with the highest overall score
  const recommended = variants.reduce((best, v) =>
    v.score.overallScore > best.score.overallScore ? v : best,
  );

  return { variants, recommended };
}

/**
 * Legacy single-layout path — returns the recommended variant as a FloorPlanLayout + FloorPlanJson.
 * Used by callers that haven't migrated to multi-variant yet.
 */
export function buildLayoutJson(
  graph: RoomGraph,
  input: ConceptIntakeInput,
): { layout: FloorPlanLayout; json: FloorPlanJson } {
  const { recommended } = buildLayoutVariants(graph, input);

  const layout: FloorPlanLayout = {
    rooms: graph.rooms.map(r => {
      const placed = recommended.floorplanJson.rooms.find(p => p.id === r.id);
      return { ...r, x: placed?.x, y: placed?.y, placed: true };
    }),
    totalWidthFt: recommended.floorplanJson.totalWidthFt,
    totalDepthFt: recommended.floorplanJson.totalDepthFt,
    scale: 6,
    layoutIssues: recommended.floorplanJson.layoutIssues,
  };

  return { layout, json: recommended.floorplanJson };
}
