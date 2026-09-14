import { SignIn } from '@clerk/nextjs'
import { ArrowRight, LockKeyhole } from 'lucide-react'

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/deliverables'
  return value
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; email?: string }
}) {
  const nextPath = safeNextPath(searchParams.next ?? null)
  const email = searchParams.email?.trim() ?? ''
  const opensConcept = nextPath.startsWith('/deliverables/')

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
          {opensConcept ? 'Open your concept' : 'Welcome back'}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          {opensConcept
            ? 'Sign in with the email used at checkout. We’ll take you directly to your concept package.'
            : 'Sign in to see your projects and deliverables.'}
        </p>
      </div>

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

      {opensConcept ? (
        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          After sign-in
          <ArrowRight className="h-3.5 w-3.5 text-[#D96632]" aria-hidden />
          Your concept package
        </p>
      ) : null}
    </main>
  )
}
