export async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const clerk = (window as typeof window & {
      Clerk?: { session?: { getToken: () => Promise<string | null> } }
    }).Clerk
    return await clerk?.session?.getToken() ?? null
  } catch {
    return null
  }
}
