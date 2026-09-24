import { SignIn } from '@clerk/nextjs'
import { ArrowRight, LockKeyhole } from 'lucide-react'

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/deliverables'
  return value
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; email?: string; info?: string; error?: string }
}) {
  const nextPath = safeNextPath(searchParams.next ?? null)
  const email = searchParams.email?.trim() ?? ''
  const opensDeliverable = nextPath.startsWith('/deliverables/')
  // A site plan is not a concept package. Telling someone signing in to see a
  // site plan that they are about to open a "concept package" is the same
  // mislabel that appears on the deliverables card.
  const opensSitePlan = nextPath.includes('/site-plan')
  const what = opensSitePlan ? 'site plan' : 'concept package'

  // The claim route sends these and the page used to drop them, so a customer
  // whose one-click link had already been used got an unexplained sign-in
  // form. Saying what happened is the difference between "this is broken" and
  // "sign in and carry on".
  const notice =
    searchParams.info === 'link_already_used'
      ? `That one-click link has already been used — they work once. Sign in below and we'll take you straight to your ${what}.`
      : searchParams.info === 'link_expired'
        ? `That link has expired. Sign in below and we'll take you straight to your ${what}.`
        : searchParams.error === 'invalid_token'
          ? `That link is no longer valid. Sign in below and we'll take you straight to your ${what}.`
          : searchParams.error === 'intake_not_found'
            ? 'We could not find that order. Sign in to see everything on your account.'
            : null

  return (
    <main className="w-full">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#D96632] ring-1 ring-orange-100">
          <LockKeyhole className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D96632]">
          Secure owner access
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {opensDeliverable ? (opensSitePlan ? 'Open your site plan' : 'Open your concept') : 'Welcome back'}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          {opensDeliverable
            ? `Sign in with the email used at checkout. We’ll take you directly to your ${what}.`
            : 'Sign in to see your projects and deliverables.'}
        </p>
      </div>

      {notice && (
        <div className="mx-auto mb-5 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm leading-6 text-amber-900">{notice}</p>
        </div>
      )}

      <SignIn
        path="/login"
        routing="path"
        signUpUrl={`/signup?next=${encodeURIComponent(nextPath)}${email ? `&email=${encodeURIComponent(email)}` : ''}`}
        forceRedirectUrl={nextPath}
        fallbackRedirectUrl={nextPath}
        initialValues={email ? { emailAddress: email } : undefined}
        appearance={{
          variables: {
            colorPrimary: '#E8724B',
            colorText: '#172033',
            colorTextSecondary: '#64748B',
            colorBackground: '#FFFFFF',
            borderRadius: '0.875rem',
            fontFamily: 'inherit',
          },
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full shadow-none',
            card: 'w-full border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7',
            header: 'hidden',
            formFieldInput: 'min-h-11 border-slate-200 bg-slate-50 focus:bg-white',
            formButtonPrimary: 'min-h-11 bg-[#E8724B] text-sm font-bold shadow-none hover:bg-[#D45C33]',
            footer: 'pt-3',
            footerActionLink: 'font-semibold text-[#D96632] hover:text-[#B94D23]',
            identityPreview: 'border-slate-200 bg-slate-50',
            alert: 'rounded-xl',
          },
        }}
      />

      {opensDeliverable ? (
        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          After sign-in
          <ArrowRight className="h-3.5 w-3.5 text-[#D96632]" aria-hidden />
          {opensSitePlan ? 'Your site plan' : 'Your concept package'}
        </p>
      ) : null}
    </main>
  )
}
