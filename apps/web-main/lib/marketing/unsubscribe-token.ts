import { createHmac } from 'crypto'

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_JWT_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  'kealee-unsubscribe-secret'

/** Sign a payload into a compact HS256 JWT for email unsubscribe links */
export function signUnsubscribeToken(contactId: string, email: string): string {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ contactId, email, iat: Math.floor(Date.now() / 1000) })).toString('base64url')
  const sig     = createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${sig}`
}
