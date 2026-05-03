import { BaseOrgBot } from "../base-orgbot.js";
import { COO_SYSTEM_PROMPT } from "../prompts/coo.prompt.js";
import type { OrgBotRequest } from "../decision-schema.js";

export class COOBot extends BaseOrgBot {
  constructor() {
    super({
      name: "kea-coo",
      role: "Chief Operating Officer",
      systemPrompt: COO_SYSTEM_PROMPT,
    });
  }

  protected buildUserPrompt(request: OrgBotRequest): string {
    const ctx = request.context as Record<string, unknown>;
    const lines: string[] = [
      `PROJECT: ${request.projectId}`,
      `TRIGGERED BY: ${request.triggeredBy}`,
      `URGENCY: ${request.urgency}`,
      "",
      "=== OPERATIONAL CONTEXT ===",
    ];

    if (ctx.projectType) lines.push(`Project Type: ${ctx.projectType}`);
    if (ctx.projectSF) lines.push(`Project SF: ${ctx.projectSF}`);
    if (ctx.permitStatus) lines.push(`Permit Status: ${ctx.permitStatus}`);
    if (ctx.gcContracted !== undefined) lines.push(`GC Under Contract: ${ctx.gcContracted}`);
    if (ctx.scheduledStartDate) lines.push(`Scheduled Start: ${ctx.scheduledStartDate}`);
    if (ctx.scheduledEndDate) lines.push(`Scheduled End: ${ctx.scheduledEndDate}`);
    if (ctx.scheduleDurationDays) lines.push(`Duration: ${ctx.scheduleDurationDays} days`);
    if (ctx.contractorsAssigned) lines.push(`Contractors Assigned: ${ctx.contractorsAssigned}`);
    if (ctx.criticalPathItems) lines.push(`Critical Path Items: ${JSON.stringify(ctx.criticalPathItems)}`);

    lines.push("", "Full context:", JSON.stringify(ctx, null, 2));
    lines.push("", "Return ONLY a valid JSON StructuredDecision. No markdown.");

    return lines.join("\n");
  }
}
