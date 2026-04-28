const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    let message = `API error ${response.status}`
    try {
      const body = await response.json()
      message = body.error ?? body.message ?? message
    } catch {}
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export async function getConcept(conceptId: string) {
  return fetchAPI<import('./types').Concept>(`/api/concepts/${conceptId}`)
}
