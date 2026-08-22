export async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    const { auth } = await import('@clerk/nextjs/server')
    return (await auth().getToken()) ?? null
  }
  const clerk = (window as typeof window & {
    Clerk?: { session?: { getToken: () => Promise<string | null> } }
  }).Clerk
  return await clerk?.session?.getToken() ?? null
}
