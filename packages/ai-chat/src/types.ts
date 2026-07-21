import type { PrismaClient } from '@prisma/client';

// ─── Chat Request / Response ────────────────────────────────────────────────────────────

export interface ChatRequest {
  userId: string;
  message: string;
  conversationId?: string;
  projectId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  actions?: ChatAction[];
  sources?: ChatSource[];
  toolsUsed?: string[];
}

export interface ChatAction {
  type: 'approve_decision' | 'reschedule_task' | 'send_message' | 'request_change_order';
  description: string;
  data: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface ChatSource {
  type: 'project' | 'task' | 'budget' | 'bid' | 'report' | 'photo' | 'contractor';
  id: string;
  label: string;
}

// ─── User Context ───────────────────────────────────────────────────────────────────

export interface UserProject {
  id: string;
  name: string;
  status: string;
  address?: string;
  budget?: number;
  currentPhase?: string;
  percentComplete?: number;
}

export interface UserContext {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId?: string;
  orgName?: string;
  projects: UserProject[];
}

// ─── Conversation ───────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  actions?: ChatAction[];
  sources?: ChatSource[];
  timestamp: string;
}

// ─── Tool Types ─────────────────────────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export type ToolExecutor = (
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
) => Promise<ToolResult>;

export interface ToolResult {
  content: string;
  sources?: ChatSource[];
  actions?: ChatAction[];
}

// ─── SSE Event Types ────────────────────────────────────────────────────────────────

export type SSEEventType = 'text' | 'tool_call' | 'action' | 'source' | 'done' | 'error';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}
