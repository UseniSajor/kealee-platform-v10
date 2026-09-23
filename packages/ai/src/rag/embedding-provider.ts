/**
 * Embedding providers behind one interface.
 *
 * Why this exists (amendment 7 of docs/decisions/toolchain-self-sufficiency.md):
 *
 *  - The corpus should not require an OpenAI key to be BUILT. Embedding is the
 *    one step that would otherwise turn "index everything we have delivered"
 *    into a metered API bill, which is exactly the pressure that leads to a
 *    half-indexed corpus.
 *  - The provider must be swappable without losing the existing index. Vectors
 *    from two models are not comparable, so a switch is a VERSIONED RE-EMBED,
 *    never an in-place mutation. `RagDocument.embeddingVersion` carries that.
 *  - Retrieval quality must be benchmarked BEFORE a switch, not assumed.
 *    `benchmarkProviders()` is the harness for that.
 *
 * The local provider is deliberately a deterministic hashing embedder rather
 * than a downloaded transformer. It has no dependencies, no download, no
 * licence question and no cold start, and it is genuinely useful for exact and
 * near-exact term overlap — which is most of what "has a reviewer raised this
 * before in this zone?" actually needs. It is NOT semantically equivalent to a
 * trained model and this module says so rather than implying parity.
 */

export interface EmbeddingProvider {
  readonly name: string
  readonly model: string
  readonly dimensions: number
  /** Cost per million tokens, USD. Zero for local. */
  readonly costPerMillionTokens: number
  /** True when the provider sends text to a third party. */
  readonly sendsDataOffPlatform: boolean
  embed(texts: string[]): Promise<number[][]>
}

// ── Local: deterministic, free, offline ─────────────────────────────────────

const LOCAL_DIMS = 512

/** FNV-1a. Stable across processes and Node versions, which a JS hash must be. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
}

/**
 * Hashed bag-of-terms with sublinear term weighting, L2-normalised.
 *
 * Unigrams AND bigrams: "front setback" must not embed the same as "setback
 * front", and in this domain the adjacent pair carries most of the meaning.
 */
export function localEmbed(text: string, dims = LOCAL_DIMS): number[] {
  const vec = new Array<number>(dims).fill(0)
  const terms = tokenise(text)
  const counts = new Map<string, number>()

  for (let i = 0; i < terms.length; i++) {
    const uni = terms[i]
    counts.set(uni, (counts.get(uni) ?? 0) + 1)
    if (i + 1 < terms.length) {
      const bi = `${terms[i]} ${terms[i + 1]}`
      counts.set(bi, (counts.get(bi) ?? 0) + 1)
    }
  }

  for (const [term, count] of counts) {
    const h = fnv1a(term)
    const idx = h % dims
    // Sign from a second hash bit so distinct terms can cancel rather than
    // only ever accumulating, which is what keeps a long document from
    // saturating every dimension.
    const sign = (h >>> 31) & 1 ? -1 : 1
    vec[idx] += sign * (1 + Math.log(count))
  }

  let norm = 0
  for (const v of vec) norm += v * v
  norm = Math.sqrt(norm)
  if (norm === 0) return vec
  return vec.map(v => v / norm)
}

export function createLocalEmbeddingProvider(dims = LOCAL_DIMS): EmbeddingProvider {
  return {
    name: 'local-hashed-bigram',
    model: `local-hashed-bigram-${dims}`,
    dimensions: dims,
    costPerMillionTokens: 0,
    sendsDataOffPlatform: false,
    async embed(texts) { return texts.map(t => localEmbed(t, dims)) },
  }
}

// ── OpenAI: the incumbent, kept ─────────────────────────────────────────────

