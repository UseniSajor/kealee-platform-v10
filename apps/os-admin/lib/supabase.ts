import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Use createClientComponentClient so the Supabase instance shares
// auth cookies set by the middleware / auth-helpers, ensuring
// getSession() returns the active session on client components.
export const supabase = createClientComponentClient()
