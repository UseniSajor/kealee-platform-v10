import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";

const Input = z.object({
  reason: z.string(),
  context: z.record(z.unknown()).optional(),
});

type In = z.infer<typeof Input>;
type Out = { requested: true; reason: string };

export const requestHumanApprovalTool: ToolDefinition<In, Out> = {
  name: "request_human_approval",
  description:
    "Halts execution and requests operator or user approval before continuing. Used as an approval gate step.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: false,
  requiresApproval: true,
  tags: ["approval", "operator"],

  async execute(input: In, context: ToolContext): Promise<Out> {
    // This tool should normally be executed as a step.type === "approval" and
    // intercepted by the Executor before reaching here.
    // If it does reach execute(), record the pending approval and surface it.
    await context.memory.agentNotes.push(
      `[approval_requested] ${input.reason} — session: ${context.session.id}`,
    );
    // TODO: persist approval request to DB so Command Center can surface it
    return { requested: true, reason: input.reason };
  },
};
