import type { KeaBotDescriptor } from './types'

export interface KeaBotBridgeOptions {
  listBots?: () => Promise<KeaBotDescriptor[]> | KeaBotDescriptor[]
}

export class KeaBotBridge {
  constructor(private readonly options: KeaBotBridgeOptions = {}) {}

  async listBots(): Promise<KeaBotDescriptor[]> {
    if (!this.options.listBots) return []
    return this.options.listBots()
  }
}
