import { AgentSession, SessionMemory } from "../types";
import { createId } from "../utils/ids";

// TODO: replace in-memory store with DB-backed persistence (Prisma AgentSession model)
const store = new Map<string, AgentSession>();

function emptyMemory(): SessionMemory {
  return {
    facts: {},
    constraints: {},
    riskFlags: [],
    agentNotes: [],
    toolHistory: [],
    stepOutputs: {},
    outputs: {},
    decisions: [],
  };
}

export class SessionManager {
  async create(params: {
    orgId?: string;
    userId?: string;
    projectId?: string;
    source: AgentSession["source"];
    mode?: AgentSession["mode"];
    metadata?: Record<string, unknown>;
  }): Promise<AgentSession> {
    const now = new Date().toISOString();
    const session: AgentSession = {
      id: createId("sess"),
      orgId: params.orgId,
      userId: params.userId,
      projectId: params.projectId,
      source: params.source,
      mode: params.mode ?? "assisted",
      createdAt: now,
      updatedAt: now,
      status: "active",
      memory: emptyMemory(),
      metadata: params.metadata,
    };
    store.set(session.id, session);
    return session;
  }

  async get(id: string): Promise<AgentSession> {
    const session = store.get(id);
    if (!session) throw new Error(`Session not found: ${id}`);
    return session;
  }

  async update(id: string, patch: Partial<AgentSession>): Promise<AgentSession> {
    const session = await this.get(id);
    const updated = { ...session, ...patch, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  }

  async list(limit = 50): Promise<AgentSession[]> {
    return Array.from(store.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async close(id: string): Promise<void> {
    await this.update(id, { status: "closed" });
  }
}
