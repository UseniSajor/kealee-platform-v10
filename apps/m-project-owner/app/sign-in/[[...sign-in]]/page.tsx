'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white shadow-lg rounded-lg",
              formButtonPrimary: "bg-[#FF8C22] hover:bg-[#E67E1A]",
            }
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
