import { auth } from '@clerk/nextjs/server'
import { requireAuthenticatedUser } from '@kealee/auth'
import { redirect } from 'next/navigation'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { reviewDb } from '@/lib/engineer-review'
import { verifyProfessionalProfile } from '@/app/engineer/review/actions'

export const dynamic = 'force-dynamic'

export default async function EngineerReviewAdministrationPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=%2Fadmin%2Fengineer-reviews')
  const user = await requireAuthenticatedUser(userId)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase())) redirect('/')

  const profiles = await reviewDb.designProfessionalProfile.findMany({
    orderBy: [{ isLicensed: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  })

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Administration</p>
        <h1 className="mt-1 text-3xl font-semibold">Engineer credential verification</h1>
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          Confirm the licence against the issuing state board before activation. This screen records platform eligibility; it does not replace board verification.
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {profiles.map((profile: any) => (
            <div key={profile.id} className="flex flex-col justify-between gap-4 border-b p-5 last:border-0 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">{profile.displayName}</p>
                <p className="mt-1 text-sm text-slate-500">{profile.firmName ?? 'Independent'} · {profile.licenseState} {profile.licenseNumber}</p>
                <p className="mt-1 text-xs text-slate-400">Expires {profile.licenseExpiry ? new Date(profile.licenseExpiry).toLocaleDateString() : 'not recorded'}</p>
              </div>
              {profile.isLicensed ? (
                <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Verified</span>
              ) : (
                <form action={verifyProfessionalProfile}>
                  <input type="hidden" name="profileId" value={profile.id} />
                  <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Mark licence verified</button>
                </form>
              )}
            </div>
          ))}
          {!profiles.length && <p className="p-8 text-center text-slate-500">No professional profiles have been submitted.</p>}
        </div>
      </div>
    </main>
  )
}
