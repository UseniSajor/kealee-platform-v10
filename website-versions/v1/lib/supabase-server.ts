import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Admin/service-role client for use in API route handlers (server-side only). */
export function getSupabaseAdmin(): SupabaseClient {
  return getServiceClient()
}

/** Build a public storage URL from a storage path. */
export function buildStorageUrl(bucket: string, path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return `${url}/storage/v1/object/public/${bucket}/${path}`
}
