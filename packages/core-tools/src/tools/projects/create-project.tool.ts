import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";

const Input = z.object({
  orgId: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().min(1),
  projectType: z.string(),
  address: z.string().optional(),
  scopeSummary: z.string().optional(),
});

type In = z.infer<typeof Input>;
type Out = { projectId: string };

export const createProjectTool: ToolDefinition<In, Out> = {
  name: "create_project",
  description: "Creates a new project record and initializes baseline project state.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: false,
  tags: ["projects", "intake"],

  async execute(input: In, context: ToolContext): Promise<Out> {
    // TODO: import prisma from @kealee/database once service is wired
    const prisma = (global as Record<string, unknown>).prisma as any;

    if (!prisma) {
      // Dev/test fallback — return a deterministic fake ID
      const fakeId = `proj_test_${Date.now()}`;
      console.warn(`[create_project] No prisma instance — returning fake ID: ${fakeId}`);
      return { projectId: fakeId };
    }

    const project = await prisma.project.create({
      data: {
        organizationId: input.orgId ?? null,
        ownerId: input.userId ?? null,
        name: input.title,
        projectType: input.projectType,
        siteAddress: input.address ?? null,
        description: input.scopeSummary ?? null,
        source: "KEACORE_INTAKE",
      },
    });

    return { projectId: project.id };
  },
};
