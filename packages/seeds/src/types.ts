import { z } from "zod";

// ─── Common seed meta ─────────────────────────────────────────────────────────

export const SeedMetaSchema = z.object({
  code: z.string().min(1),
  version: z.string().default("1.0.0"),
  status: z.enum(["active", "inactive", "draft"]),
  source: z.string().optional(),
  notes: z.string().optional(),
  lastVerifiedAt: z.string().optional(),
});

export type SeedMeta = z.infer<typeof SeedMetaSchema>;

// ─── A. Intent seed ───────────────────────────────────────────────────────────

export const IntentSeedSchema = SeedMetaSchema.extend({
  label: z.string(),
  description: z.string(),
  entrySignals: z.array(z.string()),
  defaultPrimaryAgent: z.string(),
  defaultWorkflowTemplate: z.string(),
  requiredFields: z.array(z.string()),
  optionalFields: z.array(z.string()),
  upsellTargets: z.array(z.string()),
});

export type IntentSeed = z.infer<typeof IntentSeedSchema>;

// ─── B. Workflow template seed ────────────────────────────────────────────────

export const WorkflowStepSchema = z.object({
  order: z.number(),
  code: z.string(),
  type: z.enum(["tool", "agent", "approval", "question"]),
  target: z.string(),
  required: z.boolean(),
  approvalRequired: z.boolean(),
  stopOnFailure: z.boolean().optional(),
  inputOverrides: z.record(z.unknown()).optional(),
});

export const WorkflowTemplateSeedSchema = SeedMetaSchema.extend({
  name: z.string(),
  appliesToIntents: z.array(z.string()),
  mode: z.enum(["autonomous", "assisted", "operator"]),
  steps: z.array(WorkflowStepSchema),
  successCriteria: z.array(z.string()),
});

export type WorkflowTemplateSeed = z.infer<typeof WorkflowTemplateSeedSchema>;

// ─── C. Tool registry seed ────────────────────────────────────────────────────

export const ToolRegistrySeedSchema = SeedMetaSchema.extend({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  requiresApproval: z.boolean(),
  idempotent: z.boolean(),
  inputSchemaRef: z.string(),
  outputSchemaRef: z.string(),
  enabledEnvironments: z.array(z.string()),
  tags: z.array(z.string()).optional(),
});

export type ToolRegistrySeed = z.infer<typeof ToolRegistrySeedSchema>;

// ─── D. Jurisdiction seed ─────────────────────────────────────────────────────

export const JurisdictionSeedSchema = SeedMetaSchema.extend({
  name: z.string(),
  state: z.string(),
  permitAuthority: z.string(),
  zoningAuthority: z.string(),
  permitPortalUrl: z.string().optional(),
  permitPortalName: z.string().optional(),
  zoningMapUrl: z.string().optional(),
  propertyLookupUrl: z.string().optional(),
  inspectionUrl: z.string().optional(),
  supportedProjectTypes: z.array(z.string()),
  requiredIntakeFields: z.array(z.string()),
  riskFlags: z.array(z.string()),
  reviewModel: z.enum(["plan_review", "over_the_counter", "hybrid"]).optional(),
  onlineStatusLookup: z.boolean().optional(),
  onlineZoningLookup: z.boolean().optional(),
  requiredDocsByProjectType: z.record(z.array(z.string())).optional(),
  commonApprovalBoundaries: z.array(z.string()).optional(),
  typicalTimelineDays: z.object({ simple: z.number(), complex: z.number() }).optional(),
});

export type JurisdictionSeed = z.infer<typeof JurisdictionSeedSchema>;

// ─── E. Service offering seed ─────────────────────────────────────────────────

export const ServiceOfferingSeedSchema = SeedMetaSchema.extend({
  name: z.string(),
  category: z.string(),
  description: z.string(),
  basePrice: z.number(),
  currency: z.string().default("USD"),
  billingType: z.enum(["one_time", "subscription", "custom_quote", "percentage"]),
  stripeProductKey: z.string().optional(),
  stripePriceEnvKey: z.string().optional(),
  includedOutputs: z.array(z.string()),
  requiresApproval: z.boolean(),
  availableForIntents: z.array(z.string()),
  upsellTargets: z.array(z.string()),
  deliveryDays: z.object({ min: z.number(), max: z.number() }).optional(),
});

export type ServiceOfferingSeed = z.infer<typeof ServiceOfferingSeedSchema>;

// ─── F. Role + permissions seed ───────────────────────────────────────────────

export const RolePermissionSeedSchema = SeedMetaSchema.extend({
  roleName: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
  portalAccess: z.array(z.string()).optional(),
  requiresVerification: z.boolean().optional(),
});

export type RolePermissionSeed = z.infer<typeof RolePermissionSeedSchema>;

// ─── G. Risk / approval rules seed ───────────────────────────────────────────

export const RuleSeedSchema = SeedMetaSchema.extend({
  type: z.enum(["risk_rule", "approval_rule", "routing_rule", "guard_rule"]),
  description: z.string(),
  when: z.record(z.unknown()),
  effect: z.record(z.unknown()),
  priority: z.number().default(50),
});

export type RuleSeed = z.infer<typeof RuleSeedSchema>;

// ─── H. Prompt + agent policy seed ───────────────────────────────────────────

export const PromptPolicySeedSchema = SeedMetaSchema.extend({
  type: z.enum(["system", "planner", "reflection", "policy", "user_facing"]),
  appliesTo: z.array(z.string()),
  body: z.string(),
  model: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
});

export type PromptPolicySeed = z.infer<typeof PromptPolicySeedSchema>;

// ─── Full blueprint type ──────────────────────────────────────────────────────

export interface KeacoreSeedBlueprint {
  intents: IntentSeed[];
  workflowTemplates: WorkflowTemplateSeed[];
  tools: ToolRegistrySeed[];
  jurisdictions: JurisdictionSeed[];
  services: ServiceOfferingSeed[];
  roles: RolePermissionSeed[];
  rules: RuleSeed[];
  prompts: PromptPolicySeed[];
}
