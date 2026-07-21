# @kealee/core-tools

KeaCore tool registry + first-party tool implementations.

## Tools

| Tool | Tags | Approval? |
|---|---|---|
| `create_project` | projects, intake | No |
| `update_project_context` | projects | No |
| `check_zoning` | zoning, permits | No |
| `run_feasibility` | feasibility, estimate | No |
| `generate_concept_brief` | design, concept | No |
| `create_estimate` | estimate, intake | No |
| `create_checkout` | payments, stripe | **Yes** |
| `request_human_approval` | approval, operator | **Yes** |

## Adding a new tool

```ts
import { ToolDefinition } from "@kealee/core-agents";
import { z } from "zod";
import { toolRegistry } from "@kealee/core-tools";

const myTool: ToolDefinition<..., ...> = {
  name: "my_tool",
  description: "...",
  version: "1.0.0",
  inputSchema: z.object({ ... }),
  tags: ["my-domain"],
  async execute(input, context) { ... },
};

toolRegistry.register(myTool);
```

## Stub vs. live

All tools with `source: "stub"` in their output have TODO comments marking where to plug in real integrations (Regrid, Anthropic, Prisma, etc.). Stubs return realistic shapes so downstream plan steps always have data to work with.
