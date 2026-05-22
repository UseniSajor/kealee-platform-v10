import type { OrgoAction, OrgoActionResult } from './types'

export interface OrgoComputerClientOptions {
  apiUrl?: string
  apiKey?: string
}

export class OrgoComputerClient {
  constructor(private readonly options: OrgoComputerClientOptions = {}) {}

  get isLive(): boolean {
    return Boolean(this.options.apiUrl)
  }

  async runAction(action: OrgoAction): Promise<OrgoActionResult> {
    if (!this.options.apiUrl) {
      return {
        action,
        ok: true,
        summary: `Dry-run Orgo action ${action.type} against ${action.target}`,
      }
    }

    const response = await fetch(`${this.options.apiUrl.replace(/\/$/, '')}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(action),
    })

    if (!response.ok) {
      return {
        action,
        ok: false,
        summary: `Orgo action failed: ${response.status} ${await response.text()}`,
      }
    }

    const data = await response.json() as Partial<OrgoActionResult>
    return {
      action,
      ok: data.ok ?? true,
      summary: data.summary ?? `Orgo action completed for ${action.target}`,
      artifactUrl: data.artifactUrl,
    }
  }
}
