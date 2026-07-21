export interface BotJobData {
  requestId: string
  botId: string
  input: {
    data: Record<string, unknown>
    options?: {
      tier?: 'fast' | 'standard' | 'premium'
      model?: string
      maxTokens?: number
      temperature?: number
    }
  }
  context: {
    userId?: string
    orgId?: string
    sessionId?: string
  }
  timeoutMs?: number
}

export interface ChainJobData {
  requestId: string
  input: Record<string, unknown>
  context: {
    userId?: string
    orgId?: string
  }
  timeoutMs?: number
}
