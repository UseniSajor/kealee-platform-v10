import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

export async function getRequestAuthToken(request: NextRequest): Promise<string | null> {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7)

  const { userId, getToken } = await auth()
  if (!userId) return null
  return getToken()
}
