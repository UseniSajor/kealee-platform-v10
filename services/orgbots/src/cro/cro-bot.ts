import { BaseOrgBot } from "../base-orgbot.js";
import { CRO_SYSTEM_PROMPT } from "../prompts/cro.prompt.js";
import type { OrgBotRequest } from "../decision-schema.js";

export class CROBot extends BaseOrgBot {
  constructor() {
    super({
      name: "kea-cro",
      role: "Chief Revenue Officer",
      systemPrompt: CRO_SYSTEM_PROMPT,
    });
  }

  protected buildUserPrompt(request: OrgBotRequest): string {
    const ctx = request.context as Record<string, unknown>;
    const lines: string[] = [
      `PROJECT: ${request.projectId}`,
      `TRIGGERED BY: ${request.triggeredBy}`,
      `URGENCY: ${request.urgency}`,
      "",
      "=== REVENUE CONTEXT ===",
    ];

    if (ctx.clientType) lines.push(`Client Type: ${ctx.clientType}`);
    if (ctx.projectPhase) lines.push(`Project Phase: ${ctx.projectPhase}`);
    if (ctx.purchasedServices) lines.push(`Purchased Services: ${JSON.stringify(ctx.purchasedServices)}`);
    if (ctx.completedDeliverables) lines.push(`Completed Deliverables: ${JSON.stringify(ctx.completedDeliverables)}`);
    if (ctx.totalSpend) lines.push(`Total Spend to Date: $${ctx.totalSpend}`);
    if (ctx.projectBudget) lines.push(`Project Budget: $${ctx.projectBudget}`);
    if (ctx.daysSinceLastPurchase) lines.push(`Days Since Last Purchase: ${ctx.daysSinceLastPurchase}`);
    if (ctx.projectType) lines.push(`Project Type: ${ctx.projectType}`);

    lines.push("", "Full context:", JSON.stringify(ctx, null, 2));
    lines.push("", "Return ONLY a valid JSON StructuredDecision. No markdown.");

    return lines.join("\n");
  }
}
