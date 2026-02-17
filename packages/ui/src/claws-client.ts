/**
 * @kealee/ui — Shared CLAW Client for all mini-apps.
 *
 * Provides universal CLAW gateway integration for any frontend app.
 * Each app imports { ClawsClient } from '@kealee/ui' and passes its own auth token getter.
 *
 * All 8 CLAWs are active and connected from the moment a user interacts:
 *   A: Acquisition & PreCon    E: Permits & Compliance
 *   B: Contract & Commercials  F: Docs & Communication
 *   C: Schedule & Field Ops    G: Risk & Predictions
 *   D: Budget & Cost Control   H: Command Center & Automation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClawStatus {
  name: string
  id: string
  status: 'online' | 'offline' | 'degraded'
  lastEvent?: string
  lastEventAt?: string
}

export interface ClawSystemHealth {
  status: 'ok' | 'degraded' | 'down'
  claws: ClawStatus[]
  eventBus: 'connected' | 'disconnected'
  totalClaws: number
  onlineClaws: number
}

export interface ClawTaskStatus {
  taskId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  claw: string
  progress: number
  result?: any
  error?: string
}

export interface ClawActivityItem {
  id: string
  type: string
  claw: string
  message: string
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  projectId?: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class ClawsClient {
  private baseUrl: string
  private getToken: () => Promise<string | null>

  constructor(options?: {
    baseUrl?: string
    getToken?: () => Promise<string | null>
  }) {
    this.baseUrl = options?.baseUrl || process.env.NEXT_PUBLIC_CLAWS_URL || 'http://localhost:3002'
    this.getToken = options?.getToken || (async () => null)
  }

  private async fetch<T = any>(path: string, options?: RequestInit): Promise<T> {
    const token = await this.getToken()
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `CLAW request failed (${res.status})`)
    }

    return res.json()
  }

  // ── System Health ──────────────────────────────────────────────

  async health(): Promise<ClawSystemHealth> {
    return this.fetch('/health')
  }

  async status(): Promise<{ claws: ClawStatus[] }> {
    return this.fetch('/api/claws/command/status')
  }

  // ── Project Tasks & Activity ───────────────────────────────────

  async tasks(projectId: string): Promise<{ tasks: ClawTaskStatus[] }> {
    return this.fetch(`/api/claws/command/tasks?projectId=${projectId}`)
  }

  async activity(projectId: string): Promise<{ activities: ClawActivityItem[] }> {
    return this.fetch(`/api/claws/command/activity?projectId=${projectId}`)
  }

  // ── Claw A: Acquisition & PreCon ──────────────────────────────

  async quickStart(data: Record<string, any>): Promise<any> {
    return this.fetch('/api/claws/acquisition/estimates/quick-start', {
      method: 'POST',
      body: JSON.stringify({ ...data, activateClaws: true }),
    })
  }

  async getEstimate(projectId: string): Promise<any> {
    return this.fetch(`/api/claws/acquisition/estimates/${projectId}`)
  }

  async requestBids(projectId: string): Promise<any> {
    return this.fetch('/api/claws/acquisition/bids/request', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    })
  }

  // ── Claw B: Contracts ─────────────────────────────────────────

  async initiateContract(projectId: string, bidId: string): Promise<any> {
    return this.fetch('/api/claws/contracts/initiate', {
      method: 'POST',
      body: JSON.stringify({ projectId, bidId }),
    })
  }

  // ── Claw C: Schedule ──────────────────────────────────────────

  async getSchedule(projectId: string): Promise<any> {
    return this.fetch(`/api/claws/schedule/${projectId}`)
  }

  // ── Claw D: Budget ────────────────────────────────────────────

  async getBudget(projectId: string): Promise<any> {
    return this.fetch(`/api/claws/budget/${projectId}`)
  }

  // ── Claw E: Permits ───────────────────────────────────────────

  async submitPermit(projectId: string, packageTier: string): Promise<any> {
    return this.fetch('/api/claws/permits/submit', {
      method: 'POST',
      body: JSON.stringify({ projectId, packageTier }),
    })
  }

  async getPermitStatus(projectId: string): Promise<any> {
    return this.fetch(`/api/claws/permits/${projectId}`)
  }

  // ── Claw F: Docs & Communication ──────────────────────────────

  async sendMessage(projectId: string, message: string): Promise<any> {
    return this.fetch('/api/messenger/send', {
      method: 'POST',
      body: JSON.stringify({ projectId, message }),
    })
  }

  async generateDocument(projectId: string, type: string): Promise<any> {
    return this.fetch('/api/claws/docs/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId, type }),
    })
  }

  // ── Claw G: Risk & Predictions ────────────────────────────────

  async getRisks(projectId: string): Promise<any> {
    return this.fetch(`/api/claws/risk/${projectId}`)
  }

  async getDecisions(projectId: string): Promise<any> {
    return this.fetch(`/api/claws/risk/${projectId}/decisions`)
  }

  // ── Claw H: Command Center ────────────────────────────────────

  async getAutomationRules(projectId: string): Promise<any> {
    return this.fetch(`/api/claws/command/automation?projectId=${projectId}`)
  }

  async triggerJob(queueName: string, jobData: Record<string, any>): Promise<any> {
    return this.fetch('/api/claws/command/jobs/dispatch', {
      method: 'POST',
      body: JSON.stringify({ queueName, data: jobData }),
    })
  }
}

/**
 * Singleton factory — use this in each app:
 *
 * ```ts
 * import { createClawsClient } from '@kealee/ui'
 * import { getAuthToken } from './supabase'
 *
 * export const claws = createClawsClient({ getToken: getAuthToken })
 * ```
 */
export function createClawsClient(options?: {
  baseUrl?: string
  getToken?: () => Promise<string | null>
}): ClawsClient {
  return new ClawsClient(options)
}
