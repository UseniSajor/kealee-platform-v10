import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  redis: new Map<string, string>(),
  conversationCreate: vi.fn().mockResolvedValue({ id: 'conversation-1' }),
}))

vi.mock('ioredis', () => ({
  default: class MockRedis {
    async get(key: string) {
      return state.redis.get(key) ?? null
    }
    async set(key: string, value: string) {
      state.redis.set(key, value)
      return 'OK'
    }
    async del(key: string) {
      return state.redis.delete(key) ? 1 : 0
    }
  },
}))

vi.mock('@kealee/database', () => ({
  prisma: {
    faq: { findMany: vi.fn().mockResolvedValue([]) },
    aIConversation: { create: state.conversationCreate },
  },
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Tell me more about your project.' }],
      }),
    }
  },
}))

describe('KeaBot Redis persistence', () => {
  beforeEach(() => {
    state.redis.clear()
    state.conversationCreate.mockClear()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    vi.resetModules()
  })

  it('persists session history outside process memory', async () => {
    const first = await import('../keabot-engine')
    await first.chat('session-1', 'Kitchen remodel in DC', { userId: 'user-1' })

    vi.resetModules()
    const restarted = await import('../keabot-engine')
    const history = await restarted.getConversation('session-1')

    expect(history).toHaveLength(2)
    expect(history[0].content).toContain('Kitchen remodel')
  })

  it('persists ended sessions to AIConversation and clears Redis', async () => {
    const engine = await import('../keabot-engine')
    await engine.chat('session-2', 'Budget is $100k', { userId: 'user-2' })
    const score = await engine.endSession('session-2')

    expect(score).not.toBeNull()
    expect(state.conversationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-2',
        context: expect.objectContaining({ source: 'website-chat', sessionId: 'session-2' }),
      }),
    }))
    expect(await engine.getConversation('session-2')).toEqual([])
  })
})
