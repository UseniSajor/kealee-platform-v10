import { z } from "zod";

export const AgentRoleSchema = z.enum([
  "keacore",
  "owner",
  "gc",
  "construction",
  "land",
  "feasibility",
  "finance",
  "developer",
  "permit",
  "estimate",
  "payments",
  "marketplace",
  "operations",
  "design",
]);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const TaskStatusSchema = z.enum([
  "queued",
  "planning",
  "awaiting_approval",
  "running",
  "blocked",
  "completed",
  "failed",
  "cancelled",
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const PlanStepStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
  "awaiting_approval",
]);

export type PlanStepStatus = z.infer<typeof PlanStepStatusSchema>;

// ─── Session ─────────────────────────────────────────────────────────────────

export interface AgentSession {
  id: string;
  orgId?: string;
  userId?: string;
  projectId?: string;
  threadId?: string;
  source: "web" | "portal-owner" | "portal-developer" | "command-center" | "api";
  mode: "autonomous" | "assisted" | "operator";
  createdAt: string;
  updatedAt: string;
  status: "active" | "paused" | "closed";
  memory: SessionMemory;
  metadata?: Record<string, unknown>;
}

// ─── Memory layers ────────────────────────────────────────────────────────────

export interface SessionMemory {
  // Layer 1: session — short-lived active conversation state
  userIntent?: string;
  normalizedIntent?: string;
  facts: Record<string, unknown>;
  constraints: Record<string, unknown>;
  riskFlags: string[];
  agentNotes: string[];
  currentPlan?: ExecutionPlan;

  // Layer 2: execution — tool call history and step results
  toolHistory: ToolExecutionRecord[];
  stepOutputs: Record<string, unknown>; // stepId → output

  // Layer 3: outputs — final deliverables
  outputs: Record<string, unknown>;

  // Layer 4: decisions — why keacore chose a path
  decisions: DecisionRecord[];
}

export interface DecisionRecord {
  at: string;
  reason: string;
  chosen: string;
  alternatives?: string[];
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  requestedBy: "user" | "system" | "operator";
  assignedAgent: AgentRole;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

// ─── Plan ─────────────────────────────────────────────────────────────────────

export interface ExecutionPlan {
  id: string;
  taskId: string;
  summary: string;
  steps: PlanStep[];
  createdAt: string;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  type: "tool" | "agent" | "question" | "approval";
  target: string; // tool name or agent role
  status: PlanStepStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  dependsOn?: string[]; // step ids
  retries?: number;
  maxRetries?: number;
  approvalRequired?: boolean;
  stopOnFailure?: boolean;
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export interface ToolExecutionRecord {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  success: boolean;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface ToolContext {
  session: AgentSession;
  task: Task;
  memory: SessionMemory;
  traceId: string;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  version: string;
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput, context: ToolContext) => Promise<TOutput>;
  idempotent?: boolean;
  requiresApproval?: boolean;
  tags?: string[];
}

// ─── Specialist agents ────────────────────────────────────────────────────────

export interface SpecialistAgent {
  role: AgentRole;
  description: string;
  canHandle: (task: Task, memory: SessionMemory) => boolean;
  act: (args: {
    session: AgentSession;
    task: Task;
    planStep?: PlanStep;
  }) => Promise<Record<string, unknown>>;
}

// ─── Runtime result ───────────────────────────────────────────────────────────

export type RunResult =
  | { status: "completed"; outputs: Record<string, unknown> }
  | { status: "awaiting_approval"; stepId: string; message: string }
  | { status: "failed"; stepId: string; error: string }
  | { status: "blocked"; stepId: string; reason: string };
