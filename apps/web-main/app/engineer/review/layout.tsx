import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getEngineerIdentity } from '@/lib/engineer-review'

export default async function EngineerReviewLayout({ children }: { children: React.ReactNode }) {
  const identity = await getEngineerIdentity()
  if (!identity) redirect('/sign-in?redirect_url=%2Fengineer%2Freview')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/engineer/review" className="text-lg font-semibold">Engineer Review Workspace</Link>
            <p className="text-xs text-slate-400">Human decisions remain separate from generated content.</p>
          </div>
          <div className="text-right text-sm">
            <div>{identity.profile?.displayName ?? identity.user.name ?? identity.user.email}</div>
            <div className="text-xs text-slate-400">
              {identity.profile?.isLicensed ? `${identity.profile.licenseState} ${identity.profile.licenseNumber}` : 'Verification required'}
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
