import { describe, expect, it, vi } from 'vitest'
import { PrismaRuntimeStore } from '../prisma-store'

describe('PrismaRuntimeStore atomic claims', () => {
  it('allows only one worker to claim the same runnable step', async () => {
    let status = 'READY'
    const updateMany = vi.fn(async ({ where, data }: any) => {
      await Promise.resolve()
      if (!where.status.in.includes(status)) return { count: 0 }
      status = data.status
      return { count: 1 }
    })
    const store = new PrismaRuntimeStore({ autonomousStep: { updateMany } } as any)
    const [workerA, workerB] = await Promise.all([
      store.claimStep('run-1', 'design', new Date()),
      store.claimStep('run-1', 'design', new Date()),
    ])
    expect([workerA, workerB].filter(Boolean)).toHaveLength(1)
    expect(updateMany).toHaveBeenCalledTimes(2)
  })

  it('reclaims expired run leases without touching active leases', async () => {
    const updateMany = vi.fn(async ({ where }: any) => ({ count: where.leaseExpiresAt.lt ? 2 : 0 }))
    const store = new PrismaRuntimeStore({ autonomousRun: { updateMany } } as any)
    expect(await store.reclaimExpiredLeases(new Date('2026-07-20T20:00:00Z'))).toBe(2)
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'RUNNING' }),
      data: expect.objectContaining({ status: 'QUEUED', leaseOwner: null }),
    }))
  })
})

