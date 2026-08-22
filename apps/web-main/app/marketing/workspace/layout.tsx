import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { requireAuthenticatedUser } from '@kealee/auth'
import { canAccessMarketingWorkspace } from '@/lib/admin/access-roles'

export default async function MarketingWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/marketing/login')
  }

  const user = await requireAuthenticatedUser(userId)
  const appRole = user.role?.toLowerCase()
  if (!canAccessMarketingWorkspace(appRole)) {
    redirect('/marketing/login?error=unauthorized')
  }

  return <>{children}</>
}
