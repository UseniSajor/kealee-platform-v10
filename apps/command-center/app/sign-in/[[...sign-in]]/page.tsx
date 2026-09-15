'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/*
          `(dashboard)` is a route GROUP — the parentheses keep it out of the
          URL — so `app/(dashboard)/page.tsx` serves "/" and there is no
          "/dashboard" route in this app. Sending a successful sign-in there
          landed every user on a 404. `fallbackRedirectUrl` is the Clerk v5
          prop; `redirectUrl` is deprecated.
        */}
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white shadow-lg rounded-lg",
              formButtonPrimary: "bg-[#FF8C22] hover:bg-[#E67E1A]",
            }
          }}
          fallbackRedirectUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
