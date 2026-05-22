import type { AgentRunStep, HermesTask } from './types'

export interface HermesOrchestratorOptions {
  apiUrl?: string
  apiKey?: string
}

export class HermesOrchestrator {
  constructor(private readonly options: HermesOrchestratorOptions = {}) {}

  get isLive(): boolean {
    return Boolean(this.options.apiUrl)
  }

  async plan(task: HermesTask): Promise<AgentRunStep[]> {
    if (!this.options.apiUrl) {
      return task.agents.map(agent => ({
        agent,
        status: 'completed',
        summary: `Dry-run Hermes plan for ${agent}: ${task.goal}`,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }))
    }

    const response = await fetch(`${this.options.apiUrl.replace(/\/$/, '')}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(task),
    })

    if (!response.ok) {
      throw new Error(`Hermes orchestration failed: ${response.status} ${await response.text()}`)
    }

    const data = await response.json() as { steps?: AgentRunStep[] }
    return data.steps?.length
      ? data.steps
      : task.agents.map(agent => ({
          agent,
          status: 'completed',
          summary: `Hermes accepted task ${task.id}`,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }))
  }
}
