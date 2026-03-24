export type SeedStatus = "active" | "inactive" | "draft";

export interface SeedMeta {
  code: string;
  version: string;
  status: SeedStatus;
  source?: string;
  notes?: string;
  lastVerifiedAt?: string;
}

export interface IntentSeed extends SeedMeta {
  label: string;
  description: string;
  entrySignals: string[];
  negativeSignals?: string[];
  defaultPrimaryAgent: string;
  defaultWorkflowTemplate: string;
  supportedModes: Array<"autonomous" | "assisted" | "operator">;
  requiredFields: string[];
  optionalFields: string[];
  qualificationRules: string[];
  upsellTargets: string[];
  downstreamIntents?: string[];
}

export interface WorkflowTemplateStepSeed {
  order: number;
  code: string;
  title: string;
  type: "tool" | "agent" | "approval" | "question" | "notification";
  target: string;
  required: boolean;
  approvalRequired: boolean;
  stopOnFailure: boolean;
  dependsOn?: string[];
  defaultInput?: Record<string, unknown>;
  successFlags?: string[];
  failureFlags?: string[];
}

export interface WorkflowTemplateSeed extends SeedMeta {
  name: string;
  appliesToIntents: string[];
  mode: "autonomous" | "assisted" | "operator";
  entryCriteria: string[];
  steps: WorkflowTemplateStepSeed[];
  successCriteria: string[];
  escalationTargets?: string[];
}

export interface ToolRegistrySeed extends SeedMeta {
  name: string;
  description: string;
  category: string;
  ownerAgent: string;
  requiresApproval: boolean;
  idempotent: boolean;
  sideEffectLevel: "read" | "write" | "external_write" | "financial";
  inputSchemaRef: string;
  outputSchemaRef: string;
  enabledEnvironments: string[];
  tags: string[];
}

export interface JurisdictionSeed extends SeedMeta {
  name: string;
  state: string;
  permitAuthority: string;
  zoningAuthority: string;
  permitPortalName: string;
  permitPortalUrl: string;
  zoningMapUrl: string;
  propertyLookupUrl?: string;
  inspectionUrl?: string;
  permitStatusUrl?: string;
  planUploadSystem?: string;
  supportedProjectTypes: string[];
  commonPermitTypes: string[];
  requiredIntakeFields: string[];
  commonRiskFlags: string[];
  reviewModel: "over_the_counter" | "plan_review" | "mixed";
  notesForKeaCore: string[];
}

export interface ServiceOfferingSeed extends SeedMeta {
  name: string;
  category: string;
  description: string;
  basePrice: number;
  currency: "USD";
  billingType: "one_time" | "subscription" | "custom_quote";
  stripeProductKey?: string;
  stripePriceKey?: string;
  includedOutputs: string[];
  requiresApproval: boolean;
  availableForIntents: string[];
  qualificationRules: string[];
  upsellTargets: string[];
  deliveryWorkflowCode?: string;
}

export interface RolePermissionSeed extends SeedMeta {
  roleName: string;
  audience: "external" | "internal" | "system";
  description: string;
  permissions: string[];
  approvalScopes: string[];
}

export interface RuleSeed extends SeedMeta {
  type: "risk_rule" | "approval_rule" | "routing_rule";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  when: Record<string, unknown>;
  effect: Record<string, unknown>;
}

export interface PromptPolicySeed extends SeedMeta {
  type: "system" | "planner" | "reflection" | "policy";
  appliesTo: string[];
  body: string;
}
