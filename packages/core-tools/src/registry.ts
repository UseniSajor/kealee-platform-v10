import { ToolContext, ToolDefinition } from "@kealee/core-agents";

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition<unknown, unknown>>();

  register<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool as ToolDefinition<unknown, unknown>);
  }

  get(name: string): ToolDefinition<unknown, unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return tool;
  }

  list() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      version: t.version,
      tags: t.tags ?? [],
      requiresApproval: t.requiresApproval ?? false,
      idempotent: t.idempotent ?? false,
    }));
  }

  async execute(name: string, rawInput: unknown, context: ToolContext): Promise<unknown> {
    const tool = this.get(name);
    const input = tool.inputSchema.parse(rawInput);
    return tool.execute(input, context);
  }
}

export const toolRegistry = new ToolRegistry();
