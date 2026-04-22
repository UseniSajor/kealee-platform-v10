import { intentSeeds } from "./intent/intent.seed";
import { workflowTemplateSeeds } from "./workflows/workflow-templates.seed";
import { toolRegistrySeeds } from "./tools/tool-registry.seed";
import { jurisdictionSeeds } from "./jurisdictions/dmv.jurisdictions.seed";
import { serviceOfferingSeeds } from "./services/service-catalog.seed";
import { rolePermissionSeeds } from "./roles/roles-permissions.seed";
import { ruleSeeds } from "./rules/risk-approval-rules.seed";
import { promptPolicySeeds } from "./prompts/prompts-policies.seed";
import {
  searchJurisdictions,
  findJurisdiction,
  searchServiceOfferings,
  findServiceOfferingByCode,
  getServiceOfferingsByCategory,
  searchRules,
  getRulesByType,
  findRuleByCode,
  getActiveRules,
} from "./search/seed-search";

export {
  intentSeeds,
  workflowTemplateSeeds,
  toolRegistrySeeds,
  jurisdictionSeeds,
  serviceOfferingSeeds,
  rolePermissionSeeds,
  ruleSeeds,
  promptPolicySeeds,
  // Search functions
  searchJurisdictions,
  findJurisdiction,
  searchServiceOfferings,
  findServiceOfferingByCode,
  getServiceOfferingsByCategory,
  searchRules,
  getRulesByType,
  findRuleByCode,
  getActiveRules,
};

export type {
  SeedMeta,
  SeedStatus,
  IntentSeed,
  WorkflowTemplateSeed,
  WorkflowTemplateStepSeed,
  ToolRegistrySeed,
  JurisdictionSeed,
  ServiceOfferingSeed,
  RolePermissionSeed,
  RuleSeed,
  PromptPolicySeed,
} from "./types";

export const keacoreSeedBlueprint = {
  intents: intentSeeds,
  workflows: workflowTemplateSeeds,
  tools: toolRegistrySeeds,
  jurisdictions: jurisdictionSeeds,
  services: serviceOfferingSeeds,
  roles: rolePermissionSeeds,
  rules: ruleSeeds,
  prompts: promptPolicySeeds,
};
