"use client"

import { SignIn } from '@clerk/nextjs'

export function LoginClient() {
  return <SignIn path="/login" routing="path" afterSignInUrl="/dashboard" />
}
