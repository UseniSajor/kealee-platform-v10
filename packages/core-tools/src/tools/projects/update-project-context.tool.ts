import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";

const Input = z.object({
  projectId: z.string(),
  patch: z.record(z.unknown()),
});

type In = z.infer<typeof Input>;
type Out = { updated: boolean };

export const updateProjectContextTool: ToolDefinition<In, Out> = {
  name: "update_project_context",
  description: "Merges new facts/context into an existing project record.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["projects"],

  async execute(input: In, _context: ToolContext): Promise<Out> {
    const prisma = (global as Record<string, unknown>).prisma as any;

    if (!prisma) {
      console.warn("[update_project_context] No prisma — skipping update");
      return { updated: false };
    }

    // TODO: map patch fields to actual Prisma Project columns
    await prisma.project.update({
      where: { id: input.projectId },
      data: input.patch,
    });

    return { updated: true };
  },
};
