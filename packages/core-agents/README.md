# @kealee/core-agents

KeaCore agent orchestration runtime.

## What it does

- Defines the 6 first-class objects: `AgentSession`, `Task`, `ExecutionPlan`, `PlanStep`, `ToolDefinition`, `SpecialistAgent`
- `SessionManager` — creates and tracks agent sessions (in-memory, TODO: DB-backed)
- `MemoryManager` — 4-layer memory (session, execution, outputs, decisions)
- `Planner` — deterministic intent-based plan generation
- `Executor` — runs plan steps in order, handles approvals and failures
- `KeaCoreRuntime` — top-level orchestrator

## Memory layers

| Layer | Lifetime | Contents |
|---|---|---|
| session | Active conversation | facts, constraints, risk flags, notes |
| execution | Per task run | tool call records, step outputs |
| outputs | Task lifetime | final deliverables |
| decisions | Permanent | why keacore chose a path |

## Usage

```ts
import { KeaCoreRuntime, SessionManager, MemoryManager, Planner, Executor } from "@kealee/core-agents";
import { toolRegistry } from "@kealee/core-tools";

const sessions = new SessionManager();
const memory   = new MemoryManager(sessions);
const planner  = new Planner();
const executor = new Executor(toolRegistry);
const runtime  = new KeaCoreRuntime(sessions, planner, executor, memory);
```
