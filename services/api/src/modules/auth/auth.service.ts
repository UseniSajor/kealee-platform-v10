import { prismaAny } from '../../utils/prisma-helper'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
    )
  }

  return createClient(supabaseUrl, supabaseKey)
}

export class AuthService {
  async signup(email: string, password: string, name: string) {
    // 1. Create user in Supabase Auth
    const supabase = getSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // 2. Create user record in our database
    const user = await prismaAny.user.create({
      data: {
        id: authData.user!.id,
        email,
        name,
        status: 'ACTIVE',
      },
    })

    return { user, session: authData.session }
  }

  async login(email: string, password: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { session: data.session }
  }

  async logout(accessToken: string) {
    const supabase = getSupabaseClient()
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
