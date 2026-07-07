import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient, getCurrentUser } from '@kealee/auth'
import { canAccessMarketingWorkspace } from '@/lib/admin/access-roles'

export default async function MarketingWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/marketing/login')
  }

  const appRole = (user.app_metadata?.role as string | undefined)?.toLowerCase()
  if (!canAccessMarketingWorkspace(appRole)) {
    try {
      const prismaUser = await getCurrentUser(cookieStore)
      if (!prismaUser || !['admin', 'super_admin', 'marketing_admin'].includes(prismaUser.role)) {
        redirect('/marketing/login?error=unauthorized')
      }
    } catch {
      redirect('/marketing/login?error=unauthorized')
    }
  }

  return <>{children}</>
}
