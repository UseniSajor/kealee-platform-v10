/**
 * @kealee/concept-engine
 * AI concept floor plan engine, package generator, and architect handoff system.
 */

// Floor plan
export * from './floorplan/types';
export { buildRoomGraph }         from './floorplan/build-room-graph';
export { buildLayoutJson, buildLayoutVariants } from './floorplan/build-layout-json';
export { scoreAdjacency, generateAdjacencyNotes } from './floorplan/build-adjacency';
export { inferRoomDimensions }    from './floorplan/infer-room-dimensions';
export { renderSvgFloorplan }     from './floorplan/render-svg-floorplan';
// Optimizer layer
export { optimizeLayout }         from './floorplan/layout-optimizer';
export type { LayoutScore, OptimizedLayout } from './floorplan/layout-optimizer';
export type { EnergyWeights }     from './floorplan/layout-energy';
export { checkCodeCompliance }    from './floorplan/layout-constraints';
export { scoreRoomLighting, scoreLayoutLighting } from './floorplan/orientation-model';

// Concept package
export { generateConceptNarrative } from './package/generate-concept-narrative';
export { generateScopeDirection }   from './package/generate-scope-direction';
export { generatePermitPathNotes }  from './package/generate-permit-path-notes';
export { assembleHomeownerDeliverables } from './package/generate-homeowner-deliverables';
export { generateArchitectHandoff } from './package/generate-architect-handoff';

// Types from package layer
export type { ConceptNarrative }        from './package/generate-concept-narrative';
export type { ScopeDirection, ScopeLineItem } from './package/generate-scope-direction';
export type { PermitPathNotes }         from './package/generate-permit-path-notes';
export type { HomeownerDeliverables }   from './package/generate-homeowner-deliverables';
export type { ArchitectHandoff, RevisionStatus, RecommendedService } from './package/generate-architect-handoff';

// Visuals
export { buildMidjourneyPrompts, getStyleKeywords } from './visuals/build-midjourney-prompt';
export { buildStableDiffusionPrompts } from './visuals/build-stable-diffusion-prompt';
export { buildVisualPromptBundle }     from './visuals/build-visual-prompt-bundle';
export type { VisualPromptBundle }     from './visuals/build-visual-prompt-bundle';
export type { SDPromptPair }           from './visuals/build-stable-diffusion-prompt';

// API contracts
export { generateFloorplan }       from './api/generate-floorplan';
export { generateConceptPackage }  from './api/generate-concept-package';
export { buildArchitectReviewTask } from './api/create-architect-review-task';
export type { GenerateFloorplanInput, GenerateFloorplanResult } from './api/generate-floorplan';
export type { GenerateConceptPackageInput, GenerateConceptPackageResult } from './api/generate-concept-package';
export type { CreateArchitectReviewInput, CreateArchitectReviewResult } from './api/create-architect-review-task';

// AI Concept — orchestration, journey config, intake resolution, upsell routing, buildability
export * from './ai-concept';

// PDF renderer
export { renderConceptPdf } from './pdf/render-concept-pdf';
export type { ConceptPdfInput, ConceptPdfResult } from './pdf/render-concept-pdf';

// Commercial concept engine (developer / investor)
export * from './commercial';

// Execution router
export { routeExecution } from './routing/execution-router';
export type { RouterInput, RouterOutput, ExecutionRoute as ConceptExecutionRoute } from './routing/execution-router';

// Export package builder
export { buildExportPackage } from './export/export-package-builder';
export type { ExportPackageInput, ExportManifest, HandoffSummary, ExportPackageResult } from './export/export-package-builder';
