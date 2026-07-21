/** Portal-side intake linking (uses @kealee/auth). */
import { createClient } from '@supabase/supabase-js'
import { linkIntakeToUser, linkIntakesToUser } from '@kealee/auth'

export async function linkUserToIntakesAfterAuth(
  userId: string,
  email: string,
  intakeId?: string,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (intakeId) {
    await linkIntakeToUser(admin, intakeId, userId, email)
  }
  await linkIntakesToUser(admin, userId, email)
}
