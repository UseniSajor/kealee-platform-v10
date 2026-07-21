/**
 * API contract: generate the full concept package from a floor plan.
 * Called by worker job `generate_concept_package`.
 */

import type { ConceptIntakeInput, FloorPlanJson } from '../floorplan/types';
import { generateConceptNarrative } from '../package/generate-concept-narrative';
import { generateScopeDirection }   from '../package/generate-scope-direction';
import { generatePermitPathNotes }  from '../package/generate-permit-path-notes';
import { buildVisualPromptBundle }  from '../visuals/build-visual-prompt-bundle';
import { assembleHomeownerDeliverables } from '../package/generate-homeowner-deliverables';
import { generateArchitectHandoff } from '../package/generate-architect-handoff';
import type { HomeownerDeliverables } from '../package/generate-homeowner-deliverables';
import type { ArchitectHandoff }      from '../package/generate-architect-handoff';

export interface GenerateConceptPackageInput {
  intakeId:    string;
  floorplanId: string;
  floorplan:   FloorPlanJson;
  twinId?:     string;
  projectPath: string;
  svgUrl?:     string;
  // Intake data for narrative + scope generation
  intake:      ConceptIntakeInput;
}

export interface GenerateConceptPackageResult {
  conceptPackageId:    string;
  packageJson:         HomeownerDeliverables;
  architectHandoffJson:ArchitectHandoff;
}

export async function generateConceptPackage(
  input: GenerateConceptPackageInput,
): Promise<GenerateConceptPackageResult> {
  const { floorplan, intake, svgUrl } = input;

  // Run all generators (narrative is async, others are sync)
  const [narrative, scope, permit, visuals] = await Promise.all([
    generateConceptNarrative(intake, floorplan),
    Promise.resolve(generateScopeDirection(intake)),
    Promise.resolve(generatePermitPathNotes(intake)),
    Promise.resolve(buildVisualPromptBundle(intake, floorplan)),
  ]);

  const packageJson = assembleHomeownerDeliverables({
    input:     intake,
    floorplan,
    narrative,
    scope,
    permit,
    visuals,
    svgUrl,
  });

  const conceptPackageId = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const architectHandoffJson = generateArchitectHandoff({
    input:            intake,
    floorplan,
    narrative,
    scope,
    permit,
    visuals,
    svgUrl,
    conceptPackageId,
  });

  return { conceptPackageId, packageJson, architectHandoffJson };
}
