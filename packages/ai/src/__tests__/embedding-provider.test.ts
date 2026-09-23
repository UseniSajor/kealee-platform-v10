/**
 * The local provider has to be good enough to build the corpus with, and the
 * benchmark has to be able to TELL whether it is. These tests check both, on
 * cases from the actual domain.
 */
import { describe, it, expect } from 'vitest'
import {
  createLocalEmbeddingProvider, resolveEmbeddingProvider, localEmbed,
  cosineSimilarity, benchmarkProvider, type BenchmarkCase,
} from '../rag/embedding-provider'

const local = createLocalEmbeddingProvider()

describe('the local provider', () => {
  it('is free and keeps platform data on the platform', () => {
    expect(local.costPerMillionTokens).toBe(0)
    expect(local.sendsDataOffPlatform).toBe(false)
  })

  it('is the DEFAULT, so indexing is never blocked on a billing relationship', () => {
    const saved = process.env.EMBEDDING_PROVIDER
    delete process.env.EMBEDDING_PROVIDER
    const resolved = resolveEmbeddingProvider()
    expect(resolved.name).toBe(local.name)
    expect(resolved.sendsDataOffPlatform, 'the default must not send data off platform').toBe(false)
    expect(resolved.costPerMillionTokens, 'the default must be free to index with').toBe(0)
    if (saved) process.env.EMBEDDING_PROVIDER = saved
  })

  it('refuses an unknown provider by name rather than falling back silently', () => {
    expect(() => resolveEmbeddingProvider('word2vec')).toThrow(/Unknown EMBEDDING_PROVIDER/)
  })

  it('is deterministic across calls', async () => {
    const [a] = await local.embed(['front setback in RSF-65'])
    const [b] = await local.embed(['front setback in RSF-65'])
    expect(a).toEqual(b)
  })

  it('produces unit vectors', () => {
    const v = localEmbed('driveway apron exceeds twenty feet at the right of way')
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
    expect(norm).toBeCloseTo(1, 6)
  })

  it('distinguishes word ORDER, which unigrams alone cannot', () => {
    // "front setback" and "setback front" are different things on a sheet.
    const a = localEmbed('front setback line')
    const b = localEmbed('setback front line')
    expect(cosineSimilarity(a, b)).toBeLessThan(0.999)
  })

  it('scores a document against itself at 1', () => {
    const v = localEmbed('lot coverage exceeds the thirty five percent maximum')
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 10)
  })
})

describe('dimension mismatch', () => {
  it('refuses to compare vectors from two models, and says why', () => {
    // A corpus half-embedded under two models is the failure this guards.
    expect(() => cosineSimilarity(localEmbed('a', 64), localEmbed('a', 128)))
      .toThrow(/half-embedded under two models/)
  })
})

describe('the benchmark harness', () => {
  // Cases from the domain: a question about a constraint should retrieve the
  // finding about that constraint, not a finding about a different one.
  const cases: BenchmarkCase[] = [
    {
      query: 'front setback non compliance',
      relevant: 'The proposed dwelling encroaches into the 25 ft front setback by 3 ft.',
      distractors: [
        'The tree canopy calculation omits the rear woodland area.',
        'Sediment control measures are not shown at the limit of disturbance.',
      ],
    },
    {
      query: 'lot coverage exceeds the zoning maximum',
      relevant: 'Lot coverage of 38 percent exceeds the RSF-65 maximum of 35 percent.',
      distractors: [
        'The driveway apron exceeds 20 ft where it meets the right of way.',
        'Spot elevations are absent and require a field survey.',
      ],
    },
    {
      query: 'driveway apron width at the right of way',
      relevant: 'The driveway apron exceeds 20 ft where it meets the right of way.',
      distractors: [
        'Lot coverage of 38 percent exceeds the RSF-65 maximum of 35 percent.',
        'The proposed dwelling encroaches into the 25 ft front setback by 3 ft.',
      ],
    },
  ]

  it('ranks the relevant finding first on every domain case', async () => {
    const r = await benchmarkProvider(local, cases)
    expect(r.precisionAt1, `failures: ${JSON.stringify(r.failures)}`).toBe(1)
    expect(r.meanMargin).toBeGreaterThan(0)
  })

  it('reports failures rather than only a score', async () => {
    // A benchmark that cannot show WHICH case failed cannot be acted on.
    const impossible: BenchmarkCase[] = [
      { query: 'zzz', relevant: 'qqq', distractors: ['zzz'] },
    ]
    const r = await benchmarkProvider(local, impossible)
    expect(r.precisionAt1).toBe(0)
    expect(r.failures).toHaveLength(1)
    expect(r.failures[0].bestDistractor).toBe('zzz')
  })

  it('carries the model name so a result can be tied to what produced it', async () => {
    const r = await benchmarkProvider(local, cases)
    expect(r.model).toMatch(/local-hashed-bigram/)
  })
})
