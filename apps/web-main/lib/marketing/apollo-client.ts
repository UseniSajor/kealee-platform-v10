export interface ApolloSearchPage {
  people: Array<Record<string, unknown>>
  nextPage: number | null
  totalEntries?: number
}

export class ApolloRateLimitError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super('Apollo API rate limit exceeded')
  }
}

export class ApolloClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly maxRetries: number

  constructor(options: { apiKey?: string; baseUrl?: string; timeoutMs?: number; maxRetries?: number } = {}) {
    const apiKey = options.apiKey ?? process.env.APOLLO_API_KEY
    if (!apiKey) throw new Error('APOLLO_API_KEY is required when Apollo import is enabled')
    this.apiKey = apiKey
    this.baseUrl = (options.baseUrl ?? 'https://api.apollo.io/api/v1').replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs ?? 20_000
    this.maxRetries = options.maxRetries ?? 3
  }

  async searchPeople(input: Record<string, unknown>, page = 1, perPage = 25): Promise<ApolloSearchPage> {
    const cappedPerPage = Math.max(1, Math.min(perPage, 100))
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey },
        body: JSON.stringify({ ...input, page, per_page: cappedPerPage }),
        signal: AbortSignal.timeout(this.timeoutMs),
      })
      if (response.status === 429) {
        const retryAfterMs = Math.max(1_000, Number(response.headers.get('retry-after') ?? 1) * 1_000)
        if (attempt === this.maxRetries) throw new ApolloRateLimitError(retryAfterMs)
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
        continue
      }
      if (response.status >= 500 && attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)))
        continue
      }
      if (!response.ok) throw new Error(`Apollo API request failed (${response.status})`)
      const body = await response.json() as {
        people?: Array<Record<string, unknown>>
        pagination?: { page?: number; total_entries?: number; total_pages?: number }
      }
      const pagination = body.pagination ?? {}
      const currentPage = pagination.page ?? page
      const totalPages = pagination.total_pages ?? currentPage
      return {
        people: body.people ?? [],
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        totalEntries: pagination.total_entries,
      }
    }
    throw new Error('Apollo request exhausted retries')
  }
}
