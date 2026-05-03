import { BaseOrgBot } from "../base-orgbot.js";
import { CFO_SYSTEM_PROMPT } from "../prompts/cfo.prompt.js";
import type { OrgBotRequest } from "../decision-schema.js";

export class CFOBot extends BaseOrgBot {
  constructor() {
    super({
      name: "kea-cfo",
      role: "Chief Financial Officer",
      systemPrompt: CFO_SYSTEM_PROMPT,
    });
  }

  protected buildUserPrompt(request: OrgBotRequest): string {
    const ctx = request.context as Record<string, unknown>;
    const lines: string[] = [
      `PROJECT: ${request.projectId}`,
      `TRIGGERED BY: ${request.triggeredBy}`,
      `URGENCY: ${request.urgency}`,
      "",
      "=== FINANCIAL CONTEXT ===",
    ];

    if (ctx.totalBudget) lines.push(`Total Budget: $${ctx.totalBudget}`);
    if (ctx.hardCostEstimate) lines.push(`Hard Cost Estimate: $${ctx.hardCostEstimate}`);
    if (ctx.softCostEstimate) lines.push(`Soft Cost Estimate: $${ctx.softCostEstimate}`);
    if (ctx.projectSF) lines.push(`Project SF: ${ctx.projectSF}`);
    if (ctx.projectType) lines.push(`Project Type: ${ctx.projectType}`);
    if (ctx.loanAmount) lines.push(`Loan Amount: $${ctx.loanAmount}`);
    if (ctx.equityAmount) lines.push(`Equity Amount: $${ctx.equityAmount}`);
    if (ctx.projectedRevenue) lines.push(`Projected Revenue: $${ctx.projectedRevenue}`);
    if (ctx.targetIRR) lines.push(`Target IRR: ${ctx.targetIRR}%`);
    if (ctx.dscr) lines.push(`DSCR: ${ctx.dscr}`);
    if (ctx.contingencyPct) lines.push(`Contingency: ${ctx.contingencyPct}%`);

    lines.push("", "Full context:", JSON.stringify(ctx, null, 2));
    lines.push("", "Return ONLY a valid JSON StructuredDecision. No markdown.");

    return lines.join("\n");
  }
}
