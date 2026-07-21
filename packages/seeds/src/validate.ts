import { z } from "zod";
import { keacoreSeedBlueprint } from "./index";

const metaSchema = z.object({
  code: z.string(),
  version: z.string(),
  status: z.enum(["active", "inactive", "draft"]),
});

const intentSchema = metaSchema.extend({
  label: z.string(),
  description: z.string(),
  entrySignals: z.array(z.string()).min(1),
  defaultPrimaryAgent: z.string(),
  defaultWorkflowTemplate: z.string(),
  supportedModes: z.array(z.enum(["autonomous", "assisted", "operator"])).min(1),
  requiredFields: z.array(z.string()),
  optionalFields: z.array(z.string()),
  qualificationRules: z.array(z.string()),
  upsellTargets: z.array(z.string()),
});

const workflowStepSchema = z.object({
  order: z.number(),
  code: z.string(),
  title: z.string(),
  type: z.enum(["tool", "agent", "approval", "question", "notification"]),
  target: z.string(),
  required: z.boolean(),
  approvalRequired: z.boolean(),
  stopOnFailure: z.boolean(),
});

const workflowSchema = metaSchema.extend({
  name: z.string(),
  appliesToIntents: z.array(z.string()).min(1),
  mode: z.enum(["autonomous", "assisted", "operator"]),
  entryCriteria: z.array(z.string()),
  steps: z.array(workflowStepSchema).min(1),
  successCriteria: z.array(z.string()).min(1),
});

const toolSchema = metaSchema.extend({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  ownerAgent: z.string(),
  requiresApproval: z.boolean(),
  idempotent: z.boolean(),
  sideEffectLevel: z.enum(["read", "write", "external_write", "financial"]),
  inputSchemaRef: z.string(),
  outputSchemaRef: z.string(),
  enabledEnvironments: z.array(z.string()).min(1),
  tags: z.array(z.string()),
});

const jurisdictionSchema = metaSchema.extend({
  name: z.string(),
  state: z.string(),
  permitAuthority: z.string(),
  zoningAuthority: z.string(),
  permitPortalName: z.string(),
  permitPortalUrl: z.string().url(),
  zoningMapUrl: z.string().url(),
  supportedProjectTypes: z.array(z.string()).min(1),
  commonPermitTypes: z.array(z.string()).min(1),
  requiredIntakeFields: z.array(z.string()).min(1),
  commonRiskFlags: z.array(z.string()),
  reviewModel: z.enum(["over_the_counter", "plan_review", "mixed"]),
  notesForKeaCore: z.array(z.string()),
});

const serviceSchema = metaSchema.extend({
  name: z.string(),
  category: z.string(),
  description: z.string(),
  basePrice: z.number().nonnegative(),
  currency: z.literal("USD"),
  billingType: z.enum(["one_time", "subscription", "custom_quote"]),
  includedOutputs: z.array(z.string()).min(1),
  requiresApproval: z.boolean(),
  availableForIntents: z.array(z.string()).min(1),
  qualificationRules: z.array(z.string()),
  upsellTargets: z.array(z.string()),
});

const roleSchema = metaSchema.extend({
  roleName: z.string(),
  audience: z.enum(["external", "internal", "system"]),
  description: z.string(),
  permissions: z.array(z.string()).min(1),
  approvalScopes: z.array(z.string()),
});

const ruleSchema = metaSchema.extend({
  type: z.enum(["risk_rule", "approval_rule", "routing_rule"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  when: z.record(z.any()),
  effect: z.record(z.any()),
});

const promptSchema = metaSchema.extend({
  type: z.enum(["system", "planner", "reflection", "policy"]),
  appliesTo: z.array(z.string()).min(1),
  body: z.string().min(20),
});

export function validateSeedBlueprint(): boolean {
  z.array(intentSchema).parse(keacoreSeedBlueprint.intents);
  z.array(workflowSchema).parse(keacoreSeedBlueprint.workflows);
  z.array(toolSchema).parse(keacoreSeedBlueprint.tools);
  z.array(jurisdictionSchema).parse(keacoreSeedBlueprint.jurisdictions);
  z.array(serviceSchema).parse(keacoreSeedBlueprint.services);
  z.array(roleSchema).parse(keacoreSeedBlueprint.roles);
  z.array(ruleSchema).parse(keacoreSeedBlueprint.rules);
  z.array(promptSchema).parse(keacoreSeedBlueprint.prompts);
  return true;
}

// CLI runner
if (require.main === module) {
  try {
    validateSeedBlueprint();
    const counts = Object.fromEntries(
      Object.entries(keacoreSeedBlueprint).map(([k, v]) => [k, (v as unknown[]).length])
    );
    console.log("\n✅ All seed packs valid\n");
    for (const [pack, count] of Object.entries(counts)) {
      console.log(`  ✓  ${String(count).padStart(3)}  ${pack}`);
    }
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    console.log(`\n  Total: ${total} records across ${Object.keys(counts).length} packs\n`);
  } catch (err) {
    console.error("\n❌ Seed validation failed:\n", err);
    process.exit(1);
  }
}