export function createOpenAiEmbeddingProvider(opts: {
  apiKey?: string
  model?: string
  dimensions?: number
} = {}): EmbeddingProvider {
  const model = opts.model ?? process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small'
  const dimensions = opts.dimensions ?? parseInt(process.env.EMBEDDING_DIMENSION ?? '1536', 10)
  return {
    name: 'openai',
    model,
    dimensions,
    costPerMillionTokens: 0.02,
    sendsDataOffPlatform: true,
    async embed(texts) {
      const apiKey = opts.apiKey ?? process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error(
          'The OpenAI embedding provider needs EMBEDDING_API_KEY or OPENAI_API_KEY. ' +
          'Set EMBEDDING_PROVIDER=local to index without one.',
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const OpenAI = require('openai')
      const client = new OpenAI({ apiKey })
      const resp = await client.embeddings.create({
        model,
        input: texts.map(t => t.slice(0, 8192)),
      })
      return resp.data.map((d: { embedding: number[] }) => d.embedding)
    },
  }
}

/**
 * The provider this process should use.
 *
 * Defaults to LOCAL. That is the deliberate choice: indexing must never be
 * blocked on a billing relationship, and the corpus is the asset. Set
 * `EMBEDDING_PROVIDER=openai` to use the metered one.
 */
export function resolveEmbeddingProvider(
  override?: string | null,
): EmbeddingProvider {
  const choice = (override ?? process.env.EMBEDDING_PROVIDER ?? 'local').toLowerCase()
  switch (choice) {
    case 'openai': return createOpenAiEmbeddingProvider()
    case 'local': return createLocalEmbeddingProvider()
    default:
      throw new Error(
        `Unknown EMBEDDING_PROVIDER "${choice}". Known providers: local, openai.`,
      )
  }
}

// ── Similarity and benchmarking ─────────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Cannot compare a ${a.length}-dimension vector with a ${b.length}-dimension one. ` +
      'This is the signature of a corpus half-embedded under two models — re-embed ' +
      'under one embeddingVersion rather than mixing them.',
    )
  }
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export interface BenchmarkCase {
  query: string
  /** Text that SHOULD rank above everything in `distractors`. */
  relevant: string
  distractors: string[]
}

export interface BenchmarkResult {
  provider: string
  model: string
  cases: number
  /** Share of cases where the relevant text outranked every distractor. */
  precisionAt1: number
  /** Mean margin between the relevant score and the best distractor. */
  meanMargin: number
  failures: { query: string; relevantScore: number; bestDistractor: string; distractorScore: number }[]
}

/**
 * Benchmarks a provider before anything switches to it.
 *
 * Amendment 7 requires retrieval quality to be measured rather than assumed.
 * This is deliberately a small, readable harness over cases the DOMAIN cares
 * about, not a generic IR benchmark: what matters is whether a setback
 * question retrieves a setback redline.
 */
export async function benchmarkProvider(
  provider: EmbeddingProvider,
  cases: BenchmarkCase[],
): Promise<BenchmarkResult> {
  let hits = 0
  let marginSum = 0
  const failures: BenchmarkResult['failures'] = []

  for (const c of cases) {
    const [q, rel, ...dis] = await provider.embed([c.query, c.relevant, ...c.distractors])
    const relScore = cosineSimilarity(q, rel)
    let bestDistractorScore = -Infinity
    let bestDistractor = ''
    dis.forEach((d, i) => {
      const s = cosineSimilarity(q, d)
      if (s > bestDistractorScore) { bestDistractorScore = s; bestDistractor = c.distractors[i] }
    })
    if (dis.length === 0) bestDistractorScore = 0
    marginSum += relScore - bestDistractorScore
    if (relScore > bestDistractorScore) hits++
    else failures.push({ query: c.query, relevantScore: relScore, bestDistractor, distractorScore: bestDistractorScore })
  }

  return {
    provider: provider.name,
    model: provider.model,
    cases: cases.length,
    precisionAt1: cases.length ? hits / cases.length : 0,
    meanMargin: cases.length ? marginSum / cases.length : 0,
    failures,
  }
}
