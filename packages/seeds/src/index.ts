/**
 * @kealee/seeds — KeaCore seed blueprint
 *
 * Single export point for all seed packs. Import `keacoreSeedBlueprint` to
 * get the full typed blueprint, or import individual arrays for selective use.
 */

export { intentSeeds } from "./intent/intent.seed";
export { workflowTemplateSeeds } from "./workflows/workflow-templates.seed";
export { toolRegistrySeeds } from "./tools/tool-registry.seed";
export { dmvJurisdictionSeeds } from "./jurisdictions/dmv.jurisdictions.seed";
export { serviceOfferingSeeds } from "./services/service-catalog.seed";
export { rolePermissionSeeds } from "./roles/roles-permissions.seed";
export { ruleSeeds } from "./rules/risk-approval-rules.seed";
export { promptPolicySeeds } from "./prompts/prompts-policies.seed";

export type {
  SeedMeta,
  IntentSeed,
  WorkflowTemplateSeed,
  ToolRegistrySeed,
  JurisdictionSeed,
  ServiceOfferingSeed,
  RolePermissionSeed,
  RuleSeed,
  PromptPolicySeed,
  KeacoreSeedBlueprint,
} from "./types";

import { intentSeeds } from "./intent/intent.seed";
import { workflowTemplateSeeds } from "./workflows/workflow-templates.seed";
import { toolRegistrySeeds } from "./tools/tool-registry.seed";
import { dmvJurisdictionSeeds } from "./jurisdictions/dmv.jurisdictions.seed";
import { serviceOfferingSeeds } from "./services/service-catalog.seed";
import { rolePermissionSeeds } from "./roles/roles-permissions.seed";
import { ruleSeeds } from "./rules/risk-approval-rules.seed";
import { promptPolicySeeds } from "./prompts/prompts-policies.seed";
import type { KeacoreSeedBlueprint } from "./types";

export const keacoreSeedBlueprint: KeacoreSeedBlueprint = {
  intents: intentSeeds,
  workflowTemplates: workflowTemplateSeeds,
  tools: toolRegistrySeeds,
  jurisdictions: dmvJurisdictionSeeds,
  services: serviceOfferingSeeds,
  roles: rolePermissionSeeds,
  rules: ruleSeeds,
  prompts: promptPolicySeeds,
};
