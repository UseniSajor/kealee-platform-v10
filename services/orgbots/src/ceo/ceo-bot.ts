import { BaseOrgBot } from "../base-orgbot.js";
import { CEO_SYSTEM_PROMPT } from "../prompts/ceo.prompt.js";
import type { OrgBotRequest, StructuredDecision } from "../decision-schema.js";

export class CEOBot extends BaseOrgBot {
  constructor() {
    super({
      name: "kea-ceo",
      role: "Chief Executive Officer",
      systemPrompt: CEO_SYSTEM_PROMPT,
    });
  }

  protected buildUserPrompt(request: OrgBotRequest): string {
    const ctx = request.context as Record<string, unknown>;
    const cfoDecision = ctx.cfoDecision as StructuredDecision | undefined;
    const cooDecision = ctx.cooDecision as StructuredDecision | undefined;

    const lines: string[] = [
      `PROJECT: ${request.projectId}`,
      `TRIGGERED BY: ${request.triggeredBy}`,
      `URGENCY: ${request.urgency}`,
      "",
      "=== CFO DECISION ===",
      cfoDecision
        ? `Decision: ${cfoDecision.decision} (confidence: ${cfoDecision.confidence})\nReasoning: ${cfoDecision.reasoning}`
        : "Not yet available",
      "",
      "=== COO DECISION ===",
      cooDecision
        ? `Decision: ${cooDecision.decision} (confidence: ${cooDecision.confidence})\nReasoning: ${cooDecision.reasoning}`
        : "Not yet available",
      "",
      "=== PROJECT CONTEXT ===",
      JSON.stringify(ctx, null, 2),
      "",
      "Return ONLY a valid JSON StructuredDecision. No markdown.",
    ];

    return lines.join("\n");
  }
}
