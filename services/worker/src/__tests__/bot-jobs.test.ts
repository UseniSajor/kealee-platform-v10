import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
}))

vi.mock('@kealee/database', () => ({
  prisma: {
    jobQueue: { update: mocks.update },
  },
}))

vi.mock('@kealee/queue', () => ({
  KEALEE_QUEUES: {
    BOT_JOBS: 'bot-jobs',
    CHAIN_JOBS: 'chain-jobs',
  },
  createWorker: vi.fn(),
}))

import {
  persistFailedBotJob,
  processBotJob,
  processChainJob,
} from '../processors/bot-jobs.processor'

describe('System C worker processors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.update.mockResolvedValue({})
  })

  it('executes a bot job and persists completion', async () => {
    const execute = vi.fn().mockResolvedValue({ success: true, result: { ok: true } })
    const persistBotConversation = vi.fn().mockResolvedValue(undefined)
    const job = {
      id: 'job-1',
      attemptsMade: 0,
      data: {
        requestId: 'job-1',
        botId: 'owner-bot',
        input: { data: { projectId: 'project-1' } },
        context: { userId: 'user-1' },
        timeoutMs: 1000,
      },
    } as any

    const result = await processBotJob(job, modulePath => (
      modulePath === 'bots.registry'
        ? { botRegistry: { get: () => ({ execute }) } }
        : { persistBotConversation }
    ))

    expect(result).toMatchObject({ success: true })
    expect(persistBotConversation).toHaveBeenCalledWith(
      job.data.input.data,
      result,
      expect.objectContaining({ botId: 'owner-bot', userId: 'user-1' }),
    )
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED', progress: 100 }),
    }))
  })

  it('persists failed job state', async () => {
    await persistFailedBotJob(
      'bot-jobs',
      { id: 'job-2', attemptsMade: 3 } as any,
      new Error('model timeout'),
    )
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', error: 'model timeout' }),
    }))
  })

  it('preserves chain dependency-gating failures', async () => {
    const job = {
      id: 'chain-1',
      attemptsMade: 0,
      data: {
        requestId: 'chain-1',
        input: { projectId: 'project-1' },
        context: { userId: 'user-1' },
        timeoutMs: 1000,
      },
    } as any
    await expect(processChainJob(job, () => ({
      runChain: vi.fn().mockRejectedValue(new Error('EstimateBot blocked: DesignBot not complete')),
    }))).rejects.toThrow('DesignBot not complete')
  })
})
