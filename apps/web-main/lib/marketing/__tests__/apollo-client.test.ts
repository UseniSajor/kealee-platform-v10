import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApolloClient, ApolloRateLimitError } from '../apollo-client'

describe('ApolloClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the next pagination cursor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      people: [{ id: 'person-1' }],
      pagination: { page: 1, total_pages: 3, total_entries: 51 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })))
    const client = new ApolloClient({ apiKey: 'test-key', maxRetries: 0 })
    await expect(client.searchPeople({ person_titles: ['Owner'] }, 1, 25)).resolves.toEqual({
      people: [{ id: 'person-1' }], nextPage: 2, totalEntries: 51,
    })
  })

  it('surfaces retry timing after rate limiting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {
      status: 429, headers: { 'retry-after': '2' },
    })))
    const client = new ApolloClient({ apiKey: 'test-key', maxRetries: 0 })
    const error = await client.searchPeople({}, 1, 25).catch((caught) => caught)
    expect(error).toBeInstanceOf(ApolloRateLimitError)
    expect(error.retryAfterMs).toBe(2_000)
  })

  it('fails closed when credentials are missing', () => {
    const previous = process.env.APOLLO_API_KEY
    delete process.env.APOLLO_API_KEY
    expect(() => new ApolloClient()).toThrow('APOLLO_API_KEY is required')
    if (previous) process.env.APOLLO_API_KEY = previous
  })
})
