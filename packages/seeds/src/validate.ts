/**
 * Seed validation runner — validates every seed pack with Zod.
 * Run with: pnpm --filter @kealee/seeds validate
 * Throws on first malformed record so CI catches regressions early.
 */

import { ZodSchema } from "zod";
import {
  IntentSeedSchema,
  WorkflowTemplateSeedSchema,
  ToolRegistrySeedSchema,
  JurisdictionSeedSchema,
  ServiceOfferingSeedSchema,
  RolePermissionSeedSchema,
  RuleSeedSchema,
  PromptPolicySeedSchema,
} from "./types";

import { intentSeeds } from "./intent/intent.seed";
import { workflowTemplateSeeds } from "./workflows/workflow-templates.seed";
import { toolRegistrySeeds } from "./tools/tool-registry.seed";
import { dmvJurisdictionSeeds } from "./jurisdictions/dmv.jurisdictions.seed";
import { serviceOfferingSeeds } from "./services/service-catalog.seed";
import { rolePermissionSeeds } from "./roles/roles-permissions.seed";
import { ruleSeeds } from "./rules/risk-approval-rules.seed";
import { promptPolicySeeds } from "./prompts/prompts-policies.seed";

interface ValidationResult {
  pack: string;
  count: number;
  errors: string[];
}

function validatePack<T>(
  packName: string,
  schema: ZodSchema<T>,
  items: unknown[]
): ValidationResult {
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const result = schema.safeParse(items[i]);
    if (!result.success) {
      const item = items[i] as Record<string, unknown>;
      const code = item?.code ?? `item[${i}]`;
      errors.push(
        `[${packName}] ${code}: ${result.error.errors.map((e) => `${e.path.join(".")} — ${e.message}`).join("; ")}`
      );
    }
  }

  return { pack: packName, count: items.length, errors };
}

function runValidation(): void {
  const packs = [
    validatePack("intents", IntentSeedSchema, intentSeeds),
    validatePack("workflowTemplates", WorkflowTemplateSeedSchema, workflowTemplateSeeds),
    validatePack("tools", ToolRegistrySeedSchema, toolRegistrySeeds),
    validatePack("jurisdictions", JurisdictionSeedSchema, dmvJurisdictionSeeds),
    validatePack("services", ServiceOfferingSeedSchema, serviceOfferingSeeds),
    validatePack("roles", RolePermissionSeedSchema, rolePermissionSeeds),
    validatePack("rules", RuleSeedSchema, ruleSeeds),
    validatePack("prompts", PromptPolicySeedSchema, promptPolicySeeds),
  ];

  let hasErrors = false;

  for (const result of packs) {
    if (result.errors.length > 0) {
      hasErrors = true;
      for (const err of result.errors) {
        console.error(`✗ ${err}`);
      }
    } else {
      console.log(`✓ ${result.pack} (${result.count} records)`);
    }
  }

  if (hasErrors) {
    console.error("\n❌ Seed validation failed — fix errors above before loading.");
    process.exit(1);
  } else {
    const total = packs.reduce((sum, p) => sum + p.count, 0);
    console.log(`\n✅ All seed packs valid (${total} total records across ${packs.length} packs).`);
  }
}

runValidation();
