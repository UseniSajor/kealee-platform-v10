import { Suspense } from "react"
import { SignupClient } from "./signup-client"

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-300">Loading...</div>}>
      <SignupClient />
    </Suspense>
  )
}
