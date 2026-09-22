import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfessionalIdentity } from '@/lib/professional-review'

export default async function ArchitectReviewLayout({ children }: { children: React.ReactNode }) {
  const identity = await getProfessionalIdentity()
  if (!identity) redirect('/sign-in?redirect_url=%2Farchitect%2Freview')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/architect/review" className="text-lg font-semibold">OS Architecture — Architect Review Desk</Link>
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
