import { Suspense } from "react"
import { SignupClient } from "./owner/signup-client"

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-600">Loading...</div>}>
      <SignupClient />
    </Suspense>
  )
}
