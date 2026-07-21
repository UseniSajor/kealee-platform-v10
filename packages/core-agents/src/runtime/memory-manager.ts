import { AgentSession, DecisionRecord, ExecutionPlan, SessionMemory } from "../types";
import { SessionManager } from "./session-manager";

export class MemoryManager {
  constructor(private readonly sessions: SessionManager) {}

  async appendNote(sessionId: string, note: string): Promise<void> {
    const session = await this.sessions.get(sessionId);
    session.memory.agentNotes.push(`[${new Date().toISOString()}] ${note}`);
    await this.sessions.update(sessionId, { memory: session.memory });
  }

  async setPlan(sessionId: string, plan: ExecutionPlan): Promise<void> {
    const session = await this.sessions.get(sessionId);
    session.memory.currentPlan = plan;
    await this.sessions.update(sessionId, { memory: session.memory });
  }

  async recordStepOutput(
    sessionId: string,
    stepId: string,
    output: unknown,
  ): Promise<void> {
    const session = await this.sessions.get(sessionId);
    session.memory.stepOutputs[stepId] = output;
    await this.sessions.update(sessionId, { memory: session.memory });
  }

  async setFact(sessionId: string, key: string, value: unknown): Promise<void> {
    const session = await this.sessions.get(sessionId);
    session.memory.facts[key] = value;
    await this.sessions.update(sessionId, { memory: session.memory });
  }

  async setRiskFlag(sessionId: string, flag: string): Promise<void> {
    const session = await this.sessions.get(sessionId);
    if (!session.memory.riskFlags.includes(flag)) {
      session.memory.riskFlags.push(flag);
      await this.sessions.update(sessionId, { memory: session.memory });
    }
  }

  async recordDecision(sessionId: string, decision: Omit<DecisionRecord, "at">): Promise<void> {
    const session = await this.sessions.get(sessionId);
    session.memory.decisions.push({ ...decision, at: new Date().toISOString() });
    await this.sessions.update(sessionId, { memory: session.memory });
  }

  async setOutput(sessionId: string, key: string, value: unknown): Promise<void> {
    const session = await this.sessions.get(sessionId);
    session.memory.outputs[key] = value;
    await this.sessions.update(sessionId, { memory: session.memory });
  }

  // TODO: implement promoteToProjectMemory — persist key outputs to the Project record in DB
  async promoteToProjectMemory(
    sessionId: string,
    keys: string[],
  ): Promise<void> {
    const session = await this.sessions.get(sessionId);
    if (!session.projectId) return;
    // TODO: upsert session.memory.outputs[key] → ProjectMemory table keyed by projectId
    console.log(
      `[MemoryManager] TODO: promote keys ${keys.join(",")} to project ${session.projectId}`,
    );
  }

  async getMemory(sessionId: string): Promise<SessionMemory> {
    const session = await this.sessions.get(sessionId);
    return session.memory;
  }
}
