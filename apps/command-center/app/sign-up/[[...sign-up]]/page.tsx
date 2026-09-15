'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/* There is no "/onboarding" route in this app either. */}
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white shadow-lg rounded-lg",
              formButtonPrimary: "bg-[#FF8C22] hover:bg-[#E67E1A]",
            }
          }}
          fallbackRedirectUrl="/"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}
