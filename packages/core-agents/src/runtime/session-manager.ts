import { prisma } from "@kealee/database";
import { AgentSession, SessionMemory } from "../types";

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

function dbRowToSession(row: {
  id: string;
  orgId: string | null;
  userId: string | null;
  projectId: string | null;
  threadId: string | null;
  source: string;
  mode: string;
  status: string;
  memory: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}): AgentSession {
  return {
    id: row.id,
    orgId: row.orgId ?? undefined,
    userId: row.userId ?? undefined,
    projectId: row.projectId ?? undefined,
    threadId: row.threadId ?? undefined,
    source: row.source as AgentSession["source"],
    mode: row.mode as AgentSession["mode"],
    status: row.status as AgentSession["status"],
    memory: (row.memory as SessionMemory) ?? emptyMemory(),
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
    const row = await prisma.agentSession.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        projectId: params.projectId,
        source: params.source,
        mode: params.mode ?? "assisted",
        status: "active",
        memory: emptyMemory() as object,
        metadata: params.metadata as object | undefined,
      },
    });
    return dbRowToSession(row);
  }

  async get(id: string): Promise<AgentSession> {
    const row = await prisma.agentSession.findUniqueOrThrow({ where: { id } });
    return dbRowToSession(row);
  }

  async update(id: string, patch: Partial<AgentSession>): Promise<AgentSession> {
    const data: Record<string, unknown> = {};
    if (patch.orgId !== undefined)     data.orgId     = patch.orgId;
    if (patch.userId !== undefined)    data.userId    = patch.userId;
    if (patch.projectId !== undefined) data.projectId = patch.projectId;
    if (patch.threadId !== undefined)  data.threadId  = patch.threadId;
    if (patch.source !== undefined)    data.source    = patch.source;
    if (patch.mode !== undefined)      data.mode      = patch.mode;
    if (patch.status !== undefined)    data.status    = patch.status;
    if (patch.memory !== undefined)    data.memory    = patch.memory as object;
    if (patch.metadata !== undefined)  data.metadata  = patch.metadata as object;

    const row = await prisma.agentSession.update({ where: { id }, data });
    return dbRowToSession(row);
  }

  async list(limit = 50): Promise<AgentSession[]> {
    const rows = await prisma.agentSession.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(dbRowToSession);
  }

  async close(id: string): Promise<void> {
    await prisma.agentSession.update({
      where: { id },
      data: { status: "closed", closedAt: new Date() },
    });
  }
}
