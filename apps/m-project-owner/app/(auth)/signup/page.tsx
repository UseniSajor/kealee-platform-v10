import { Suspense } from "react"
import { SignupClient } from "./signup-client"

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-600">Loading...</div>}>
      <SignupClient />
    </Suspense>
  )
}
