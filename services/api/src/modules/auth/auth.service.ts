import { createClerkClient, verifyToken as verifyClerkToken } from '@clerk/backend'
import { prismaAny } from '../../utils/prisma-helper'
import { auditService } from '../audit/audit.service'
import { syncNewUser } from '../integrations/ghl/ghl-sync'

function clerk() {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is required')
  return createClerkClient({ secretKey })
}

export class AuthService {
  async signup(email: string, password: string, name: string) {
    const [firstName, ...lastNameParts] = name.trim().split(/\s+/)
    const identity = await clerk().users.createUser({
      emailAddress: [email],
      password,
      firstName: firstName || undefined,
      lastName: lastNameParts.join(' ') || undefined,
    })

    let user: any
    try {
      user = await prismaAny.user.create({
        data: {
          email,
          name,
          firstName: firstName || null,
          lastName: lastNameParts.join(' ') || null,
          externalAuthId: identity.id,
          authProvider: 'clerk',
          status: 'ACTIVE',
        },
      })
    } catch (databaseError) {
      await clerk().users.deleteUser(identity.id).catch(() => undefined)
      throw databaseError
    }

    auditService.log({ userId: user.id, action: 'CREATE', entityType: 'USER', entityId: user.id, description: `Clerk user registered: ${email}`, category: 'SECURITY', severity: 'INFO' })
    syncNewUser({
      id: user.id,
      email: user.email,
      firstName: firstName || undefined,
      lastName: lastNameParts.join(' ') || undefined,
    }, 'Direct Sign-up').catch(() => {})

    // Clerk creates the browser session in its hosted/client flow.
    return { user, session: null, clerkUserId: identity.id }
  }

  async login(_email: string, _password: string): Promise<never> {
    throw new Error('Password sign-in is managed by Clerk. Use the application sign-in flow.')
  }

  async logout(_accessToken: string) {
    // Session termination is performed by Clerk in the browser where the
    // session ID and cookie context are available.
    return
  }

  async verifyToken(token: string) {
    const secretKey = process.env.CLERK_SECRET_KEY
    if (!secretKey) throw new Error('CLERK_SECRET_KEY is required')
    const claims = await verifyClerkToken(token, { secretKey })
    const user = await prismaAny.user.findFirst({
      where: {
        OR: [{ externalAuthId: claims.sub }, { id: claims.sub }],
      },
    })
    if (!user || user.status !== 'ACTIVE') throw new Error('User not found or inactive')
    return {
      ...user,
      userId: user.id,
      clerkUserId: claims.sub,
      role: user.role || 'USER',
      authSource: 'clerk' as const,
    }
  }
}

export const authService = new AuthService()
