/**
 * Print all active workflow templates and service offerings for operator review.
 * Run with: pnpm --filter @kealee/seeds print-active
 */

import { workflowTemplateSeeds } from "../workflows/workflow-templates.seed";
import { serviceOfferingSeeds } from "../services/service-catalog.seed";
import { intentSeeds } from "../intent/intent.seed";
import { ruleSeeds } from "../rules/risk-approval-rules.seed";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";

function header(title: string, color: string): void {
  const line = "─".repeat(60);
  console.log(`\n${color}${BOLD}${line}${RESET}`);
  console.log(`${color}${BOLD}  ${title}${RESET}`);
  console.log(`${color}${BOLD}${line}${RESET}`);
}

function printWorkflowTemplates(): void {
  const active = workflowTemplateSeeds.filter((w) => w.status === "active");
  header(`WORKFLOW TEMPLATES (${active.length} active)`, CYAN);

  for (const w of active) {
    console.log(`\n  ${BOLD}${w.code}${RESET}  ${DIM}v${w.version}${RESET}`);
    console.log(`  ${w.name}  [mode: ${w.mode}]`);
    console.log(`  Intents: ${w.appliesToIntents.join(", ")}`);
    console.log(`  Steps:`);
    for (const s of w.steps) {
      const flag = s.approvalRequired ? " 🔒" : "";
      const stop = s.stopOnFailure ? " ⛔" : "";
      console.log(`    ${s.order}. [${s.type}] ${s.target}${flag}${stop}`);
    }
    console.log(`  Success criteria: ${w.successCriteria.join(" | ")}`);
  }
}

function printServiceOfferings(): void {
  const active = serviceOfferingSeeds.filter((s) => s.status === "active");
  header(`SERVICE OFFERINGS (${active.length} active)`, GREEN);

  const byCategory = active.reduce<Record<string, typeof active>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  for (const [category, services] of Object.entries(byCategory)) {
    console.log(`\n  ${BOLD}${category.toUpperCase()}${RESET}`);
    for (const s of services) {
      const price =
        s.billingType === "custom_quote"
          ? "Custom quote"
          : s.billingType === "subscription"
            ? `$${s.basePrice.toLocaleString()}/mo`
            : `$${s.basePrice.toLocaleString()}`;
      const approval = s.requiresApproval ? "🔒" : "  ";
      console.log(`  ${approval}  ${s.code.padEnd(40)} ${price}`);
      console.log(`       ${DIM}${s.name} — ${s.description}${RESET}`);
    }
  }
}

function printIntents(): void {
  const active = intentSeeds.filter((i) => i.status === "active");
  header(`INTENTS (${active.length} active)`, YELLOW);

  for (const intent of active) {
    console.log(
      `\n  ${BOLD}${intent.code}${RESET}  →  workflow: ${intent.defaultWorkflowTemplate}  |  agent: ${intent.defaultPrimaryAgent}`
    );
    console.log(`  ${DIM}${intent.description}${RESET}`);
    console.log(`  Signals: ${intent.entrySignals.slice(0, 4).join(", ")}${intent.entrySignals.length > 4 ? ", ..." : ""}`);
    if (intent.upsellTargets.length > 0) {
      console.log(`  Upsells: ${intent.upsellTargets.join(", ")}`);
    }
  }
}

function printRules(): void {
  const active = ruleSeeds.filter((r) => r.status === "active");
  header(`RULES (${active.length} active)`, MAGENTA);

  const byType = active.reduce<Record<string, typeof active>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  for (const [type, rules] of Object.entries(byType)) {
    console.log(`\n  ${BOLD}${type.replace(/_/g, " ").toUpperCase()}${RESET}`);
    for (const r of rules) {
      console.log(`    [${r.severity}] ${r.code}`);
      console.log(`    ${DIM}${r.description}${RESET}`);
    }
  }
}

function printSummary(): void {
  header("SEED BLUEPRINT SUMMARY", CYAN);
  const counts = [
    ["intents", intentSeeds.filter((i) => i.status === "active").length],
    ["workflow templates", workflowTemplateSeeds.filter((w) => w.status === "active").length],
    ["service offerings", serviceOfferingSeeds.filter((s) => s.status === "active").length],
    ["rules", ruleSeeds.filter((r) => r.status === "active").length],
  ];
  for (const [label, count] of counts) {
    console.log(`  ${GREEN}✓${RESET}  ${String(count).padStart(3)}  ${label}`);
  }
}

printIntents();
printWorkflowTemplates();
printServiceOfferings();
printRules();
printSummary();
console.log();
