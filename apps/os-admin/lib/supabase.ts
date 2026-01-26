import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkreqfpkxavqpsqexbfs.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDc3NzAsImV4cCI6MjA4Mzk4Mzc3MH0.Zszenm7LrN7eRKi3-htbsQX8h4ulNvdCT_F1s-v0YJk'

let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set, using defaults')
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })

  return _supabase
}

export const supabase = getSupabaseClient()
