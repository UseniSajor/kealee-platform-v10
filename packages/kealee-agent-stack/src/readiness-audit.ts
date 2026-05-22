import { randomUUID } from 'crypto'
import type { AgentRunRequest, AgentRunResult, AgentRunStep, OrgoAction } from './types'
import { HermesOrchestrator } from './hermes'
import { OrgoComputerClient } from './orgo'
import { ObsidianVaultWriter } from './obsidian'
import { KeaBotBridge } from './keabot-bridge'
import { READINESS_PLAYBOOK, createBaselineFindings, createPlaybookSteps } from './playbook'

export interface ReadinessAuditRunnerOptions {
  hermes: HermesOrchestrator
  orgo: OrgoComputerClient
  obsidian: ObsidianVaultWriter
  keabots: KeaBotBridge
  siteUrl?: string
}

export class ReadinessAuditRunner {
  constructor(private readonly options: ReadinessAuditRunnerOptions) {}

  async run(request: Partial<AgentRunRequest> = {}): Promise<AgentRunResult> {
    const id = randomUUID()
    const startedAt = new Date().toISOString()
    const mode = request.mode ?? (this.options.hermes.isLive && this.options.orgo.isLive ? 'live' : 'dry-run')
    const agents = request.agents?.length ? request.agents : READINESS_PLAYBOOK.map(agent => agent.name)

    const hermesSteps = await this.options.hermes.plan({
      id,
      name: request.name ?? 'Kealee Blocking Launch Readiness Audit',
      goal: request.goal ?? 'Audit repo, agent ops, and web-main sales funnel for blocking launch readiness.',
      agents,
      mode,
      metadata: request.metadata,
    })

    const orgoActions = await this.runWebsiteSmoke(mode)
    const keabots = await this.options.keabots.listBots()
    const completedAt = new Date().toISOString()
    const steps = mergeSteps(createPlaybookSteps(), hermesSteps, orgoActions)
    const findings = createBaselineFindings({
      ambientTypesFixed: true,
      keabotCount: keabots.length,
      mode,
    })

    const result: AgentRunResult = {
      id,
      name: request.name ?? 'Kealee Blocking Launch Readiness Audit',
      goal: request.goal ?? 'Audit repo, agent ops, and web-main sales funnel for blocking launch readiness.',
      mode,
      status: 'completed',
      startedAt,
      completedAt,
      steps,
      findings,
      score: scoreFindings(findings),
      metadata: {
        ...request.metadata,
        keabotCount: keabots.length,
        keabots,
        orgoActions,
      },
    }

    return this.options.obsidian.writeRun(result)
  }

  private async runWebsiteSmoke(mode: 'dry-run' | 'live') {
    const siteUrl = this.options.siteUrl ?? 'http://localhost:3000'
    const actions: OrgoAction[] = [
      { type: 'open-url', target: `${siteUrl}/` },
      { type: 'open-url', target: `${siteUrl}/concept` },
      { type: 'smoke-flow', target: `${siteUrl}/concept/details?service=kitchen_remodel`, metadata: { viewport: 'desktop' } },
      { type: 'smoke-flow', target: `${siteUrl}/concept/details?service=kitchen_remodel`, metadata: { viewport: 'mobile' } },
    ]

    if (mode === 'dry-run') {
      return Promise.all(actions.map(action => this.options.orgo.runAction(action)))
    }

    return Promise.all(actions.map(action => this.options.orgo.runAction(action)))
  }
}

function mergeSteps(base: AgentRunStep[], hermes: AgentRunStep[], orgoActions: Awaited<ReturnType<OrgoComputerClient['runAction']>>[]): AgentRunStep[] {
  const byAgent = new Map(base.map(step => [step.agent, { ...step }]))
  for (const step of hermes) {
    const existing = byAgent.get(step.agent)
    byAgent.set(step.agent, {
      ...(existing ?? step),
      ...step,
      status: step.status === 'failed' ? 'failed' : 'completed',
    })
  }
  byAgent.set('Orgo Website Smoke', {
    agent: 'Orgo Website Smoke',
    area: 'website-funnel',
    status: orgoActions.every(action => action.ok) ? 'completed' : 'failed',
    summary: orgoActions.map(action => action.summary).join('; '),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  })
  return [...byAgent.values()]
}

function scoreFindings(findings: AgentRunResult['findings']): number {
  const penalty = findings.reduce((sum, finding) => {
    if (finding.severity === 'blocker') return sum + 35
    if (finding.severity === 'high') return sum + 20
    if (finding.severity === 'medium') return sum + 10
    return sum + 3
  }, 0)
  return Math.max(0, 100 - penalty)
}
