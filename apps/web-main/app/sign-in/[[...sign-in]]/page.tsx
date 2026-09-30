'use client'

import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignIn, SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function safeDestination(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/login'
  return value
}

export default function SignInPage() {
  const searchParams = useSearchParams()
  const destination = safeDestination(
    searchParams.get('redirect_url') ??
      searchParams.get('redirectTo') ??
      searchParams.get('next'),
  )

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <ClerkLoading>
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <p className="text-sm font-medium text-slate-600">Loading secure sign-in…</p>
          </div>
        </ClerkLoading>

        <ClerkLoaded>
          <SignedOut>
            <SignIn
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-white shadow-lg rounded-lg',
                  formButtonPrimary: 'bg-[#FF8C22] hover:bg-[#E67E1A]',
                },
              }}
              fallbackRedirectUrl={destination}
            />
          </SignedOut>

          <SignedIn>
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E8793A]">
                Kealee account
              </p>
              <h1 className="mt-3 text-2xl font-bold text-[#1A2B4A]">You are already signed in</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Continue to your requested workspace, or sign out to use another account.
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  href={destination}
                  className="flex w-full items-center justify-center rounded-xl bg-[#E8793A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d5682f]"
                >
                  Continue
                </Link>
                <SignOutButton redirectUrl="/sign-in">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign out and use another account
                  </button>
                </SignOutButton>
              </div>
            </div>
          </SignedIn>
        </ClerkLoaded>
      </div>
    </div>
  )
}
