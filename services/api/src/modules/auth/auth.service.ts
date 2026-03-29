import { prismaAny } from '../../utils/prisma-helper'
import { getSupabaseClient } from '../../utils/supabase-client'
import { auditService } from '../audit/audit.service'
import { syncNewUser } from '../integrations/ghl/ghl-sync'

export class AuthService {
  async signup(email: string, password: string, name: string) {
    // 1. Create user in Supabase Auth
    const supabase = getSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // 2. Create user record in our database — with Supabase rollback on failure
    let user: any
    try {
      user = await prismaAny.user.create({
        data: {
          id: authData.user!.id,
          email,
          name,
          status: 'ACTIVE',
        },
      })
    } catch (prismaErr: any) {
      // Rollback: delete the Supabase auth user to prevent orphaned accounts
      try {
        await supabase.auth.admin.deleteUser(authData.user!.id)
        console.log(`Auth rollback: Supabase user ${authData.user!.id} deleted after Prisma failure`)
      } catch (rollbackErr: any) {
        console.error(`Auth rollback failed for ${authData.user!.id}:`, rollbackErr.message)
      }
      throw prismaErr
    }

    auditService.log({ userId: user.id, action: 'CREATE', entityType: 'USER', entityId: user.id, description: `User registered: ${email}`, category: 'SECURITY', severity: 'INFO' })

    // Sync new user to GHL CRM (fire-and-forget)
    const nameParts = name.split(' ')
    syncNewUser({
      id: user.id,
      email: user.email,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || undefined,
    }, 'Direct Sign-up').catch(() => {})

    return { user, session: authData.session }
  }

  async login(email: string, password: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      auditService.log({ userId: 'unknown', action: 'LOGIN', entityType: 'SESSION', entityId: email, description: `Failed login attempt: ${email}`, category: 'SECURITY', severity: 'WARNING' })
      throw error
    }

    auditService.log({ userId: data.session?.user?.id || 'unknown', userEmail: email, action: 'LOGIN', entityType: 'SESSION', entityId: data.session?.access_token?.substring(0, 8) || 'unknown', description: `User logged in: ${email}`, category: 'SECURITY', severity: 'INFO' })

    return { session: data.session }
  }

  async logout(accessToken: string) {
    const supabase = getSupabaseClient()
    auditService.log({ userId: 'unknown', action: 'LOGOUT', entityType: 'SESSION', entityId: accessToken.substring(0, 8), description: 'User logged out', category: 'SECURITY', severity: 'INFO' })
    await supabase.auth.signOut()
  }

  async verifyToken(token: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error) throw error
    return data.user
  }
}

export const authService = new AuthService()
