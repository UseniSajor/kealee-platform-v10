import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('@kealee/queue', () => ({
  KEALEE_QUEUES: {
    BOT_JOBS: 'bot-jobs',
    CHAIN_JOBS: 'chain-jobs',
    RAG_INGEST: 'rag-ingest',
  },
  createQueue: vi.fn(() => ({ add: mocks.add })),
}))

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    jobQueue: {
      upsert: mocks.upsert,
      update: mocks.update,
      findFirst: mocks.findFirst,
    },
  },
}))

import { enqueueBotJob, enqueueChainJob, getBotJob } from '../bots.queue'

describe('System C queue persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.add.mockImplementation((_name, _data, options) => Promise.resolve({ id: options.jobId }))
    mocks.upsert.mockResolvedValue({})
    mocks.update.mockResolvedValue({})
  })

  it('creates a persistent bot job', async () => {
    const result = await enqueueBotJob(
      'owner-bot',
      { data: { projectId: 'project-1' } },
      { userId: 'user-1' },
    )

    expect(result.jobId).toBe(result.requestId)
    expect(mocks.add).toHaveBeenCalledWith(
      'execute-bot',
      expect.objectContaining({ botId: 'owner-bot' }),
      expect.objectContaining({ jobId: result.requestId }),
    )
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ queueName: 'bot-jobs', status: 'WAITING' }),
    }))
  })

  it('creates a chain job with dependency-gated chain execution payload', async () => {
    const result = await enqueueChainJob(
      { projectId: 'project-1', projectType: 'remodel', location: 'DC', scope: 'Kitchen' },
      { userId: 'user-1' },
    )
    expect(mocks.add).toHaveBeenCalledWith(
      'execute-chain',
      expect.objectContaining({ requestId: result.requestId }),
      expect.any(Object),
    )
  })

  it('persists a failed state when queue insertion fails', async () => {
    mocks.add.mockRejectedValueOnce(new Error('redis unavailable'))

    await expect(enqueueBotJob(
      'owner-bot',
      { data: { projectId: 'project-1' } },
      { userId: 'user-1' },
    )).rejects.toThrow('redis unavailable')

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', error: 'redis unavailable' }),
    }))
  })

  it('returns persisted job status for polling', async () => {
    mocks.findFirst.mockResolvedValue({
      jobId: 'job-1',
      queueName: 'bot-jobs',
      status: 'FAILED',
      progress: 10,
      attempts: 3,
      maxAttempts: 3,
      result: null,
      error: 'timeout',
      createdAt: new Date(),
      processedAt: new Date(),
      completedAt: null,
      failedAt: new Date(),
    })
    const job = await getBotJob('job-1')
    expect(job).toMatchObject({ jobId: 'job-1', status: 'FAILED', error: 'timeout' })
  })
})
