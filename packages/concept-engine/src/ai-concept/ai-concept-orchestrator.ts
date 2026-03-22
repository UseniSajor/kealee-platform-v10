/**
 * AI Concept Orchestrator
 * Central coordinator for the full concept engine pipeline.
 * Used by both API routes (sync fast path) and worker jobs (async full pipeline).
 */

import { generateFloorplan } from '../api/generate-floorplan'
import { generateConceptPackage } from '../api/generate-concept-package'
import { buildBuildabilitySnapshot } from './buildability-snapshot'
import { buildVisualPromptBundle } from '../visuals/build-visual-prompt-bundle'
import { routeUpsell } from './upsell-router'
import type { ConceptIntakeInput } from '../floorplan/types'
import type { BuildabilitySnapshot, ZoningData } from './buildability-snapshot'
import type { UpsellRoute } from './upsell-router'
import type { VisualPromptBundle } from '../visuals/build-visual-prompt-bundle'
import type { GenerateFloorplanResult } from '../api/generate-floorplan'
import type { GenerateConceptPackageResult } from '../api/generate-concept-package'
import type { ProjectPath } from './journey-config'

export type OrchestrationMode =
  | 'floorplan_only'       // Fast: sync floor plan generation only
  | 'full_concept'         // Full pipeline: floor plan + package + buildability + visuals
  | 'buildability_only'    // Standalone buildability snapshot
  | 'visual_bundle_only'   // Visual prompts only (re-generate pass)

export interface OrchestrationInput {
  intake: ConceptIntakeInput
  mode: OrchestrationMode
  zoningData?: ZoningData | null
  existingFloorplanResult?: GenerateFloorplanResult | null
}

export interface OrchestrationResult {
  intakeId: string
  projectPath: ProjectPath
  mode: OrchestrationMode
  floorplan?: GenerateFloorplanResult
  conceptPackage?: GenerateConceptPackageResult
  buildability?: BuildabilitySnapshot
  visualBundle?: VisualPromptBundle
  upsellRoute?: UpsellRoute
  durationMs: number
  errors: string[]
  completedAt: string
}

export async function orchestrateConcept(
  opts: OrchestrationInput
): Promise<OrchestrationResult> {
  const { intake, mode, zoningData, existingFloorplanResult } = opts
  const startMs = Date.now()
  const errors: string[] = []

  let floorplan: GenerateFloorplanResult | undefined
  let conceptPackage: GenerateConceptPackageResult | undefined
  let buildability: BuildabilitySnapshot | undefined
  let visualBundle: VisualPromptBundle | undefined
  let upsellRoute: UpsellRoute | undefined

  // ── Step 1: Floor plan ────────────────────────────────────────────────────
  if (mode === 'floorplan_only' || mode === 'full_concept') {
    try {
      floorplan = existingFloorplanResult ?? generateFloorplan(intake)
    } catch (err) {
      errors.push(`floorplan: ${String(err)}`)
    }
  }

  // ── Step 2: Concept package (narrative + scope + permit + architect handoff)
  if (mode === 'full_concept' && floorplan) {
    try {
      conceptPackage = await generateConceptPackage({
        intakeId: intake.intakeId,
        floorplanId: floorplan.floorplanId,
        floorplan: floorplan.floorplanJson,
        intake,
        projectPath: intake.projectPath,
        svgUrl: undefined,
      })
    } catch (err) {
      errors.push(`concept_package: ${String(err)}`)
    }
  }

  // ── Step 3: Buildability snapshot ─────────────────────────────────────────
  if (mode === 'full_concept' || mode === 'buildability_only') {
    try {
      buildability = await buildBuildabilitySnapshot({
        intakeId: intake.intakeId,
        projectPath: intake.projectPath,
        address: intake.projectAddress,
        jurisdiction: intake.jurisdiction,
        budgetRange: intake.budgetRange,
        constraints: intake.knownConstraints,
        zoningData: zoningData ?? null,
      })
    } catch (err) {
      errors.push(`buildability: ${String(err)}`)
    }
  }

  // ── Step 4: Visual prompt bundle ──────────────────────────────────────────
  if (mode === 'full_concept' || mode === 'visual_bundle_only') {
    try {
      const fp = floorplan?.floorplanJson ?? existingFloorplanResult?.floorplanJson
      if (fp) {
        visualBundle = buildVisualPromptBundle(intake, fp)
      }
    } catch (err) {
      errors.push(`visual_bundle: ${String(err)}`)
    }
  }

  // ── Step 5: Upsell routing ─────────────────────────────────────────────────
  if (mode === 'full_concept') {
    try {
      upsellRoute = routeUpsell(intake.intakeId, intake.projectPath as ProjectPath)
    } catch (err) {
      errors.push(`upsell_route: ${String(err)}`)
    }
  }

  return {
    intakeId: intake.intakeId,
    projectPath: intake.projectPath as ProjectPath,
    mode,
    floorplan,
    conceptPackage,
    buildability,
    visualBundle,
    upsellRoute,
    durationMs: Date.now() - startMs,
    errors,
    completedAt: new Date().toISOString(),
  }
}

/**
 * Convenience: run only floor plan (sync, fast path for API).
 */
export function orchestrateFloorplanOnly(intake: ConceptIntakeInput): GenerateFloorplanResult {
  return generateFloorplan(intake)
}

/**
 * Convenience: run full pipeline async.
 */
export async function orchestrateFullConcept(
  intake: ConceptIntakeInput,
  zoningData?: ZoningData | null
): Promise<OrchestrationResult> {
  return orchestrateConcept({ intake, mode: 'full_concept', zoningData })
}
